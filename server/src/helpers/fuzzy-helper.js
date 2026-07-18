const { BadRequestError } = require("../utils/error-handling-util");

class FuzzyHelper {
  static ALLOWED_FUNCTIONS = ["linear", "near"];
  static ALLOWED_ARAH = ["increasing", "decreasing", "near"];

  static round(value, digits = 6) {
    return Number(value.toFixed(digits));
  }

  static clamp01(value) {
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
  }

  static toNumber(value, fieldName) {
    if (value === null || value === undefined || value === "") {
      throw new BadRequestError(`${fieldName} wajib diisi.`);
    }

    const parsed = Number(value);

    if (Number.isNaN(parsed)) {
      throw new BadRequestError(`${fieldName} harus berupa angka.`);
    }

    return parsed;
  }

  /**
   * Normalisasi fungsi_fuzzy ke salah satu dari: "linear", "near".
   * Sesuai enum FungsiFuzzy di schema baru (LINEAR / NEAR).
   */
  static normalizeFunctionName(fungsi_fuzzy) {
    if (!fungsi_fuzzy) {
      throw new BadRequestError("fungsi_fuzzy wajib diisi.");
    }

    const functionName = String(fungsi_fuzzy)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_")
      .replace(/-/g, "_");

    const aliases = {
      linear: "linear",
      linear_increasing: "linear",
      linear_decreasing: "linear",
      increasing: "linear",
      decreasing: "linear",

      near: "near",
      fuzzy_near: "near",
      bell: "near",
      bell_shaped: "near",
      triangle: "near",
      triangular: "near",
      optimum: "near",
    };

    const normalized = aliases[functionName] || functionName;

    if (!this.ALLOWED_FUNCTIONS.includes(normalized)) {
      throw new BadRequestError(
        "fungsi_fuzzy hanya mendukung: linear atau near.",
      );
    }

    return normalized;
  }

  /**
   * Normalisasi arah. Untuk "near", arah selalu "near" (di-force).
   * Untuk "linear", arah wajib diisi user: increasing atau decreasing —
   * tidak lagi bisa ditebak dari nama fungsi seperti versi lama.
   */
  static normalizeArah(arah, fungsi_fuzzy) {
    const functionName = this.normalizeFunctionName(fungsi_fuzzy);

    if (functionName === "near") {
      return "near";
    }

    if (!arah) {
      throw new BadRequestError(
        "arah wajib diisi untuk fungsi_fuzzy linear (increasing/decreasing).",
      );
    }

    const arahName = String(arah).toLowerCase().trim();

    const aliases = {
      increasing: "increasing",
      benefit: "increasing",
      naik: "increasing",

      decreasing: "decreasing",
      cost: "decreasing",
      turun: "decreasing",
    };

    const normalized = aliases[arahName];

    if (!normalized) {
      throw new BadRequestError(
        "arah untuk fungsi_fuzzy linear hanya mendukung: increasing atau decreasing.",
      );
    }

    return normalized;
  }

  /** Konversi ke bentuk enum Prisma ("LINEAR" | "NEAR"). */
  static toPrismaFungsiFuzzy(fungsi_fuzzy) {
    return this.normalizeFunctionName(fungsi_fuzzy).toUpperCase();
  }

  /** Konversi ke bentuk enum Prisma ("INCREASING" | "DECREASING" | "NEAR"). */
  static toPrismaArah(arah, fungsi_fuzzy) {
    return this.normalizeArah(arah, fungsi_fuzzy).toUpperCase();
  }

  static calculateLinearIncreasing(value, rule) {
    const x = this.toNumber(value, "nilai_asli");
    const min = this.toNumber(rule.nilai_min, "nilai_min");
    const max = this.toNumber(rule.nilai_max, "nilai_max");

    if (max < min) {
      throw new BadRequestError(
        "nilai_max tidak boleh lebih kecil dari nilai_min.",
      );
    }

    if (max === min) {
      return 0.5;
    }

    const result = (x - min) / (max - min);

    return this.round(this.clamp01(result));
  }

  static calculateLinearDecreasing(value, rule) {
    const x = this.toNumber(value, "nilai_asli");
    const min = this.toNumber(rule.nilai_min, "nilai_min");
    const max = this.toNumber(rule.nilai_max, "nilai_max");

    if (max < min) {
      throw new BadRequestError(
        "nilai_max tidak boleh lebih kecil dari nilai_min.",
      );
    }

    if (max === min) {
      return 0.5;
    }

    const result = (max - x) / (max - min);

    return this.round(this.clamp01(result));
  }

  /**
   * Near / Optimum fuzzy membership (piecewise).
   * Cocok untuk indikator "optimum" seperti kepadatan.
   *
   * - x <= nilai_min → 0
   * - x == midpoint  → 1
   * - x >= nilai_max → 0
   * - x < midpoint   : (x - min)/(midpoint - min), quadratic ramp up
   * - x > midpoint   : linear ramp down to nilai_max
   *
   * nilai_min default 0 bila kosong, nilai_max default midpoint*2 bila kosong.
   * `spread` tidak dipakai oleh fungsi ini (dipertahankan di schema untuk
   * kompatibilitas, bukan untuk perhitungan).
   */
  static calculateNear(value, rule) {
    const x = this.toNumber(value, "nilai_asli");
    const midpoint = this.toNumber(rule.midpoint, "midpoint");

    const minVal =
      rule.nilai_min !== null && rule.nilai_min !== undefined
        ? this.toNumber(rule.nilai_min, "nilai_min")
        : 0;
    const maxVal =
      rule.nilai_max !== null && rule.nilai_max !== undefined
        ? this.toNumber(rule.nilai_max, "nilai_max")
        : midpoint * 2;

    if (midpoint <= minVal || midpoint >= maxVal) {
      throw new BadRequestError(
        "midpoint harus berada di antara nilai_min dan nilai_max.",
      );
    }

    let result;

    if (x <= minVal) {
      result = 0;
    } else if (x <= midpoint) {
      const t = (x - minVal) / (midpoint - minVal);
      result = t * t;
    } else if (x <= maxVal) {
      result = 1 - (x - midpoint) / (maxVal - midpoint);
    } else {
      result = 0;
    }

    return this.round(this.clamp01(result));
  }

  /**
   * rule harus punya: fungsi_fuzzy, arah, nilai_min?, nilai_max?, midpoint?, spread?
   */
  static calculate(value, rule) {
    const functionName = this.normalizeFunctionName(rule.fungsi_fuzzy);

    if (functionName === "near") {
      return this.calculateNear(value, rule);
    }

    const arah = this.normalizeArah(rule.arah, functionName);

    if (arah === "increasing") {
      return this.calculateLinearIncreasing(value, rule);
    }

    return this.calculateLinearDecreasing(value, rule);
  }
}

module.exports = FuzzyHelper;
