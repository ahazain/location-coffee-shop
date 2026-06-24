const express = require("express");
const router = express.Router();

const FuzzyController = require("../controllers/fuzzy-controller");

router.get("/aturan", FuzzyController.getAllAturan);
router.get("/aturan/:id_indikator", FuzzyController.getAturanByIndikator);
router.post("/aturan", FuzzyController.saveAturan);
router.put("/aturan/:id_indikator", FuzzyController.updateAturan);
router.delete("/aturan/:id_indikator", FuzzyController.deleteAturan);

router.post("/hitung-semua", FuzzyController.calculateAll);
router.post("/hitung/:id_indikator", FuzzyController.calculateByIndikator);

module.exports = router;
