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

  static buildKriteriaMatrixPayload(idPakar, itemIds, matrix) {
    const payload = [];

    for (let row = 0; row < itemIds.length; row++) {
      for (let col = 0; col < itemIds.length; col++) {
        payload.push({
          id_pakar: idPakar,
          id_kriteria_1: itemIds[row],
          id_kriteria_2: itemIds[col],
          nilai_perbandingan: matrix[row][col],
        });
      }
    }

    return payload;
  }

  static buildBobotKriteriaPayload(idPakar, itemIds, weights) {
    return itemIds.map((id, index) => ({
      id_pakar: idPakar,
      id_kriteria: id,
      bobot_kriteria: weights[index],
    }));
  }

  static async saveKriteriaAHP({ id_pakar, matrix, item_ids }) {
    const parsedIdPakar = this.parseId(id_pakar, "ID Pakar");

    const pakar = await prisma.pakar.findUnique({
      where: { id_pakar: parsedIdPakar },
    });
    if (!pakar) {
      throw new NotFoundError("Pakar tidak ditemukan.");
    }

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
      parsedIdPakar,
      itemIds,
      calculated.matrix,
    );

    const bobotPayload = this.buildBobotKriteriaPayload(
      parsedIdPakar,
      itemIds,
      calculated.weights.map((item) => item.bobot),
    );

    await prisma.$transaction(async (tx) => {
      await tx.ahpKriteriaMatrix.deleteMany({
        where: { id_pakar: parsedIdPakar }
      });

      await tx.ahpKriteriaMatrix.createMany({
        data: matrixPayload,
      });

      await tx.bobotKriteria.deleteMany({
        where: {
          id_pakar: parsedIdPakar,
          id_kriteria: {
            in: itemIds,
          },
        },
      });

      await tx.bobotKriteria.createMany({
        data: bobotPayload,
      });

      await tx.ahpKonsistensi.deleteMany({
        where: {
          id_pakar: parsedIdPakar,
          tipe: "kriteria",
        },
      });

      await tx.ahpKonsistensi.create({
        data: {
          id_pakar: parsedIdPakar,
          tipe: "kriteria",
          id_kriteria: null,
          lambda_max: calculated.lambda_max,
          consistency_index: calculated.consistency_index,
          consistency_ratio: calculated.consistency_ratio,
          status_konsistensi: calculated.status_konsistensi,
        },
      });
    });

    // Otomatis hitung ulang bobot konsensus rata-rata kriteria
    await this.recalculateConsensusKriteriaAHP();

    return {
      tipe: "kriteria",
      id_pakar: parsedIdPakar,
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

  static buildIndikatorMatrixPayload(idPakar, idKriteria, itemIds, matrix) {
    const payload = [];

    for (let row = 0; row < itemIds.length; row++) {
      for (let col = 0; col < itemIds.length; col++) {
        payload.push({
          id_pakar: idPakar,
          id_kriteria: idKriteria,
          id_indikator_1: itemIds[row],
          id_indikator_2: itemIds[col],
          nilai_perbandingan: matrix[row][col],
        });
      }
    }

    return payload;
  }

  static buildBobotIndikatorPayload(idPakar, itemIds, weights, bobotKriteria) {
    return itemIds.map((id, index) => {
      const bobotLokal = weights[index];
      const bobotAkhir = bobotLokal * bobotKriteria;

      return {
        id_pakar: idPakar,
        id_indikator: id,
        bobot_lokal: bobotLokal,
        bobot_akhir: bobotAkhir,
      };
    });
  }

  static async saveIndikatorAHP({ id_pakar, id_kriteria, matrix, item_ids }) {
    const parsedIdPakar = this.parseId(id_pakar, "ID Pakar");
    const parsedIdKriteria = this.parseId(id_kriteria, "ID kriteria");

    const pakar = await prisma.pakar.findUnique({
      where: { id_pakar: parsedIdPakar },
    });
    if (!pakar) {
      throw new NotFoundError("Pakar tidak ditemukan.");
    }

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

    const bobotKriteria = await prisma.bobotKriteria.findFirst({
      where: {
        id_kriteria: parsedIdKriteria,
        id_pakar: parsedIdPakar,
      },
    });

    if (!bobotKriteria) {
      throw new BadRequestError(
        "Bobot kriteria untuk pakar ini belum tersedia. Hitung dan simpan AHP kriteria pakar terlebih dahulu.",
      );
    }

    const itemIds = item_ids.map((id) => this.parseId(id, "Indikator ID"));
    const bobotKriteriaValue = Number(bobotKriteria.bobot_kriteria);

    const matrixPayload = this.buildIndikatorMatrixPayload(
      parsedIdPakar,
      parsedIdKriteria,
      itemIds,
      calculated.matrix,
    );

    const bobotPayload = this.buildBobotIndikatorPayload(
      parsedIdPakar,
      itemIds,
      calculated.weights.map((item) => item.bobot),
      bobotKriteriaValue,
    );

    await prisma.$transaction(async (tx) => {
      await tx.ahpIndikatorMatrix.deleteMany({
        where: {
          id_pakar: parsedIdPakar,
          id_kriteria: parsedIdKriteria,
        },
      });

      await tx.ahpIndikatorMatrix.createMany({
        data: matrixPayload,
      });

      await tx.bobotIndikator.deleteMany({
        where: {
          id_pakar: parsedIdPakar,
          id_indikator: {
            in: itemIds,
          },
        },
      });

      await tx.bobotIndikator.createMany({
        data: bobotPayload,
      });

      await tx.ahpKonsistensi.deleteMany({
        where: {
          id_pakar: parsedIdPakar,
          id_kriteria: parsedIdKriteria,
          tipe: "indikator",
        },
      });

      await tx.ahpKonsistensi.create({
        data: {
          id_pakar: parsedIdPakar,
          tipe: "indikator",
          id_kriteria: parsedIdKriteria,
          lambda_max: calculated.lambda_max,
          consistency_index: calculated.consistency_index,
          consistency_ratio: calculated.consistency_ratio,
          status_konsistensi: calculated.status_konsistensi,
        },
      });
    });

    // Otomatis hitung ulang bobot konsensus rata-rata kriteria & indikator untuk kriteria ini
    await this.recalculateConsensusKriteriaAHP();
    await this.recalculateConsensusIndikatorAHP(parsedIdKriteria);

    return {
      tipe: "indikator",
      id_pakar: parsedIdPakar,
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

  static async recalculateConsensusKriteriaAHP() {
    const kriteriaList = await prisma.kriteria.findMany({
      where: { is_active: true },
      select: { id_kriteria: true }
    });

    const activePakar = await prisma.pakar.findMany({
      where: { is_active: true },
      select: { id_pakar: true }
    });
    const pakarIds = activePakar.map(p => p.id_pakar);

    if (pakarIds.length === 0) return;

    const consensusWeights = [];
    for (const crit of kriteriaList) {
      const weights = await prisma.bobotKriteria.findMany({
        where: {
          id_kriteria: crit.id_kriteria,
          id_pakar: { in: pakarIds }
        },
        select: { bobot_kriteria: true }
      });

      if (weights.length > 0) {
        const sum = weights.reduce((acc, curr) => acc + Number(curr.bobot_kriteria), 0);
        const avg = sum / weights.length;
        consensusWeights.push({
          id_kriteria: crit.id_kriteria,
          bobot_kriteria: avg
        });
      }
    }

    const totalConsensus = consensusWeights.reduce((acc, c) => acc + c.bobot_kriteria, 0);
    if (totalConsensus > 0) {
      consensusWeights.forEach(c => {
        c.bobot_kriteria = c.bobot_kriteria / totalConsensus;
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.bobotKriteria.deleteMany({
        where: { id_pakar: null }
      });

      await tx.bobotKriteria.createMany({
        data: consensusWeights.map(c => ({
          id_pakar: null,
          id_kriteria: c.id_kriteria,
          bobot_kriteria: c.bobot_kriteria
        }))
      });
    });
  }

  static async recalculateConsensusIndikatorAHP(idKriteria) {
    const indikatorList = await prisma.indikator.findMany({
      where: { id_kriteria: idKriteria, is_active: true },
      select: { id_indikator: true }
    });

    const activePakar = await prisma.pakar.findMany({
      where: { is_active: true },
      select: { id_pakar: true }
    });
    const pakarIds = activePakar.map(p => p.id_pakar);

    if (pakarIds.length === 0) return;

    const consensusKriteria = await prisma.bobotKriteria.findFirst({
      where: {
        id_pakar: null,
        id_kriteria: idKriteria
      }
    });
    const bobotKriteriaConsensus = consensusKriteria ? Number(consensusKriteria.bobot_kriteria) : 0;

    const consensusIndikatorWeights = [];
    for (const ind of indikatorList) {
      const weights = await prisma.bobotIndikator.findMany({
        where: {
          id_indikator: ind.id_indikator,
          id_pakar: { in: pakarIds }
        },
        select: { bobot_lokal: true }
      });

      if (weights.length > 0) {
        const sum = weights.reduce((acc, curr) => acc + Number(curr.bobot_lokal), 0);
        const avgLokal = sum / weights.length;
        consensusIndikatorWeights.push({
          id_indikator: ind.id_indikator,
          bobot_lokal: avgLokal
        });
      }
    }

    const totalLokal = consensusIndikatorWeights.reduce((acc, w) => acc + w.bobot_lokal, 0);
    if (totalLokal > 0) {
      consensusIndikatorWeights.forEach(w => {
        w.bobot_lokal = w.bobot_lokal / totalLokal;
        w.bobot_akhir = w.bobot_lokal * bobotKriteriaConsensus;
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.bobotIndikator.deleteMany({
        where: {
          id_pakar: null,
          id_indikator: { in: indikatorList.map(i => i.id_indikator) }
        }
      });

      await tx.bobotIndikator.createMany({
        data: consensusIndikatorWeights.map(w => ({
          id_pakar: null,
          id_indikator: w.id_indikator,
          bobot_lokal: w.bobot_lokal,
          bobot_akhir: w.bobot_akhir
        }))
      });
    });
  }
}

module.exports = AHPService;
