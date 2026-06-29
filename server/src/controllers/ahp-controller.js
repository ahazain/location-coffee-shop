const AHPService = require("../services/ahp-service");
const ResponseHelper = require("../helpers/response-helper");

class AHPController {
  static async calculateAHP(req, res) {
    try {
      const { matrix, items } = req.body;
      const data = await AHPService.calculateAHP({ matrix, items });
      ResponseHelper.success(res, data, "Perhitungan AHP berhasil.");
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }

  static async getBobotKonsensus(req, res) {
    try {
      const data = await AHPService.getBobotKonsensus();
      ResponseHelper.success(res, data, "Bobot konsensus AHP berhasil diambil.");
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }

  static async getKriteriaItems(req, res) {
    try {
      const data = await AHPService.getKriteriaItems();

      ResponseHelper.success(res, data, "Data kriteria AHP berhasil diambil.");
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }

  static async calculateKriteriaAHP(req, res) {
    try {
      const { matrix, item_ids } = req.body;

      const data = await AHPService.calculateKriteriaAHP({
        matrix,
        item_ids,
      });

      ResponseHelper.success(res, data, "Perhitungan AHP kriteria berhasil.");
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }

  static async saveKriteriaAHP(req, res) {
    try {
      const { id_pakar, matrix, item_ids } = req.body;

      const data = await AHPService.saveKriteriaAHP({
        id_pakar,
        matrix,
        item_ids,
      });

      ResponseHelper.created(
        res,
        data,
        "Bobot AHP kriteria berhasil disimpan.",
      );
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }

  static async getIndikatorItems(req, res) {
    try {
      const { id_kriteria } = req.params;

      const data = await AHPService.getIndikatorItems({
        id_kriteria,
      });

      ResponseHelper.success(res, data, "Data indikator AHP berhasil diambil.");
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }

  static async calculateIndikatorAHP(req, res) {
    try {
      const { id_kriteria } = req.params;
      const { matrix, item_ids } = req.body;

      const data = await AHPService.calculateIndikatorAHP({
        id_kriteria,
        matrix,
        item_ids,
      });

      ResponseHelper.success(res, data, "Perhitungan AHP indikator berhasil.");
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }

  static async saveIndikatorAHP(req, res) {
    try {
      const { id_kriteria } = req.params;
      const { id_pakar, matrix, item_ids } = req.body;

      const data = await AHPService.saveIndikatorAHP({
        id_pakar,
        id_kriteria,
        matrix,
        item_ids,
      });

      ResponseHelper.created(
        res,
        data,
        "Bobot AHP indikator berhasil disimpan.",
      );
    } catch (error) {
      ResponseHelper.error(res, error);
    }
  }
}

module.exports = AHPController;
