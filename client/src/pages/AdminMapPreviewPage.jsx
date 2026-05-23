import { useEffect, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import GridDetailPanel from "../components/map/GridDetailPanel";
import Legend from "../components/map/Legend";
import MapView from "../components/map/MapView";
import AdminLayout from "../layouts/AdminLayout";
import { adminService } from "../services/adminService";

export default function AdminMapPreviewPage() {
  const [geojson, setGeojson] = useState(null);
  const [selectedGrid, setSelectedGrid] = useState(null);
  const [previewStatus, setPreviewStatus] = useState(null);
  const [publishStatus, setPublishStatus] = useState(null);
  const [canPublish, setCanPublish] = useState(false);
  const [message, setMessage] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);

  function loadPreview() {
    adminService.getMapPreview().then((data) => {
      setGeojson(data.map);
      setSelectedGrid(data.map.summary.topGrid);
      setPreviewStatus(data.previewStatus);
      setPublishStatus(data.publishStatus);
      setCanPublish(data.canPublish);
    });
  }

  useEffect(() => {
    loadPreview();
  }, []);

  async function handlePublish() {
    setMessage(null);
    setIsPublishing(true);
    const result = await adminService.publishMap();
    setIsPublishing(false);
    setMessage({ type: result.ok ? "success" : "error", text: result.message });
    loadPreview();
  }

  return (
    <AdminLayout>
      <Card className="mb-5 p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <Badge>Preview admin</Badge>
            <h2 className="mt-3 text-2xl font-black text-stone-950">Preview dan publish peta hasil WLC</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
              Admin meninjau hasil akhir setelah dataset, fuzzy, AHP default, dan WLC dijalankan. Jika sudah sesuai, hasil dapat dipublish sebagai peta default pelaku usaha.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button as="link" to="/peta-rekomendasi" variant="secondary">Lihat Halaman Publik</Button>
            <Button onClick={handlePublish} disabled={!canPublish || isPublishing}>
              <Send size={16} /> {isPublishing ? "Publishing..." : "Publish peta"}
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-stone-50 p-4">
            <p className="text-xs text-stone-500">Status WLC</p>
            <p className="mt-1 text-sm font-bold text-stone-950">{previewStatus?.statusLabel || "-"}</p>
          </div>
          <div className="rounded-2xl bg-stone-50 p-4">
            <p className="text-xs text-stone-500">Draft</p>
            <p className="mt-1 text-sm font-bold text-stone-950">{previewStatus?.draftVersion || "-"}</p>
          </div>
          <div className="rounded-2xl bg-stone-50 p-4">
            <p className="text-xs text-stone-500">Publish</p>
            <p className="mt-1 text-sm font-bold text-stone-950">{publishStatus?.statusLabel || "-"}</p>
          </div>
        </div>
      </Card>

      {message && (
        <div className={message.type === "success" ? "mb-5 rounded-3xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-800" : "mb-5 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"}>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>{message.text}</span>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="h-[72vh] overflow-hidden rounded-3xl border border-stone-200 bg-white p-2 shadow-sm">
          <MapView geojson={geojson} selectedGridCode={selectedGrid?.gridCode} onSelectGrid={setSelectedGrid} />
        </div>
        <aside className="space-y-4">
          <Card className="p-4">
            <h3 className="font-bold text-stone-950">Ringkasan peta</h3>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-stone-50 p-3">
                <p className="text-lg font-black text-stone-950">{geojson?.summary.total ?? "-"}</p>
                <p className="text-xs text-stone-500">Grid</p>
              </div>
              <div className="rounded-2xl bg-stone-50 p-3">
                <p className="text-lg font-black text-stone-950">{geojson?.summary.recommended ?? "-"}</p>
                <p className="text-xs text-stone-500">Rekom.</p>
              </div>
              <div className="rounded-2xl bg-stone-50 p-3">
                <p className="text-lg font-black text-stone-950">{geojson?.summary.averageScore ?? "-"}</p>
                <p className="text-xs text-stone-500">Rata-rata</p>
              </div>
            </div>
          </Card>
          <Legend />
          <GridDetailPanel selectedGrid={selectedGrid} />
        </aside>
      </div>
    </AdminLayout>
  );
}
