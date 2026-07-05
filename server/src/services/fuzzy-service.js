const path = require("path");
const fs = require("fs");
const prisma = require("../prisma/prisma-client");
const FuzzyHelper = require("../helpers/fuzzy-helper");
const GeotiffHelper = require("../helpers/geotiff-helper");
const RasterDbUtil = require("../utils/raster-db-util");
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

    if (indikator.tipe_nilai === "mask") {
      throw new BadRequestError(
        "Indikator constraint/mask tidak dihitung sebagai nilai fuzzy.",
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
      created_at: rule.created_at,
      updated_at: rule.updated_at,
    };
  }

  static validateRulePayload(payload) {
    const fungsi_fuzzy = FuzzyHelper.normalizeFunctionName(
      payload.fungsi_fuzzy,
    );
    const arah = FuzzyHelper.getArahByFunction(fungsi_fuzzy);

    if (fungsi_fuzzy === "near") {
      FuzzyHelper.toNumber(payload.midpoint, "midpoint");
      FuzzyHelper.toNumber(payload.spread, "spread");
    }

    return {
      fungsi_fuzzy,
      arah,
    };
  }

  /**
   * Ambil aturan fuzzy aktif untuk satu indikator.
   * Sumber min/max diambil dari raster_layers (raw, active) —
   * tidak lagi dari statistik_indikator.
   */
  static resolveRuleFromRaster(rule, rawRaster) {
    const fungsiFuzzy = FuzzyHelper.normalizeFunctionName(rule.fungsi_fuzzy);

    const resolvedRule = {
      fungsi_fuzzy: fungsiFuzzy,
      arah: rule.arah,
      midpoint:
        rule.midpoint !== null && rule.midpoint !== undefined
          ? Number(rule.midpoint)
          : null,
      spread:
        rule.spread !== null && rule.spread !== undefined
          ? Number(rule.spread)
          : null,
    };

    // Untuk linear increasing / decreasing, min-max diambil dari database jika ada,
    // jika null, ambil dari statistik raster raw sebagai fallback
    if (
      fungsiFuzzy === "linear_increasing" ||
      fungsiFuzzy === "linear_decreasing"
    ) {
      const dbMin = rule.nilai_min !== null && rule.nilai_min !== undefined ? Number(rule.nilai_min) : null;
      const dbMax = rule.nilai_max !== null && rule.nilai_max !== undefined ? Number(rule.nilai_max) : null;

      if (dbMin !== null) {
        resolvedRule.nilai_min = dbMin;
      } else {
        if (rawRaster.min_value === null) {
          throw new BadRequestError(
            "Raster raw belum memiliki statistik min. Re-upload GeoTIFF raw.",
          );
        }
        resolvedRule.nilai_min = Number(rawRaster.min_value);
      }

      if (dbMax !== null) {
        resolvedRule.nilai_max = dbMax;
      } else {
        if (rawRaster.max_value === null) {
          throw new BadRequestError(
            "Raster raw belum memiliki statistik max. Re-upload GeoTIFF raw.",
          );
        }
        resolvedRule.nilai_max = Number(rawRaster.max_value);
      }
    }

    return resolvedRule;
  }

  /**
   * Generate nama file dan path untuk output fuzzy GeoTIFF.
   */
  static buildFuzzyOutputPath(id_indikator) {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const fileName = `${timestamp}_${random}_fuzzy_ind${id_indikator}.tif`;

    const relDir = path.join("storage", "geotiff", "fuzzy");
    const absDir = path.join(process.cwd(), relDir);
    const absPath = path.join(absDir, fileName);
    const relPath = path.join(relDir, fileName).replace(/\\/g, "/");

    return { absPath, relPath };
  }

  // ─────────────────────────────────────────────
  // CRUD Aturan Fuzzy
  // ─────────────────────────────────────────────

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
    const { id_indikator, fungsi_fuzzy, midpoint, spread, nilai_min, nilai_max } =
      payload;

    const indikator = await this.getIndikatorOrThrow(id_indikator);

    const scarcityCheck = midpoint !== undefined && midpoint !== null && midpoint !== "";
    const validated = this.validateRulePayload({
      fungsi_fuzzy,
      midpoint: scarcityCheck ? midpoint : 0,
      spread: spread ?? 0.1,
    });

    const isNear = validated.fungsi_fuzzy === "near";
    const statusSpread = spread !== undefined && spread !== null && spread !== "" ? Number(spread) : 0.1;

    // Ambil raster raw aktif untuk auto-fill min/max/median
    const rawRaster = await prisma.rasterLayer.findFirst({
      where: {
        id_indikator: indikator.id_indikator,
        tipe_raster: "raw",
      },
    });

    let autoMin = !isNear && nilai_min !== undefined && nilai_min !== null && nilai_min !== "" ? Number(nilai_min) : null;
    let autoMax = !isNear && nilai_max !== undefined && nilai_max !== null && nilai_max !== "" ? Number(nilai_max) : null;
    let autoMidpoint = isNear ? (scarcityCheck ? Number(midpoint) : null) : null;

    if (rawRaster) {
      if (!isNear) {
        if (autoMin === null) {
          autoMin = rawRaster.min_value !== null ? Number(rawRaster.min_value) : null;
        }
        if (autoMax === null) {
          autoMax = rawRaster.max_value !== null ? Number(rawRaster.max_value) : null;
        }
      }

      if (isNear && autoMidpoint === null) {
        try {
          const rawAbsPath = path.isAbsolute(rawRaster.file_path)
            ? rawRaster.file_path
            : path.join(process.cwd(), rawRaster.file_path);

          const GeotiffHelper = require("../helpers/geotiff-helper");
          const { noDataValue, pixelValues } = await GeotiffHelper.readPixelsForFuzzy(rawAbsPath);

          const validValues = pixelValues.filter(v =>
            v !== null &&
            v !== undefined &&
            !Number.isNaN(v) &&
            Number.isFinite(v) &&
            (noDataValue === null || v !== noDataValue)
          );

          if (validValues.length > 0) {
            validValues.sort((a, b) => a - b);
            const mid = Math.floor(validValues.length / 2);
            autoMidpoint = validValues.length % 2 !== 0
              ? validValues[mid]
              : (validValues[mid - 1] + validValues[mid]) / 2;
          } else {
            autoMidpoint = 0;
          }
        } catch (err) {
          console.error("Gagal menghitung median otomatis:", err.message);
          autoMidpoint = 0;
        }
      }
    }

    const saved = await prisma.aturanFuzzy.upsert({
      where: {
        id_indikator: indikator.id_indikator,
      },
      update: {
        fungsi_fuzzy: validated.fungsi_fuzzy,
        arah: validated.arah,
        nilai_min: autoMin,
        nilai_max: autoMax,
        midpoint: isNear ? autoMidpoint : null,
        spread: isNear ? statusSpread : null,
      },
      create: {
        id_indikator: indikator.id_indikator,
        fungsi_fuzzy: validated.fungsi_fuzzy,
        arah: validated.arah,
        nilai_min: autoMin,
        nilai_max: autoMax,
        midpoint: isNear ? autoMidpoint : null,
        spread: isNear ? statusSpread : null,
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
      midpoint:
        payload.midpoint !== undefined ? payload.midpoint : existing.midpoint,
      spread: payload.spread !== undefined ? payload.spread : existing.spread,
      nilai_min:
        payload.nilai_min !== undefined ? payload.nilai_min : existing.nilai_min,
      nilai_max:
        payload.nilai_max !== undefined ? payload.nilai_max : existing.nilai_max,
    };

    const isNear = mergedPayload.fungsi_fuzzy === "near";
    const scarcityCheck = mergedPayload.midpoint !== undefined && mergedPayload.midpoint !== null && mergedPayload.midpoint !== "";

    const validated = this.validateRulePayload({
      fungsi_fuzzy: mergedPayload.fungsi_fuzzy,
      midpoint: scarcityCheck ? mergedPayload.midpoint : 0,
      spread: mergedPayload.spread ?? 0.1,
    });

    const statusSpread = mergedPayload.spread !== undefined && mergedPayload.spread !== null && mergedPayload.spread !== "" ? Number(mergedPayload.spread) : 0.1;

    // Ambil raster raw aktif untuk update min/max/median
    const rawRaster = await prisma.rasterLayer.findFirst({
      where: {
        id_indikator: parsedId,
        tipe_raster: "raw",
      },
    });

    let autoMin = !isNear && mergedPayload.nilai_min !== null && mergedPayload.nilai_min !== undefined && mergedPayload.nilai_min !== ""
      ? Number(mergedPayload.nilai_min)
      : null;
    let autoMax = !isNear && mergedPayload.nilai_max !== null && mergedPayload.nilai_max !== undefined && mergedPayload.nilai_max !== ""
      ? Number(mergedPayload.nilai_max)
      : null;
    let autoMidpoint = isNear ? (scarcityCheck ? Number(mergedPayload.midpoint) : null) : null;

    if (rawRaster) {
      if (!isNear) {
        if (autoMin === null) {
          autoMin = rawRaster.min_value !== null ? Number(rawRaster.min_value) : null;
        }
        if (autoMax === null) {
          autoMax = rawRaster.max_value !== null ? Number(rawRaster.max_value) : null;
        }
      }

      if (isNear && autoMidpoint === null) {
        try {
          const rawAbsPath = path.isAbsolute(rawRaster.file_path)
            ? rawRaster.file_path
            : path.join(process.cwd(), rawRaster.file_path);

          const GeotiffHelper = require("../helpers/geotiff-helper");
          const { noDataValue, pixelValues } = await GeotiffHelper.readPixelsForFuzzy(rawAbsPath);

          const validValues = pixelValues.filter(v =>
            v !== null &&
            v !== undefined &&
            !Number.isNaN(v) &&
            Number.isFinite(v) &&
            (noDataValue === null || v !== noDataValue)
          );

          if (validValues.length > 0) {
            validValues.sort((a, b) => a - b);
            const mid = Math.floor(validValues.length / 2);
            autoMidpoint = validValues.length % 2 !== 0
              ? validValues[mid]
              : (validValues[mid - 1] + validValues[mid]) / 2;
          } else {
            autoMidpoint = 0;
          }
        } catch (err) {
          console.error("Gagal menghitung median otomatis:", err.message);
          autoMidpoint = 0;
        }
      }
    }

    const updated = await prisma.aturanFuzzy.update({
      where: {
        id_indikator: parsedId,
      },
      data: {
        fungsi_fuzzy: validated.fungsi_fuzzy,
        arah: validated.arah,
        nilai_min: autoMin,
        nilai_max: autoMax,
        midpoint: isNear ? autoMidpoint : null,
        spread: isNear ? statusSpread : null,
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

  // ─────────────────────────────────────────────
  // Perhitungan Fuzzy → GeoTIFF output
  // ─────────────────────────────────────────────

  /**
   * Hitung fuzzy untuk satu indikator:
   * 1. Baca aturan fuzzy
   * 2. Ambil raster raw aktif → file_path + min/max dari DB
   * 3. Baca pixel dari GeoTIFF raw
   * 4. Hitung fuzzy per pixel
   * 5. Tulis GeoTIFF fuzzy baru ke storage
   * 6. Simpan metadata fuzzy ke raster_layers
   */
  static async calculateByIndikator({ id_indikator }) {
    const parsedId = this.parseId(id_indikator, "ID indikator");

    // 1. Validasi indikator
    await this.getIndikatorOrThrow(parsedId);

    // 2. Ambil aturan fuzzy
    const rule = await prisma.aturanFuzzy.findUnique({
      where: { id_indikator: parsedId },
    });

    if (!rule) {
      throw new BadRequestError(
        "Aturan fuzzy belum tersedia untuk indikator ini. Tambahkan aturan fuzzy terlebih dahulu.",
      );
    }

    // 3. Ambil raster raw aktif
    const rawRaster = await prisma.rasterLayer.findFirst({
      where: {
        id_indikator: parsedId,
        tipe_raster: "raw",
      },
    });

    if (!rawRaster) {
      throw new BadRequestError(
        "GeoTIFF raw belum tersedia untuk indikator ini. Upload GeoTIFF raw terlebih dahulu.",
      );
    }

    // 4. Resolve rule dengan min/max dari raster raw
    const resolvedRule = this.resolveRuleFromRaster(rule, rawRaster);

    // 5. Baca pixel dari GeoTIFF raw
    const rawAbsPath = path.isAbsolute(rawRaster.file_path)
      ? rawRaster.file_path
      : path.join(process.cwd(), rawRaster.file_path);

    const { width, height, noDataValue, pixelValues } =
      await GeotiffHelper.readPixelsForFuzzy(rawAbsPath);

    // 6. Hitung fuzzy per pixel
    const fuzzyOutputNodata =
      noDataValue !== null ? noDataValue : -9999;

    const fuzzyValues = new Array(pixelValues.length);

    for (let i = 0; i < pixelValues.length; i++) {
      const px = pixelValues[i];
      const isNodata =
        (noDataValue !== null && px === noDataValue) ||
        !Number.isFinite(px) ||
        Number.isNaN(px);

      fuzzyValues[i] = isNodata
        ? fuzzyOutputNodata
        : FuzzyHelper.calculate(px, resolvedRule);
    }

    // 7. Tulis GeoTIFF fuzzy
    const { absPath: fuzzyAbsPath, relPath: fuzzyRelPath } =
      this.buildFuzzyOutputPath(parsedId);

    await GeotiffHelper.writeGeoTIFF(
      fuzzyAbsPath,
      fuzzyValues,
      rawAbsPath,
      fuzzyOutputNodata,
    );

    // 8. Baca metadata GeoTIFF fuzzy yang baru ditulis
    let fuzzyMetadata;

    try {
      fuzzyMetadata = await GeotiffHelper.readMetadataOnly(fuzzyAbsPath);
    } catch (err) {
      // Jika baca metadata gagal, hapus file dan lempar error
      if (fs.existsSync(fuzzyAbsPath)) fs.unlinkSync(fuzzyAbsPath);
      throw err;
    }

    // 9. Simpan ke DB dalam satu transaksi
    let savedRaster;
    let oldFuzzyFilePath = null;

    try {
      savedRaster = await prisma.$transaction(async (tx) => {
        // Hapus record fuzzy lama dari DB dan simpan path-nya
        oldFuzzyFilePath = await RasterDbUtil.deleteExistingRaster(tx, {
          id_indikator: parsedId,
          tipe_raster: "fuzzy",
        });

        // Simpan raster fuzzy baru
        return tx.rasterLayer.create({
          data: {
            id_indikator: parsedId,
            tipe_raster: "fuzzy",
            file_path: fuzzyRelPath,
            crs: fuzzyMetadata.crs,
            min_value: fuzzyMetadata.min_value,
            max_value: fuzzyMetadata.max_value,
            mean_value: fuzzyMetadata.mean_value,
            nodata_value: fuzzyOutputNodata,
          },
        });
      });
    } catch (dbErr) {
      // Rollback file baru jika DB gagal
      if (fs.existsSync(fuzzyAbsPath)) {
        try { fs.unlinkSync(fuzzyAbsPath); } catch (_) {}
      }
      throw dbErr;
    }

    // Hapus file fuzzy lama dari penyimpanan setelah transaksi DB sukses
    if (oldFuzzyFilePath) {
      const absoluteOldPath = path.isAbsolute(oldFuzzyFilePath)
        ? oldFuzzyFilePath
        : path.join(process.cwd(), oldFuzzyFilePath);

      if (fs.existsSync(absoluteOldPath)) {
        try {
          fs.unlinkSync(absoluteOldPath);
        } catch (err) {
          console.warn(`  [WARNING] Gagal menghapus file fuzzy lama ${oldFuzzyFilePath}: ${err.message}`);
        }
      }
    }

    return {
      id_indikator: parsedId,
      id_raster_layer_fuzzy: savedRaster.id_raster_layer,
      file_path: fuzzyRelPath,
      fungsi_fuzzy: resolvedRule.fungsi_fuzzy,
      arah: resolvedRule.arah,
      nilai_min: resolvedRule.nilai_min ?? null,
      nilai_max: resolvedRule.nilai_max ?? null,
      midpoint: resolvedRule.midpoint ?? null,
      spread: resolvedRule.spread ?? null,
      total_pixel: pixelValues.length,
    };
  }

  /**
   * Hitung fuzzy untuk semua indikator yang memiliki:
   * - aturan_fuzzy terdefinisi
   * - raster raw aktif tersedia
   *
   * Memproses per indikator secara independen; error satu indikator
   * tidak menghentikan indikator lainnya.
   */
  static async calculateAll() {
    const rules = await prisma.aturanFuzzy.findMany({
      orderBy: { id_indikator: "asc" },
    });

    if (rules.length === 0) {
      throw new BadRequestError("Belum ada aturan fuzzy yang tersedia.");
    }

    const results = [];
    const errors = [];

    for (const rule of rules) {
      try {
        const result = await this.calculateByIndikator({
          id_indikator: rule.id_indikator,
        });
        results.push(result);
      } catch (err) {
        errors.push({
          id_indikator: rule.id_indikator,
          error: err.message,
        });
      }
    }

    return {
      total_aturan: rules.length,
      total_berhasil: results.length,
      total_gagal: errors.length,
      hasil: results,
      gagal: errors.length > 0 ? errors : undefined,
    };
  }
}

module.exports = FuzzyService;
