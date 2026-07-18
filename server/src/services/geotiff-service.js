const path = require("path");
const fs = require("fs");
const prisma = require("../prisma/prisma-client");
const crypto = require("crypto");
const GeotiffHelper = require("../helpers/geotiff-helper");
const { TipeRaster } = require("@prisma/client");
const RasterDbUtil = require("../utils/raster-db-util");
const {
  BadRequestError,
  NotFoundError,
} = require("../utils/error-handling-util");

class GeotiffService {
  static async uploadIndikatorRaw({ id_indikator, file }) {
    if (!file) {
      throw new BadRequestError("File GeoTIFF wajib diunggah.");
    }

    GeotiffHelper.validateExtension(file);

    const parsedIdIndikator = RasterDbUtil.parseId(
      id_indikator,
      "ID indikator",
    );

    const metadata = await GeotiffHelper.readMetadata(file.path);
    const storedPath = RasterDbUtil.normalizeStoredPath(file.path);

    let oldFilePathToDelete = null;

    const result = await prisma.$transaction(async (tx) => {
      // LANGKAH 1: Validasi keberadaan indikator di database
      const indikator = await tx.indikator.findUnique({
        where: {
          id_indikator: parsedIdIndikator,
        },
        select: {
          id_indikator: true,
          nama_indikator: true,
        },
      });

      if (!indikator) {
        throw new NotFoundError("Indikator tidak ditemukan.");
      }

      const tipeRaster = TipeRaster.RAW;

      // LANGKAH 2: Cari dan hapus DB record raster lama dengan tipe yang sama
      oldFilePathToDelete = await RasterDbUtil.deleteExistingRaster(tx, {
        id_indikator: parsedIdIndikator,
        tipe_raster: tipeRaster,
      });

      // Cari dan hapus juga FUZZY raster layer terkait indikator ini
      const fuzzyRaster = await tx.rasterLayer.findFirst({
        where: {
          id_indikator: parsedIdIndikator,
          tipe_raster: TipeRaster.FUZZY,
        },
      });

      let oldFuzzyFilePath = null;
      if (fuzzyRaster) {
        await tx.rasterLayer.delete({
          where: { id_raster_layer: fuzzyRaster.id_raster_layer },
        });
        oldFuzzyFilePath = fuzzyRaster.file_path;
      }

      // Bersihkan hasil WLC lama dan raster FINAL_SCORE karena data input berubah
      await tx.hasilWlc.deleteMany({});
      
      const finalScoreRasters = await tx.rasterLayer.findMany({
        where: { tipe_raster: TipeRaster.FINAL_SCORE }
      });
      const finalScoreFilePaths = [];
      for (const fsr of finalScoreRasters) {
        await tx.rasterLayer.delete({
          where: { id_raster_layer: fsr.id_raster_layer }
        });
        finalScoreFilePaths.push(fsr.file_path);
      }

      //inisiasi name kode layer
      const randomSuffix = crypto.randomBytes(4).toString("hex"); // hasilkan 8 karakter hex
      const kodeLayer = `${tipeRaster}-IND${parsedIdIndikator}-${randomSuffix}`;

      // LANGKAH 3: Masukkan data metadata GeoTIFF baru yang diunggah ke database
      const rasterLayer = await tx.rasterLayer.create({
        data: {
          id_indikator: parsedIdIndikator,
          tipe_raster: tipeRaster,
          kode_layer: kodeLayer,
          file_path: storedPath,
          crs: metadata.crs,
          min_value: metadata.min_value,
          max_value: metadata.max_value,
          mean_value: metadata.mean_value,
          nodata_value: metadata.nodata_value,
        },
      });

      // LANGKAH 4: Kembalikan objek respon
      return {
        id_raster_layer: rasterLayer.id_raster_layer,
        id_indikator: indikator.id_indikator,
        kode_layer: rasterLayer.kode_layer,
        kode_indikator: String(indikator.id_indikator),
        nama_indikator: indikator.nama_indikator,
        tipe_raster: rasterLayer.tipe_raster,
        file_path: rasterLayer.file_path,
        metadata: {
          crs: rasterLayer.crs,
          min_value: rasterLayer.min_value,
          max_value: rasterLayer.max_value,
          mean_value: rasterLayer.mean_value,
          nodata_value: rasterLayer.nodata_value,
        },
        oldFuzzyFilePath,
        finalScoreFilePaths,
      };
    });

    // LANGKAH 5: Hapus berkas fisik raster lama dari penyimpanan setelah transaksi DB sukses
    if (oldFilePathToDelete) {
      const absolutePath = path.isAbsolute(oldFilePathToDelete)
        ? oldFilePathToDelete
        : path.join(process.cwd(), oldFilePathToDelete);

      if (fs.existsSync(absolutePath)) {
        try {
          fs.unlinkSync(absolutePath);
        } catch (err) {
          console.warn(
            `  [WARNING] Gagal menghapus berkas fisik lama ${oldFilePathToDelete}: ${err.message}`,
          );
        }
      }
    }

    if (result.oldFuzzyFilePath) {
      const fuzzyAbsPath = path.isAbsolute(result.oldFuzzyFilePath)
        ? result.oldFuzzyFilePath
        : path.join(process.cwd(), result.oldFuzzyFilePath);
      if (fs.existsSync(fuzzyAbsPath)) {
        try {
          fs.unlinkSync(fuzzyAbsPath);
        } catch (err) {
          console.warn(
            `  [WARNING] Gagal menghapus berkas fuzzy lama ${result.oldFuzzyFilePath}: ${err.message}`,
          );
        }
      }
    }

    if (result.finalScoreFilePaths && result.finalScoreFilePaths.length > 0) {
      for (const filePath of result.finalScoreFilePaths) {
        const absPath = path.isAbsolute(filePath)
          ? filePath
          : path.join(process.cwd(), filePath);
        if (fs.existsSync(absPath)) {
          try {
            fs.unlinkSync(absPath);
          } catch (err) {
            console.warn(
              `  [WARNING] Gagal menghapus berkas final score lama ${filePath}: ${err.message}`,
            );
          }
        }
      }
    }

    return result;
  }

  static async updateIndikatorRaw({ id_indikator, file }) {
    // Dengan skema baru, update sama saja dengan upload (delete-then-insert)
    return this.uploadIndikatorRaw({ id_indikator, file });
  }

  // ─────────────────────────────────────────────
  // List & Get Raster Layers
  // ─────────────────────────────────────────────

  /**
   * Daftar semua raster layer untuk satu indikator (semua tipe).
   */
  static async listRasterByIndikator({ id_indikator }) {
    const parsedId = RasterDbUtil.parseId(id_indikator, "ID indikator");

    const indikator = await prisma.indikator.findUnique({
      where: { id_indikator: parsedId },
      select: {
        id_indikator: true,
        nama_indikator: true,
      },
    });

    if (!indikator) {
      throw new NotFoundError("Indikator tidak ditemukan.");
    }

    const rasters = await prisma.rasterLayer.findMany({
      where: { id_indikator: parsedId },
      orderBy: [{ tipe_raster: "asc" }],
    });

    return {
      indikator,
      total: rasters.length,
      rasters: rasters.map((r) => RasterDbUtil.formatRaster(r)),
    };
  }

  /**
   * Ambil raster layer untuk tipe tertentu (raw atau fuzzy).
   */
  static async getActiveRaster({ id_indikator, tipe_raster }) {
    const parsedId = RasterDbUtil.parseId(id_indikator, "ID indikator");

    const validTipes = ["raw", "fuzzy", "final_score"];

    if (!validTipes.includes(tipe_raster)) {
      throw new BadRequestError(
        `tipe_raster harus salah satu dari: ${validTipes.join(", ")}.`,
      );
    }

    const raster = await prisma.rasterLayer.findFirst({
      where: {
        id_indikator: parsedId,
        tipe_raster,
      },
    });

    if (!raster) {
      throw new NotFoundError(
        `Raster '${tipe_raster}' untuk indikator ini tidak ditemukan.`,
      );
    }

    return RasterDbUtil.formatRaster(raster);
  }

  // ─────────────────────────────────────────────
  // Delete Raster Layer
  // ─────────────────────────────────────────────

  /**
   * Hapus satu raster layer: hapus file dari storage dan record dari DB.
   */
  static async deleteRasterLayer({ id_raster_layer }) {
    const parsedId = RasterDbUtil.parseId(id_raster_layer, "ID raster layer");

    const raster = await prisma.rasterLayer.findUnique({
      where: { id_raster_layer: parsedId },
    });

    if (!raster) {
      throw new NotFoundError("Raster layer tidak ditemukan.");
    }

    let fuzzyDeleted = false;
    let oldWlcDeleted = false;

    // Hapus dari DB terlebih dahulu
    await prisma.rasterLayer.delete({
      where: { id_raster_layer: parsedId },
    });

    // Jika yang dihapus adalah RAW dataset, hapus juga FUZZY raster layer dan hasil WLC
    if (raster.tipe_raster === "RAW" && raster.id_indikator) {
      const fuzzyRaster = await prisma.rasterLayer.findFirst({
        where: {
          id_indikator: raster.id_indikator,
          tipe_raster: "FUZZY",
        },
      });

      if (fuzzyRaster) {
        await prisma.rasterLayer.delete({
          where: { id_raster_layer: fuzzyRaster.id_raster_layer },
        });
        fuzzyDeleted = true;

        const fuzzyAbsPath = path.isAbsolute(fuzzyRaster.file_path)
          ? fuzzyRaster.file_path
          : path.join(process.cwd(), fuzzyRaster.file_path);

        if (fs.existsSync(fuzzyAbsPath)) {
          try {
            fs.unlinkSync(fuzzyAbsPath);
          } catch (err) {
            console.warn(
              `  [WARNING] Gagal menghapus file fuzzy ${fuzzyRaster.file_path}: ${err.message}`,
            );
          }
        }
      }

      // Bersihkan hasil WLC lama karena data tidak lagi lengkap
      await prisma.hasilWlc.deleteMany({});
      
      const finalScoreRasters = await prisma.rasterLayer.findMany({
        where: { tipe_raster: "FINAL_SCORE" }
      });
      for (const fsr of finalScoreRasters) {
        await prisma.rasterLayer.delete({
          where: { id_raster_layer: fsr.id_raster_layer }
        });
        const fsrAbsPath = path.isAbsolute(fsr.file_path)
          ? fsr.file_path
          : path.join(process.cwd(), fsr.file_path);
        if (fs.existsSync(fsrAbsPath)) {
          try {
            fs.unlinkSync(fsrAbsPath);
          } catch (err) {
            console.warn(`  [WARNING] Gagal menghapus file final score ${fsr.file_path}: ${err.message}`);
          }
        }
      }
      oldWlcDeleted = true;
    }

    // Hapus file dari storage (best-effort, tidak gagal jika file tidak ada)
    const absolutePath = path.isAbsolute(raster.file_path)
      ? raster.file_path
      : path.join(process.cwd(), raster.file_path);

    if (fs.existsSync(absolutePath)) {
      try {
        fs.unlinkSync(absolutePath);
      } catch (err) {
        console.warn(
          `  [WARNING] Gagal menghapus file ${raster.file_path}: ${err.message}`,
        );
      }
    }

    return {
      id_raster_layer: parsedId,
      tipe_raster: raster.tipe_raster,
      file_path: raster.file_path,
      deleted: true,
      fuzzyDeleted,
      oldWlcDeleted,
    };
  }
}

module.exports = GeotiffService;
