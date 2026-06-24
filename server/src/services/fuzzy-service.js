const prisma = require("../prisma/prisma-client");
const FuzzyHelper = require("../helpers/fuzzy-helper");
const {
  BadRequestError,
  NotFoundError,
} = require("../utils/error-handling-util");

class FuzzyService {
  static parseId(id, fieldName = "ID") {
    const parsedId = Number(id);

    if (!id || Number.isNaN(parsedId)) {
      throw new BadRequestError(`${fieldName} tidak valid.`);
    }

    return parsedId;
  }

  static async getIndikatorOrThrow(id_indikator) {
    const parsedId = this.parseId(id_indikator, "ID indikator");

    const indikator = await prisma.indikator.findUnique({
      where: {
        id_indikator: parsedId,
      },
    });

    if (!indikator) {
      throw new NotFoundError("Indikator tidak ditemukan.");
    }

    if (!indikator.is_active) {
      throw new BadRequestError("Indikator tidak aktif.");
    }

    if (indikator.jenis_indikator === "constraint") {
      throw new BadRequestError(
        "Indikator constraint tidak dihitung sebagai nilai fuzzy. Gunakan modul constraint_grid.",
      );
    }

    return indikator;
  }

  static formatAturan(rule) {
    return {
      id_aturan: rule.id_aturan,
      id_indikator: rule.id_indikator,
      fungsi_fuzzy: rule.fungsi_fuzzy,
      arah: rule.arah,
      nilai_min:
        rule.nilai_min === null || rule.nilai_min === undefined
          ? null
          : Number(rule.nilai_min),
      nilai_max:
        rule.nilai_max === null || rule.nilai_max === undefined
          ? null
          : Number(rule.nilai_max),
      midpoint:
        rule.midpoint === null || rule.midpoint === undefined
          ? null
          : Number(rule.midpoint),
      spread:
        rule.spread === null || rule.spread === undefined
          ? null
          : Number(rule.spread),
      keterangan: rule.keterangan,
      created_at: rule.created_at,
      updated_at: rule.updated_at,
    };
  }

  static validateRulePayload(payload) {
    const fungsi_fuzzy = FuzzyHelper.normalizeFunctionName(
      payload.fungsi_fuzzy,
    );
    const arah = FuzzyHelper.normalizeDirection(payload.arah);

    if (fungsi_fuzzy === "linear") {
      FuzzyHelper.toNumber(payload.nilai_min, "nilai_min");
      FuzzyHelper.toNumber(payload.nilai_max, "nilai_max");
    }

    if (fungsi_fuzzy === "sigmoid") {
      FuzzyHelper.toNumber(payload.midpoint, "midpoint");
      FuzzyHelper.toNumber(payload.spread, "spread");
    }

    if (fungsi_fuzzy === "triangular") {
      FuzzyHelper.toNumber(payload.nilai_min, "nilai_min");
      FuzzyHelper.toNumber(payload.midpoint, "midpoint");
      FuzzyHelper.toNumber(payload.nilai_max, "nilai_max");
    }

    return {
      fungsi_fuzzy,
      arah,
    };
  }

  static async getAllAturan() {
    const data = await prisma.aturanFuzzy.findMany({
      orderBy: {
        id_indikator: "asc",
      },
    });

    return {
      total: data.length,
      data_aturan: data.map((item) => this.formatAturan(item)),
    };
  }

  static async getAturanByIndikator({ id_indikator }) {
    const parsedId = this.parseId(id_indikator, "ID indikator");

    const rule = await prisma.aturanFuzzy.findUnique({
      where: {
        id_indikator: parsedId,
      },
    });

    if (!rule) {
      throw new NotFoundError("Aturan fuzzy untuk indikator ini belum ada.");
    }

    return this.formatAturan(rule);
  }

  static async saveAturan(payload) {
    const {
      id_indikator,
      fungsi_fuzzy,
      arah,
      nilai_min,
      nilai_max,
      midpoint,
      spread,
      keterangan,
    } = payload;

    const indikator = await this.getIndikatorOrThrow(id_indikator);

    const validated = this.validateRulePayload({
      fungsi_fuzzy,
      arah,
      nilai_min,
      nilai_max,
      midpoint,
      spread,
    });

    const saved = await prisma.aturanFuzzy.upsert({
      where: {
        id_indikator: indikator.id_indikator,
      },
      update: {
        fungsi_fuzzy: validated.fungsi_fuzzy,
        arah: validated.arah,
        nilai_min,
        nilai_max,
        midpoint,
        spread,
        keterangan,
      },
      create: {
        id_indikator: indikator.id_indikator,
        fungsi_fuzzy: validated.fungsi_fuzzy,
        arah: validated.arah,
        nilai_min,
        nilai_max,
        midpoint,
        spread,
        keterangan,
      },
    });

    return this.formatAturan(saved);
  }

  static async updateAturan({ id_indikator, payload }) {
    const parsedId = this.parseId(id_indikator, "ID indikator");

    await this.getIndikatorOrThrow(parsedId);

    const existing = await prisma.aturanFuzzy.findUnique({
      where: {
        id_indikator: parsedId,
      },
    });

    if (!existing) {
      throw new NotFoundError("Aturan fuzzy untuk indikator ini belum ada.");
    }

    const mergedPayload = {
      fungsi_fuzzy: payload.fungsi_fuzzy ?? existing.fungsi_fuzzy,
      arah: payload.arah ?? existing.arah,
      nilai_min: payload.nilai_min ?? existing.nilai_min,
      nilai_max: payload.nilai_max ?? existing.nilai_max,
      midpoint: payload.midpoint ?? existing.midpoint,
      spread: payload.spread ?? existing.spread,
    };

    const validated = this.validateRulePayload(mergedPayload);

    const updated = await prisma.aturanFuzzy.update({
      where: {
        id_indikator: parsedId,
      },
      data: {
        fungsi_fuzzy: validated.fungsi_fuzzy,
        arah: validated.arah,
        nilai_min: payload.nilai_min,
        nilai_max: payload.nilai_max,
        midpoint: payload.midpoint,
        spread: payload.spread,
        keterangan: payload.keterangan,
      },
    });

    return this.formatAturan(updated);
  }

  static async deleteAturan({ id_indikator }) {
    const parsedId = this.parseId(id_indikator, "ID indikator");

    const existing = await prisma.aturanFuzzy.findUnique({
      where: {
        id_indikator: parsedId,
      },
    });

    if (!existing) {
      throw new NotFoundError("Aturan fuzzy untuk indikator ini belum ada.");
    }

    await prisma.aturanFuzzy.delete({
      where: {
        id_indikator: parsedId,
      },
    });

    return {
      id_indikator: parsedId,
      deleted: true,
    };
  }

  static async calculateByIndikator({ id_indikator }) {
    const parsedId = this.parseId(id_indikator, "ID indikator");

    const rule = await prisma.aturanFuzzy.findUnique({
      where: {
        id_indikator: parsedId,
      },
    });

    if (!rule) {
      throw new BadRequestError(
        "Aturan fuzzy belum tersedia untuk indikator ini.",
      );
    }

    const nilaiIndikator = await prisma.nilaiIndikator.findMany({
      where: {
        id_indikator: parsedId,
      },
      orderBy: {
        id_grid: "asc",
      },
    });

    if (nilaiIndikator.length === 0) {
      throw new BadRequestError(
        "Nilai indikator asli belum tersedia. Upload atau import data GeoJSON terlebih dahulu.",
      );
    }

    const fuzzyRows = nilaiIndikator.map((item) => ({
      id_grid: item.id_grid,
      id_indikator: item.id_indikator,
      nilai_fuzzy: FuzzyHelper.calculate(Number(item.nilai_asli), rule),
    }));

    await prisma.$transaction(async (tx) => {
      await tx.nilaiFuzzy.deleteMany({
        where: {
          id_indikator: parsedId,
        },
      });

      if (fuzzyRows.length > 0) {
        await tx.nilaiFuzzy.createMany({
          data: fuzzyRows,
        });
      }
    });

    return {
      id_indikator: parsedId,
      fungsi_fuzzy: rule.fungsi_fuzzy,
      arah: rule.arah,
      total_dihitung: fuzzyRows.length,
      preview: fuzzyRows.slice(0, 10),
    };
  }

  static async calculateAll() {
    const rules = await prisma.aturanFuzzy.findMany({
      orderBy: {
        id_indikator: "asc",
      },
    });

    if (rules.length === 0) {
      throw new BadRequestError("Belum ada aturan fuzzy yang tersedia.");
    }

    const ruleIds = rules.map((rule) => rule.id_indikator);
    const allFuzzyRows = [];
    const summary = [];

    for (const rule of rules) {
      const nilaiIndikator = await prisma.nilaiIndikator.findMany({
        where: {
          id_indikator: rule.id_indikator,
        },
        orderBy: {
          id_grid: "asc",
        },
      });

      const fuzzyRows = nilaiIndikator.map((item) => ({
        id_grid: item.id_grid,
        id_indikator: item.id_indikator,
        nilai_fuzzy: FuzzyHelper.calculate(Number(item.nilai_asli), rule),
      }));

      allFuzzyRows.push(...fuzzyRows);

      summary.push({
        id_indikator: rule.id_indikator,
        fungsi_fuzzy: rule.fungsi_fuzzy,
        arah: rule.arah,
        total_dihitung: fuzzyRows.length,
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.nilaiFuzzy.deleteMany({
        where: {
          id_indikator: {
            in: ruleIds,
          },
        },
      });

      if (allFuzzyRows.length > 0) {
        await tx.nilaiFuzzy.createMany({
          data: allFuzzyRows,
        });
      }
    });

    return {
      total_aturan: rules.length,
      total_nilai_fuzzy: allFuzzyRows.length,
      summary,
      preview: allFuzzyRows.slice(0, 10),
    };
  }
}

module.exports = FuzzyService;
