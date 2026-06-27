const { BadRequestError } = require("../utils/error-handling-util");

class FuzzyHelper {
  static ALLOWED_FUNCTIONS = ["linear_increasing", "linear_decreasing", "near"];

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
      increasing: "linear_increasing",
      linear_increasing: "linear_increasing",
      linearincrease: "linear_increasing",

      decreasing: "linear_decreasing",
      linear_decreasing: "linear_decreasing",
      lineardecrease: "linear_decreasing",

      fuzzy_near: "near",
      near: "near",
    };

    const normalized = aliases[functionName] || functionName;

    if (!this.ALLOWED_FUNCTIONS.includes(normalized)) {
      throw new BadRequestError(
        "fungsi_fuzzy hanya mendukung: linear_increasing, linear_decreasing, atau near.",
      );
    }

    return normalized;
  }

  static getArahByFunction(fungsi_fuzzy) {
    const functionName = this.normalizeFunctionName(fungsi_fuzzy);

    if (functionName === "linear_increasing") {
      return "benefit";
    }

    if (functionName === "linear_decreasing") {
      return "cost";
    }

    if (functionName === "near") {
      return "optimum";
    }

    throw new BadRequestError("Fungsi fuzzy tidak dikenali.");
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

  static calculateNear(value, rule) {
    const x = this.toNumber(value, "nilai_asli");
    const midpoint = this.toNumber(rule.midpoint, "midpoint");
    const spread = this.toNumber(rule.spread, "spread");

    if (spread <= 0) {
      throw new BadRequestError("spread harus lebih besar dari 0.");
    }

    const result = 1 / (1 + spread * Math.pow(x - midpoint, 2));

    return this.round(this.clamp01(result));
  }

  static calculate(value, rule) {
    const functionName = this.normalizeFunctionName(rule.fungsi_fuzzy);

    if (functionName === "linear_increasing") {
      return this.calculateLinearIncreasing(value, rule);
    }

    if (functionName === "linear_decreasing") {
      return this.calculateLinearDecreasing(value, rule);
    }

    if (functionName === "near") {
      return this.calculateNear(value, rule);
    }

    throw new BadRequestError("Fungsi fuzzy tidak dikenali.");
  }
}

module.exports = FuzzyHelper;
