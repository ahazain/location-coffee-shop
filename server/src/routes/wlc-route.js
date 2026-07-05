const express = require("express");
const WlcController = require("../controllers/wlc-controller");

const router = express.Router();

router.post("/calculate", WlcController.calculateWlc);
router.get("/active", WlcController.getActiveWlc);
router.get("/grids", WlcController.getWlcGrids);
router.get("/boundary", WlcController.getBoundary);

module.exports = router;
