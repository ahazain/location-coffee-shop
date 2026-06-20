const RANDOM_INDEX = {
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

function validateMatrix(matrix) {
  if (!Array.isArray(matrix) || matrix.length === 0) {
    throw new Error("Matrix AHP tidak boleh kosong");
  }

  const n = matrix.length;

  matrix.forEach((row) => {
    if (!Array.isArray(row) || row.length !== n) {
      throw new Error("Matrix AHP harus berbentuk persegi");
    }

    row.forEach((value) => {
      if (typeof value !== "number" || value <= 0) {
        throw new Error("Semua nilai matrix AHP harus berupa angka positif");
      }
    });
  });
}

function calculateAhp(matrix) {
  validateMatrix(matrix);

  const n = matrix.length;

  const columnSums = Array(n).fill(0);

  for (let col = 0; col < n; col++) {
    for (let row = 0; row < n; row++) {
      columnSums[col] += matrix[row][col];
    }
  }

  const normalizedMatrix = matrix.map((row) =>
    row.map((value, colIndex) => value / columnSums[colIndex]),
  );

  const weights = normalizedMatrix.map((row) => {
    const rowSum = row.reduce((sum, value) => sum + value, 0);
    return rowSum / n;
  });

  const weightedSumVector = matrix.map((row) =>
    row.reduce((sum, value, colIndex) => {
      return sum + value * weights[colIndex];
    }, 0),
  );

  const lambdaVector = weightedSumVector.map((value, index) => {
    return value / weights[index];
  });

  const lambdaMax = lambdaVector.reduce((sum, value) => sum + value, 0) / n;

  const consistencyIndex = n <= 2 ? 0 : (lambdaMax - n) / (n - 1);

  const randomIndex = RANDOM_INDEX[n] ?? 1.49;

  const consistencyRatio =
    randomIndex === 0 ? 0 : consistencyIndex / randomIndex;

  const isConsistent = consistencyRatio <= 0.1;

  return {
    matrix,
    columnSums,
    normalizedMatrix,
    weights,
    weightedSumVector,
    lambdaVector,
    lambdaMax,
    consistencyIndex,
    consistencyRatio,
    isConsistent,
    status: isConsistent ? "Konsisten" : "Tidak Konsisten",
  };
}

function calculateFinalIndicatorWeights(indicatorWeights, criteriaWeight) {
  return indicatorWeights.map((weight) => ({
    bobot_lokal: weight,
    bobot_akhir: weight * criteriaWeight,
  }));
}

module.exports = {
  calculateAhp,
  calculateFinalIndicatorWeights,
};
