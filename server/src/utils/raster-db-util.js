const path = require("path");
const prisma = require("../prisma/prisma-client");
const { BadRequestError } = require("./error-handling-util");

class RasterDbUtil {
  /**
   * Memvalidasi dan mengonversi ID (string) dari params URL menjadi tipe data Number.
   * Melempar BadRequestError jika input bukan angka atau tidak valid.
   */
  static parseId(id, fieldName = "ID") {
    const parsedId = Number(id);

    if (!id || Number.isNaN(parsedId)) {
      throw new BadRequestError(`${fieldName} tidak valid.`);
    }

    return parsedId;
  }

  /**
   * Mengonversi path file fisik menjadi path relatif menggunakan garis miring (/)
   * agar format alamat file seragam di sistem operasi Windows maupun Linux.
   */
  static normalizeStoredPath(filePath) {
    return path.relative(process.cwd(), filePath).replace(/\\/g, "/");
  }

  /**
   * Mencari versi tertinggi dari raster pada indikator tertentu di database,
   * lalu mengembalikan nomor versi berikutnya (versi_maksimum + 1).
   */
  static async getNextVersion(tx, { id_indikator, tipe_raster }) {
    const aggregate = await tx.rasterLayer.aggregate({
      where: {
        id_indikator,
        tipe_raster,
      },
      _max: {
        versi: true,
      },
    });

    return aggregate._max.versi ? aggregate._max.versi + 1 : 1;
  }

  /**
   * Menonaktifkan status (set is_active = false) semua berkas raster lama
   * dengan tipe yang sama agar tidak bentrok dengan berkas baru yang diunggah.
   */
  static async deactivateActiveRaster(tx, { id_indikator, tipe_raster }) {
    await tx.rasterLayer.updateMany({
      where: {
        id_indikator,
        tipe_raster,
        is_active: true,
      },
      data: {
        is_active: false,
      },
    });
  }

  /**
   * Memformat objek data mentah dari tabel database raster_layers
   * menjadi format JSON respon API yang rapi untuk dikirim ke frontend.
   */
  static formatRaster(raster) {
    return {
      id_raster_layer: raster.id_raster_layer,
      id_indikator: raster.id_indikator,
      id_analysis_run: raster.id_analysis_run,
      tipe_raster: raster.tipe_raster,
      file_path: raster.file_path,
      original_filename: raster.original_filename,
      versi: raster.versi,
      is_active: raster.is_active,
      created_at: raster.created_at,
      updated_at: raster.updated_at,
      metadata: {
        crs: raster.crs,
        width: raster.width,
        height: raster.height,
        band_count: raster.band_count,
        resolution_x:
          raster.resolution_x !== null ? Number(raster.resolution_x) : null,
        resolution_y:
          raster.resolution_y !== null ? Number(raster.resolution_y) : null,
        extent: raster.extent,
        min_value: raster.min_value !== null ? Number(raster.min_value) : null,
        max_value: raster.max_value !== null ? Number(raster.max_value) : null,
        mean_value:
          raster.mean_value !== null ? Number(raster.mean_value) : null,
        std_value: raster.std_value !== null ? Number(raster.std_value) : null,
        nodata_value:
          raster.nodata_value !== null ? Number(raster.nodata_value) : null,
        jumlah_pixel: raster.jumlah_pixel,
        jumlah_pixel_valid: raster.jumlah_pixel_valid,
        jumlah_pixel_nodata: raster.jumlah_pixel_nodata,
      },
    };
  }
}

module.exports = RasterDbUtil;
