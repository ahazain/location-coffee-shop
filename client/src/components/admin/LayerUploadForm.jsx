import { useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileJson, FileUp, MousePointerClick, UploadCloud } from "lucide-react";
import { indicators } from "../../data/indicators";
import Badge from "../common/Badge";
import Button from "../common/Button";
import Card from "../common/Card";

function formatBytes(bytes = 0) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getIndicatorName(code) {
  return indicators.find((indicator) => indicator.code === code)?.name || code;
}

function isGeoJsonFile(file) {
  const name = file?.name?.toLowerCase() || "";
  return name.endsWith(".geojson") || name.endsWith(".json");
}

export default function LayerUploadForm({ layerOptions, checklist, onUpload }) {
  const fileInputRef = useRef(null);
  const [selectedLayerId, setSelectedLayerId] = useState(layerOptions[0]?.id || "");
  const [selectedFile, setSelectedFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState(null);

  const selectedLayer = useMemo(
    () => layerOptions.find((layer) => layer.id === selectedLayerId) || layerOptions[0],
    [layerOptions, selectedLayerId],
  );

  function resetFeedback() {
    setMessage(null);
  }

  function handleChooseFile() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    resetFeedback();

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!isGeoJsonFile(file)) {
      setSelectedFile(null);
      setMessage({ type: "error", text: "File ditolak. Format yang diterima hanya .geojson atau .json berisi GeoJSON." });
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    resetFeedback();

    if (!selectedFile) {
      setMessage({ type: "error", text: "Pilih file GeoJSON terlebih dahulu." });
      return;
    }

    setIsUploading(true);
    const result = await onUpload?.({ layerId: selectedLayerId, file: selectedFile, notes });
    setIsUploading(false);

    if (!result?.ok) {
      setMessage({ type: "error", text: result?.message || "Upload gagal diproses." });
      return;
    }

    setMessage({ type: "success", text: result.message });
    setSelectedFile(null);
    setNotes("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <span className="rounded-2xl bg-amber-100 p-3 text-amber-800"><FileUp /></span>
        <div>
          <Badge>Input dataset GeoJSON</Badge>
          <h2 className="mt-2 text-xl font-black text-stone-950">Upload layer spasial untuk memperbarui indikator</h2>
          <p className="mt-2 text-sm leading-6 text-stone-500">
            Form ini sudah bisa membuka file manager, membaca file GeoJSON, memvalidasi FeatureCollection, lalu menyimpan perubahan ke mock backend browser. Nanti fungsi ini tinggal diganti menjadi request API.
          </p>
        </div>
      </div>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-semibold text-stone-700">Jenis layer yang diperbarui</span>
          <select
            value={selectedLayerId}
            onChange={(event) => {
              setSelectedLayerId(event.target.value);
              resetFeedback();
            }}
            className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-100"
          >
            {layerOptions.map((layer) => (
              <option key={layer.id} value={layer.id}>{layer.label}</option>
            ))}
          </select>
        </label>

        {selectedLayer && (
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Cara update</p>
              <h3 className="mt-2 font-black text-stone-950">{selectedLayer.uploadMode}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-500">{selectedLayer.description}</p>
            </div>
            <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Format dan geometri</p>
              <h3 className="mt-2 font-black text-stone-950">GeoJSON saja</h3>
              <p className="mt-2 text-sm leading-6 text-stone-500">{selectedLayer.allowedGeometry}</p>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".geojson,.json,application/geo+json,application/json"
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
                <p className="font-black text-stone-950">Klik untuk memilih file GeoJSON dari laptop</p>
                <p className="mt-1 text-sm leading-6 text-stone-500">
                  CSV/XLSX tidak diterima karena belum tentu membawa geometri spasial. Upload file .geojson atau .json FeatureCollection.
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
              <FileJson className="mt-1" size={20} />
              <div>
                <p className="font-bold">File dipilih: {selectedFile.name}</p>
                <p className="mt-1 text-sm">Ukuran: {formatBytes(selectedFile.size)} • Siap divalidasi sebagai GeoJSON FeatureCollection</p>
              </div>
            </div>
          </div>
        )}

        <label className="block">
          <span className="text-sm font-semibold text-stone-700">Catatan admin</span>
          <input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="misal: tambahan 3 titik kedai kopi baru dari survei lapangan"
            className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-100"
          />
        </label>

        <div className="rounded-3xl border border-stone-200 p-4">
          <p className="text-sm font-bold text-stone-950">Indikator yang akan ditandai perlu fuzzy ulang</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(selectedLayer?.affectedIndicators || []).map((code) => (
              <Badge key={code}>{code === "constraint_mask" ? "Constraint mask" : getIndicatorName(code)}</Badge>
            ))}
          </div>
          <p className="mt-3 text-sm leading-6 text-stone-500">{selectedLayer?.gridRequirement}</p>
        </div>

        <div className="rounded-3xl bg-stone-50 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-stone-950"><CheckCircle2 size={16} /> Validasi yang dilakukan</p>
          <div className="mt-3 grid gap-2 text-sm text-stone-600">
            {checklist.map((item) => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-green-700" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {message && (
          <div className={message.type === "success" ? "rounded-3xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-800" : "rounded-3xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"}>
            <div className="flex items-start gap-2">
              {message.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={isUploading || !selectedFile}>
            <UploadCloud size={16} /> {isUploading ? "Memproses GeoJSON..." : "Upload dan tandai indikator"}
          </Button>
          <Button as="link" to="/admin/fuzzy" variant="secondary">Buka halaman fuzzy</Button>
        </div>
      </form>
    </Card>
  );
}
