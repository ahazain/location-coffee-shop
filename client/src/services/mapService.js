import { wlcService } from "./api/wlcService";
import { ahpService } from "./api/ahpService";

export const mapService = {
  async getDefaultMap() {
    const grids = await wlcService.getGrids();
    const konsensus = await ahpService.getBobotKonsensus();

    if (grids && grids.features) {
      const mapClassToUi = (cls) => {
        if (!cls) return "";
        const normalized = cls.toLowerCase();
        if (normalized === "sesuai") return "Sesuai";
        if (normalized === "cukup_sesuai" || normalized === "cukup sesuai") return "Cukup Sesuai";
        if (normalized === "kurang_sesuai" || normalized === "kurang sesuai") return "Kurang Sesuai";
        return cls;
      };

      // Map properties for compatibility with MapView and DetailPanel
      grids.features = grids.features.map((f) => {
        f.properties.scoreUsed = f.properties.scoreDefault;
        f.properties.suitabilityClass = mapClassToUi(f.properties.suitabilityClass);
        return f;
      });

      const total = grids.features.length;
      const sesuai = grids.features.filter(f => f.properties.suitabilityClass === "Sesuai").length;
      const cukupSesuai = grids.features.filter(f => f.properties.suitabilityClass === "Cukup Sesuai").length;
      const kurangSesuai = grids.features.filter(f => f.properties.suitabilityClass === "Kurang Sesuai").length;

      grids.summary = {
        total,
        sesuai,
        cukupSesuai,
        kurangSesuai,
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
        globalIndicatorWeights[i.kode] = i.bobot_rata_rata || i.bobot_akhir;
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
    const grids = await wlcService.getGrids();
    
    let customAhp = null;
    try {
      const rawValue = window.localStorage.getItem("coffee-location-active-ahp-weights");
      if (rawValue) {
        customAhp = JSON.parse(rawValue);
      }
    } catch (e) {
      console.error("Gagal membaca bobot kustom dari localStorage:", e);
    }

    if (customAhp && customAhp.globalIndicatorWeights) {
      const weights = customAhp.globalIndicatorWeights;
      if (grids && grids.features) {
        grids.features = grids.features.map((f) => {
          const scores = f.properties.indicatorScores || {};
          
          let scoreSum = 0;
          let weightSum = 0;
          
          for (const [indKey, weightVal] of Object.entries(weights)) {
            const fuzzyVal = scores["fuzzy_" + indKey] ?? 0;
            scoreSum += fuzzyVal * weightVal;
            weightSum += weightVal;
          }
          
          const rawScore = weightSum > 0 ? scoreSum / weightSum : scoreSum;
          const isConstrained = scores.sawah === 0 || scores.sempadan_sungai === 0;
          const finalScore = isConstrained ? 0.0 : rawScore;
          
          let suitabilityClass = "Kurang Sesuai";
          if (!isConstrained && finalScore >= 0.333333) {
            if (finalScore >= 0.666667) {
              suitabilityClass = "Sesuai";
            } else {
              suitabilityClass = "Cukup Sesuai";
            }
          }
          
          f.properties.scoreUsed = finalScore;
          f.properties.suitabilityClass = suitabilityClass;
          return f;
        });
        
        const total = grids.features.length;
        const sesuai = grids.features.filter(f => f.properties.suitabilityClass === "Sesuai").length;
        const cukupSesuai = grids.features.filter(f => f.properties.suitabilityClass === "Cukup Sesuai").length;
        const kurangSesuai = grids.features.filter(f => f.properties.suitabilityClass === "Kurang Sesuai").length;
        
        grids.summary = {
          total,
          sesuai,
          cukupSesuai,
          kurangSesuai,
          topGrid: [...grids.features].sort((a, b) => b.properties.scoreUsed - a.properties.scoreUsed)[0]?.properties || null
        };
        
        const criteriaWeights = {};
        if (customAhp.criteriaWeights) {
          Object.entries(customAhp.criteriaWeights).forEach(([k, v]) => {
            criteriaWeights[k] = v;
          });
        }

        grids.weightAnalysis = {
          mode: "custom-ahp",
          source: "Bobot AHP Kustom Pelaku Usaha (Browser)",
          criteriaWeights,
          globalIndicatorWeights: weights
        };
        
        return grids;
      }
    }

    return this.getDefaultMap();
  },

  async getCustomAhpMap() {
    return this.getActiveMap();
  },

  async getMapFromWeights() {
    return this.getActiveMap();
  },
};
