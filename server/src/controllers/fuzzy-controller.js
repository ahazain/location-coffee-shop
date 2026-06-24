const FuzzyService = require("../services/fuzzy-service");
const ResponseHelper = require("../helpers/response-helper");

class FuzzyController {
  static async getAllAturan(req, res) {
    try {
      const data = await FuzzyService.getAllAturan();

      ResponseHelper.success(res, data, "Data aturan fuzzy berhasil diambil.");
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }

  static async getAturanByIndikator(req, res) {
    try {
      const { id_indikator } = req.params;

      const data = await FuzzyService.getAturanByIndikator({
        id_indikator,
      });

      ResponseHelper.success(
        res,
        data,
        "Detail aturan fuzzy berhasil diambil.",
      );
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }

  static async saveAturan(req, res) {
    try {
      const data = await FuzzyService.saveAturan(req.body || {});

      ResponseHelper.created(res, data, "Aturan fuzzy berhasil disimpan.");
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }

  static async updateAturan(req, res) {
    try {
      const { id_indikator } = req.params;

      const data = await FuzzyService.updateAturan({
        id_indikator,
        payload: req.body || {},
      });

      ResponseHelper.success(res, data, "Aturan fuzzy berhasil diperbarui.");
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }

  static async deleteAturan(req, res) {
    try {
      const { id_indikator } = req.params;

      const data = await FuzzyService.deleteAturan({
        id_indikator,
      });

      ResponseHelper.success(res, data, "Aturan fuzzy berhasil dihapus.");
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }

  static async calculateByIndikator(req, res) {
    try {
      const { id_indikator } = req.params;

      const data = await FuzzyService.calculateByIndikator({
        id_indikator,
      });

      ResponseHelper.success(
        res,
        data,
        "Perhitungan fuzzy indikator berhasil.",
      );
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }

  static async calculateAll(req, res) {
    try {
      const data = await FuzzyService.calculateAll();

      ResponseHelper.success(
        res,
        data,
        "Perhitungan fuzzy semua indikator berhasil.",
      );
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }
}

module.exports = FuzzyController;
