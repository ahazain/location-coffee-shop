const fs = require("fs");
const GeotiffService = require("../services/geotiff-service");
const ResponseHelper = require("../helpers/response-helper");

class GeotiffController {
  static async uploadIndikatorRaw(req, res) {
    let shouldDeleteUploadedFile = true;

    try {
      const { id_indikator } = req.params;

      const data = await GeotiffService.uploadIndikatorRaw({
        id_indikator,
        file: req.file,
      });

      shouldDeleteUploadedFile = false;

      ResponseHelper.created(res, data, "Upload GeoTIFF indikator berhasil.");
    } catch (error) {
      if (
        shouldDeleteUploadedFile &&
        req.file &&
        req.file.path &&
        fs.existsSync(req.file.path)
      ) {
        fs.unlinkSync(req.file.path);
      }

      ResponseHelper.error(res, error);
    }
  }

  static async updateIndikatorRaw(req, res) {
    let shouldDeleteUploadedFile = true;

    try {
      const { id_indikator } = req.params;

      const data = await GeotiffService.updateIndikatorRaw({
        id_indikator,
        file: req.file,
      });

      shouldDeleteUploadedFile = false;

      ResponseHelper.success(
        res,
        data,
        "Update GeoTIFF indikator berhasil. Raster lama dihapus.",
      );
    } catch (error) {
      if (
        shouldDeleteUploadedFile &&
        req.file &&
        req.file.path &&
        fs.existsSync(req.file.path)
      ) {
        fs.unlinkSync(req.file.path);
      }

      ResponseHelper.error(res, error);
    }
  }

  // ─────────────────────────────────────────────
  // List & Get Raster Layers
  // ─────────────────────────────────────────────

  /** GET /geotiff/indikator/:id_indikator — daftar semua raster */
  static async listRasterByIndikator(req, res) {
    try {
      const { id_indikator } = req.params;

      const data = await GeotiffService.listRasterByIndikator({ id_indikator });

      ResponseHelper.success(
        res,
        data,
        "Daftar raster layer indikator berhasil diambil.",
      );
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }

  /** GET /geotiff/indikator/:id_indikator/:tipe_raster/active — raster aktif */
  static async getActiveRaster(req, res) {
    try {
      const { id_indikator, tipe_raster } = req.params;

      const data = await GeotiffService.getActiveRaster({
        id_indikator,
        tipe_raster,
      });

      ResponseHelper.success(
        res,
        data,
        `Raster ${tipe_raster} aktif berhasil diambil.`,
      );
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }

  // ─────────────────────────────────────────────
  // Delete Raster Layer
  // ─────────────────────────────────────────────

  /** DELETE /geotiff/raster/:id_raster_layer */
  static async deleteRasterLayer(req, res) {
    try {
      const { id_raster_layer } = req.params;

      const data = await GeotiffService.deleteRasterLayer({ id_raster_layer });

      ResponseHelper.success(res, data, "Raster layer berhasil dihapus.");
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }
}

module.exports = GeotiffController;
