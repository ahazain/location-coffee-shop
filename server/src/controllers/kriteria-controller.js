const KriteriaService = require("../services/kriteria-service");
const ResponseHelper = require("../helpers/response-helper");

class KriteriaController {
  static async createKriteria(req, res) {
    try {
      const data = await KriteriaService.createKriteria(req.body);
      ResponseHelper.created(res, data, "Kriteria berhasil dibuat.");
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }

  static async getAllKriteria(req, res) {
    try {
      const data = await KriteriaService.getAllKriteria();
      ResponseHelper.success(res, data, "Data kriteria berhasil diambil.");
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }

  static async getKriteriaById(req, res) {
    try {
      const { id } = req.params;
      const data = await KriteriaService.getKriteriaById({ id });
      ResponseHelper.success(res, data, "Detail kriteria berhasil diambil.");
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }

  static async updateKriteria(req, res) {
    try {
      const { id } = req.params;
      const data = await KriteriaService.updateKriteria({
        id,
        payload: req.body,
      });
      ResponseHelper.success(res, data, "Kriteria berhasil diperbarui.");
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }

  static async deleteKriteria(req, res) {
    try {
      const { id } = req.params;
      const data = await KriteriaService.deleteKriteria({ id });
      ResponseHelper.success(res, data, "Kriteria berhasil dinonaktifkan.");
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }
}

module.exports = KriteriaController;
