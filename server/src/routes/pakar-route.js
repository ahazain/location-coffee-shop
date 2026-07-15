const express = require("express");
const router = express.Router();
const PakarController = require("../controllers/pakar-controller");
const authMiddleware = require("../middlewares/auth-middleware");

router.get("/", PakarController.getAllPakar);
router.get("/:id_pakar", PakarController.getPakarById);
router.post("/", authMiddleware, PakarController.createPakar);
router.put("/:id_pakar", authMiddleware, PakarController.updatePakar);
router.delete("/:id_pakar", authMiddleware, PakarController.deletePakar);

module.exports = router;
