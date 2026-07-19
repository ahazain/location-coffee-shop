const path = require("path");
const fs = require("fs");
const prisma = require("../prisma/prisma-client");
const {
  TipeRaster,
  TipeNilaiIndikator,
  FungsiFuzzy,
  ArahFuzzy,
} = require("@prisma/client");
const FuzzyHelper = require("../helpers/fuzzy-helper");
const GeotiffHelper = require("../helpers/geotiff-helper");
const RasterDbUtil = require("../utils/raster-db-util");
const {
  BadRequestError,
  NotFoundError,
} = require("../utils/error-handling-util");

class FuzzyService {
  // Default spread untuk fungsi NEAR (selalu 0.2, tidak bisa di-custom)
  static DEFAULT_NEAR_SPREAD = 0.2;

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

    if (indikator.tipe_nilai === TipeNilaiIndikator.MASK) {
      throw new BadRequestError(
        "Indikator constraint/mask tidak dihitung sebagai nilai fuzzy.",
      );
    }

    return indikator;
  }

  /**
   * Format record aturan_fuzzy dari DB untuk response API.
   * PERBAIKAN: sebelumnya field fungsi_fuzzy & arah salah dikirim sebagai
   * referensi ke object enum Prisma itu sendiri (`FungsiFuzzy`, `ArahFuzzy`),
   * bukan nilai dari `rule`. Sekarang dikembalikan sebagai string enum asli
   * (mis. "LINEAR", "INCREASING") supaya konsumen tahu persis nilai di DB.
   */
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

  /**
   * Validasi payload aturan fuzzy dari request.
   * Sesuai schema baru: fungsi_fuzzy ("linear" | "near"), arah wajib diisi
   * eksplisit untuk "linear" (tidak lagi ditebak dari nama fungsi seperti
   * versi lama yang punya linear_increasing/linear_decreasing/bell_shaped).
   *
   * Return: { fungsi_fuzzy, arah } dalam bentuk ENUM PRISMA (UPPERCASE),
   * siap langsung dipakai untuk create/update Prisma.
   */
  static validateRulePayload(payload) {
    const fungsiFuzzyNormalized = FuzzyHelper.normalizeFunctionName(
      payload.fungsi_fuzzy,
    );
    const arahNormalized = FuzzyHelper.normalizeArah(
      payload.arah,
      fungsiFuzzyNormalized,
    );

    if (fungsiFuzzyNormalized === "near") {
      FuzzyHelper.toNumber(payload.midpoint, "midpoint");
    }

    return {
      fungsi_fuzzy: FuzzyHelper.toPrismaFungsiFuzzy(fungsiFuzzyNormalized),
      arah: FuzzyHelper.toPrismaArah(arahNormalized, fungsiFuzzyNormalized),
    };
  }

  /**
   * Ambil aturan fuzzy aktif untuk satu indikator, resolve min/max dari
   * raster_layers (raw, active) jika nilai_min/nilai_max belum diisi manual.
   *
   * PERBAIKAN: baris debug lama `if (fungsiFuzzy === TipeRaster... // salah...`
   * adalah syntax error yang menyebabkan crash nodemon — sudah dihapus.
   * Perbandingan sekarang konsisten pakai enum FungsiFuzzy dari @prisma/client.
   */
  static resolveRuleFromRaster(rule, rawRaster) {
    const fungsiFuzzy = rule.fungsi_fuzzy; // "LINEAR" | "NEAR" (enum)
    const arah = rule.arah; // "INCREASING" | "DECREASING" | "NEAR" (enum)

    const resolvedRule = {
      fungsi_fuzzy: fungsiFuzzy,
      arah: arah,
      midpoint:
        rule.midpoint !== null && rule.midpoint !== undefined
          ? Number(rule.midpoint)
          : null,
      spread:
        rule.spread !== null && rule.spread !== undefined
          ? Number(rule.spread)
          : null,
    };

    if (fungsiFuzzy === FungsiFuzzy.LINEAR) {
      // arah (INCREASING/DECREASING) menentukan arah linearnya
      const dbMin =
        rule.nilai_min !== null && rule.nilai_min !== undefined
          ? Number(rule.nilai_min)
          : null;
      const dbMax =
        rule.nilai_max !== null && rule.nilai_max !== undefined
          ? Number(rule.nilai_max)
          : null;

      resolvedRule.nilai_min =
        dbMin !== null
          ? dbMin
          : rawRaster.min_value !== null
            ? Number(rawRaster.min_value)
            : (() => {
                throw new BadRequestError(
                  "Raster raw belum memiliki statistik min. Re-upload GeoTIFF raw.",
                );
              })();

      resolvedRule.nilai_max =
        dbMax !== null
          ? dbMax
          : rawRaster.max_value !== null
            ? Number(rawRaster.max_value)
            : (() => {
                throw new BadRequestError(
                  "Raster raw belum memiliki statistik max. Re-upload GeoTIFF raw.",
                );
              })();
    }

    // NEAR: cukup midpoint (+ nilai_min/nilai_max opsional untuk piecewise di helper).
    // spread tidak dipakai perhitungan NEAR versi baru, dipertahankan untuk kompatibilitas data lama.

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

  /**
   * Hitung nilai midpoint otomatis (midrange) untuk fungsi NEAR dari pixel
   * raster raw, bila user tidak mengirim midpoint sendiri.
   * Midrange = (min + max) / 2
   */
  static async computeAutoMidpointFromRaster(rawRaster) {
    try {
      const rawAbsPath = path.isAbsolute(rawRaster.file_path)
        ? rawRaster.file_path
        : path.join(process.cwd(), rawRaster.file_path);

      const { noDataValue, pixelValues } =
        await GeotiffHelper.readPixelsForFuzzy(rawAbsPath);

      const validValues = pixelValues.filter(
        (v) =>
          v !== null &&
          v !== undefined &&
          !Number.isNaN(v) &&
          Number.isFinite(v) &&
          v > 0 &&
          (noDataValue === null || v !== noDataValue),
      );

      if (validValues.length === 0) {
        return 0;
      }

      validValues.sort((a, b) => a - b);
      const minVal = validValues[0];
      const maxVal = validValues[validValues.length - 1];

      // Midrange = (min + max) / 2
      return (minVal + maxVal) / 2;
    } catch (err) {
      console.error("Gagal menghitung midrange otomatis:", err.message);
      return 0;
    }
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
    const {
      id_indikator,
      fungsi_fuzzy,
    } = payload;

    // Validasi: fungsi_fuzzy wajib dipilih
    if (!fungsi_fuzzy) {
      throw new BadRequestError("Fungsi fuzzy wajib dipilih (INCREASING, DECREASING, atau NEAR).");
    }

    const indikator = await this.getIndikatorOrThrow(id_indikator);

    // Ambil raster raw untuk mendapatkan min/max dari metadata
    const rawRaster = await prisma.rasterLayer.findFirst({
      where: {
        id_indikator: indikator.id_indikator,
        tipe_raster: TipeRaster.RAW,
      },
    });

    if (!rawRaster) {
      throw new BadRequestError("Dataset raster belum diupload untuk indikator ini. Upload dataset terlebih dahulu.");
    }

    // Konversi dari frontend format ke Prisma enum
    // Frontend: INCREASING, DECREASING, NEAR
    // Prisma FungsiFuzzy: LINEAR, NEAR
    // Prisma ArahFuzzy: INCREASING, DECREASING, NEAR
    let prismaFungsiFuzzy;
    let prismaArah;
    let nilai_min = null;
    let nilai_max = null;
    let midpoint = null;
    let spread = null;

    if (fungsi_fuzzy === "NEAR") {
      prismaFungsiFuzzy = FungsiFuzzy.NEAR;
      prismaArah = ArahFuzzy.NEAR;
      const minVal = rawRaster.min_value !== null ? Number(rawRaster.min_value) : 0;
      const maxVal = rawRaster.max_value !== null ? Number(rawRaster.max_value) : 0;
      midpoint = (minVal + maxVal) / 2;
      spread = this.DEFAULT_NEAR_SPREAD; // 0.2
    } else if (fungsi_fuzzy === "DECREASING") {
      prismaFungsiFuzzy = FungsiFuzzy.LINEAR;
      prismaArah = ArahFuzzy.DECREASING;
      nilai_min = rawRaster.min_value !== null ? Number(rawRaster.min_value) : null;
      nilai_max = rawRaster.max_value !== null ? Number(rawRaster.max_value) : null;
    } else {
      // INCREASING (default)
      prismaFungsiFuzzy = FungsiFuzzy.LINEAR;
      prismaArah = ArahFuzzy.INCREASING;
      nilai_min = rawRaster.min_value !== null ? Number(rawRaster.min_value) : null;
      nilai_max = rawRaster.max_value !== null ? Number(rawRaster.max_value) : null;
    }

    // Validasi: pastikan min/max tidak null untuk INCREASING/DECREASING
    if (fungsi_fuzzy !== "NEAR" && (nilai_min === null || nilai_max === null)) {
      throw new BadRequestError("Metadata raster tidak lengkap. Pastikan dataset raster memiliki nilai min dan max.");
    }

    const saved = await prisma.aturanFuzzy.upsert({
      where: {
        id_indikator: indikator.id_indikator,
      },
      update: {
        fungsi_fuzzy: prismaFungsiFuzzy,
        arah: prismaArah,
        nilai_min: nilai_min,
        nilai_max: nilai_max,
        midpoint: midpoint,
        spread: spread,
      },
      create: {
        id_indikator: indikator.id_indikator,
        fungsi_fuzzy: prismaFungsiFuzzy,
        arah: prismaArah,
        nilai_min: nilai_min,
        nilai_max: nilai_max,
        midpoint: midpoint,
        spread: spread,
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

    // Validasi: fungsi_fuzzy wajib dipilih
    if (!payload.fungsi_fuzzy) {
      throw new BadRequestError("Fungsi fuzzy wajib dipilih (INCREASING, DECREASING, atau NEAR).");
    }

    // Ambil raster raw untuk mendapatkan min/max dari metadata
    const rawRaster = await prisma.rasterLayer.findFirst({
      where: {
        id_indikator: parsedId,
        tipe_raster: TipeRaster.RAW,
      },
    });

    if (!rawRaster) {
      throw new BadRequestError("Dataset raster belum diupload untuk indikator ini. Upload dataset terlebih dahulu.");
    }

    // Konversi dari frontend format ke Prisma enum
    let prismaFungsiFuzzy;
    let prismaArah;

    if (payload.fungsi_fuzzy === "NEAR") {
      prismaFungsiFuzzy = FungsiFuzzy.NEAR;
      prismaArah = ArahFuzzy.NEAR;
    } else if (payload.fungsi_fuzzy === "DECREASING") {
      prismaFungsiFuzzy = FungsiFuzzy.LINEAR;
      prismaArah = ArahFuzzy.DECREASING;
    } else {
      prismaFungsiFuzzy = FungsiFuzzy.LINEAR;
      prismaArah = ArahFuzzy.INCREASING;
    }

    // Tentukan nilai berdasarkan fungsi fuzzy
    let nilai_min = null;
    let nilai_max = null;
    let midpoint = null;
    let spread = null;

    if (payload.fungsi_fuzzy === "NEAR") {
      // NEAR: midpoint = (min + max) / 2, spread = 0.2
      const minVal = rawRaster.min_value !== null ? Number(rawRaster.min_value) : 0;
      const maxVal = rawRaster.max_value !== null ? Number(rawRaster.max_value) : 0;
      midpoint = (minVal + maxVal) / 2;
      spread = this.DEFAULT_NEAR_SPREAD; // 0.2
    } else if (payload.fungsi_fuzzy === "DECREASING") {
      // DECREASING: min/max dari metadata raster
      nilai_min = rawRaster.min_value !== null ? Number(rawRaster.min_value) : null;
      nilai_max = rawRaster.max_value !== null ? Number(rawRaster.max_value) : null;
    } else {
      // INCREASING: min/max dari metadata raster
      nilai_min = rawRaster.min_value !== null ? Number(rawRaster.min_value) : null;
      nilai_max = rawRaster.max_value !== null ? Number(rawRaster.max_value) : null;
    }

    // Validasi: pastikan min/max tidak null untuk INCREASING/DECREASING
    if (payload.fungsi_fuzzy !== "NEAR" && (nilai_min === null || nilai_max === null)) {
      throw new BadRequestError("Metadata raster tidak lengkap. Pastikan dataset raster memiliki nilai min dan max.");
    }

    const updated = await prisma.aturanFuzzy.update({
      where: {
        id_indikator: parsedId,
      },
      data: {
        fungsi_fuzzy: prismaFungsiFuzzy,
        arah: prismaArah,
        nilai_min: nilai_min,
        nilai_max: nilai_max,
        midpoint: midpoint,
        spread: spread,
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
        tipe_raster: TipeRaster.RAW,
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
    const fuzzyOutputNodata = noDataValue !== null ? noDataValue : -9999;

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
        // Hapus record fuzzy lama dari DB dan simpan path-nya.
        // PERBAIKAN: kirim enum Prisma (TipeRaster.FUZZY), bukan string "fuzzy" —
        // ini penyebab error "Invalid value for argument tipe_raster. Expected TipeRaster."
        oldFuzzyFilePath = await RasterDbUtil.deleteExistingRaster(tx, {
          id_indikator: parsedId,
          tipe_raster: TipeRaster.FUZZY,
        });

        // Simpan raster fuzzy baru
        return tx.rasterLayer.create({
          data: {
            id_indikator: parsedId,
            kode_layer: this.buildFuzzyKodeLayer(parsedId),
            tipe_raster: TipeRaster.FUZZY,
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
        try {
          fs.unlinkSync(fuzzyAbsPath);
        } catch (_) {}
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
          console.warn(
            `  [WARNING] Gagal menghapus file fuzzy lama ${oldFuzzyFilePath}: ${err.message}`,
          );
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
   * Generate kode_layer unik untuk raster fuzzy.
   * Format: FUZZY-{id_indikator}-{timestamp}
   * (kode_layer bersifat @unique di schema, jadi harus selalu berbeda tiap kali dibuat)
   */
  static buildFuzzyKodeLayer(id_indikator) {
    const timestamp = Date.now();
    return `FUZZY-${id_indikator}-${timestamp}`;
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
