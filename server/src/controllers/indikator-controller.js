const IndikatorService = require("../services/indikator-service");
const ResponseHelper = require("../helpers/response-helper");

class IndikatorController {
  static async createIndikator(req, res) {
    try {
      const data = await IndikatorService.createIndikator(req.body);
      ResponseHelper.created(res, data, "Indikator berhasil dibuat.");
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }

  static async getAllIndikator(req, res) {
    try {
      const data = await IndikatorService.getAllIndikator();
      ResponseHelper.success(res, data, "Data indikator berhasil diambil.");
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }

  static async getIndikatorById(req, res) {
    try {
      const { id } = req.params;
      const data = await IndikatorService.getIndikatorById({ id });
      ResponseHelper.success(res, data, "Detail indikator berhasil diambil.");
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }

  static async getIndikatorByKriteria(req, res) {
    try {
      const { id_kriteria } = req.params;
      const data = await IndikatorService.getIndikatorByKriteria({ id_kriteria });
      ResponseHelper.success(
        res,
        data,
        "Data indikator berdasarkan kriteria berhasil diambil."
      );
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }

  static async updateIndikator(req, res) {
    try {
      const { id } = req.params;
      const data = await IndikatorService.updateIndikator({
        id,
        payload: req.body,
      });
      ResponseHelper.success(res, data, "Indikator berhasil diperbarui.");
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }

  static async deleteIndikator(req, res) {
    try {
      const { id } = req.params;
      const data = await IndikatorService.deleteIndikator({ id });
      ResponseHelper.success(res, data, "Indikator berhasil dinonaktifkan.");
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }
}

module.exports = IndikatorController;