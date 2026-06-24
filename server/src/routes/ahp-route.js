const express = require("express");
const router = express.Router();
const AHPController = require("../controllers/ahp-controller");

router.post("/calculate", AHPController.calculateAHP);

router.get("/kriteria/items", AHPController.getKriteriaItems);
router.post("/kriteria/calculate", AHPController.calculateKriteriaAHP);
router.post("/kriteria/save", AHPController.saveKriteriaAHP);

router.get("/indikator/:id_kriteria/items", AHPController.getIndikatorItems);
router.post(
  "/indikator/:id_kriteria/calculate",
  AHPController.calculateIndikatorAHP,
);
router.post("/indikator/:id_kriteria/save", AHPController.saveIndikatorAHP);

module.exports = router;
