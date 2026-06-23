const express = require("express");
const router = express.Router();

const IndikatorController = require("../controllers/indikator-controller");

router.get("/", IndikatorController.getAllIndikator);
router.get(
  "/kriteria/:id_kriteria",
  IndikatorController.getIndikatorByKriteria,
);
router.get("/:id", IndikatorController.getIndikatorById);
router.post("/", IndikatorController.createIndikator);
router.put("/:id", IndikatorController.updateIndikator);
router.delete("/:id", IndikatorController.deleteIndikator);

module.exports = router;
