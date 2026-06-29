import { useEffect, useState } from "react";
import { CheckCircle2, Database, Info, RefreshCcw } from "lucide-react";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import DatasetTable from "../components/admin/DatasetTable";
import LayerUploadForm from "../components/admin/LayerUploadForm";
import AdminLayout from "../layouts/AdminLayout";
import { indikatorService } from "../services/api/indikatorService";
import { geotiffService } from "../services/api/geotiffService";

export default function AdminDatasetsPage() {
  const [indicators, setIndicators] = useState([]);
  const [rastersMap, setRastersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const list = await indikatorService.getAll();
      setIndicators(list);

      // Fetch all rasters for each indicator
      const map = {};
      await Promise.all(
        list.map(async (ind) => {
          try {
            const data = await geotiffService.listByIndikator(ind.id);
            map[ind.id] = data.rasters || [];
          } catch (e) {
            map[ind.id] = [];
          }
        })
      );
      setRastersMap(map);
    } catch (err) {
      setMessage({ type: "error", text: `Gagal memuat dataset: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  async function handleUploadDataset(idIndikator, file) {
    await geotiffService.uploadRaw(idIndikator, file);
    // Reload database datasets
    await loadData();
  }

  async function handleDeleteRaster(idRasterLayer) {
    if (!window.confirm("Apakah Anda yakin ingin menghapus file raster ini dari database?")) return;
    try {
      await geotiffService.deleteRaster(idRasterLayer);
      setMessage({ type: "success", text: "Raster layer berhasil dihapus." });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  }

  // Find active version of WLC or general stats
  const activeVersionsCount = Object.values(rastersMap).reduce((acc, currentList) => {
    const active = currentList.find(r => r.is_active);
    return acc + (active ? 1 : 0);
  }, 0);

  return (
    <AdminLayout>
      <Card className="mb-5 p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <Badge>Step 1 — Input Dataset</Badge>
            <h2 className="mt-3 text-2xl font-black text-stone-950">Upload & Kelola Dataset Spasial GeoTIFF</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-stone-500">
              Unggah dataset spasial raster (.tif) untuk masing-masing indikator. Sistem akan mengklasifikasikan GeoTIFF raw ini sebelum dilakukan normalisasi fuzzy.
            </p>
          </div>
          <Button as="link" to="/admin/fuzzy" variant="secondary"><RefreshCcw size={16} /> Lanjut ke Fuzzy</Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-stone-50 p-4">
            <p className="text-xs text-stone-500">Total File Aktif</p>
            <p className="mt-1 text-sm font-bold text-stone-950">{activeVersionsCount} File</p>
          </div>
          <div className="rounded-2xl bg-stone-50 p-4">
            <p className="text-xs text-stone-500">Kebutuhan CRS</p>
            <p className="mt-1 text-sm font-bold text-stone-950">EPSG:32749 (UTM 49S)</p>
          </div>
          <div className="rounded-2xl bg-stone-50 p-4">
            <p className="text-xs text-stone-500">Dimensi Target</p>
            <p className="mt-1 text-sm font-bold text-stone-950">29 x 33 pixels</p>
          </div>
          <div className="rounded-2xl bg-stone-50 p-4">
            <p className="text-xs text-stone-500">Total Indikator</p>
            <p className="mt-1 text-sm font-bold text-stone-950">{indicators.length} Indikator</p>
          </div>
        </div>
      </Card>

      {message && (
        <div className={`mb-4 rounded-xl p-4 text-sm ${
          message.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {message.text}
        </div>
      )}

      <div className="mb-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <LayerUploadForm
          indicators={indicators}
          onUpload={handleUploadDataset}
        />

        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Info size={18} className="text-amber-800" />
              <h2 className="font-bold text-stone-950">Informasi Metadata Spasial</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-stone-500">
              Setiap kali Anda mengunggah GeoTIFF, sistem backend akan membaca file secara real-time menggunakan pustaka geotiff-js untuk memverifikasi keabsahan bounding box (extent), nilai minimum/maksimum nilai piksel, serta CRS koordinat data.
            </p>
          </Card>

          <Card className="p-5">
            <span className="inline-flex rounded-2xl bg-amber-100 p-3 text-amber-800"><Database /></span>
            <h3 className="mt-4 font-bold text-stone-950">Kenapa Menggunakan Format GeoTIFF?</h3>
            <p className="mt-2 text-sm leading-6 text-stone-500">
              GeoTIFF adalah format standar industri GIS untuk merepresentasikan nilai continuous spasial (kepadatan, jarak, ketinggian) per sel grid pixel. File ini di-load langsung di backend demi efisiensi kalkulasi WLC.
            </p>
          </Card>
        </div>
      </div>

      <div className="grid gap-5">
        <DatasetTable 
          indicators={indicators} 
          rastersMap={rastersMap} 
          loading={loading}
          onDeleteRaster={handleDeleteRaster}
        />
      </div>
    </AdminLayout>
  );
}
