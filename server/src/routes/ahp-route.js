const express = require("express");
const router = express.Router();
const AHPController = require("../controllers/ahp-controller");
const authMiddleware = require("../middlewares/auth-middleware");

router.post("/calculate", authMiddleware, AHPController.calculateAHP);
router.get("/bobot-konsensus", AHPController.getBobotKonsensus);

router.get("/kriteria/items", AHPController.getKriteriaItems);
router.post("/kriteria/calculate", authMiddleware, AHPController.calculateKriteriaAHP);
router.post("/kriteria/save", authMiddleware, AHPController.saveKriteriaAHP);

router.get("/indikator/:id_kriteria/items", AHPController.getIndikatorItems);
router.post(
  "/indikator/:id_kriteria/calculate",
  authMiddleware,
  AHPController.calculateIndikatorAHP,
);
router.post("/indikator/:id_kriteria/save", authMiddleware, AHPController.saveIndikatorAHP);

module.exports = router;
