import { respondentPrioritySnapshots, respondentProfiles } from "../data/ahpQuestionnaire";
import { criteria } from "../data/criteria";
import { indicators } from "../data/indicators";
import {
  calculateAhp,
  combineMatricesGeometric,
  matrixFromComparisons,
  matrixFromWeightSnapshot,
} from "../utils/ahp";
import { buildGlobalIndicatorWeights } from "../utils/weights";

const ACTIVE_AHP_STORAGE_KEY = "coffee-location-active-ahp-weights";

function getIndicatorsByCriteria(criteriaCode) {
  return indicators.filter((indicator) => indicator.criteriaCode === criteriaCode);
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function buildLocalResultsFromMatrices(matricesByCriteria) {
  return Object.fromEntries(
    criteria.map((criterion) => {
      const items = getIndicatorsByCriteria(criterion.code);
      const matrices = matricesByCriteria[criterion.code] || [];
      const combinedMatrix = combineMatricesGeometric(matrices);
      const result = calculateAhp(combinedMatrix, items);

      return [criterion.code, result];
    }),
  );
}

function buildLocalWeightsFromResults(localResults) {
  return Object.fromEntries(
    Object.entries(localResults).map(([criteriaCode, result]) => [criteriaCode, result.weightsPercent]),
  );
}

function buildRespondentAnalysis(snapshot) {
  const criteriaMatrix = matrixFromWeightSnapshot(criteria, snapshot.criteriaWeights);
  const criteriaResult = calculateAhp(criteriaMatrix, criteria);
  const localResults = Object.fromEntries(
    criteria.map((criterion) => {
      const items = getIndicatorsByCriteria(criterion.code);
      const localMatrix = matrixFromWeightSnapshot(items, snapshot.localIndicatorWeights[criterion.code]);
      return [criterion.code, calculateAhp(localMatrix, items)];
    }),
  );

  return {
    ...snapshot,
    profile: respondentProfiles.find((profile) => profile.id === snapshot.respondentId),
    criteriaMatrix,
    criteriaResult,
    localResults,
  };
}

function buildDefaultAhpAnalysis() {
  const respondentAnalyses = respondentPrioritySnapshots.map(buildRespondentAnalysis);
  const criteriaMatrices = respondentAnalyses.map((item) => item.criteriaMatrix);
  const combinedCriteriaMatrix = combineMatricesGeometric(criteriaMatrices);
  const combinedCriteriaResult = calculateAhp(combinedCriteriaMatrix, criteria);

  const localMatricesByCriteria = Object.fromEntries(
    criteria.map((criterion) => [
      criterion.code,
      respondentPrioritySnapshots.map((snapshot) =>
        matrixFromWeightSnapshot(
          getIndicatorsByCriteria(criterion.code),
          snapshot.localIndicatorWeights[criterion.code],
        ),
      ),
    ]),
  );

  const combinedLocalResults = buildLocalResultsFromMatrices(localMatricesByCriteria);
  const criteriaWeights = combinedCriteriaResult.weightsPercent;
  const localIndicatorWeights = buildLocalWeightsFromResults(combinedLocalResults);
  const globalIndicatorWeights = buildGlobalIndicatorWeights(criteriaWeights, localIndicatorWeights);

  return {
    mode: "default",
    source: "Bobot default AHP dari 3 pelaku usaha berpengalaman (> 2 tahun dan memiliki cabang)",
    respondentProfiles,
    respondentAnalyses,
    combinedCriteriaMatrix,
    combinedCriteriaResult,
    combinedLocalResults,
    criteriaWeights,
    localIndicatorWeights,
    globalIndicatorWeights,
    isConsistent: true,
  };
}

function buildCustomAhpAnalysis({ criteriaComparisons, indicatorComparisons }) {
  const criteriaMatrix = matrixFromComparisons(criteria, criteriaComparisons);
  const criteriaResult = calculateAhp(criteriaMatrix, criteria);

  const localResults = Object.fromEntries(
    criteria.map((criterion) => {
      const items = getIndicatorsByCriteria(criterion.code);
      const matrix = matrixFromComparisons(items, indicatorComparisons?.[criterion.code] || {});

      return [criterion.code, calculateAhp(matrix, items)];
    }),
  );

  const criteriaWeights = criteriaResult.weightsPercent;
  const localIndicatorWeights = buildLocalWeightsFromResults(localResults);
  const globalIndicatorWeights = buildGlobalIndicatorWeights(criteriaWeights, localIndicatorWeights);
  const allLocalConsistent = Object.values(localResults).every((result) => result.isConsistent);

  return {
    mode: "custom-ahp",
    source: "Bobot AHP dari input pelaku usaha",
    savedAt: new Date().toISOString(),
    criteriaComparisons,
    indicatorComparisons,
    combinedCriteriaResult: criteriaResult,
    combinedLocalResults: localResults,
    criteriaWeights,
    localIndicatorWeights,
    globalIndicatorWeights,
    isConsistent: criteriaResult.isConsistent && allLocalConsistent,
  };
}

function readStoredCustomAhp() {
  if (!canUseStorage()) return null;

  try {
    const rawValue = window.localStorage.getItem(ACTIVE_AHP_STORAGE_KEY);
    if (!rawValue) return null;

    const parsed = JSON.parse(rawValue);
    if (!parsed?.globalIndicatorWeights || !parsed?.criteriaWeights) return null;

    return parsed;
  } catch {
    return null;
  }
}

function saveStoredCustomAhp(analysis) {
  if (!canUseStorage()) return analysis;
  window.localStorage.setItem(ACTIVE_AHP_STORAGE_KEY, JSON.stringify(analysis));
  return analysis;
}

function clearStoredCustomAhp() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(ACTIVE_AHP_STORAGE_KEY);
}

export const weightService = {
  async getDefaultWeights() {
    return buildDefaultAhpAnalysis();
  },

  async getAhpProcess() {
    return buildDefaultAhpAnalysis();
  },

  async getActiveWeights() {
    const stored = readStoredCustomAhp();
    return stored || buildDefaultAhpAnalysis();
  },

  async buildCustomAhpWeights(payload) {
    return buildCustomAhpAnalysis(payload);
  },

  async saveCustomAhpWeights(payload) {
    const analysis = buildCustomAhpAnalysis(payload);

    if (!analysis.isConsistent) {
      return analysis;
    }

    return saveStoredCustomAhp(analysis);
  },

  async resetActiveWeights() {
    clearStoredCustomAhp();
    return buildDefaultAhpAnalysis();
  },

  async getStoredCustomAhp() {
    return readStoredCustomAhp();
  },
};
