const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const GeotiffController = require("../controllers/geotiff-controller");

const router = express.Router();

const uploadDir = path.join(process.cwd(), "storage", "geotiff", "raw");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_-]/g, "");

    cb(null, `${timestamp}_${random}_${baseName}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = [".tif", ".tiff"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    return cb(new Error("File harus berekstensi .tif atau .tiff."));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB
  },
});

// ─────────────────────────────────────────────
// Upload Raw GeoTIFF
// POST /geotiff/indikator/:id_indikator/raw
// ─────────────────────────────────────────────
router.post(
  "/indikator/:id_indikator/raw",
  upload.single("file"),
  GeotiffController.uploadIndikatorRaw,
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
