const express = require("express");
const WlcController = require("../controllers/wlc-controller");
const authMiddleware = require("../middlewares/auth-middleware");

const router = express.Router();

router.post("/calculate", authMiddleware, WlcController.calculateWlc);
router.get("/active", WlcController.getActiveWlc);
router.get("/grids", WlcController.getWlcGrids);
router.get("/boundary", WlcController.getBoundary);
router.get("/sementara-fuzzy", WlcController.getSementaraFuzzy);
router.get("/sementara/fuzzy", WlcController.getSementaraFuzzy);

module.exports = router;
