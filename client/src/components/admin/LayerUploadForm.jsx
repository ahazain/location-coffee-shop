import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileUp, MousePointerClick, UploadCloud } from "lucide-react";
import Badge from "../common/Badge";
import Button from "../common/Button";
import Card from "../common/Card";

function formatBytes(bytes = 0) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function isGeotiffFile(file) {
  const name = file?.name?.toLowerCase() || "";
  return name.endsWith(".tif") || name.endsWith(".tiff");
}

export default function LayerUploadForm({ indicators, onUpload }) {
  const fileInputRef = useRef(null);
  const [selectedIndikatorId, setSelectedIndikatorId] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState(null);

  // Initialize selected indicator when props are ready
  if (!selectedIndikatorId && indicators.length > 0) {
    setSelectedIndikatorId(indicators[0].id.toString());
  }

  function handleChooseFile() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    setMessage(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!isGeotiffFile(file)) {
      setSelectedFile(null);
      setMessage({ type: "error", text: "File ditolak. Format yang diterima hanya file raster .tif atau .tiff." });
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage(null);

    if (!selectedFile) {
      setMessage({ type: "error", text: "Pilih file GeoTIFF terlebih dahulu." });
      return;
    }

    if (!selectedIndikatorId) {
      setMessage({ type: "error", text: "Pilih indikator terlebih dahulu." });
      return;
    }

    setIsUploading(true);
    try {
      const result = await onUpload?.(Number(selectedIndikatorId), selectedFile);
      setMessage({ type: "success", text: "File GeoTIFF berhasil diunggah dan diverifikasi oleh server!" });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Upload gagal diproses." });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <span className="rounded-2xl bg-amber-100 p-3 text-amber-800"><FileUp /></span>
        <div>
          <Badge>Input Dataset Spasial</Badge>
          <h2 className="mt-2 text-xl font-black text-stone-950">Upload File Raster GeoTIFF (.tif / .tiff)</h2>
          <p className="mt-2 text-sm leading-6 text-stone-500">
            Unggah berkas raster mentah (raw) untuk memperbarui nilai parameter grid spasial pada indikator bersangkutan.
          </p>
        </div>
      </div>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-semibold text-stone-700">Pilih Indikator Penerima</span>
          <select
            value={selectedIndikatorId}
            onChange={(event) => {
              setSelectedIndikatorId(event.target.value);
              setMessage(null);
            }}
            className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-100"
          >
            <option value="" disabled>-- Pilih Indikator --</option>
            {indicators.map((ind) => (
              <option key={ind.id} value={ind.id}>{ind.kode_indikator} - {ind.nama_indikator}</option>
            ))}
          </select>
        </label>

        <input
          ref={fileInputRef}
          type="file"
          accept=".tif,.tiff"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          type="button"
          onClick={handleChooseFile}
          className="w-full rounded-3xl border-2 border-dashed border-amber-300 bg-amber-50/70 p-6 text-left transition hover:border-amber-700 hover:bg-amber-50"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <span className="rounded-2xl bg-white p-3 text-amber-800 shadow-sm"><UploadCloud /></span>
              <div>
                <p className="font-black text-stone-950">Klik untuk memilih file GeoTIFF dari komputer</p>
                <p className="mt-1 text-sm leading-6 text-stone-500">
                  Hanya file berakhiran .tif atau .tiff yang diterima untuk pemetaan raster spasial UTM Zone 49S.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-amber-800 shadow-sm">
              <MousePointerClick size={16} /> Pilih file
            </span>
          </div>
        </button>

        {selectedFile && (
          <div className="rounded-3xl border border-green-200 bg-green-50 p-4 text-green-900">
            <div className="flex items-start gap-3">
              <span className="rounded-2xl bg-white p-2 text-green-800 shadow-sm font-semibold">TIF</span>
              <div>
                <p className="font-bold">File dipilih: {selectedFile.name}</p>
                <p className="mt-1 text-sm">Ukuran: {formatBytes(selectedFile.size)} • Siap diunggah ke backend</p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-3xl bg-stone-50 p-4 text-sm text-stone-600">
          <p className="flex items-center gap-2 font-bold text-stone-950 mb-2">
            <CheckCircle2 size={16} className="text-green-700" /> Aturan Pengunggahan
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>File GeoTIFF harus sudah diproyeksikan ke EPSG:32749 (UTM Zone 49S).</li>
            <li>Dimensi grid ideal adalah 29 baris x 33 kolom untuk sinkronisasi WLC.</li>
            <li>Pastikan nodata value pada raster terset dengan benar (misal: -9999).</li>
          </ul>
        </div>

        {message && (
          <div className={message.type === "success" 
            ? "rounded-3xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-800" 
            : "rounded-3xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
          }>
            <div className="flex items-start gap-2">
              {message.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={isUploading || !selectedFile}>
            <UploadCloud size={16} /> {isUploading ? "Mengunggah..." : "Unggah GeoTIFF"}
          </Button>
          <Button as="link" to="/admin/fuzzy" variant="secondary">Buka Halaman Fuzzy</Button>
        </div>
      </form>
    </Card>
  );
}
