const express = require("express");
const router = express.Router();
const FuzzyController = require("../controllers/fuzzy-controller");
const authMiddleware = require("../middlewares/auth-middleware");

router.get("/aturan", FuzzyController.getAllAturan);
router.get("/aturan/:id_indikator", FuzzyController.getAturanByIndikator);
router.post("/aturan", authMiddleware, FuzzyController.saveAturan);
router.put("/aturan/:id_indikator", authMiddleware, FuzzyController.updateAturan);
router.delete("/aturan/:id_indikator", authMiddleware, FuzzyController.deleteAturan);

router.post("/hitung-semua", authMiddleware, FuzzyController.calculateAll);
router.post("/hitung/:id_indikator", authMiddleware, FuzzyController.calculateByIndikator);

module.exports = router;
