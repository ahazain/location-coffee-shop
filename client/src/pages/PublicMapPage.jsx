import { useEffect, useMemo, useState } from "react";
import { ArrowDownWideNarrow, BrainCircuit, MapPinned, RotateCcw, SlidersHorizontal } from "lucide-react";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import GridDetailPanel from "../components/map/GridDetailPanel";
import Legend from "../components/map/Legend";
import MapView from "../components/map/MapView";
import PublicLayout from "../layouts/PublicLayout";
import { mapService } from "../services/mapService";
import { weightService } from "../services/weightService";
import { kriteriaService } from "../services/api/kriteriaService";
import { getSuitabilityBadgeClass } from "../utils/mapStyle";

function WeightSummary({ analysis, criteriaList }) {
  const criteriaWeights = analysis?.criteriaWeights || {};
  const sortedCriteria = [...criteriaList].sort((a, b) => Number(criteriaWeights[b.kode_kriteria] || 0) - Number(criteriaWeights[a.kode_kriteria] || 0));

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <span className="rounded-2xl bg-amber-100 p-2 text-amber-800"><BrainCircuit size={18} /></span>
        <div>
          <p className="text-sm text-stone-500">Bobot yang digunakan</p>
          <h2 className="mt-1 text-xl font-bold text-stone-950">
            {analysis?.mode === "custom-ahp" ? "Bobot AHP Pelaku Usaha" : "Bobot Default AHP"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-500">{analysis?.source}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {sortedCriteria.map((item) => {
          const value = Number(criteriaWeights[item.kode_kriteria] || 0);

          return (
            <div key={item.id_kriteria}>
              <div className="mb-1 flex items-center justify-between gap-3 text-xs font-semibold text-stone-600">
                <span>{item.nama_kriteria}</span>
                <span>{value.toFixed(2)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                <div className="h-full rounded-full bg-amber-800" style={{ width: `${Math.min(value, 100)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default function PublicMapPage() {
  const [geojson, setGeojson] = useState(null);
  const [selectedGrid, setSelectedGrid] = useState(null);
  const [criteriaList, setCriteriaList] = useState([]);
  const [classFilter, setClassFilter] = useState("Semua");
  const [sortMode, setSortMode] = useState("score-desc");
  const [isLoading, setIsLoading] = useState(false);

  async function loadInitialMap() {
    setIsLoading(true);
    try {
      const [data, kriteria] = await Promise.all([
        mapService.getActiveMap(),
        kriteriaService.getAll(),
      ]);
      setGeojson(data);
      setCriteriaList(kriteria);
      if (data?.summary?.topGrid) {
        setSelectedGrid(data.summary.topGrid);
      }
    } catch (err) {
      console.error("Gagal memuat peta publik:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadInitialMap();
  }, []);

  async function resetDefault() {
    setIsLoading(true);
    await weightService.resetActiveWeights();
    const data = await mapService.getDefaultMap();
    setGeojson(data);
    if (data?.summary?.topGrid) {
      setSelectedGrid(data.summary.topGrid);
    }
    setIsLoading(false);
  }

  const gridRows = useMemo(() => {
    if (!geojson) return [];

    const rows = geojson.features
      .map((feature) => feature.properties)
      .filter((item) => classFilter === "Semua" || item.suitabilityClass === classFilter);

    return rows.sort((a, b) => {
      if (sortMode === "score-asc") return Number(a.scoreUsed || 0) - Number(b.scoreUsed || 0);
      return Number(b.scoreUsed || 0) - Number(a.scoreUsed || 0);
    });
  }, [geojson, classFilter, sortMode]);

  const classOptions = useMemo(() => {
    if (!geojson) return ["Semua"];

    return ["Semua", ...new Set(geojson.features.map((feature) => feature.properties.suitabilityClass))];
  }, [geojson]);

  return (
    <PublicLayout>
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-5 flex flex-col justify-between gap-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center">
          <div>
            <Badge>Peta rekomendasi pelaku usaha</Badge>
            <h1 className="mt-3 text-2xl font-black text-stone-950 md:text-3xl">Peta Rekomendasi Lokasi Coffee Shop</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-500">
              Menampilkan hasil evaluasi spasial WLC berbasis grid. Gunakan panel detail untuk meninjau status kriteria dan pembatas lahan.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[380px]">
            <div className="rounded-2xl bg-stone-50 p-3">
              <p className="text-xl font-black text-stone-950">{geojson?.summary?.total ?? "-"}</p>
              <p className="text-xs text-stone-500">Grid</p>
            </div>
            <div className="rounded-2xl bg-stone-50 p-3">
              <p className="text-xl font-black text-stone-950">{geojson?.summary?.recommended ?? "-"}</p>
              <p className="text-xs text-stone-500">Direkomendasikan</p>
            </div>
            <div className="rounded-2xl bg-stone-50 p-3">
              <p className="text-xl font-black text-stone-950">
                {geojson?.summary?.averageScore ? parseFloat(geojson.summary.averageScore).toFixed(3) : "-"}
              </p>
              <p className="text-xs text-stone-500">Rata-rata</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-4">
            <div className="h-[70vh] overflow-hidden rounded-3xl border border-stone-200 bg-white p-2 shadow-sm">
              <MapView geojson={geojson} selectedGridCode={selectedGrid?.gridCode} onSelectGrid={setSelectedGrid} />
            </div>

            <Card className="p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="font-bold text-stone-950">Ranking Grid Lokasi</h2>
                  <p className="mt-1 text-sm text-stone-500">Klik baris untuk menampilkan detail skor WLC pada panel kanan.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select value={classFilter} onChange={(event) => setClassFilter(event.target.value)} className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 outline-none focus:border-amber-700">
                    {classOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                  <select value={sortMode} onChange={(event) => setSortMode(event.target.value)} className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 outline-none focus:border-amber-700">
                    <option value="score-desc">Skor tertinggi</option>
                    <option value="score-asc">Skor terendah</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="text-xs uppercase tracking-wide text-stone-500">
                    <tr className="border-b border-stone-200">
                      <th className="py-3 pr-4">Grid</th>
                      <th className="py-3 pr-4">Kecamatan / Kelurahan</th>
                      <th className="py-3 pr-4">Kelas</th>
                      <th className="py-3 pr-4 text-right">Skor WLC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {gridRows.map((row) => (
                      <tr key={row.gridCode} onClick={() => setSelectedGrid(row)} className="cursor-pointer hover:bg-amber-50/60">
                        <td className="py-3 pr-4 font-bold text-stone-950">{row.gridCode}</td>
                        <td className="py-3 pr-4 text-stone-600">
                          {row.kecamatan && row.kelurahan ? `${row.kecamatan} / ${row.kelurahan}` : "Luar Wilayah"}
                        </td>
                        <td className="py-3 pr-4"><span className={`rounded-full border px-2 py-1 text-xs font-semibold ${getSuitabilityBadgeClass(row.suitabilityClass)}`}>{row.suitabilityClass}</span></td>
                        <td className="py-3 pr-4 text-right font-bold text-stone-950">{row.scoreUsed?.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <aside className="space-y-4">
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <span className="rounded-2xl bg-green-100 p-2 text-green-700"><MapPinned size={18} /></span>
                <div>
                  <h2 className="font-bold text-stone-950">Pembobotan Analisis</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-500">
                    Peta memuat nilai pembobotan default AHP konsensus pakar dari database.
                  </p>
                </div>
              </div>
            </Card>

            <WeightSummary analysis={geojson?.weightAnalysis} criteriaList={criteriaList} />
            <Legend />
            <GridDetailPanel selectedGrid={selectedGrid} />

            <Card className="p-4">
              <div className="flex items-center gap-2 font-semibold text-stone-900">
                <ArrowDownWideNarrow size={18} /> Kriteria Terdaftar
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {criteriaList.map((item) => (
                  <span key={item.id_kriteria} className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">{item.nama_kriteria}</span>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      </section>
    </PublicLayout>
  );
}
