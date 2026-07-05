const express = require("express");
const ValidationController = require("../controllers/validation-controller");

const router = express.Router();

router.get("/stats", ValidationController.getSpatialValidationStats);
router.get("/points", ValidationController.getExistingCoffeeShops);

module.exports = router;
