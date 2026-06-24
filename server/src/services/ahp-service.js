const prisma = require("../prisma/prisma-client");
const AHPHelper = require("../helpers/ahp-helper");
const {
  BadRequestError,
  NotFoundError,
} = require("../utils/error-handling-util");

class AHPService {
  static parseId(id, fieldName = "ID") {
    const parsedId = Number(id);

    if (id === null || id === undefined || Number.isNaN(parsedId)) {
      throw new BadRequestError(`${fieldName} tidak valid.`);
    }

    return parsedId;
  }

  static validateItemIds(item_ids, matrixSize) {
    if (!Array.isArray(item_ids) || item_ids.length === 0) {
      throw new BadRequestError("item_ids wajib dikirim dalam bentuk array.");
    }

    if (item_ids.length !== matrixSize) {
      throw new BadRequestError(
        "Jumlah item_ids harus sama dengan ukuran matrix AHP.",
      );
    }

    return item_ids.map((id) => this.parseId(id, "Item ID"));
  }

  static mapItemsByOrder(items, itemIds, idField, nameField) {
    const itemMap = new Map(items.map((item) => [item[idField], item]));

    return itemIds.map((id) => {
      const item = itemMap.get(id);

      if (!item) {
        throw new BadRequestError(
          `Item dengan ID ${id} tidak ditemukan atau tidak valid.`,
        );
      }

      return {
        id,
        nama: item[nameField],
        raw: item,
      };
    });
  }

  static formatWeights(items, weights) {
    return items.map((item, index) => ({
      id: item.id,
      nama: item.nama,
      bobot: weights[index],
    }));
  }

  static async calculateAHP({ matrix, items }) {
    if (!matrix) {
      throw new BadRequestError("Matrix AHP wajib dikirim.");
    }

    const result = AHPHelper.calculate(matrix);

    if (!items) {
      return result;
    }

    if (!Array.isArray(items)) {
      throw new BadRequestError("Items harus berbentuk array.");
    }

    if (items.length !== result.weights.length) {
      throw new BadRequestError(
        "Jumlah items harus sama dengan ukuran matrix.",
      );
    }

    return {
      ...result,
      weights: items.map((item, index) => ({
        id: item.id ?? null,
        nama: item.nama ?? item.name ?? `Item ${index + 1}`,
        bobot: result.weights[index],
      })),
    };
  }

  static async getKriteriaItems() {
    const data = await prisma.kriteria.findMany({
      where: {
        is_active: true,
      },
      orderBy: [
        {
          urutan: "asc",
        },
        {
          id_kriteria: "asc",
        },
      ],
    });

    return {
      total: data.length,
      items: data.map((item) => ({
        id: item.id_kriteria,
        kode: item.kode_kriteria,
        nama: item.nama_kriteria,
        deskripsi: item.deskripsi,
        urutan: item.urutan,
      })),
    };
  }

  static async getKriteriaByItemIds(itemIds) {
    const data = await prisma.kriteria.findMany({
      where: {
        id_kriteria: {
          in: itemIds,
        },
        is_active: true,
      },
    });

    if (data.length !== itemIds.length) {
      throw new BadRequestError(
        "Sebagian kriteria tidak ditemukan atau tidak aktif.",
      );
    }

    return this.mapItemsByOrder(data, itemIds, "id_kriteria", "nama_kriteria");
  }

  static async calculateKriteriaAHP({ matrix, item_ids }) {
    if (!matrix) {
      throw new BadRequestError("Matrix AHP wajib dikirim.");
    }

    const result = AHPHelper.calculate(matrix);
    const itemIds = this.validateItemIds(item_ids, result.weights.length);
    const items = await this.getKriteriaByItemIds(itemIds);

    return {
      tipe: "kriteria",
      ...result,
      weights: this.formatWeights(items, result.weights),
    };
  }

  static buildKriteriaMatrixPayload(itemIds, matrix) {
    const payload = [];

    for (let row = 0; row < itemIds.length; row++) {
      for (let col = 0; col < itemIds.length; col++) {
        payload.push({
          id_kriteria_1: itemIds[row],
          id_kriteria_2: itemIds[col],
          nilai_perbandingan: matrix[row][col],
        });
      }
    }

    return payload;
  }

  static buildBobotKriteriaPayload(itemIds, weights) {
    return itemIds.map((id, index) => ({
      id_kriteria: id,
      bobot_kriteria: weights[index],
    }));
  }

  static async saveKriteriaAHP({ matrix, item_ids }) {
    const calculated = await this.calculateKriteriaAHP({
      matrix,
      item_ids,
    });

    if (!calculated.is_consistent) {
      throw new BadRequestError(
        "Matrix AHP kriteria belum konsisten. Perbaiki nilai perbandingan sebelum menyimpan.",
      );
    }

    const itemIds = item_ids.map((id) => this.parseId(id, "Kriteria ID"));

    const matrixPayload = this.buildKriteriaMatrixPayload(
      itemIds,
      calculated.matrix,
    );

    const bobotPayload = this.buildBobotKriteriaPayload(
      itemIds,
      calculated.weights.map((item) => item.bobot),
    );

    await prisma.$transaction(async (tx) => {
      await tx.ahpKriteriaMatrix.deleteMany({});

      await tx.ahpKriteriaMatrix.createMany({
        data: matrixPayload,
      });

      await tx.bobotKriteria.deleteMany({
        where: {
          id_kriteria: {
            in: itemIds,
          },
        },
      });

      await tx.bobotKriteria.createMany({
        data: bobotPayload,
      });

      await tx.ahpKonsistensi.create({
        data: {
          tipe: "kriteria",
          id_kriteria: null,
          lambda_max: calculated.lambda_max,
          consistency_index: calculated.consistency_index,
          consistency_ratio: calculated.consistency_ratio,
          status_konsistensi: calculated.status_konsistensi,
        },
      });
    });

    return {
      tipe: "kriteria",
      status_simpan: "saved",
      ...calculated,
    };
  }

  static async getIndikatorItems({ id_kriteria }) {
    const parsedIdKriteria = this.parseId(id_kriteria, "ID kriteria");

    const kriteria = await prisma.kriteria.findUnique({
      where: {
        id_kriteria: parsedIdKriteria,
      },
    });

    if (!kriteria) {
      throw new NotFoundError("Kriteria tidak ditemukan.");
    }

    const data = await prisma.indikator.findMany({
      where: {
        id_kriteria: parsedIdKriteria,
        is_active: true,
      },
      orderBy: [
        {
          urutan: "asc",
        },
        {
          id_indikator: "asc",
        },
      ],
    });

    return {
      kriteria: {
        id: kriteria.id_kriteria,
        kode: kriteria.kode_kriteria,
        nama: kriteria.nama_kriteria,
      },
      total: data.length,
      items: data.map((item) => ({
        id: item.id_indikator,
        kode: item.kode_indikator,
        nama: item.nama_indikator,
        satuan: item.satuan,
        jenis_indikator: item.jenis_indikator,
        urutan: item.urutan,
      })),
    };
  }

  static async getIndikatorByItemIds(idKriteria, itemIds) {
    const data = await prisma.indikator.findMany({
      where: {
        id_kriteria: idKriteria,
        id_indikator: {
          in: itemIds,
        },
        is_active: true,
      },
    });

    if (data.length !== itemIds.length) {
      throw new BadRequestError(
        "Sebagian indikator tidak ditemukan, tidak aktif, atau tidak berada pada kriteria tersebut.",
      );
    }

    return this.mapItemsByOrder(
      data,
      itemIds,
      "id_indikator",
      "nama_indikator",
    );
  }

  static async calculateIndikatorAHP({ id_kriteria, matrix, item_ids }) {
    const parsedIdKriteria = this.parseId(id_kriteria, "ID kriteria");

    if (!matrix) {
      throw new BadRequestError("Matrix AHP wajib dikirim.");
    }

    const result = AHPHelper.calculate(matrix);
    const itemIds = this.validateItemIds(item_ids, result.weights.length);
    const items = await this.getIndikatorByItemIds(parsedIdKriteria, itemIds);

    return {
      tipe: "indikator",
      id_kriteria: parsedIdKriteria,
      ...result,
      weights: this.formatWeights(items, result.weights),
    };
  }

  static buildIndikatorMatrixPayload(idKriteria, itemIds, matrix) {
    const payload = [];

    for (let row = 0; row < itemIds.length; row++) {
      for (let col = 0; col < itemIds.length; col++) {
        payload.push({
          id_kriteria: idKriteria,
          id_indikator_1: itemIds[row],
          id_indikator_2: itemIds[col],
          nilai_perbandingan: matrix[row][col],
        });
      }
    }

    return payload;
  }

  static buildBobotIndikatorPayload(itemIds, weights, bobotKriteria) {
    return itemIds.map((id, index) => {
      const bobotLokal = weights[index];
      const bobotAkhir = bobotLokal * bobotKriteria;

      return {
        id_indikator: id,
        bobot_lokal: bobotLokal,
        bobot_akhir: bobotAkhir,
      };
    });
  }

  static async saveIndikatorAHP({ id_kriteria, matrix, item_ids }) {
    const parsedIdKriteria = this.parseId(id_kriteria, "ID kriteria");

    const calculated = await this.calculateIndikatorAHP({
      id_kriteria: parsedIdKriteria,
      matrix,
      item_ids,
    });

    if (!calculated.is_consistent) {
      throw new BadRequestError(
        "Matrix AHP indikator belum konsisten. Perbaiki nilai perbandingan sebelum menyimpan.",
      );
    }

    const bobotKriteria = await prisma.bobotKriteria.findUnique({
      where: {
        id_kriteria: parsedIdKriteria,
      },
    });

    if (!bobotKriteria) {
      throw new BadRequestError(
        "Bobot kriteria belum tersedia. Hitung dan simpan AHP kriteria terlebih dahulu.",
      );
    }

    const itemIds = item_ids.map((id) => this.parseId(id, "Indikator ID"));
    const bobotKriteriaValue = Number(bobotKriteria.bobot_kriteria);

    const matrixPayload = this.buildIndikatorMatrixPayload(
      parsedIdKriteria,
      itemIds,
      calculated.matrix,
    );

    const bobotPayload = this.buildBobotIndikatorPayload(
      itemIds,
      calculated.weights.map((item) => item.bobot),
      bobotKriteriaValue,
    );

    await prisma.$transaction(async (tx) => {
      await tx.ahpIndikatorMatrix.deleteMany({
        where: {
          id_kriteria: parsedIdKriteria,
        },
      });

      await tx.ahpIndikatorMatrix.createMany({
        data: matrixPayload,
      });

      await tx.bobotIndikator.deleteMany({
        where: {
          id_indikator: {
            in: itemIds,
          },
        },
      });

      await tx.bobotIndikator.createMany({
        data: bobotPayload,
      });

      await tx.ahpKonsistensi.create({
        data: {
          tipe: "indikator",
          id_kriteria: parsedIdKriteria,
          lambda_max: calculated.lambda_max,
          consistency_index: calculated.consistency_index,
          consistency_ratio: calculated.consistency_ratio,
          status_konsistensi: calculated.status_konsistensi,
        },
      });
    });

    return {
      tipe: "indikator",
      id_kriteria: parsedIdKriteria,
      bobot_kriteria: bobotKriteriaValue,
      status_simpan: "saved",
      ...calculated,
      weights: calculated.weights.map((item, index) => ({
        ...item,
        bobot_lokal: item.bobot,
        bobot_akhir: bobotPayload[index].bobot_akhir,
      })),
    };
  }
}

module.exports = AHPService;
