import { mapDummy } from "../data/mapDummy";
import { weightService } from "./weightService";
import {
  calculateTopIndicators,
  calculateWlcScore,
  classifyScore,
  summarizeMap,
} from "../utils/wlc";

function cloneData(data) {
  return structuredClone(data);
}

function applyWlcToMap(geojson, globalIndicatorWeights, mode = "default", weightSource = "Bobot default AHP") {
  const cloned = cloneData(geojson);

  cloned.features = cloned.features.map((feature) => {
    const indicatorScores = feature.properties.indicatorScores;
    const mask = feature.properties.mask ?? 1;
    const score = mask === 0 ? 0 : calculateWlcScore(indicatorScores, globalIndicatorWeights, mask);
    const suitabilityClass = classifyScore(score, mask);
    const topIndicators = calculateTopIndicators(indicatorScores, globalIndicatorWeights);
    const baseProperties = {
      ...feature.properties,
      scoreUsed: score,
      suitabilityClass,
      topIndicators,
      weightSource,
    };

    if (mode === "default") {
      return {
        ...feature,
        properties: {
          ...baseProperties,
          scoreDefault: score,
          scoreCustom: undefined,
        },
      };
    }

    return {
      ...feature,
      properties: {
        ...baseProperties,
        scoreDefault: feature.properties.scoreDefault,
        scoreCustom: score,
      },
    };
  });

  cloned.summary = summarizeMap(cloned.features);
  cloned.weightSource = weightSource;
  cloned.weightMode = mode;

  return cloned;
}

export const mapService = {
  async getDefaultMap() {
    const weights = await weightService.getDefaultWeights();

    return {
      ...applyWlcToMap(mapDummy, weights.globalIndicatorWeights, "default", weights.source),
      weightAnalysis: weights,
    };
  },

  async getActiveMap() {
    const defaultWeights = await weightService.getDefaultWeights();
    const defaultMap = applyWlcToMap(mapDummy, defaultWeights.globalIndicatorWeights, "default", defaultWeights.source);
    const activeWeights = await weightService.getActiveWeights();

    if (activeWeights.mode === "custom-ahp") {
      return {
        ...applyWlcToMap(defaultMap, activeWeights.globalIndicatorWeights, "custom", activeWeights.source),
        weightAnalysis: activeWeights,
      };
    }

    return {
      ...defaultMap,
      weightAnalysis: defaultWeights,
    };
  },

  async getCustomAhpMap({ criteriaComparisons, indicatorComparisons }) {
    const defaultMap = await this.getDefaultMap();
    const weights = await weightService.buildCustomAhpWeights({ criteriaComparisons, indicatorComparisons });

    return {
      ...applyWlcToMap(defaultMap, weights.globalIndicatorWeights, "custom", weights.source),
      weightAnalysis: weights,
    };
  },

  async getMapFromWeights(globalIndicatorWeights, weightSource = "Bobot custom") {
    const defaultMap = await this.getDefaultMap();

    return applyWlcToMap(defaultMap, globalIndicatorWeights, "custom", weightSource);
  },
};
