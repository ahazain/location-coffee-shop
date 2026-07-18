const express = require("express");
const router = express.Router();
const KriteriaController = require("../controllers/kriteria-controller");
const authMiddleware = require("../middlewares/auth-middleware");

router.get("/", KriteriaController.getAllKriteria);
router.get("/:id", KriteriaController.getKriteriaById);
router.post("/", authMiddleware, KriteriaController.createKriteria);
router.put("/:id", authMiddleware, KriteriaController.updateKriteria);
router.delete("/:id", authMiddleware, KriteriaController.deleteKriteria);

module.exports = router;
