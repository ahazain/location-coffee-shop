export function normalizeWeightsTo100(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, value]) => sum + Number(value), 0);

  if (total === 0 || entries.length === 0) {
    return weights;
  }

  const rawNormalized = entries.map(([key, value]) => ({
    key,
    value: (Number(value) / total) * 100,
  }));

  const normalized = Object.fromEntries(
    rawNormalized.map((item) => [item.key, Math.floor(item.value)]),
  );

  const remainder = 100 - Object.values(normalized).reduce((sum, value) => sum + value, 0);
  const sortedByDecimal = rawNormalized
    .map((item) => ({ ...item, decimal: item.value - Math.floor(item.value) }))
    .sort((a, b) => b.decimal - a.decimal);

  for (let index = 0; index < remainder; index += 1) {
    normalized[sortedByDecimal[index % sortedByDecimal.length].key] += 1;
  }

  return normalized;
}

export function buildGlobalIndicatorWeights(criteriaWeights, localIndicatorWeights) {
  const globalWeights = {};

  Object.entries(localIndicatorWeights).forEach(([criteriaCode, indicators]) => {
    const criteriaWeight = Number(criteriaWeights[criteriaCode] || 0) / 100;

    Object.entries(indicators).forEach(([indicatorCode, localWeight]) => {
      globalWeights[indicatorCode] = Number((criteriaWeight * (Number(localWeight) / 100)).toFixed(4));
    });
  });

  return globalWeights;
}

export function formatPercent(value) {
  return `${Math.round(Number(value) * 100)}%`;
}
