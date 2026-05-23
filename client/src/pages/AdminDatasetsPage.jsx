import { useEffect, useState } from "react";
import { CheckCircle2, Database, Info, RefreshCcw } from "lucide-react";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import DatasetTable from "../components/admin/DatasetTable";
import LayerUploadForm from "../components/admin/LayerUploadForm";
import AdminLayout from "../layouts/AdminLayout";
import { adminService } from "../services/adminService";

export default function AdminDatasetsPage() {
  const [data, setData] = useState(null);

  function loadData() {
    adminService.getDatasets().then(setData);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleUploadDataset(payload) {
    const result = await adminService.uploadDataset(payload);
    if (result.ok) loadData();
    return result;
  }

  return (
    <AdminLayout>
      <Card className="mb-5 p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <Badge>Step 1 — Input dataset</Badge>
            <h2 className="mt-3 text-2xl font-black text-stone-950">Upload data spasial yang sudah mengikuti grid</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-stone-500">
              Halaman ini dibuat sebagai pusat input dataset admin. Format yang diterima hanya GeoJSON karena data harus memiliki geometri spasial. Untuk titik kedai kopi existing, data baru ditambahkan ke layer kompetitor, bukan mengganti seluruh database.
            </p>
          </div>
          <Button as="link" to="/admin/fuzzy" variant="secondary"><RefreshCcw size={16} /> Lanjut ke fuzzy</Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-stone-50 p-4">
            <p className="text-xs text-stone-500">Versi aktif</p>
            <p className="mt-1 text-sm font-bold text-stone-950">{data?.datasetSummary.activeVersion || "-"}</p>
          </div>
          <div className="rounded-2xl bg-stone-50 p-4">
            <p className="text-xs text-stone-500">Wilayah studi</p>
            <p className="mt-1 text-sm font-bold text-stone-950">{data?.datasetSummary.areaStudy || "-"}</p>
          </div>
          <div className="rounded-2xl bg-stone-50 p-4">
            <p className="text-xs text-stone-500">Ukuran grid</p>
            <p className="mt-1 text-sm font-bold text-stone-950">{data?.datasetSummary.gridSize || "-"}</p>
          </div>
          <div className="rounded-2xl bg-stone-50 p-4">
            <p className="text-xs text-stone-500">CRS analisis</p>
            <p className="mt-1 text-sm font-bold text-stone-950">{data?.datasetSummary.coordinateSystem || "-"}</p>
          </div>
        </div>
      </Card>

      <div className="mb-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <LayerUploadForm
          layerOptions={data?.uploadLayerOptions || []}
          checklist={data?.datasetValidationChecklist || []}
          onUpload={handleUploadDataset}
        />

        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Info size={18} className="text-amber-800" />
              <h2 className="font-bold text-stone-950">Log proses admin</h2>
            </div>
            <div className="mt-4 space-y-3">
              {(data?.processingLogs || []).map((item) => (
                <div key={item.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-stone-900">{item.title}</p>
                      <p className="mt-1 text-xs text-stone-500">{item.time}</p>
                    </div>
                    <CheckCircle2 size={18} className="text-green-700" />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-stone-500">{item.detail}</p>
                  <Badge variant="green" className="mt-3">{item.status}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <span className="inline-flex rounded-2xl bg-amber-100 p-3 text-amber-800"><Database /></span>
            <h3 className="mt-4 font-bold text-stone-950">Kenapa upload tidak langsung mengganti semua?</h3>
            <p className="mt-2 text-sm leading-6 text-stone-500">
              Karena beberapa data bersifat bertambah, misalnya titik kedai kopi existing. Jika ada 3 kedai baru, sistem cukup menambahkan 3 titik itu ke layer kompetitor, lalu hanya indikator persaingan yang ditandai perlu fuzzy ulang. Dataset lain yang tidak berubah tetap digunakan.
            </p>
          </Card>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <DatasetTable layers={data?.datasetLayers || []} />

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Info size={18} className="text-amber-800" />
            <h2 className="font-bold text-stone-950">Riwayat Upload</h2>
          </div>
          <div className="mt-4 space-y-3">
            {(data?.uploadHistory || []).map((item) => (
              <div key={item.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-stone-900">{item.fileName}</p>
                    <p className="mt-1 text-xs text-stone-500">{item.uploadedAt} oleh {item.uploadedBy}</p>
                  </div>
                  <CheckCircle2 size={18} className="text-green-700" />
                </div>
                <Badge variant="green" className="mt-3">{item.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
