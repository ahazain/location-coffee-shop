export const randomIndexBySize = {
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

export const saatyScale = [
  { value: 1, label: "1 - sama penting" },
  { value: 2, label: "2 - nilai antara" },
  { value: 3, label: "3 - sedikit lebih penting" },
  { value: 4, label: "4 - nilai antara" },
  { value: 5, label: "5 - lebih penting" },
  { value: 6, label: "6 - nilai antara" },
  { value: 7, label: "7 - sangat lebih penting" },
  { value: 8, label: "8 - nilai antara" },
  { value: 9, label: "9 - mutlak lebih penting" },
];

export function buildPairKey(leftCode, rightCode) {
  return `${leftCode}__${rightCode}`;
}

export function generatePairs(items) {
  const pairs = [];

  items.forEach((left, leftIndex) => {
    items.slice(leftIndex + 1).forEach((right) => {
      pairs.push({ left, right, key: buildPairKey(left.code, right.code) });
    });
  });

  return pairs;
}

export function getComparisonValue(comparison) {
  if (!comparison || comparison.preference === "equal" || Number(comparison.intensity) === 1) {
    return 1;
  }

  const intensity = Number(comparison.intensity || 1);
  return comparison.preference === "left" ? intensity : 1 / intensity;
}

export function createEqualComparisons(pairs) {
  return Object.fromEntries(
    pairs.map((pair) => [pair.key, { preference: "equal", intensity: 1 }]),
  );
}

export function matrixFromComparisons(items, comparisons = {}) {
  const size = items.length;
  const matrix = Array.from({ length: size }, () => Array(size).fill(1));

  for (let row = 0; row < size; row += 1) {
    for (let column = row + 1; column < size; column += 1) {
      const left = items[row];
      const right = items[column];
      const key = buildPairKey(left.code, right.code);
      const value = getComparisonValue(comparisons[key]);

      matrix[row][column] = value;
      matrix[column][row] = 1 / value;
    }
  }

  return matrix;
}

export function matrixFromWeightSnapshot(items, weightSnapshot) {
  const total = items.reduce((sum, item) => sum + Number(weightSnapshot[item.code] || 0), 0) || 1;
  const normalized = items.map((item) => Number(weightSnapshot[item.code] || 0) / total);

  return normalized.map((rowWeight) => normalized.map((columnWeight) => rowWeight / columnWeight));
}

export function combineMatricesGeometric(matrices) {
  if (!matrices.length) return [];

  const size = matrices[0].length;

  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) => {
      const product = matrices.reduce((result, matrix) => result * Number(matrix[row][column] || 1), 1);
      return Math.pow(product, 1 / matrices.length);
    }),
  );
}

export function calculateAhp(matrix, items) {
  const size = matrix.length;

  if (size === 0) {
    return {
      matrix: [],
      normalizedMatrix: [],
      weights: {},
      weightsPercent: {},
      lambdaMax: 0,
      ci: 0,
      cr: 0,
      isConsistent: true,
    };
  }

  if (size === 1) {
    const code = items[0].code;
    return {
      matrix,
      normalizedMatrix: [[1]],
      weights: { [code]: 1 },
      weightsPercent: { [code]: 100 },
      lambdaMax: 1,
      ci: 0,
      cr: 0,
      isConsistent: true,
    };
  }

  const columnTotals = matrix[0].map((_, column) =>
    matrix.reduce((sum, row) => sum + Number(row[column] || 0), 0),
  );

  const normalizedMatrix = matrix.map((row) =>
    row.map((value, column) => Number(value || 0) / (columnTotals[column] || 1)),
  );

  const priorityVector = normalizedMatrix.map(
    (row) => row.reduce((sum, value) => sum + value, 0) / size,
  );

  const weightedSum = matrix.map((row) =>
    row.reduce((sum, value, column) => sum + Number(value || 0) * priorityVector[column], 0),
  );

  const lambdaVector = weightedSum.map((value, index) => value / (priorityVector[index] || 1));
  const lambdaMax = lambdaVector.reduce((sum, value) => sum + value, 0) / size;
  const ci = size > 2 ? (lambdaMax - size) / (size - 1) : 0;
  const ri = randomIndexBySize[size] ?? randomIndexBySize[10];
  const cr = ri > 0 ? ci / ri : 0;

  const weights = Object.fromEntries(
    items.map((item, index) => [item.code, Number(priorityVector[index].toFixed(6))]),
  );
  const weightsPercent = Object.fromEntries(
    items.map((item, index) => [item.code, Number((priorityVector[index] * 100).toFixed(2))]),
  );

  return {
    matrix,
    normalizedMatrix,
    weights,
    weightsPercent,
    lambdaMax: Number(lambdaMax.toFixed(4)),
    ci: Number(Math.max(ci, 0).toFixed(4)),
    cr: Number(Math.max(cr, 0).toFixed(4)),
    isConsistent: cr <= 0.1,
  };
}

export function calculateAhpFromComparisons(items, comparisons) {
  return calculateAhp(matrixFromComparisons(items, comparisons), items);
}

export function formatPercent(value, digit = 2) {
  return `${Number(value || 0).toFixed(digit)}%`;
}
