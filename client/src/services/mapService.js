import { wlcService } from "./api/wlcService";
import { ahpService } from "./api/ahpService";

export const mapService = {
  async getDefaultMap() {
    const grids = await wlcService.getGrids();
    const konsensus = await ahpService.getBobotKonsensus();

    if (grids && grids.features) {
      // Map properties for compatibility with MapView and DetailPanel
      grids.features = grids.features.map((f) => {
        f.properties.scoreUsed = f.properties.scoreDefault;
        return f;
      });

      const total = grids.features.length;
      const recommended = grids.features.filter(f => f.properties.suitabilityClass === "Sesuai").length;
      const sumScore = grids.features.reduce((acc, f) => acc + (f.properties.scoreDefault || 0), 0);
      const averageScore = total > 0 ? (sumScore / total).toFixed(4) : "0";

      grids.summary = {
        total,
        recommended,
        averageScore,
        topGrid: [...grids.features].sort((a, b) => b.properties.scoreDefault - a.properties.scoreDefault)[0]?.properties || null
      };
    }

    // Map consensus weights to what the client expects
    const criteriaWeights = {};
    if (konsensus?.bobot_kriteria) {
      konsensus.bobot_kriteria.forEach(k => {
        criteriaWeights[k.kode] = k.bobot * 100;
      });
    }

    const globalIndicatorWeights = {};
    if (konsensus?.bobot_indikator) {
      konsensus.bobot_indikator.forEach(i => {
        globalIndicatorWeights[i.kode] = i.bobot_akhir;
      });
    }

    grids.weightAnalysis = {
      mode: "default",
      source: "Bobot Konsensus AHP dari database pakar",
      criteriaWeights,
      globalIndicatorWeights,
    };

    return grids;
  },

  async getActiveMap() {
    return this.getDefaultMap();
  },

  async getCustomAhpMap() {
    // If custom is requested, fallback to default map for consistency
    return this.getDefaultMap();
  },

  async getMapFromWeights() {
    return this.getDefaultMap();
  },
};
