import { useEffect, useState } from "react";
import { MapPinned } from "lucide-react";
import Badge from "../components/common/Badge";
import Card from "../components/common/Card";
import GridDetailPanel from "../components/map/GridDetailPanel";
import Legend from "../components/map/Legend";
import MapView from "../components/map/MapView";
import PublicLayout from "../layouts/PublicLayout";
import { mapService } from "../services/mapService";
import { kriteriaService } from "../services/api/kriteriaService";
import { indikatorService } from "../services/api/indikatorService";
import { wlcService } from "../services/api/wlcService";
import { getJenksBreaks } from "../utils/jenks";

function getArrayData(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function mapKriteriaItem(item) {
  const id = item.id_kriteria ?? item.id;
  return {
    id,
    code: String(id),
    name: item.nama_kriteria ?? item.nama ?? "-",
    description: item.deskripsi ?? item.keterangan ?? "",
    urutan: item.urutan ?? 999,
  };
}

function mapIndikatorItem(item) {
  const id = item.id_indikator ?? item.id;
  const idKriteria =
    item.id_kriteria ??
    item.kriteria?.id_kriteria ??
    item.kriteria?.id ??
    item.criteriaId;
  return {
    id,
    code: String(id),
    criteriaCode: String(idKriteria),
    criteriaId: idKriteria,
    name: item.nama_indikator ?? item.nama ?? "-",
    description: item.keterangan ?? item.deskripsi ?? "",
    urutan: item.urutan ?? 999,
  };
}

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

function WeightSummary({ analysis, criteriaList, indicatorList }) {
  const criteriaWeights = analysis?.criteriaWeights || {};
  const globalIndicatorWeights = analysis?.globalIndicatorWeights || {};

  const groupedData = criteriaList.map(criterion => {
    const indicatorsUnderCriteria = indicatorList.filter(
      ind => ind.criteriaCode === criterion.code
    );
    
    const sortedInds = [...indicatorsUnderCriteria].sort(
      (a, b) => Number(globalIndicatorWeights[b.code] || 0) - Number(globalIndicatorWeights[a.code] || 0)
    );

    const criterionWeightPercent = Number(criteriaWeights[criterion.code] || 0);

    return {
      criterion,
      weightPercent: criterionWeightPercent,
      indicators: sortedInds.map(ind => {
        const globalWeight = Number(globalIndicatorWeights[ind.code] || 0);
        const critFraction = criterionWeightPercent > 1 ? criterionWeightPercent / 100 : criterionWeightPercent;
        const localWeight = critFraction > 0 ? (globalWeight / critFraction) : 0;
        
        return {
          ...ind,
          globalWeight: globalWeight * 100,
          localWeight: localWeight * 100
        };
      })
    };
  });

  return (
    <Card className="p-5 border border-stone-200 bg-white rounded-3xl shadow-sm max-h-[50vh] overflow-y-auto">
      <h3 className="text-xs font-bold text-stone-900 mb-4 uppercase tracking-wider border-b border-stone-100 pb-2">
        Rincian Pembobotan AHP ({analysis?.mode === "custom-ahp" ? "Simulasi Saya" : "Pakar"})
      </h3>
      <div className="space-y-5">
        {groupedData.map(({ criterion, weightPercent, indicators }) => (
          <div key={criterion.id} className="space-y-2.5">
            <div className="flex justify-between items-center bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-100">
              <span className="text-xs font-extrabold text-[#1D3557]">{criterion.name}</span>
              <span className="text-xs font-mono font-black text-[#1D3557]">
                {(weightPercent > 1 ? weightPercent : weightPercent * 100).toFixed(1)}%
              </span>
            </div>
            
            <div className="pl-2 space-y-2">
              {indicators.map(ind => (
                <div key={ind.id} className="text-[11px] border-b border-stone-50 pb-1.5 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start text-stone-700">
                    <span className="font-semibold leading-tight pr-4">{ind.name}</span>
                    <span className="font-mono font-black text-stone-900 shrink-0">
                      Total: {ind.globalWeight.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-[10px] text-stone-400 mt-0.5">
                    Lokal: <span className="font-semibold text-stone-600">{ind.localWeight.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function PublicMapPage() {
  const [defaultGeojson, setDefaultGeojson] = useState(null);
  const [customGeojson, setCustomGeojson] = useState(null);
  const [mapMode, setMapMode] = useState("default"); // Defaults to "default" on refresh
  const [boundaryGeojson, setBoundaryGeojson] = useState(null);
  const [selectedGrid, setSelectedGrid] = useState(null);
  const [criteriaList, setCriteriaList] = useState([]);
  const [indicatorList, setIndicatorList] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadInitialMap = async () => {
    try {
      setLoading(true);
      const [defaultData, kriteriaData, indikatorData, boundary] = await Promise.all([
        mapService.getDefaultMap(), // Always load default database map as baseline
        kriteriaService.getAll(),
        indikatorService.getAll(),
        wlcService.getBoundary().catch(() => null),
      ]);
      
      const mappedKriteria = getArrayData(kriteriaData)
        .map(mapKriteriaItem)
        .filter((item) => item.id !== 6 && item.code !== "6")
        .sort((a, b) => a.urutan - b.urutan);

      const mappedIndikator = getArrayData(indikatorData)
        .map(mapIndikatorItem)
        .filter((item) => item.criteriaId !== 6 && item.criteriaCode !== "6")
        .sort((a, b) => a.urutan - b.urutan);

      setDefaultGeojson(defaultData);
      setCriteriaList(mappedKriteria);
      setIndicatorList(mappedIndikator);
      setBoundaryGeojson(boundary);

      // Check if custom weights exist in localStorage
      try {
        const rawValue = window.localStorage.getItem("coffee-location-active-ahp-weights");
        if (rawValue) {
          const customAhp = JSON.parse(rawValue);
          if (customAhp && customAhp.globalIndicatorWeights) {
            const weights = customAhp.globalIndicatorWeights;
            const customData = JSON.parse(JSON.stringify(defaultData));
            
            customData.features = customData.features.map((f) => {
              const scores = f.properties.indicatorScores || {};
              let scoreSum = 0;
              let weightSum = 0;
              
              for (const [indIdStr, weightVal] of Object.entries(weights)) {
                const indId = Number(indIdStr);
                const indKey = indicatorIdToKey[indId];
                if (!indKey) continue;
                
                const fuzzyVal = scores["fuzzy_" + indKey] ?? 0;
                scoreSum += fuzzyVal * weightVal;
                weightSum += weightVal;
              }
              
              const rawScore = weightSum > 0 ? scoreSum / weightSum : scoreSum;
              const isConstrained = scores.sawah === 0 || scores.sempadan_sungai === 0;
              const finalScore = isConstrained ? 0.0 : rawScore;
              
              f.properties.scoreUsed = finalScore;
              f.properties.isConstrained = isConstrained;
              return f;
            });

            // Extract valid scores for Jenks Breaks calculation
            const validScores = customData.features
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
            customData.features = customData.features.map((f) => {
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
            
            const total = customData.features.length;
            const sesuai = customData.features.filter(f => f.properties.suitabilityClass === "Sesuai").length;
            const cukupSesuai = customData.features.filter(f => f.properties.suitabilityClass === "Cukup Sesuai").length;
            const kurangSesuai = customData.features.filter(f => f.properties.suitabilityClass === "Kurang Sesuai").length;
            
            customData.summary = {
              total,
              sesuai,
              cukupSesuai,
              kurangSesuai,
              topGrid: [...customData.features].sort((a, b) => b.properties.scoreUsed - a.properties.scoreUsed)[0]?.properties || null
            };
            
            const criteriaWeights = {};
            if (customAhp.criteriaWeights) {
              Object.entries(customAhp.criteriaWeights).forEach(([k, v]) => {
                criteriaWeights[k] = v;
              });
            }

            customData.weightAnalysis = {
              mode: "custom-ahp",
              source: "Bobot AHP Kustom Pelaku Usaha (Browser)",
              criteriaWeights,
              globalIndicatorWeights: weights
            };
            
            setCustomGeojson(customData);
            
            // Clean localStorage immediately after setting state so a refresh clears the custom weights!
            window.localStorage.removeItem("coffee-location-active-ahp-weights");
          }
        }
      } catch (e) {
        console.error("Gagal kalkulasi kustom AHP pada client:", e);
      }
    } catch (err) {
      console.error("Gagal memuat peta publik:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialMap();
  }, []);

  const geojson = mapMode === "custom" && customGeojson ? customGeojson : defaultGeojson;

  return (
    <PublicLayout>
      <section className="mx-auto max-w-7xl px-4 py-6">
        <Card className="mb-5 p-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <Badge>Peta rekomendasi pelaku usaha</Badge>
              <h2 className="mt-3 text-2xl font-black text-stone-950">Peta Rekomendasi Lokasi Coffee Shop</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
                Menampilkan hasil evaluasi spasial WLC berbasis grid. Klik salah satu grid pada peta untuk meninjau
                detail skor dan kriteria di bawah peta.
              </p>

              {/* Toggle Buttons untuk perbandingan Peta */}
              {customGeojson && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-stone-50 p-2 border border-stone-200/50">
                  <span className="text-[10px] font-bold text-stone-500 px-2 uppercase tracking-wide">Mode Peta:</span>
                  <button
                    onClick={() => {
                      setMapMode("default");
                      setSelectedGrid(null);
                    }}
                    className={`rounded-xl px-4 py-1.5 text-xs font-bold transition active:scale-95 cursor-pointer ${
                      mapMode === "default"
                        ? "bg-[#1D3557] text-white shadow-sm"
                        : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    Bobot Default (Pakar)
                  </button>
                  <button
                    onClick={() => {
                      setMapMode("custom");
                      setSelectedGrid(null);
                    }}
                    className={`rounded-xl px-4 py-1.5 text-xs font-bold transition active:scale-95 cursor-pointer ${
                      mapMode === "custom"
                        ? "bg-[#577590] text-white shadow-sm"
                        : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    Bobot Simulasi Saya
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-3 grid-cols-2 md:grid-cols-4">
            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-xs text-stone-500">Total Grid</p>
              <p className="mt-1 text-sm font-bold text-stone-950">{geojson?.summary?.total ?? "-"}</p>
            </div>
            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-xs text-stone-500">Sesuai</p>
              <p className="mt-1 text-sm font-bold text-stone-950">{geojson?.summary?.sesuai ?? "-"}</p>
            </div>
            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-xs text-stone-500">Cukup Sesuai</p>
              <p className="mt-1 text-sm font-bold text-stone-950">{geojson?.summary?.cukupSesuai ?? "-"}</p>
            </div>
            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-xs text-stone-500">Kurang Sesuai</p>
              <p className="mt-1 text-sm font-bold text-stone-950">{geojson?.summary?.kurangSesuai ?? "-"}</p>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="flex h-[50vh] items-center justify-center rounded-3xl border border-stone-200 bg-white text-stone-500">
            Memuat peta rekomendasi spasial...
          </div>
        ) : !geojson ? (
          <div className="flex h-[50vh] items-center justify-center rounded-3xl border border-stone-200 bg-white text-stone-500">
            Peta belum tersedia. Silakan coba lagi nanti.
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
              <div className="space-y-3">
                <div className="h-[72vh] overflow-hidden rounded-3xl border border-stone-200 bg-white p-2 shadow-sm">
                  <MapView geojson={geojson} boundaryGeojson={boundaryGeojson} selectedGridCode={selectedGrid?.gridCode} onSelectGrid={setSelectedGrid} />
                </div>

                {!selectedGrid && (
                  <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-500">
                    Klik salah satu grid pada peta untuk menampilkan keterangan detail skor dan kriteria.
                  </div>
                )}
              </div>

              <aside className="space-y-4">
                <Card className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="rounded-2xl bg-green-100 p-2 text-green-700"><MapPinned size={18} /></span>
                    <div>
                      <h3 className="font-bold text-stone-950">Pembobotan Analisis</h3>
                      <p className="mt-2 text-sm leading-6 text-stone-500">
                        {geojson?.weightAnalysis?.mode === "custom-ahp"
                          ? "Peta memuat nilai pembobotan AHP kustom simulasi pelaku usaha yang Anda masukkan."
                          : "Peta memuat nilai pembobotan default AHP konsensus pakar dari database."}
                      </p>
                    </div>
                  </div>
                </Card>

                <WeightSummary
                  analysis={geojson?.weightAnalysis}
                  criteriaList={criteriaList}
                  indicatorList={indicatorList}
                />
                <Legend geojson={geojson} />
              </aside>
            </div>

            {/* Detail grid hanya muncul di bawah peta setelah salah satu grid diklik */}
            {selectedGrid && (
              <div className="mt-4">
                <GridDetailPanel selectedGrid={selectedGrid} />
              </div>
            )}
          </>
        )}
      </section>
    </PublicLayout>
  );
}