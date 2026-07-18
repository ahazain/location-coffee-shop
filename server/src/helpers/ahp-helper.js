const { BadRequestError } = require("../utils/error-handling-util");
// menghitung bobot dan konsistensi dari matriks perbandingan berpasangan
class AHPHelper {
  static RANDOM_INDEX = {
    1: 0,
    2: 0,
    3: 0.58,
    4: 0.9,
    5: 1.12,
    6: 1.24,
    7: 1.32,
    8: 1.41,
    9: 1.45,
    10: 1.49,
  };

  static parseValue(value) {
    if (typeof value === "number") return value;

    if (typeof value === "string") {
      const trimmed = value.trim();

      if (trimmed.includes("/")) {
        const [numerator, denominator] = trimmed.split("/").map(Number);

        if (!numerator || !denominator) {
          throw new BadRequestError("Format pecahan matrix AHP tidak valid.");
        }

        return numerator / denominator;
      }

      const parsed = Number(trimmed);

      if (!Number.isNaN(parsed)) return parsed;
    }

    throw new BadRequestError("Nilai matrix AHP harus berupa angka.");
  }

  static normalizeInputMatrix(matrix) {
    if (!Array.isArray(matrix) || matrix.length === 0) {
      throw new BadRequestError("Matrix AHP tidak boleh kosong.");
    }

    const n = matrix.length;

    if (n > 10) {
      throw new BadRequestError(
        "Jumlah elemen AHP maksimal 10 karena nilai RI hanya tersedia sampai 10.",
      );
    }

    return matrix.map((row) => {
      if (!Array.isArray(row) || row.length !== n) {
        throw new BadRequestError("Matrix AHP harus berbentuk persegi.");
      }

      return row.map((value) => {
        const parsedValue = this.parseValue(value);

        if (parsedValue <= 0) {
          throw new BadRequestError(
            "Semua nilai matrix AHP harus lebih dari 0.",
          );
        }

        return parsedValue;
      });
    });
  }

  static validateDiagonal(matrix) {
    matrix.forEach((row, rowIndex) => {
      const diagonalValue = row[rowIndex];

      if (Math.abs(diagonalValue - 1) > 0.000001) {
        throw new BadRequestError("Nilai diagonal utama matrix AHP harus 1.");
      }
    });
  }

  static validateReciprocal(matrix) {
    const n = matrix.length;
    const tolerance = 0.01;

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const aij = matrix[i][j];
        const aji = matrix[j][i];

        if (Math.abs(aij * aji - 1) > tolerance) {
          throw new BadRequestError(
            "Matrix AHP harus bersifat reciprocal. Jika A dibanding B = 3, maka B dibanding A harus 1/3.",
          );
        }
      }
    }
  }

  static getColumnSums(matrix) {
    const n = matrix.length;
    const columnSums = Array(n).fill(0);

    for (let col = 0; col < n; col++) {
      for (let row = 0; row < n; row++) {
        columnSums[col] += matrix[row][col];
      }
    }

    return columnSums;
  }

  static getNormalizedMatrix(matrix, columnSums) {
    return matrix.map((row) =>
      row.map((value, colIndex) => value / columnSums[colIndex]),
    );
  }

  static getWeights(normalizedMatrix) {
    const n = normalizedMatrix.length;

    return normalizedMatrix.map((row) => {
      const rowSum = row.reduce((sum, value) => sum + value, 0);
      return rowSum / n;
    });
  }

  static getWeightedSumVector(matrix, weights) {
    return matrix.map((row) =>
      row.reduce((sum, value, colIndex) => {
        return sum + value * weights[colIndex];
      }, 0),
    );
  }

  static getLambdaVector(weightedSumVector, weights) {
    return weightedSumVector.map((value, index) => value / weights[index]);
  }

  static round(value, digits = 6) {
    return Number(value.toFixed(digits));
  }

  static calculate(matrix) {
    const normalizedInputMatrix = this.normalizeInputMatrix(matrix);

    this.validateDiagonal(normalizedInputMatrix);
    this.validateReciprocal(normalizedInputMatrix);

    const n = normalizedInputMatrix.length;

    const columnSums = this.getColumnSums(normalizedInputMatrix);
    const normalizedMatrix = this.getNormalizedMatrix(
      normalizedInputMatrix,
      columnSums,
    );
    const weights = this.getWeights(normalizedMatrix);
    const weightedSumVector = this.getWeightedSumVector(
      normalizedInputMatrix,
      weights,
    );
    const lambdaVector = this.getLambdaVector(weightedSumVector, weights);

    const lambdaMax = lambdaVector.reduce((sum, value) => sum + value, 0) / n;

    const consistencyIndex = n <= 2 ? 0 : (lambdaMax - n) / (n - 1);

    const randomIndex = this.RANDOM_INDEX[n];

    const consistencyRatio =
      randomIndex === 0 ? 0 : consistencyIndex / randomIndex;

    const isConsistent = consistencyRatio <= 0.1;

    return {
      matrix: normalizedInputMatrix.map((row) =>
        row.map((value) => this.round(value)),
      ),
      column_sums: columnSums.map((value) => this.round(value)),
      normalized_matrix: normalizedMatrix.map((row) =>
        row.map((value) => this.round(value)),
      ),
      weights: weights.map((value) => this.round(value)),
      weighted_sum_vector: weightedSumVector.map((value) => this.round(value)),
      lambda_vector: lambdaVector.map((value) => this.round(value)),
      lambda_max: this.round(lambdaMax),
      consistency_index: this.round(consistencyIndex),
      consistency_ratio: this.round(consistencyRatio),
      is_consistent: isConsistent,
      status_konsistensi: isConsistent ? "KONSISTEN" : "TIDAK_KONSISTEN",
    };
  }

  static calculateFinalIndicatorWeights(indicatorWeights, criteriaWeight) {
    return indicatorWeights.map((weight) => ({
      bobot_lokal: this.round(weight),
      bobot_akhir: this.round(weight * criteriaWeight),
    }));
  }
}

module.exports = AHPHelper;
