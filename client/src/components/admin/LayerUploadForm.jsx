import { useRef, useState, useEffect } from "react";
import { UploadCloud, FolderOpen, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Check } from "lucide-react";
import Button from "../common/Button";
import Card from "../common/Card";

export default function LayerUploadForm({ indicators, rastersMap = {}, onUpload, isUploadingExternal }) {
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const [selectedIndikatorId, setSelectedIndikatorId] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [feedback, setFeedback] = useState(null);
  
  // Custom dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (indicators.length > 0 && !selectedIndikatorId) {
      setSelectedIndikatorId(indicators[0].id.toString());
    }
  }, [indicators, selectedIndikatorId]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeIndikator = indicators.find(ind => ind.id.toString() === selectedIndikatorId);

  // Group indicators by criteria
  const grouped = indicators.reduce((acc, ind) => {
    const kId = ind.id_kriteria || (ind.kriteria?.id) || 999;
    const kName = ind.kriteria?.nama_kriteria || "Lainnya";
    if (!acc[kId]) {
      acc[kId] = { id: kId, nama: kName, items: [] };
    }
    acc[kId].items.push(ind);
    return acc;
  }, {});
  const groupedIndicators = Object.values(grouped).sort((a, b) => a.id - b.id);

  function handleChooseFile() {
    fileInputRef.current?.click();
  }

  const validateAndSetFile = (file) => {
    setFeedback(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }
    const ext = file.name.toLowerCase();
    if (!ext.endsWith(".tif") && !ext.endsWith(".tiff")) {
      setSelectedFile(null);
      setFeedback({ type: "error", text: "Format file tidak didukung. Harap pilih file GeoTIFF (.tif/.tiff)." });
      return;
    }
    setSelectedFile(file);
  };

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    validateAndSetFile(file);
  }

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  async function handleFormSubmit(event) {
    event.preventDefault();
    setFeedback(null);

    if (!selectedFile) {
      setFeedback({ type: "error", text: "Silakan pilih berkas terlebih dahulu." });
      return;
    }

    setIsUploading(true);
    try {
      await onUpload?.(Number(selectedIndikatorId), selectedFile);
      setFeedback({ type: "success", text: "File GeoTIFF berhasil diunggah!" });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setFeedback({ type: "error", text: err.message || "Upload gagal diproses." });
    } finally {
      setIsUploading(false);
    }
  }

  const loadingState = isUploading || isUploadingExternal;

  // Format bytes helper
  function formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 2;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  return (
    <Card className="p-8 border border-stone-200/60 shadow-xs rounded-3xl bg-white w-full">
      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* HEADER FORM */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3.5 text-[#577590] border border-blue-100/50 shadow-xs">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#1D3557] tracking-wide">Unggah Berkas Baru</h2>
            </div>
          </div>

          {/* CUSTOM INDICATOR DROPDOWN SELECT */}
          <div className="w-full sm:w-80 relative" ref={dropdownRef}>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1 text-left">Pilih Indikator</span>
            
            {activeIndikator ? (
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full rounded-2xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 px-4 py-3 flex items-center justify-between text-left outline-none transition focus:border-[#1D3557] focus:ring-4 focus:ring-blue-50/50 cursor-pointer shadow-xs"
              >
                <div className="min-w-0 leading-tight">
                  <span className="block text-[9px] font-semibold text-stone-400 font-mono truncate">{activeIndikator.kode_indikator}</span>
                  <span className="block text-xs font-bold text-stone-700 truncate">{activeIndikator.nama_indikator}</span>
                </div>
                {isDropdownOpen ? (
                  <ChevronUp size={16} className="text-stone-400 shrink-0 ml-2" />
                ) : (
                  <ChevronDown size={16} className="text-stone-400 shrink-0 ml-2" />
                )}
              </button>
            ) : (
              <div className="w-full rounded-2xl border border-stone-200 bg-stone-100 px-4 py-3 text-xs text-stone-400 font-medium">
                Indikator kosong
              </div>
            )}

            {/* DROPDOWN MENU */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-full sm:w-96 max-h-80 overflow-y-auto rounded-3xl border border-stone-200/80 bg-white p-3 shadow-xl z-50 animate-scaleUp">
                {groupedIndicators.map((group) => (
                  <div key={group.id} className="mb-3 last:mb-0">
                    {/* CRITERIA HEADER LIMITER */}
                    <div className="px-3 py-1.5 text-[9px] font-bold text-stone-400 tracking-widest uppercase border-b border-stone-50">
                      {group.nama}
                    </div>
                    {/* INDICATORS LIST */}
                    <div className="mt-1.5 space-y-1">
                      {group.items.map((ind) => {
                        const isSelected = ind.id.toString() === selectedIndikatorId;
                        return (
                          <button
                            key={ind.id}
                            type="button"
                            onClick={() => {
                              setSelectedIndikatorId(ind.id.toString());
                              setIsDropdownOpen(false);
                              setFeedback(null);
                            }}
                            className={`w-full rounded-2xl px-3 py-2.5 flex items-center justify-between transition text-left cursor-pointer ${
                              isSelected 
                                ? "bg-amber-50/50 border border-amber-200/50 shadow-xs" 
                                : "hover:bg-stone-50 border border-transparent"
                            }`}
                          >
                            <div className="min-w-0 leading-tight">
                              <span className="block text-[9px] font-semibold text-stone-400 font-mono truncate">{ind.kode_indikator}</span>
                              <span className="block text-xs font-bold text-stone-700 truncate">{ind.nama_indikator}</span>
                            </div>
                            {isSelected && (
                              <Check size={14} className="text-amber-700 shrink-0 ml-2" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* DROPZONE AREA */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`relative overflow-hidden rounded-3xl border-2 border-dashed p-10 text-center transition-all duration-300 ${
            isDragActive
              ? "border-[#577590] bg-blue-50/30 scale-[1.01] shadow-inner"
              : "border-stone-200 bg-stone-50/40 hover:border-[#577590] hover:bg-blue-50/10"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".tif,.tiff"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="rounded-2xl bg-blue-50 p-4 text-[#577590] border border-blue-100/50 shadow-xs">
              <UploadCloud className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <p className="font-extrabold text-[#1D3557] text-sm">
                Klik atau Seret Berkas ke Sini
              </p>
              <p className="text-[11px] text-stone-400 font-medium">
                Mendukung format .tif, .tiff (Maks. 100MB)
              </p>
            </div>
            
            <button
              type="button"
              disabled={loadingState}
              onClick={handleChooseFile}
              className="mt-2 inline-flex items-center justify-center rounded-2xl bg-[#1D3557] hover:bg-[#2c4c78] px-6 py-3 text-xs font-bold text-white shadow-md transition active:scale-95 cursor-pointer uppercase tracking-wider"
            >
              Pilih Berkas
            </button>
          </div>
        </div>

        {/* Selected File Badge */}
        {selectedFile && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 text-emerald-950 shadow-xs flex items-center justify-between gap-4 animate-fadeIn">
            <div className="min-w-0">
              <p className="font-bold text-stone-800 truncate text-xs">
                📄 {selectedFile.name} ({formatBytes(selectedFile.size)})
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="rounded-xl bg-white border border-stone-200 px-3 py-1.5 text-[10px] font-bold text-stone-500 hover:text-red-650 hover:bg-red-50 transition active:scale-95 cursor-pointer shadow-xs"
            >
              Batal
            </button>
          </div>
        )}

        {/* Feedback Messages */}
        {feedback && (
          <div className={`rounded-2xl border p-4 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn ${
            feedback.type === "success" 
              ? "border-emerald-100 bg-emerald-50/50 text-emerald-900" 
              : "border-red-100 bg-red-50/50 text-red-900"
          }`}>
            {feedback.type === "success" 
              ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              : <AlertCircle className="h-4 w-4 text-red-650 shrink-0" />
            }
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Submit action (only show if selectedFile exists) */}
        {selectedFile && (
          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              disabled={loadingState}
              className="px-6 py-3 text-xs font-bold uppercase tracking-wider transition bg-[#577590] hover:bg-[#1D3557] text-white rounded-2xl cursor-pointer"
            >
              {loadingState ? "Mengunggah..." : "Kirim GeoTIFF"}
            </Button>
          </div>
        )}
      </form>
    </Card>
  );
}
