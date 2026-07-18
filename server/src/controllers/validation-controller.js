const ValidationService = require("../services/validation-service");
const ResponseHelper = require("../helpers/response-helper");

class ValidationController {
  static async getSpatialValidationStats(req, res) {
    try {
      const data = await ValidationService.getSpatialValidationStats();
      ResponseHelper.success(res, data, "Statistik validasi spasial berhasil diambil.");
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }

  static async getExistingCoffeeShops(req, res) {
    try {
      const data = await ValidationService.getExistingCoffeeShopsGeoJson();
      ResponseHelper.success(res, data, "Data spasial coffee shop eksisting berhasil diambil.");
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }

  static async syncCoffeeShops(req, res) {
    try {
      const result = await ValidationService.syncExistingCoffeeShops();
      ResponseHelper.success(res, result, `Berhasil menyinkronkan ${result.totalSynced} titik kedai kopi baru.`);
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }
}

module.exports = ValidationController;
