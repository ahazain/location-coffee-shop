const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const GeojsonController = require("../controllers/geojson-controller");

const router = express.Router();

const uploadDir = path.join(process.cwd(), "uploads", "geojson");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/\s+/g, "_");
    cb(null, `${timestamp}_${originalName}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = [".geojson", ".json"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    return cb(new Error("File harus berekstensi .geojson atau .json."));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

router.post(
  "/import-grid",
  upload.single("file"),
  GeojsonController.importGrid,
);

router.post(
  "/import-indikator/:id_indikator",
  upload.single("file"),
  GeojsonController.importIndikator,
);

module.exports = router;
