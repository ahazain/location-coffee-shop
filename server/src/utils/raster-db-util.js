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

    if (id === null || id === undefined || Number.isNaN(parsedId)) {
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
   * Menghapus record raster lama dari database dan mengembalikan path file fisiknya
   * agar bisa dihapus setelah transaksi sukses (mencegah data hilang jika transaksi gagal).
   */
  static async deleteExistingRaster(tx, { id_indikator, tipe_raster }) {
    const existing = await tx.rasterLayer.findFirst({
      where: {
        id_indikator: id_indikator || null,
        tipe_raster,
      },
    });

    if (existing) {
      await tx.rasterLayer.delete({
        where: { id_raster_layer: existing.id_raster_layer },
      });
      return existing.file_path;
    }

    return null;
  }

  /**
   * Memformat objek data mentah dari tabel database raster_layers
   * menjadi format JSON respon API yang rapi untuk dikirim ke frontend.
   */
  static formatRaster(raster) {
    if (!raster) return null;
    return {
      id_raster_layer: raster.id_raster_layer,
      id_indikator: raster.id_indikator,
      id_analysis_run: raster.id_analysis_run,
      tipe_raster: raster.tipe_raster,
      file_path: raster.file_path,
      created_at: raster.created_at,
      updated_at: raster.updated_at,
      metadata: {
        crs: raster.crs,
        min_value: raster.min_value !== null && raster.min_value !== undefined ? Number(raster.min_value) : null,
        max_value: raster.max_value !== null && raster.max_value !== undefined ? Number(raster.max_value) : null,
        mean_value: raster.mean_value !== null && raster.mean_value !== undefined ? Number(raster.mean_value) : null,
        nodata_value: raster.nodata_value !== null && raster.nodata_value !== undefined ? Number(raster.nodata_value) : null,
      },
    };
  }
}

module.exports = RasterDbUtil;
