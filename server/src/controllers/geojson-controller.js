const fs = require("fs");
const GeojsonService = require("../services/geojson-service");
const ResponseHelper = require("../helpers/response-helper");

class GeojsonController {
  static async importGrid(req, res) {
    try {
      const data = await GeojsonService.importGrid({
        file: req.file,
      });

      ResponseHelper.created(res, data, "Import GeoJSON grid berhasil.");
    } catch (error) {
      ResponseHelper.error(res, error);
    } finally {
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }
  }

  static async importIndikator(req, res) {
    try {
      const { id_indikator } = req.params;

      const replace = req.query.replace === "true" || req.query.replace === "1";

      const data = await GeojsonService.importIndikator({
        id_indikator,
        file: req.file,
        replace,
      });

      ResponseHelper.created(res, data, "Import GeoJSON indikator berhasil.");
    } catch (error) {
      ResponseHelper.error(res, error);
    } finally {
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }
  }
}

module.exports = GeojsonController;
