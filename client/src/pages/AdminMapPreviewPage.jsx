import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import GridDetailPanel from "../components/map/GridDetailPanel";
import Legend from "../components/map/Legend";
import MapView from "../components/map/MapView";
import AdminLayout from "../layouts/AdminLayout";
import { wlcService } from "../services/api/wlcService";

export default function AdminMapPreviewPage() {
  const [geojson, setGeojson] = useState(null);
  const [selectedGrid, setSelectedGrid] = useState(null);
  const [activeWlc, setActiveWlc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const loadPreview = async () => {
    try {
      setLoading(true);
      const active = await wlcService.getActive().catch(() => null);
      const grids = await wlcService.getGrids().catch(() => null);

      if (grids && grids.features) {
        // Map scoreDefault to scoreUsed for compatibility with MapView and GridDetailPanel
        grids.features = grids.features.map((f) => {
          f.properties.scoreUsed = f.properties.scoreDefault;
          return f;
        });

        // Compute summary values
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

        setGeojson(grids);
        if (grids.summary.topGrid) {
          setSelectedGrid(grids.summary.topGrid);
        }
      }
      setActiveWlc(active);
    } catch (err) {
      setMessage({ type: "error", text: `Gagal memuat preview: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreview();
  }, []);

  return (
    <AdminLayout>
      <Card className="mb-5 p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <Badge>Preview Peta WLC</Badge>
            <h2 className="mt-3 text-2xl font-black text-stone-950">Hasil Spasial Rekomendasi Lokasi</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
              Admin meninjau hasil akhir peta kesesuaian lahan secara spasial. Peta ini bersumber langsung dari layer grid GIS database.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button as="link" to="/peta-rekomendasi" variant="secondary">Lihat Halaman Publik</Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-stone-50 p-4">
            <p className="text-xs text-stone-500">Status Output WLC</p>
            <p className="mt-1 text-sm font-bold text-stone-950">
              {activeWlc ? "Dihasilkan & Aktif" : "Belum Tersedia"}
            </p>
          </div>
          <div className="rounded-2xl bg-stone-50 p-4">
            <p className="text-xs text-stone-500">Versi Raster Layer</p>
            <p className="mt-1 text-sm font-bold text-stone-950">
              {activeWlc ? `Versi ${activeWlc.versi}` : "-"}
            </p>
          </div>
          <div className="rounded-2xl bg-stone-50 p-4">
            <p className="text-xs text-stone-500">Tanggal Kalkulasi</p>
            <p className="mt-1 text-sm font-bold text-stone-950">
              {activeWlc ? new Date(activeWlc.created_at).toLocaleString("id-ID") : "-"}
            </p>
          </div>
        </div>
      </Card>

      {message && (
        <div className={message.type === "success" 
          ? "mb-5 rounded-3xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-800" 
          : "mb-5 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
        }>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="h-[50vh] flex items-center justify-center text-stone-500 bg-white rounded-3xl border border-stone-200">
          Memproses peta rekomendasi spasial...
        </div>
      ) : !geojson ? (
        <div className="h-[50vh] flex items-center justify-center text-stone-500 bg-white rounded-3xl border border-stone-200">
          Belum ada data WLC yang dihitung. Silakan jalankan kalkulasi WLC terlebih dahulu.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="h-[72vh] overflow-hidden rounded-3xl border border-stone-200 bg-white p-2 shadow-sm">
            <MapView geojson={geojson} selectedGridCode={selectedGrid?.gridCode} onSelectGrid={setSelectedGrid} />
          </div>
          <aside className="space-y-4">
            <Card className="p-4">
              <h3 className="font-bold text-stone-950">Ringkasan Peta</h3>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-stone-50 p-3">
                  <p className="text-lg font-black text-stone-950">{geojson?.summary.total ?? "-"}</p>
                  <p className="text-xs text-stone-500">Total Grid</p>
                </div>
                <div className="rounded-2xl bg-stone-50 p-3">
                  <p className="text-lg font-black text-stone-950">{geojson?.summary.recommended ?? "-"}</p>
                  <p className="text-xs text-stone-500">Rekom.</p>
                </div>
                <div className="rounded-2xl bg-stone-50 p-3">
                  <p className="text-lg font-black text-stone-950">
                    {geojson ? parseFloat(geojson.summary.averageScore).toFixed(3) : "-"}
                  </p>
                  <p className="text-xs text-stone-500">Rata-rata</p>
                </div>
              </div>
            </Card>
            <Legend />
            <GridDetailPanel selectedGrid={selectedGrid} />
          </aside>
        </div>
      )}
    </AdminLayout>
  );
}
