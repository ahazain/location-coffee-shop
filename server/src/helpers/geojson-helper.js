const fs = require("fs");
const { BadRequestError } = require("../utils/error-handling-util");

class GeojsonHelper {
  static readGeojsonFile(filePath) {
    if (!filePath) {
      throw new BadRequestError("File GeoJSON wajib diunggah.");
    }

    const raw = fs.readFileSync(filePath, "utf8");

    let geojson;

    try {
      geojson = JSON.parse(raw);
    } catch (error) {
      throw new BadRequestError(
        "File tidak valid. Pastikan formatnya GeoJSON.",
      );
    }

    if (geojson.type !== "FeatureCollection") {
      throw new BadRequestError("GeoJSON harus bertipe FeatureCollection.");
    }

    if (!Array.isArray(geojson.features) || geojson.features.length === 0) {
      throw new BadRequestError("GeoJSON tidak memiliki features.");
    }

    return geojson;
  }

  static getProperties(feature) {
    return feature.properties || {};
  }

  static getGeometry(feature) {
    if (!feature.geometry) {
      throw new BadRequestError("Setiap feature harus memiliki geometry.");
    }

    if (!["Polygon", "MultiPolygon"].includes(feature.geometry.type)) {
      throw new BadRequestError(
        "Geometry grid harus berupa Polygon atau MultiPolygon.",
      );
    }

    return feature.geometry;
  }

  static getKodeGrid(properties) {
    const kodeGrid =
      properties.kode_grid ||
      properties.kodeGrid ||
      properties.grid_id ||
      properties.id_grid ||
      properties.ID_GRID;

    if (!kodeGrid) {
      throw new BadRequestError(
        "Property kode_grid wajib ada pada setiap feature GeoJSON.",
      );
    }

    return String(kodeGrid);
  }

  static parseNumber(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    const normalizedValue =
      typeof value === "string" ? value.replace(",", ".") : value;

    const parsed = Number(normalizedValue);

    if (Number.isNaN(parsed)) {
      return null;
    }

    return parsed;
  }

  static calculateStats(values) {
    const cleanedValues = values
      .map((value) => Number(value))
      .filter((value) => !Number.isNaN(value));

    if (cleanedValues.length === 0) {
      return {
        nilai_min: null,
        nilai_max: null,
        nilai_mean: null,
        nilai_median: null,
        nilai_std: null,
        jumlah_data: 0,
      };
    }

    const sorted = [...cleanedValues].sort((a, b) => a - b);
    const total = cleanedValues.length;
    const sum = cleanedValues.reduce((acc, value) => acc + value, 0);
    const mean = sum / total;

    let median;

    if (total % 2 === 0) {
      median = (sorted[total / 2 - 1] + sorted[total / 2]) / 2;
    } else {
      median = sorted[Math.floor(total / 2)];
    }

    const variance =
      cleanedValues.reduce((acc, value) => {
        return acc + Math.pow(value - mean, 2);
      }, 0) / total;

    const std = Math.sqrt(variance);

    return {
      nilai_min: sorted[0],
      nilai_max: sorted[sorted.length - 1],
      nilai_mean: mean,
      nilai_median: median,
      nilai_std: std,
      jumlah_data: total,
    };
  }
}

module.exports = GeojsonHelper;
