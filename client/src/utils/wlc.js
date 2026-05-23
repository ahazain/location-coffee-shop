export function classifyScore(score, mask = 1) {
  if (mask === 0) return "Area terbatas";
  if (score >= 0.8) return "Sangat sesuai";
  if (score >= 0.6) return "Sesuai";
  if (score >= 0.4) return "Cukup sesuai";
  if (score >= 0.2) return "Kurang sesuai";

  return "Tidak sesuai";
}

export function calculateWlcScore(indicatorScores, globalIndicatorWeights, constraint = 1) {
  const score = Object.entries(globalIndicatorWeights).reduce((sum, [indicatorCode, weight]) => {
    const fuzzyValue = Number(indicatorScores[indicatorCode] || 0);

    return sum + fuzzyValue * Number(weight);
  }, 0);

  return Number((score * Number(constraint)).toFixed(3));
}

export function calculateTopIndicators(indicatorScores, globalIndicatorWeights) {
  return Object.entries(globalIndicatorWeights)
    .map(([indicatorCode, weight]) => {
      const fuzzyValue = Number(indicatorScores[indicatorCode] || 0);
      const contribution = fuzzyValue * Number(weight);

      return {
        indicatorCode,
        fuzzyValue,
        weight,
        contribution: Number(contribution.toFixed(4)),
      };
    })
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 3);
}

export function calculateWlcBreakdown(indicatorScores, globalIndicatorWeights) {
  return Object.entries(globalIndicatorWeights)
    .map(([indicatorCode, weight]) => {
      const fuzzyValue = Number(indicatorScores[indicatorCode] || 0);
      const contribution = fuzzyValue * Number(weight);

      return {
        indicatorCode,
        fuzzyValue,
        weight,
        contribution: Number(contribution.toFixed(4)),
      };
    })
    .sort((a, b) => b.contribution - a.contribution);
}

export function summarizeMap(features) {
  const total = features.length;
  const averageScore = total
    ? features.reduce((sum, feature) => sum + Number(feature.properties.scoreUsed || 0), 0) / total
    : 0;
  const recommended = features.filter((feature) =>
    ["Sangat sesuai", "Sesuai"].includes(feature.properties.suitabilityClass),
  ).length;
  const constrained = features.filter((feature) => feature.properties.mask === 0).length;
  const topGrid = [...features].sort(
    (a, b) => Number(b.properties.scoreUsed || 0) - Number(a.properties.scoreUsed || 0),
  )[0];

  return {
    total,
    averageScore: Number(averageScore.toFixed(3)),
    recommended,
    constrained,
    topGrid: topGrid?.properties,
  };
}
