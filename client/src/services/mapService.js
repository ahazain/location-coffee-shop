import { wlcService } from "./api/wlcService";
import { ahpService } from "./api/ahpService";
import { getJenksBreaks } from "../utils/jenks";

const indicatorIdToKey = {
  1: "kepadatan_layanan_makan_non_coffee",
  2: "kepadatan_layanan_olahraga_rekreasi",
  3: "kepadatan_hunian",
  4: "kedekatan_pusat_belanja",
  5: "kepadatan_kampus_fasilitas_pendidikan",
  6: "kepadatan_kantor_jasa_keuangan_bisnis",
  7: "intensitas_cahaya_malam",
  8: "kepadatan_populasi",
  9: "jarak_jalan_utama",
  10: "kedekatan_simpul_transportasi",
  11: "kepadatan_simpang_jalan",
  12: "kepadatan_coffee_shop_existing",
  13: "jarak_coffee_shop_existing_terdekat",
};

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

  async getActiveMap(indicatorList = []) {
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
        const maskIndicatorKeys = indicatorList
          .filter(ind => ind.tipe_nilai === "MASK" || ind.tipeNilai === "MASK")
          .map(ind => "ind_" + ind.id);

        grids.features = grids.features.map((f) => {
          const scores = f.properties.indicatorScores || {};
          
          let scoreSum = 0;
          let weightSum = 0;
          
          for (const [indIdStr, weightVal] of Object.entries(weights)) {
            const indId = Number(indIdStr);
            const indKey = "ind_" + indId;
            
            const fuzzyVal = scores["fuzzy_" + indKey] ?? 0;
            scoreSum += fuzzyVal * weightVal;
            weightSum += weightVal;
          }
          
          const rawScore = weightSum > 0 ? scoreSum / weightSum : scoreSum;
          const isConstrained = maskIndicatorKeys.length > 0
            ? maskIndicatorKeys.some(key => scores[key] === 0)
            : (scores.sawah === 0 || scores.sempadan_sungai === 0 || scores.ind_14 === 0 || scores.ind_15 === 0);
          const finalScore = isConstrained ? 0.0 : rawScore;
          
          f.properties.scoreUsed = finalScore;
          f.properties.isConstrained = isConstrained;
          return f;
        });

        // Extract valid scores for Jenks Breaks calculation
        const validScores = grids.features
          .filter((f) => !f.properties.isConstrained && f.properties.scoreUsed > 0)
          .map((f) => f.properties.scoreUsed);

        let break1 = 0.333333;
        let break2 = 0.666667;

        if (validScores.length >= 3) {
          const breaks = getJenksBreaks(validScores, 3);
          if (breaks && breaks.length === 4) {
            break1 = breaks[1];
            break2 = breaks[2];
          }
        }

        // Assign final suitability class based on breaks
        grids.features = grids.features.map((f) => {
          const score = f.properties.scoreUsed;
          const isConstrained = f.properties.isConstrained;
          
          let suitabilityClass = "Kurang Sesuai";
          if (!isConstrained && score > 0) {
            if (score <= break1) {
              suitabilityClass = "Kurang Sesuai";
            } else if (score <= break2) {
              suitabilityClass = "Cukup Sesuai";
            } else {
              suitabilityClass = "Sesuai";
            }
          }
          
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

  async getCustomAhpMap(indicatorList = []) {
    return this.getActiveMap(indicatorList);
  },

  async getMapFromWeights(indicatorList = []) {
    return this.getActiveMap(indicatorList);
  },
};
