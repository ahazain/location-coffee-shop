const express = require("express");
const router = express.Router();
const PakarController = require("../controllers/pakar-controller");

router.get("/", PakarController.getAllPakar);
router.get("/:id_pakar", PakarController.getPakarById);
router.post("/", PakarController.createPakar);
router.put("/:id_pakar", PakarController.updatePakar);
router.delete("/:id_pakar", PakarController.deletePakar);

module.exports = router;
