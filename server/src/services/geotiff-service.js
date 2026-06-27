const path = require("path");
const fs = require("fs");
const prisma = require("../prisma/prisma-client");
const GeotiffHelper = require("../helpers/geotiff-helper");
const RasterDbUtil = require("../utils/raster-db-util");
const {
  BadRequestError,
  NotFoundError,
} = require("../utils/error-handling-util");

class GeotiffService {
  // ─────────────────────────────────────────────
  // Upload Raw GeoTIFF
  // ─────────────────────────────────────────────

  static async uploadIndikatorRaw({ id_indikator, file }) {
    if (!file) {
      throw new BadRequestError("File GeoTIFF wajib diunggah.");
    }

    GeotiffHelper.validateExtension(file);

    const parsedIdIndikator = RasterDbUtil.parseId(id_indikator, "ID indikator");

    const metadata = await GeotiffHelper.readMetadata(file.path);
    const storedPath = RasterDbUtil.normalizeStoredPath(file.path);

    const result = await prisma.$transaction(async (tx) => {
      // LANGKAH 1: Validasi keberadaan indikator di database
      const indikator = await tx.indikator.findUnique({
        where: {
          id_indikator: parsedIdIndikator,
        },
        select: {
          id_indikator: true,
          kode_indikator: true,
          nama_indikator: true,
          jenis_indikator: true,
          is_active: true,
        },
      });

      if (!indikator) {
        throw new NotFoundError("Indikator tidak ditemukan.");
      }

      // LANGKAH 2: Validasi status keaktifan indikator
      if (!indikator.is_active) {
        throw new BadRequestError("Indikator tidak aktif.");
      }

      // LANGKAH 3: Validasi jenis indikator (bukan bertipe constraint)
      if (indikator.jenis_indikator === "constraint") {
        throw new BadRequestError(
          "Indikator constraint sebaiknya diunggah melalui modul constraint.",
        );
      }

      const tipeRaster = "raw";

      // LANGKAH 4: Ambil nomor versi berikutnya (versi_lama + 1) untuk tipe raw ini
      const nextVersion = await RasterDbUtil.getNextVersion(tx, {
        id_indikator: parsedIdIndikator,
        tipe_raster: tipeRaster,
      });

      // LANGKAH 5: Nonaktifkan (is_active = false) raster tipe raw lama yang sedang aktif
      await RasterDbUtil.deactivateActiveRaster(tx, {
        id_indikator: parsedIdIndikator,
        tipe_raster: tipeRaster,
      });

      // LANGKAH 6: Masukkan data metadata GeoTIFF baru yang diunggah ke database (is_active = true)
      const rasterLayer = await tx.rasterLayer.create({
        data: {
          id_indikator: parsedIdIndikator,
          tipe_raster: tipeRaster,
          file_path: storedPath,
          original_filename: file.originalname,
          crs: metadata.crs,
          resolution_x: metadata.resolution_x,
          resolution_y: metadata.resolution_y,
          width: metadata.width,
          height: metadata.height,
          band_count: metadata.band_count,
          extent: metadata.extent,
          min_value: metadata.min_value,
          max_value: metadata.max_value,
          mean_value: metadata.mean_value,
          std_value: metadata.std_value,
          nodata_value: metadata.nodata_value,
          jumlah_pixel: metadata.jumlah_pixel,
          jumlah_pixel_valid: metadata.jumlah_pixel_valid,
          jumlah_pixel_nodata: metadata.jumlah_pixel_nodata,
          versi: nextVersion,
          is_active: true,
        },
      });

      // LANGKAH 7: Kembalikan objek gabungan antara data indikator dan metadata raster yang sukses dibuat
      return {
        id_raster_layer: rasterLayer.id_raster_layer,
        id_indikator: indikator.id_indikator,
        kode_indikator: indikator.kode_indikator,
        nama_indikator: indikator.nama_indikator,
        tipe_raster: rasterLayer.tipe_raster,
        file_path: rasterLayer.file_path,
        original_filename: rasterLayer.original_filename,
        versi: rasterLayer.versi,
        is_active: rasterLayer.is_active,
        metadata: {
          crs: rasterLayer.crs,
          resolution_x: rasterLayer.resolution_x,
          resolution_y: rasterLayer.resolution_y,
          width: rasterLayer.width,
          height: rasterLayer.height,
          band_count: rasterLayer.band_count,
          extent: rasterLayer.extent,
          min_value: rasterLayer.min_value,
          max_value: rasterLayer.max_value,
          mean_value: rasterLayer.mean_value,
          std_value: rasterLayer.std_value,
          nodata_value: rasterLayer.nodata_value,
          jumlah_pixel: rasterLayer.jumlah_pixel,
          jumlah_pixel_valid: rasterLayer.jumlah_pixel_valid,
          jumlah_pixel_nodata: rasterLayer.jumlah_pixel_nodata,
        },
      };
    });

    return result;
  }

  // ─────────────────────────────────────────────
  // List & Get Raster Layers
  // ─────────────────────────────────────────────

  /**
   * Daftar semua raster layer untuk satu indikator (semua tipe & versi).
   */
  static async listRasterByIndikator({ id_indikator }) {
    const parsedId = RasterDbUtil.parseId(id_indikator, "ID indikator");

    const indikator = await prisma.indikator.findUnique({
      where: { id_indikator: parsedId },
      select: {
        id_indikator: true,
        kode_indikator: true,
        nama_indikator: true,
        jenis_indikator: true,
      },
    });

    if (!indikator) {
      throw new NotFoundError("Indikator tidak ditemukan.");
    }

    const rasters = await prisma.rasterLayer.findMany({
      where: { id_indikator: parsedId },
      orderBy: [{ tipe_raster: "asc" }, { versi: "desc" }],
    });

    return {
      indikator,
      total: rasters.length,
      rasters: rasters.map((r) => RasterDbUtil.formatRaster(r)),
    };
  }

  /**
   * Ambil raster layer aktif untuk tipe tertentu (raw atau fuzzy).
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
        is_active: true,
      },
    });

    if (!raster) {
      throw new NotFoundError(
        `Raster '${tipe_raster}' aktif untuk indikator ini tidak ditemukan.`,
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

    // Hapus dari DB terlebih dahulu
    await prisma.rasterLayer.delete({
      where: { id_raster_layer: parsedId },
    });

    // Hapus file dari storage (best-effort, tidak gagal jika file tidak ada)
    const absolutePath = path.isAbsolute(raster.file_path)
      ? raster.file_path
      : path.join(process.cwd(), raster.file_path);

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    return {
      id_raster_layer: parsedId,
      tipe_raster: raster.tipe_raster,
      file_path: raster.file_path,
      deleted: true,
    };
  }
}

module.exports = GeotiffService;
