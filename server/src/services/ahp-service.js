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

  static async getBobotKonsensus() {
    // Cari semua kriteria/indikator constraint secara dinamis
    const constraintIndicators = await prisma.indikator.findMany({
      where: { tipe_nilai: "MASK" },
      select: { id_indikator: true, id_kriteria: true },
    });
    const constraintIndIds = constraintIndicators.map((i) => i.id_indikator);
    const constraintCritIds = [...new Set(constraintIndicators.map((i) => i.id_kriteria))];

    const [pakarList, bobotKriteriaSemuaPakar, bobotIndikatorSemuaPakar] =
      await Promise.all([
        prisma.pakar.findMany({
          select: {
            id_pakar: true,
            nama_pakar: true,
            institusi: true,
            jabatan: true,
          },
          orderBy: { id_pakar: "asc" },
        }),

        prisma.bobotKriteria.findMany({
          where: {
            NOT: { id_kriteria: { in: constraintCritIds } },
          },
          include: {
            kriteria: { select: { nama_kriteria: true } },
          },
          orderBy: { id_kriteria: "asc" },
        }),

        // id_pakar sekarang nullable di schema (baris id_pakar = null = hasil
        // konsensus yang sudah TERSIMPAN). Baris seperti itu bukan input untuk
        // dihitung rata-ratanya, jadi difilter keluar di sini secara eksplisit.
        prisma.bobotIndikator.findMany({
          where: {
            id_pakar: { not: null },
            NOT: { id_indikator: { in: constraintIndIds } },
          },
          include: {
            pakar: {
              select: {
                id_pakar: true,
                nama_pakar: true,
                institusi: true,
                jabatan: true,
              },
            },
            indikator: {
              select: {
                id_indikator: true,
                nama_indikator: true,
                id_kriteria: true,
              },
            },
          },
          orderBy: [{ id_indikator: "asc" }, { id_pakar: "asc" }],
        }),
      ]);

    if (pakarList.length === 0) {
      return {
        total_pakar: 0,
        pakar: [],
        bobot: [],
      };
    }

    // ============================================================
    // BAGIAN 1: Rincian penilaian MASING-MASING pakar
    // (pakar -> kriteria -> indikator, bersarang)
    // ============================================================

    // Kelompokkan bobot kriteria per pakar: id_pakar -> Map(id_kriteria -> node)
    const kriteriaPerPakar = new Map();

    bobotKriteriaSemuaPakar.forEach((b) => {
      if (!kriteriaPerPakar.has(b.id_pakar)) {
        kriteriaPerPakar.set(b.id_pakar, new Map());
      }

      kriteriaPerPakar.get(b.id_pakar).set(b.id_kriteria, {
        id_kriteria: b.id_kriteria,
        kode: String(b.id_kriteria),
        nama: b.kriteria.nama_kriteria,
        // Bobot kriteria versi pakar ini (langsung di bawah Goal, sudah final)
        bobot_kriteria: Number(b.bobot_kriteria),
        indikator: [],
      });
    });

    // Sisipkan tiap indikator ke dalam kriteria & pakar yang sesuai
    bobotIndikatorSemuaPakar.forEach((b) => {
      const petaKriteriaPakarIni = kriteriaPerPakar.get(b.id_pakar);
      if (!petaKriteriaPakarIni) return; // pakar ini belum isi bobot kriteria

      const nodeKriteria = petaKriteriaPakarIni.get(b.indikator.id_kriteria);
      if (!nodeKriteria) return; // kriteria induk belum diisi pakar ini

      nodeKriteria.indikator.push({
        id_indikator: b.id_indikator,
        kode: String(b.id_indikator),
        nama: b.indikator.nama_indikator,
        // Windikator pakar ini (relatif ke kriteria induk)
        bobot_lokal: Number(b.bobot_lokal),
        // Wtotal pakar ini = bobot_kriteria (pakar ini) x bobot_lokal (pakar ini)
        bobot_total: Number(b.bobot_akhir),
      });
    });

    // Susun struktur pakar[] final: tiap pakar punya daftar kriteria,
    // tiap kriteria punya daftar indikator miliknya sendiri
    const pakarDenganDetail = pakarList.map((pakar) => {
      const petaKriteriaPakarIni =
        kriteriaPerPakar.get(pakar.id_pakar) || new Map();

      const daftarKriteria = Array.from(petaKriteriaPakarIni.values())
        .sort((a, b) => a.id_kriteria - b.id_kriteria)
        .map((k) => ({
          ...k,
          indikator: [...k.indikator].sort(
            (a, b) => a.id_indikator - b.id_indikator,
          ),
        }));

      return {
        id_pakar: pakar.id_pakar,
        nama_pakar: pakar.nama_pakar,
        institusi: pakar.institusi,
        jabatan: pakar.jabatan,
        kriteria: daftarKriteria,
      };
    });

    // ============================================================
    // BAGIAN 2: Hasil KONSENSUS (rata-rata lintas pakar)
    // ============================================================

    // --- Konsensus bobot kriteria ---
    const kriteriaConsensusMap = new Map();
    bobotKriteriaSemuaPakar.forEach((b) => {
      if (!kriteriaConsensusMap.has(b.id_kriteria)) {
        kriteriaConsensusMap.set(b.id_kriteria, {
          id_kriteria: b.id_kriteria,
          kode: String(b.id_kriteria),
          nama: b.kriteria?.nama_kriteria || `Kriteria ${b.id_kriteria}`,
          totalBobot: [],
        });
      }
      kriteriaConsensusMap.get(b.id_kriteria).totalBobot.push(Number(b.bobot_kriteria));
    });

    const bobotKriteriaConsensus = Array.from(kriteriaConsensusMap.values())
      .sort((a, b) => a.id_kriteria - b.id_kriteria)
      .map((item) => {
        const n = item.totalBobot.length;
        const sum = item.totalBobot.reduce((acc, v) => acc + v, 0);
        const avg = n > 0 ? sum / n : 0;
        return {
          id_kriteria: item.id_kriteria,
          kode: item.kode,
          nama: item.nama,
          bobot: Math.round(avg * 1000000) / 1000000,
        };
      });

    // --- Konsensus bobot indikator ---
    const indikatorMap = new Map();
    bobotIndikatorSemuaPakar.forEach((b) => {
      if (!indikatorMap.has(b.id_indikator)) {
        indikatorMap.set(b.id_indikator, {
          id_indikator: b.id_indikator,
          nama: b.indikator.nama_indikator,
          bobot_akhir_pakar: [],
        });
      }

      indikatorMap.get(b.id_indikator).bobot_akhir_pakar.push({
        id_pakar: b.id_pakar,
        bobot_lokal: Number(b.bobot_lokal),
        bobot_akhir: Number(b.bobot_akhir),
      });
    });

    const bobotIndikatorConsensus = Array.from(indikatorMap.values())
      .sort((a, b) => a.id_indikator - b.id_indikator)
      .map((ind) => {
        const n = ind.bobot_akhir_pakar.length;
        const sum = ind.bobot_akhir_pakar.reduce((acc, p) => acc + p.bobot_akhir, 0);
        const avg = n > 0 ? sum / n : 0;

        return {
          id_indikator: ind.id_indikator,
          kode: String(ind.id_indikator),
          nama: ind.nama,
          bobot_rata_rata: Math.round(avg * 1000000) / 1000000, // rata-rata dari ke-3 pakar
          bobot_pakar: ind.bobot_akhir_pakar,
        };
      });

    return {
      total_pakar: pakarList.length,
      pakar: pakarDenganDetail,
      bobot_kriteria: bobotKriteriaConsensus,
      bobot_indikator: bobotIndikatorConsensus,
      bobot: bobotIndikatorConsensus, // alias untuk backward compatibility
    };
  }

  static async getKriteriaItems() {
    // Cari kriteria yang memiliki indikator pembatas secara dinamis
    const constraintIndicators = await prisma.indikator.findMany({
      where: { tipe_nilai: "MASK" },
      select: { id_kriteria: true },
    });
    const constraintCritIds = [...new Set(constraintIndicators.map((i) => i.id_kriteria))];

    const data = await prisma.kriteria.findMany({
      where: {
        NOT: {
          id_kriteria: { in: constraintCritIds },
        },
      },
      orderBy: [
        {
          id_kriteria: "asc",
        },
      ],
    });

    return {
      total: data.length,
      items: data.map((item) => ({
        id: item.id_kriteria,
        kode: String(item.id_kriteria),
        nama: item.nama_kriteria,
        deskripsi: item.deskripsi,
      })),
    };
  }

  static async getKriteriaByItemIds(itemIds) {
    const data = await prisma.kriteria.findMany({
      where: {
        id_kriteria: {
          in: itemIds,
        },
      },
    });

    if (data.length !== itemIds.length) {
      throw new BadRequestError("Sebagian kriteria tidak ditemukan.");
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

    // Uji konsistensi (CR) matrix perbandingan KRITERIA milik pakar ini.
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

    // Catatan: tidak ada lagi recalculateConsensusKriteriaAHP() di sini.
    // Bobot kriteria konsensus dihitung on-the-fly di getBobotKonsensus(),
    // bukan disimpan ulang ke tabel bobot_kriteria dengan id_pakar = null.
    await prisma.$transaction(async (tx) => {
      await tx.ahpKriteriaMatrix.deleteMany({
        where: { id_pakar: parsedIdPakar },
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
          tipe: "KRITERIA",
        },
      });

      await tx.ahpKonsistensi.create({
        data: {
          id_pakar: parsedIdPakar,
          tipe: "KRITERIA",
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
      },
      orderBy: [
        {
          id_indikator: "asc",
        },
      ],
    });

    return {
      kriteria: {
        id: kriteria.id_kriteria,
        nama: kriteria.nama_kriteria,
      },
      total: data.length,
      items: data.map((item) => ({
        id: item.id_indikator,
        kode: String(item.id_indikator),
        nama: item.nama_indikator,
        satuan: item.satuan,
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
      },
    });

    if (data.length !== itemIds.length) {
      throw new BadRequestError(
        "Sebagian indikator tidak ditemukan atau tidak berada pada kriteria tersebut.",
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
      // bobot_akhir dihitung PER PAKAR di sini: Wtotal_pakar = Wkriteria_pakar
      // x Windikator_pakar. Ini penting: total bobot_akhir semua indikator
      // milik satu pakar akan otomatis = bobot_kriteria pakar tsb, sehingga
      // rata-rata bobot_akhir lintas pakar (di getBobotKonsensus) tetap
      // konsisten secara matematis dengan metode AIP (Aggregating
      // Individual Priorities): kalikan dulu per pakar, baru rata-ratakan.
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

    // Uji konsistensi (CR) matrix perbandingan INDIKATOR LOKAL (dalam satu
    // kriteria) milik pakar ini.
    if (!calculated.is_consistent) {
      throw new BadRequestError(
        "Matrix AHP indikator belum konsisten. Perbaiki nilai perbandingan sebelum menyimpan.",
      );
    }

    // Bobot kriteria pakar ini WAJIB sudah ada (tahap kriteria harus
    // diselesaikan lebih dulu untuk pakar yang bersangkutan).
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

    // Catatan: tidak ada lagi recalculateConsensusKriteriaAHP() maupun
    // recalculateConsensusIndikatorAHP() di sini. Konsensus dihitung
    // on-the-fly di getBobotKonsensus() dari data per pakar yang tersimpan.
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
          tipe: "INDIKATOR",
        },
      });

      await tx.ahpKonsistensi.create({
        data: {
          id_pakar: parsedIdPakar,
          tipe: "INDIKATOR",
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
}

module.exports = AHPService;
