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
import { wlcService } from "../services/api/wlcService";

function WeightSummary({ analysis, criteriaList }) {
  const criteriaWeights = analysis?.criteriaWeights || {};
  const sortedCriteria = [...criteriaList].sort(
    (a, b) => Number(criteriaWeights[b.kode_kriteria] || 0) - Number(criteriaWeights[a.kode_kriteria] || 0)
  );

  return (
    <Card className="p-4 bg-stone-50 border border-stone-200">
      <h3 className="text-xs font-semibold text-stone-600 mb-3 uppercase tracking-wider">Metrik Pembobotan AHP</h3>
      <div className="space-y-2">
        {sortedCriteria.map(item => {
          const value = Number(criteriaWeights[item.kode_kriteria] || 0);
          return (
            <div key={item.id} className="flex justify-between items-center text-xs">
              <span className="text-stone-600 font-medium">{item.nama_kriteria}</span>
              <span className="font-mono text-stone-900 font-bold">{value.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default function PublicMapPage() {
  const [geojson, setGeojson] = useState(null);
  const [boundaryGeojson, setBoundaryGeojson] = useState(null);
  const [selectedGrid, setSelectedGrid] = useState(null);
  const [criteriaList, setCriteriaList] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadInitialMap = async () => {
    try {
      setLoading(true);
      const [data, kriteria, boundary] = await Promise.all([
        mapService.getActiveMap(),
        kriteriaService.getAll(),
        wlcService.getBoundary().catch(() => null),
      ]);
      setGeojson(data);
      setCriteriaList(kriteria);
      setBoundaryGeojson(boundary);
      // Tidak auto-select grid teratas. Detail hanya muncul setelah user klik grid pada peta.
    } catch (err) {
      console.error("Gagal memuat peta publik:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialMap();
  }, []);

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
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-xs text-stone-500">Total Grid</p>
              <p className="mt-1 text-sm font-bold text-stone-950">{geojson?.summary?.total ?? "-"}</p>
            </div>
            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-xs text-stone-500">Direkomendasikan</p>
              <p className="mt-1 text-sm font-bold text-stone-950">{geojson?.summary?.recommended ?? "-"}</p>
            </div>
            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-xs text-stone-500">Rata-rata Skor</p>
              <p className="mt-1 text-sm font-bold text-stone-950">
                {geojson?.summary?.averageScore ? parseFloat(geojson.summary.averageScore).toFixed(3) : "-"}
              </p>
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
                        Peta memuat nilai pembobotan default AHP konsensus pakar dari database.
                      </p>
                    </div>
                  </div>
                </Card>

                <WeightSummary analysis={geojson?.weightAnalysis} criteriaList={criteriaList} />
                <Legend />
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