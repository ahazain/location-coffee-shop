const WlcService = require("../services/wlc-service");
const ResponseHelper = require("../helpers/response-helper");

class WlcController {
  static async calculateWlc(req, res) {
    try {
      const data = await WlcService.calculateWlcConsensus();
      ResponseHelper.created(res, data, "Kalkulasi WLC berhasil dijalankan dan disimpan.");
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }

  static async getActiveWlc(req, res) {
    try {
      const data = await WlcService.getActiveWlc();
      ResponseHelper.success(res, data, "Data WLC aktif berhasil diambil.");
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }

  static async getWlcGrids(req, res) {
    try {
      const data = await WlcService.getWlcGrids();
      ResponseHelper.success(res, data, "Data spasial grid WLC berhasil diambil.");
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }
}

module.exports = WlcController;
