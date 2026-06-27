const path = require("path");
const fs = require("fs");
const prisma = require("../prisma/prisma-client");
const FuzzyHelper = require("../helpers/fuzzy-helper");
const GeotiffHelper = require("../helpers/geotiff-helper");
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
        "Indikator constraint tidak dihitung sebagai nilai fuzzy.",
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

    // Untuk linear increasing / decreasing, min-max diambil dari statistik raster raw
    if (
      fungsiFuzzy === "linear_increasing" ||
      fungsiFuzzy === "linear_decreasing"
    ) {
      if (rawRaster.min_value === null || rawRaster.max_value === null) {
        throw new BadRequestError(
          "Raster raw belum memiliki statistik min/max. Re-upload GeoTIFF raw.",
        );
      }

      resolvedRule.nilai_min = Number(rawRaster.min_value);
      resolvedRule.nilai_max = Number(rawRaster.max_value);
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
    const { id_indikator, fungsi_fuzzy, midpoint, spread, keterangan } =
      payload;

    const indikator = await this.getIndikatorOrThrow(id_indikator);

    const validated = this.validateRulePayload({
      fungsi_fuzzy,
      midpoint,
      spread,
    });

    const isNear = validated.fungsi_fuzzy === "near";

    const saved = await prisma.aturanFuzzy.upsert({
      where: {
        id_indikator: indikator.id_indikator,
      },
      update: {
        fungsi_fuzzy: validated.fungsi_fuzzy,
        arah: validated.arah,
        // Min-max diambil dari raster raw saat hitung fuzzy, bukan disimpan manual
        nilai_min: null,
        nilai_max: null,
        midpoint: isNear ? midpoint : null,
        spread: isNear ? spread : null,
        keterangan,
      },
      create: {
        id_indikator: indikator.id_indikator,
        fungsi_fuzzy: validated.fungsi_fuzzy,
        arah: validated.arah,
        nilai_min: null,
        nilai_max: null,
        midpoint: isNear ? midpoint : null,
        spread: isNear ? spread : null,
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
      midpoint:
        payload.midpoint !== undefined ? payload.midpoint : existing.midpoint,
      spread: payload.spread !== undefined ? payload.spread : existing.spread,
    };

    const validated = this.validateRulePayload(mergedPayload);
    const isNear = validated.fungsi_fuzzy === "near";

    const updated = await prisma.aturanFuzzy.update({
      where: {
        id_indikator: parsedId,
      },
      data: {
        fungsi_fuzzy: validated.fungsi_fuzzy,
        arah: validated.arah,
        nilai_min: null,
        nilai_max: null,
        midpoint: isNear ? mergedPayload.midpoint : null,
        spread: isNear ? mergedPayload.spread : null,
        keterangan:
          payload.keterangan !== undefined
            ? payload.keterangan
            : existing.keterangan,
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
        is_active: true,
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

    try {
      savedRaster = await prisma.$transaction(async (tx) => {
        // Cari versi terakhir
        const agg = await tx.rasterLayer.aggregate({
          where: { id_indikator: parsedId, tipe_raster: "fuzzy" },
          _max: { versi: true },
        });
        const nextVersi = agg._max.versi ? agg._max.versi + 1 : 1;

        // Deaktivasi versi fuzzy lama
        await tx.rasterLayer.updateMany({
          where: { id_indikator: parsedId, tipe_raster: "fuzzy", is_active: true },
          data: { is_active: false },
        });

        // Simpan raster fuzzy baru
        return tx.rasterLayer.create({
          data: {
            id_indikator: parsedId,
            tipe_raster: "fuzzy",
            file_path: fuzzyRelPath,
            original_filename: `fuzzy_ind${parsedId}_v${nextVersi}.tif`,
            crs: fuzzyMetadata.crs,
            resolution_x: fuzzyMetadata.resolution_x,
            resolution_y: fuzzyMetadata.resolution_y,
            width: fuzzyMetadata.width,
            height: fuzzyMetadata.height,
            band_count: fuzzyMetadata.band_count,
            extent: fuzzyMetadata.extent,
            min_value: fuzzyMetadata.min_value,
            max_value: fuzzyMetadata.max_value,
            mean_value: fuzzyMetadata.mean_value,
            std_value: fuzzyMetadata.std_value,
            nodata_value: fuzzyOutputNodata,
            jumlah_pixel: fuzzyMetadata.jumlah_pixel,
            jumlah_pixel_valid: fuzzyMetadata.jumlah_pixel_valid,
            jumlah_pixel_nodata: fuzzyMetadata.jumlah_pixel_nodata,
            versi: nextVersi,
            is_active: true,
          },
        });
      });
    } catch (dbErr) {
      // Rollback file jika DB gagal
      if (fs.existsSync(fuzzyAbsPath)) fs.unlinkSync(fuzzyAbsPath);
      throw dbErr;
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
      total_pixel_valid: savedRaster.jumlah_pixel_valid,
      total_pixel_nodata: savedRaster.jumlah_pixel_nodata,
      versi: savedRaster.versi,
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
