const PakarService = require("../services/pakar-service");
const ResponseHelper = require("../helpers/response-helper");

class PakarController {
  static async getAllPakar(req, res) {
    try {
      const data = await PakarService.getAllPakar();
      ResponseHelper.success(res, data, "Data pakar berhasil diambil.");
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }

  static async getPakarById(req, res) {
    try {
      const { id_pakar } = req.params;
      const data = await PakarService.getPakarById(id_pakar);
      ResponseHelper.success(res, data, "Data pakar berhasil diambil.");
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }

  static async createPakar(req, res) {
    try {
      const data = await PakarService.createPakar(req.body);
      ResponseHelper.created(res, data, "Data pakar berhasil dibuat.");
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }

  static async updatePakar(req, res) {
    try {
      const { id_pakar } = req.params;
      const data = await PakarService.updatePakar(id_pakar, req.body);
      ResponseHelper.success(res, data, "Data pakar berhasil diubah.");
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }

  static async deletePakar(req, res) {
    try {
      const { id_pakar } = req.params;
      const data = await PakarService.deletePakar(id_pakar);
      ResponseHelper.success(res, data, "Data pakar berhasil dihapus.");
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }
}

module.exports = PakarController;
