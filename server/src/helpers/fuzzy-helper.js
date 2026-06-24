const { BadRequestError } = require("../utils/error-handling-util");

class FuzzyHelper {
  static ALLOWED_FUNCTIONS = ["linear", "sigmoid", "triangular"];
  static ALLOWED_DIRECTIONS = ["benefit", "cost"];

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

    const functionName = String(fungsi_fuzzy).toLowerCase();

    if (!this.ALLOWED_FUNCTIONS.includes(functionName)) {
      throw new BadRequestError(
        "fungsi_fuzzy hanya mendukung: linear, sigmoid, atau triangular.",
      );
    }

    return functionName;
  }

  static normalizeDirection(arah) {
    if (!arah) {
      throw new BadRequestError("arah wajib diisi.");
    }

    const direction = String(arah).toLowerCase();

    if (!this.ALLOWED_DIRECTIONS.includes(direction)) {
      throw new BadRequestError("arah hanya boleh benefit atau cost.");
    }

    return direction;
  }

  static calculateLinear(value, rule) {
    const x = this.toNumber(value, "nilai_asli");
    const min = this.toNumber(rule.nilai_min, "nilai_min");
    const max = this.toNumber(rule.nilai_max, "nilai_max");
    const arah = this.normalizeDirection(rule.arah);

    if (max <= min) {
      throw new BadRequestError("nilai_max harus lebih besar dari nilai_min.");
    }

    let result;

    if (arah === "benefit") {
      result = (x - min) / (max - min);
    } else {
      result = (max - x) / (max - min);
    }

    return this.round(this.clamp01(result));
  }

  static calculateSigmoid(value, rule) {
    const x = this.toNumber(value, "nilai_asli");
    const midpoint = this.toNumber(rule.midpoint, "midpoint");
    const spread = this.toNumber(rule.spread, "spread");
    const arah = this.normalizeDirection(rule.arah);

    if (spread <= 0) {
      throw new BadRequestError("spread harus lebih besar dari 0.");
    }

    const z = (x - midpoint) / spread;
    const benefitValue = 1 / (1 + Math.exp(-z));

    const result = arah === "benefit" ? benefitValue : 1 - benefitValue;

    return this.round(this.clamp01(result));
  }

  static calculateTriangular(value, rule) {
    const x = this.toNumber(value, "nilai_asli");
    const min = this.toNumber(rule.nilai_min, "nilai_min");
    const mid = this.toNumber(rule.midpoint, "midpoint");
    const max = this.toNumber(rule.nilai_max, "nilai_max");

    if (!(min < mid && mid < max)) {
      throw new BadRequestError(
        "Untuk triangular, nilai_min < midpoint < nilai_max.",
      );
    }

    let result;

    if (x <= min || x >= max) {
      result = 0;
    } else if (x === mid) {
      result = 1;
    } else if (x < mid) {
      result = (x - min) / (mid - min);
    } else {
      result = (max - x) / (max - mid);
    }

    return this.round(this.clamp01(result));
  }

  static calculate(value, rule) {
    const functionName = this.normalizeFunctionName(rule.fungsi_fuzzy);

    if (functionName === "linear") {
      return this.calculateLinear(value, rule);
    }

    if (functionName === "sigmoid") {
      return this.calculateSigmoid(value, rule);
    }

    if (functionName === "triangular") {
      return this.calculateTriangular(value, rule);
    }

    throw new BadRequestError("Fungsi fuzzy tidak dikenali.");
  }
}

module.exports = FuzzyHelper;
