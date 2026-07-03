const express = require("express");
const GeotiffController = require("../controllers/geotiff-controller");
const uploadGeotiff = require("../middlewares/upload-geotiff");

const router = express.Router();

// ─────────────────────────────────────────────
// Upload Raw GeoTIFF
// POST /geotiff/indikator/:id_indikator/raw
// ─────────────────────────────────────────────
router.post(
  "/indikator/:id_indikator/raw",
  uploadGeotiff.single("file"),
  GeotiffController.uploadIndikatorRaw,
);

// PUT /geotiff/indikator/:id_indikator/raw (Update & hapus data/storage lama)
router.put(
  "/indikator/:id_indikator/raw",
  uploadGeotiff.single("file"),
  GeotiffController.updateIndikatorRaw,
);


// ─────────────────────────────────────────────
// List & Get Raster Layers
// ─────────────────────────────────────────────

// GET /geotiff/indikator/:id_indikator
// Daftar semua raster layer (semua tipe & versi) untuk satu indikator
router.get(
  "/indikator/:id_indikator",
  GeotiffController.listRasterByIndikator,
);

// GET /geotiff/indikator/:id_indikator/:tipe_raster/active
// Ambil raster aktif untuk tipe tertentu (raw | fuzzy | final_score)
router.get(
  "/indikator/:id_indikator/:tipe_raster/active",
  GeotiffController.getActiveRaster,
);

// ─────────────────────────────────────────────
// Delete Raster Layer
// DELETE /geotiff/raster/:id_raster_layer
// ─────────────────────────────────────────────
router.delete(
  "/raster/:id_raster_layer",
  GeotiffController.deleteRasterLayer,
);

module.exports = router;
