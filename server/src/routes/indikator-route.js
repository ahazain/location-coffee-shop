const express = require("express");
const router = express.Router();
const IndikatorController = require("../controllers/indikator-controller");
const authMiddleware = require("../middlewares/auth-middleware");

router.get("/", IndikatorController.getAllIndikator);
router.get(
  "/kriteria/:id_kriteria",
  IndikatorController.getIndikatorByKriteria,
);
router.get("/:id", IndikatorController.getIndikatorById);
router.post("/", authMiddleware, IndikatorController.createIndikator);
router.put("/:id", authMiddleware, IndikatorController.updateIndikator);
router.delete("/:id", authMiddleware, IndikatorController.deleteIndikator);

module.exports = router;
