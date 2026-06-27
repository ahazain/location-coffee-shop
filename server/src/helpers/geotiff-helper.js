const path = require("path");
const fs = require("fs");
const { BadRequestError } = require("../utils/error-handling-util");

class GeotiffHelper {
  static validateExtension(file) {
    if (!file || !file.originalname) {
      throw new BadRequestError("File GeoTIFF wajib diunggah.");
    }

    const allowedExtensions = [".tif", ".tiff"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      throw new BadRequestError("File harus berekstensi .tif atau .tiff.");
    }
  }

  static parseNumber(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    const parsed = Number(value);

    if (Number.isNaN(parsed)) {
      return null;
    }

    return parsed;
  }

  static getCrsFromGeoKeys(geoKeys) {
    if (!geoKeys) {
      return null;
    }

    const projectedCode = geoKeys.ProjectedCSTypeGeoKey;
    const geographicCode = geoKeys.GeographicTypeGeoKey;

    if (projectedCode && projectedCode > 0) {
      return `EPSG:${projectedCode}`;
    }

    if (geographicCode && geographicCode > 0) {
      return `EPSG:${geographicCode}`;
    }

    return null;
  }

  static getNoDataValue(image) {
    let rawNoData = null;

    if (typeof image.getGDALNoData === "function") {
      rawNoData = image.getGDALNoData();
    }

    if (rawNoData === null || rawNoData === undefined || rawNoData === "") {
      rawNoData = image.fileDirectory?.GDAL_NODATA;
    }

    return this.parseNumber(rawNoData);
  }

  static getResolution(image) {
    try {
      const resolution = image.getResolution();

      if (Array.isArray(resolution) && resolution.length >= 2) {
        return {
          resolution_x: Math.abs(Number(resolution[0])),
          resolution_y: Math.abs(Number(resolution[1])),
        };
      }
    } catch (error) {
      // fallback ke ModelPixelScale di bawah
    }

    const modelPixelScale = image.fileDirectory?.ModelPixelScale;

    if (Array.isArray(modelPixelScale) && modelPixelScale.length >= 2) {
      return {
        resolution_x: Math.abs(Number(modelPixelScale[0])),
        resolution_y: Math.abs(Number(modelPixelScale[1])),
      };
    }

    return {
      resolution_x: null,
      resolution_y: null,
    };
  }

  static calculateRasterStats(values, noDataValue = null) {
    let countValid = 0;
    let countNoData = 0;
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    let sumSquare = 0;

    for (const value of values) {
      const numericValue = Number(value);

      const isInvalid =
        Number.isNaN(numericValue) ||
        !Number.isFinite(numericValue) ||
        (noDataValue !== null && numericValue === noDataValue);

      if (isInvalid) {
        countNoData += 1;
        continue;
      }

      countValid += 1;
      min = Math.min(min, numericValue);
      max = Math.max(max, numericValue);
      sum += numericValue;
      sumSquare += numericValue * numericValue;
    }

    if (countValid === 0) {
      return {
        min_value: null,
        max_value: null,
        mean_value: null,
        std_value: null,
        jumlah_pixel_valid: 0,
        jumlah_pixel_nodata: countNoData,
      };
    }

    const mean = sum / countValid;
    const variance = sumSquare / countValid - mean * mean;
    const std = Math.sqrt(Math.max(variance, 0));

    return {
      min_value: min,
      max_value: max,
      mean_value: mean,
      std_value: std,
      jumlah_pixel_valid: countValid,
      jumlah_pixel_nodata: countNoData,
    };
  }

  static validateMetadata(metadata) {
    const expectedCrs = process.env.RASTER_EXPECTED_CRS || "EPSG:32749";
    const expectedResolution = Number(
      process.env.RASTER_EXPECTED_RESOLUTION || 465,
    );

    const tolerance = Number(process.env.RASTER_RESOLUTION_TOLERANCE || 0.01);

    if (!metadata.crs) {
      throw new BadRequestError(
        "CRS GeoTIFF tidak terbaca. Pastikan file memiliki CRS.",
      );
    }

    if (metadata.crs !== expectedCrs) {
      throw new BadRequestError(
        `CRS GeoTIFF tidak sesuai. Diterima: ${metadata.crs}, seharusnya: ${expectedCrs}.`,
      );
    }

    if (!metadata.resolution_x || !metadata.resolution_y) {
      throw new BadRequestError(
        "Resolusi GeoTIFF tidak terbaca. Pastikan file memiliki georeference.",
      );
    }

    const diffX = Math.abs(metadata.resolution_x - expectedResolution);
    const diffY = Math.abs(metadata.resolution_y - expectedResolution);

    if (diffX > tolerance || diffY > tolerance) {
      throw new BadRequestError(
        `Resolusi GeoTIFF tidak sesuai. Diterima: ${metadata.resolution_x} x ${metadata.resolution_y}, seharusnya: ${expectedResolution} x ${expectedResolution}.`,
      );
    }

    if (!metadata.width || !metadata.height) {
      throw new BadRequestError("Ukuran raster GeoTIFF tidak valid.");
    }

    if (metadata.band_count < 1) {
      throw new BadRequestError("GeoTIFF tidak memiliki band raster.");
    }
  }

  /**
   * Logika internal: buka file, baca metadata & statistik pixel.
   * Digunakan bersama oleh readMetadata dan readMetadataOnly.
   */
  static async _extractMetadata(filePath) {
    if (!filePath) {
      throw new BadRequestError("Path file GeoTIFF tidak valid.");
    }

    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);

    let fromFile;

    try {
      const geotiffModule = await import("geotiff");
      fromFile = geotiffModule.fromFile;
    } catch (error) {
      throw new BadRequestError(
        "Library geotiff belum tersedia. Jalankan: npm install geotiff",
      );
    }

    let tiff;
    let image;

    try {
      tiff = await fromFile(absolutePath);
      image = await tiff.getImage();
    } catch (error) {
      throw new BadRequestError(
        "File tidak valid. Pastikan file yang diunggah adalah GeoTIFF.",
      );
    }

    const width = image.getWidth();
    const height = image.getHeight();
    const bandCount = image.getSamplesPerPixel();
    const geoKeys = image.getGeoKeys();
    const crs = this.getCrsFromGeoKeys(geoKeys);
    const bbox = image.getBoundingBox();
    const noDataValue = this.getNoDataValue(image);
    const resolution = this.getResolution(image);

    let rasterBand;

    try {
      const rasters = await image.readRasters({ samples: [0] });
      rasterBand = rasters[0];
    } catch (error) {
      throw new BadRequestError("Gagal membaca nilai pixel GeoTIFF.");
    }

    const stats = this.calculateRasterStats(rasterBand, noDataValue);

    return {
      crs,
      width,
      height,
      band_count: bandCount,
      resolution_x: resolution.resolution_x,
      resolution_y: resolution.resolution_y,
      extent: {
        min_x: bbox[0],
        min_y: bbox[1],
        max_x: bbox[2],
        max_y: bbox[3],
      },
      nodata_value: noDataValue,
      jumlah_pixel: width * height,
      ...stats,
    };
  }

  /**
   * Baca metadata GeoTIFF + validasi CRS & resolusi.
   * Digunakan saat upload raw dari QGIS.
   */
  static async readMetadata(filePath) {
    const metadata = await this._extractMetadata(filePath);
    this.validateMetadata(metadata);
    return metadata;
  }

  /**
   * Baca metadata GeoTIFF tanpa validasi CRS/resolusi.
   * Digunakan untuk membaca metadata file hasil output internal (fuzzy GeoTIFF).
   */
  static async readMetadataOnly(filePath) {
    return this._extractMetadata(filePath);
  }

  /**
   * Baca pixel raster band pertama beserta informasi nodata dan dimensi.
   * Digunakan sebagai input untuk perhitungan fuzzy.
   * @returns {{ width, height, noDataValue, pixelValues: number[] }}
   */
  static async readPixelsForFuzzy(filePath) {
    if (!filePath) {
      throw new BadRequestError("Path file GeoTIFF tidak valid.");
    }

    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);

    let fromFile;

    try {
      const geotiffModule = await import("geotiff");
      fromFile = geotiffModule.fromFile;
    } catch (error) {
      throw new BadRequestError("Library geotiff belum tersedia.");
    }

    let tiff;
    let image;

    try {
      tiff = await fromFile(absolutePath);
      image = await tiff.getImage();
    } catch (error) {
      throw new BadRequestError(
        `GeoTIFF tidak dapat dibuka: ${absolutePath}`,
      );
    }

    const width = image.getWidth();
    const height = image.getHeight();
    const noDataValue = this.getNoDataValue(image);

    let rasters;

    try {
      rasters = await image.readRasters({ samples: [0] });
    } catch (error) {
      throw new BadRequestError("Gagal membaca pixel GeoTIFF raw.");
    }

    // Konversi TypedArray ke array number biasa
    const pixelValues = Array.from(rasters[0]).map(Number);

    return { width, height, noDataValue, pixelValues };
  }

  /**
   * Tulis GeoTIFF Float32 baru menggunakan georeference dari file referensi.
   * Digunakan untuk menyimpan hasil normalisasi fuzzy.
   *
   * @param {string} outputPath        Path absolut file output
   * @param {number[]} pixelValues     Array nilai pixel (panjang = width * height)
   * @param {string} referenceFilePath Path absolut GeoTIFF referensi (untuk CRS/geotransform)
   * @param {number|null} noDataValue  Nilai nodata yang digunakan (boleh null)
   */
  static async writeGeoTIFF(outputPath, pixelValues, referenceFilePath, noDataValue = null) {
    let fromFile;
    let writeArrayBuffer;

    try {
      const geotiffModule = await import("geotiff");
      fromFile = geotiffModule.fromFile;
      writeArrayBuffer = geotiffModule.writeArrayBuffer;
    } catch (error) {
      throw new BadRequestError("Library geotiff belum tersedia.");
    }

    if (typeof writeArrayBuffer !== "function") {
      throw new BadRequestError(
        "Versi geotiff tidak mendukung penulisan file. Upgrade ke geotiff >=2.",
      );
    }

    // Buka file referensi untuk mengambil georeferencing
    let refTiff;
    let refImage;

    try {
      refTiff = await fromFile(referenceFilePath);
      refImage = await refTiff.getImage();
    } catch (error) {
      throw new BadRequestError(
        "GeoTIFF referensi tidak dapat dibuka untuk mengambil CRS.",
      );
    }

    const width = refImage.getWidth();
    const height = refImage.getHeight();
    const fileDir = refImage.fileDirectory;

    // Metadata output GeoTIFF (Float32, 1 band)
    const metadata = {
      width,
      height,
      BitsPerSample: [32],
      SampleFormat: [3],              // 3 = IEEE floating point
      SamplesPerPixel: 1,
      Compression: 1,                 // 1 = no compression
      PhotometricInterpretation: 1,   // 1 = BlackIsZero
      PlanarConfiguration: 1,         // 1 = Chunky
    };

    // Salin tag georeferensi dari referensi agar CRS & geotransform tetap sama
    if (fileDir.ModelPixelScale) {
      metadata.ModelPixelScale = Array.from(fileDir.ModelPixelScale);
    }

    if (fileDir.ModelTiepoint) {
      metadata.ModelTiepoint = Array.from(fileDir.ModelTiepoint);
    }

    if (fileDir.GeoKeyDirectory) {
      metadata.GeoKeyDirectory = Array.from(fileDir.GeoKeyDirectory);
    }

    if (fileDir.GeoDoubleParams) {
      metadata.GeoDoubleParams = Array.from(fileDir.GeoDoubleParams);
    }

    if (fileDir.GeoAsciiParams) {
      metadata.GeoAsciiParams = fileDir.GeoAsciiParams;
    }

    // Tetapkan nilai nodata jika ada
    if (noDataValue !== null && noDataValue !== undefined) {
      metadata.GDAL_NODATA = String(noDataValue);
    }

    // Buat direktori output jika belum ada
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Tulis GeoTIFF
    const data = [new Float32Array(pixelValues)];
    let arrayBuffer;

    try {
      arrayBuffer = await writeArrayBuffer(data, metadata);
    } catch (error) {
      throw new BadRequestError(
        `Gagal menulis GeoTIFF fuzzy: ${error.message}`,
      );
    }

    fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
  }
}

module.exports = GeotiffHelper;
