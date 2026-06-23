const express = require("express");
const router = express.Router();

const KriteriaController = require("../controllers/kriteria-controller");

router.get("/", KriteriaController.getAllKriteria);
router.get("/:id", KriteriaController.getKriteriaById);
router.post("/", KriteriaController.createKriteria);
router.put("/:id", KriteriaController.updateKriteria);
router.delete("/:id", KriteriaController.deleteKriteria);

module.exports = router;
