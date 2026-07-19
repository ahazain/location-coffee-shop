import { useEffect, useState, Fragment } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Folder,
  RefreshCcw,
  Sigma,
  TrendingDown,
  TrendingUp,
  Target,
  Save,
  X,
  Info,
  Sparkles,
} from "lucide-react";
import Card from "../components/common/Card";
import Toast from "../components/common/Toast";
import ConfirmationModal from "../components/common/ConfirmationModal";
import AdminLayout from "../layouts/AdminLayout";
import { fuzzyService } from "../services/api/fuzzyService";
import { indikatorService } from "../services/api/indikatorService";

// ============================================================
// HELPERS
// ============================================================

function fuzzyLabel(type) {
  if (type === "LINEAR") return "Linear";
  if (type === "linear_increasing" || type === "INCREASING") return "Linear Increasing (Benefit)";
  if (type === "linear_decreasing" || type === "DECREASING") return "Linear Decreasing (Cost)";
  if (type === "NEAR") return "Near (Optimum)";
  return type || "-";
}

function arahLabel(arah) {
  if (arah === "benefit" || arah === "INCREASING") return "Benefit";
  if (arah === "cost" || arah === "DECREASING") return "Cost";
  if (arah === "optimum" || arah === "NEAR") return "Optimum";
  return arah || "-";
}

function getIndikatorId(indikator) {
  if (!indikator) return null;
  return indikator.id || indikator.id_indikator;
}

function getKriteriaId(indikator) {
  if (!indikator) return 999;
  return (
    indikator.id_kriteria ||
    indikator.kriteria?.id_kriteria ||
    indikator.kriteria?.id ||
    999
  );
}

function getKriteriaName(indikator) {
  if (!indikator) return "Lainnya";
  return indikator.kriteria?.nama_kriteria || "Lainnya";
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  return Number(value).toFixed(4);
}

// Rekomendasi aturan fuzzy berdasarkan ID indikator
// NOTE: ID 4, 9, 10 adalah indikator jarak (DECREASING)
//       ID 12, 13 adalah indikator persaingan (NEAR)
function getRecommendedFuzzy(indicatorId) {
  // Indikator 4, 9, 10 → DECREASING (jarak)
  if ([4, 9, 10].includes(Number(indicatorId))) {
    return {
      fungsi_fuzzy: "DECREASING",
      note: "Rekomendasi: Cost (semakin kecil semakin baik)"
    };
  }
  // Indikator 12, 13 → NEAR (persaingan)
  if ([12, 13].includes(Number(indicatorId))) {
    return {
      fungsi_fuzzy: "NEAR",
      note: "Rekomendasi: Optimum (nilai ideal di sekitar midpoint)"
    };
  }
  // Default → INCREASING (semakin besar semakin baik)
  return {
    fungsi_fuzzy: "INCREASING",
    note: "Rekomendasi: Benefit (semakin besar semakin baik)"
  };
}

// ============================================================
// FUZZY RULE FORM MODAL
// ============================================================
function FuzzyRuleModal({ isOpen, onClose, indikator, existingRule, rasterInfo, onSave, isSaving }) {
  const [selectedFuzzy, setSelectedFuzzy] = useState(null);
  const [error, setError] = useState("");

  // Reset selection saat indikator berubah
  useEffect(() => {
    if (indikator) {
      setSelectedFuzzy(null);
      setError("");
    }
  }, [indikator]);

  if (!isOpen || !indikator) return null;

  const indicatorId = getIndikatorId(indikator);
  const recommended = getRecommendedFuzzy(indicatorId);
  const existingFuzzy = existingRule?.fungsi_fuzzy;

  function handleSelect(fuzzy) {
    setSelectedFuzzy(fuzzy);
    setError("");
  }

  function handleSubmit() {
    if (!selectedFuzzy) {
      setError("Pilih salah satu fungsi fuzzy terlebih dahulu.");
      return;
    }

    onSave({
      id_indikator: indicatorId,
      fungsi_fuzzy: selectedFuzzy,
    });
  }

  // Tampilkan info raster jika ada
  const hasRaster = rasterInfo && (rasterInfo.min_value !== null || rasterInfo.max_value !== null);
  const minVal = rasterInfo?.min_value;
  const maxVal = rasterInfo?.max_value;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-3xl border-b border-stone-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-[#1D3557]">Atur Arah Fuzzy</h2>
            <p className="text-xs text-stone-500 mt-0.5">{indikator.nama_indikator}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-stone-100 transition cursor-pointer"
          >
            <X size={20} className="text-stone-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Info Dataset */}
          {hasRaster ? (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Dataset Terdeteksi</p>
                  <p className="text-xs text-emerald-700 mt-1">
                    Min: <span className="font-bold">{formatValue(minVal)}</span> | Max: <span className="font-bold">{formatValue(maxVal)}</span>
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    Nilai min/max akan digunakan secara otomatis untuk normalisasi.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Dataset Belum Terdeteksi</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Upload dataset raster terlebih dahulu untuk melihat nilai min/max.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Rekomendasi Info */}
          <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
            <div className="flex items-start gap-3">
              <Info size={16} className="text-blue-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-800">{recommended.note}</p>
                <button
                  onClick={() => handleSelect(recommended.fungsi_fuzzy)}
                  className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles size={12} />
                  Gunakan Rekomendasi
                </button>
              </div>
            </div>
          </div>

          {/* Status Existing */}
          {existingFuzzy && existingFuzzy !== selectedFuzzy && (
            <div className="text-xs text-stone-500 italic">
              Aturan saat ini: <span className="font-semibold text-stone-700">{existingFuzzy}</span>
            </div>
          )}

          {/* Fuzzy Selection */}
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-3">
              Pilih Arah Fuzzy <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {/* INCREASING */}
              <button
                type="button"
                onClick={() => handleSelect("INCREASING")}
                className={`w-full p-4 rounded-xl border-2 transition flex items-center gap-4 cursor-pointer ${
                  selectedFuzzy === "INCREASING"
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-stone-200 hover:border-stone-300 bg-white"
                }`}
              >
                <div className={`rounded-xl p-2.5 ${selectedFuzzy === "INCREASING" ? "bg-emerald-100" : "bg-stone-100"}`}>
                  <TrendingUp size={22} className={selectedFuzzy === "INCREASING" ? "text-emerald-600" : "text-stone-500"} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-stone-800">Increasing (Benefit)</p>
                  <p className="text-xs text-stone-500 mt-0.5">Semakin besar nilai, semakin tinggi skor fuzzy</p>
                </div>
                {selectedFuzzy === "INCREASING" && <CheckCircle2 size={20} className="text-emerald-500" />}
              </button>

              {/* DECREASING */}
              <button
                type="button"
                onClick={() => handleSelect("DECREASING")}
                className={`w-full p-4 rounded-xl border-2 transition flex items-center gap-4 cursor-pointer ${
                  selectedFuzzy === "DECREASING"
                    ? "border-amber-500 bg-amber-50"
                    : "border-stone-200 hover:border-stone-300 bg-white"
                }`}
              >
                <div className={`rounded-xl p-2.5 ${selectedFuzzy === "DECREASING" ? "bg-amber-100" : "bg-stone-100"}`}>
                  <TrendingDown size={22} className={selectedFuzzy === "DECREASING" ? "text-amber-600" : "text-stone-500"} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-stone-800">Decreasing (Cost)</p>
                  <p className="text-xs text-stone-500 mt-0.5">Semakin kecil nilai, semakin tinggi skor fuzzy</p>
                </div>
                {selectedFuzzy === "DECREASING" && <CheckCircle2 size={20} className="text-amber-500" />}
              </button>

              {/* NEAR */}
              <button
                type="button"
                onClick={() => handleSelect("NEAR")}
                className={`w-full p-4 rounded-xl border-2 transition flex items-center gap-4 cursor-pointer ${
                  selectedFuzzy === "NEAR"
                    ? "border-blue-500 bg-blue-50"
                    : "border-stone-200 hover:border-stone-300 bg-white"
                }`}
              >
                <div className={`rounded-xl p-2.5 ${selectedFuzzy === "NEAR" ? "bg-blue-100" : "bg-stone-100"}`}>
                  <Target size={22} className={selectedFuzzy === "NEAR" ? "text-blue-600" : "text-stone-500"} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-stone-800">Near (Optimum)</p>
                  <p className="text-xs text-stone-500 mt-0.5">Nilai optimum di sekitar midpoint (min+max)/2</p>
                </div>
                {selectedFuzzy === "NEAR" && <CheckCircle2 size={20} className="text-blue-500" />}
              </button>
            </div>
          </div>

          {/* Info Proses */}
          <div className="rounded-xl bg-stone-50 border border-stone-100 p-4 text-xs text-stone-600">
            <p className="font-semibold text-stone-700 mb-1">ℹ️ Cara Kerja:</p>
            <ul className="space-y-1 ml-4 list-disc">
              <li><strong>Increasing:</strong> min/max dari dataset → normalisasi linear naik</li>
              <li><strong>Decreasing:</strong> min/max dari dataset → normalisasi linear turun</li>
              <li><strong>Near:</strong> midpoint = (min+max)/2, spread = 0.2 (otomatis)</li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-3 flex items-start gap-2">
              <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white rounded-b-3xl border-t border-stone-100 px-6 py-4 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving || !selectedFuzzy}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#1D3557] text-white text-sm font-bold hover:bg-[#2c4c78] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <RefreshCcw size={16} className="animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save size={16} />
                Simpan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function AdminFuzzyPage() {
  // ------------------------------------------------------------
  // STATE
  // ------------------------------------------------------------
  const [indikatorList, setIndikatorList] = useState([]);
  const [aturanMap, setAturanMap] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingAll, setLoadingAll] = useState(true);

  // Fuzzy Rule Modal State
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRuleIndikator, setEditingRuleIndikator] = useState(null);
  const [isSavingRule, setIsSavingRule] = useState(false);

  const [toast, setToast] = useState(null);
  const [modalConfig, setModalConfig] = useState(null);

  // ------------------------------------------------------------
  // DATA LOADING
  // ------------------------------------------------------------
  async function loadData() {
    try {
      setLoadingAll(true);

      const [indData, aturanData] = await Promise.all([
        indikatorService.getAll(),
        fuzzyService.getAllAturan(),
      ]);

      const map = {};
      aturanData.forEach((aturan) => {
        map[aturan.id_indikator] = aturan;
      });

      setIndikatorList(indData);
      setAturanMap(map);

      setSelectedId((currentSelectedId) => {
        const currentStillExist = indData.some(
          (ind) => getIndikatorId(ind) === currentSelectedId
        );

        if (currentSelectedId && currentStillExist) {
          return currentSelectedId;
        }

        const firstWithoutAturan = indData.find(
          (ind) => !map[getIndikatorId(ind)]
        );

        return getIndikatorId(firstWithoutAturan || indData[0]) || null;
      });
    } catch (err) {
      setToast({
        type: "error",
        message: `Gagal memuat data: ${err.message}`,
      });
    } finally {
      setLoadingAll(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // ------------------------------------------------------------
  // DERIVED DATA
  // ------------------------------------------------------------
  const selectedIndikator = indikatorList.find(
    (ind) => getIndikatorId(ind) === selectedId
  );

  const selectedAturan = selectedId ? aturanMap[selectedId] : null;

  const totalFuzzyInd = indikatorList.filter(
    (ind) => ind.tipe_nilai !== "MASK"
  ).length;

  const needsProcessCount = indikatorList.filter((ind) => {
    const isMask = ind.tipe_nilai === "MASK";
    if (isMask) return false;
    const hasRaw = ind.raster_layers?.some((r) => r.tipe_raster === "RAW");
    const hasRule = !!aturanMap[getIndikatorId(ind)];
    const hasFuzzy = ind.raster_layers?.some((r) => r.tipe_raster === "FUZZY");
    return hasRaw && hasRule && !hasFuzzy;
  }).length;

  const completedCount = indikatorList.filter((ind) => {
    const isMask = ind.tipe_nilai === "MASK";
    if (isMask) return false;
    const hasRaw = ind.raster_layers?.some((r) => r.tipe_raster === "RAW");
    const hasRule = !!aturanMap[getIndikatorId(ind)];
    const hasFuzzy = ind.raster_layers?.some((r) => r.tipe_raster === "FUZZY");
    return hasRaw && hasRule && hasFuzzy;
  }).length;

  const groupedIndikator = indikatorList.reduce((acc, indikator) => {
    const kriteriaId = getKriteriaId(indikator);
    const kriteriaName = getKriteriaName(indikator);

    if (!acc[kriteriaId]) {
      acc[kriteriaId] = {
        id: kriteriaId,
        nama: kriteriaName,
        items: [],
      };
    }

    acc[kriteriaId].items.push(indikator);
    return acc;
  }, {});

  const groups = Object.values(groupedIndikator)
    .sort((a, b) => a.id - b.id)
    .map((group) => ({
      ...group,
      items: group.items.sort((a, b) => (a.urutan || 0) - (b.urutan || 0)),
    }));

  // ------------------------------------------------------------
  // FUZZY RULE HANDLERS
  // ------------------------------------------------------------
  function handleOpenRuleModal(indikator) {
    const id = getIndikatorId(indikator);
    const existingRule = aturanMap[id] || null;
    const rawRaster = indikator.raster_layers?.find((r) => r.tipe_raster === "RAW");
    const rasterInfo = rawRaster ? {
      min_value: rawRaster.min_value,
      max_value: rawRaster.max_value,
    } : null;
    setEditingRuleIndikator({ ...indikator, existingRule, rasterInfo });
    setIsRuleModalOpen(true);
  }

  async function handleSaveRule(ruleData) {
    setIsSavingRule(true);
    try {
      await fuzzyService.saveAturan(ruleData);
      setToast({
        type: "success",
        message: "Aturan fuzzy berhasil disimpan.",
      });
      setIsRuleModalOpen(false);
      setEditingRuleIndikator(null);
      await loadData();
    } catch (err) {
      setToast({
        type: "error",
        message: err.message || "Gagal menyimpan aturan fuzzy.",
      });
    } finally {
      setIsSavingRule(false);
    }
  }

  // ------------------------------------------------------------
  // ACTIONS
  // ------------------------------------------------------------
  async function handleCalculate(id) {
    if (!id) return;

    const indikator = indikatorList.find(ind => getIndikatorId(ind) === id);
    const hasRaw = indikator?.raster_layers?.some((r) => r.tipe_raster === "RAW");

    if (!hasRaw) {
      setToast({
        type: "error",
        message: "Dataset raster belum diupload. Upload dataset terlebih dahulu.",
      });
      return;
    }

    if (!aturanMap[id]) {
      setToast({
        type: "error",
        message: "Arah fuzzy belum diset. Klik tombol Σ untuk mengatur arah fuzzy terlebih dahulu.",
      });
      return;
    }

    setIsProcessing(true);

    try {
      await fuzzyService.calculateByIndikator(id);
      setToast({
        type: "success",
        message: "Fuzzy indikator berhasil dihitung.",
      });
      await loadData();
      setSelectedId(id);
    } catch (err) {
      setToast({
        type: "error",
        message: err.message || "Gagal menghitung fuzzy indikator.",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  function handleOpenCalculateAllModal() {
    // Cek indikator yang belum siap
    const belumUpload = indikatorList.filter(ind => {
      if (ind.tipe_nilai === "MASK") return false;
      return !ind.raster_layers?.some((r) => r.tipe_raster === "RAW");
    });

    const belumAtur = indikatorList.filter(ind => {
      if (ind.tipe_nilai === "MASK") return false;
      const id = getIndikatorId(ind);
      return ind.raster_layers?.some((r) => r.tipe_raster === "RAW") && !aturanMap[id];
    });

    let message = "Apakah Anda yakin ingin menjalankan proses fuzzy untuk semua indikator yang sudah siap?";
    if (belumUpload.length > 0) {
      message = `${message}\n\n⚠️ ${belumUpload.length} indikator belum upload dataset.`;
    }
    if (belumAtur.length > 0) {
      message = `${message}\n⚠️ ${belumAtur.length} indikator belum atur arah fuzzy.`;
    }

    setModalConfig({
      isOpen: true,
      title: "Konfirmasi Hitung Semua Fuzzy",
      message: message,
      variant: "warning",
      onConfirm: executeCalculateAll,
    });
  }

  async function executeCalculateAll() {
    setModalConfig(null);
    setIsProcessing(true);

    try {
      const result = await fuzzyService.calculateAll();

      setToast({
        type: "success",
        message: `Semua indikator berhasil dihitung fuzzy. Total: ${result?.total_calculated || "-"
          }`,
      });

      await loadData();
    } catch (err) {
      setToast({
        type: "error",
        message: err.message || "Gagal menghitung semua fuzzy.",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ============================================================ */}
        {/* SUMMARY CARD */}
        {/* ============================================================ */}
        <Card className="p-8 border border-stone-200/60 shadow-xs rounded-3xl bg-white w-full">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="mt-3 text-xl font-black text-[#1D3557] tracking-wide">
                Proses Fuzzy
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-500">
                Jalankan proses fuzzifikasi untuk mengubah nilai indikator
                menjadi nilai terstandarisasi sebelum masuk ke perhitungan WLC.
              </p>
            </div>

             <div className="flex flex-wrap gap-4">
              <div className="rounded-2xl bg-stone-50 p-4 text-center border border-stone-100">
                <p className="text-2xl font-black text-[#1D3557]">
                  {totalFuzzyInd}
                </p>
                <p className="text-xs text-stone-500">Total Indikator</p>
              </div>

              <div
                className={`rounded-2xl p-4 text-center border transition ${
                  needsProcessCount > 0
                    ? "bg-blue-50 border-blue-100 text-blue-800 animate-pulse font-extrabold"
                    : "bg-stone-50 border-stone-100 text-stone-500"
                }`}
              >
                <p className="text-2xl font-black">{needsProcessCount}</p>
                <p className="text-xs">Siap Diproses</p>
              </div>

              <div
                className={`rounded-2xl p-4 text-center border transition ${
                  completedCount === totalFuzzyInd
                    ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                    : "bg-amber-50 border-amber-100 text-amber-800"
                }`}
              >
                <p className="text-2xl font-black">{completedCount}</p>
                <p className="text-xs">
                  {completedCount === totalFuzzyInd ? "Semua Selesai" : "Selesai"}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* ============================================================ */}
        {/* MAIN PROCESS FORM */}
        {/* ============================================================ */}
        <Card className="p-8 border border-stone-200/60 shadow-xs rounded-3xl bg-white w-full">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-blue-50 p-4 text-[#577590] border border-blue-100/50 shadow-xs">
                <Sigma className="h-7 w-7" />
              </div>

              <div>
                <h3 className="text-base font-extrabold text-[#1D3557] tracking-wide">
                  Form Kalkulasi Fuzzy
                </h3>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-stone-500">
                  Pilih indikator, cek aturan fuzzy, lalu jalankan proses
                  perhitungan. Tombol proses akan aktif jika indikator sudah
                  memiliki aturan fuzzy.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenCalculateAllModal}
              disabled={isProcessing || indikatorList.length === 0}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold uppercase tracking-wider shadow-md transition ${isProcessing || indikatorList.length === 0
                ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                : "bg-[#1D3557] text-white hover:bg-[#2c4c78] active:scale-95 cursor-pointer"
                }`}
            >
              <RefreshCcw size={16} />
              {isProcessing ? "Memproses..." : "Hitung Semua Fuzzy"}
            </button>
          </div>

          <div className="mt-6 rounded-3xl border border-stone-200/70 bg-stone-50/40 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Indikator Terpilih
                </p>
                <h3 className="mt-2 text-lg font-black text-[#1D3557]">
                  {selectedIndikator?.nama_indikator || "Belum ada indikator dipilih"}
                </h3>
                <p className="mt-1 text-xs font-medium text-stone-500">
                  Kriteria: {selectedIndikator?.kriteria?.nama_kriteria || "-"}
                </p>
                <p className="mt-2 text-xs leading-5 text-stone-400">
                  Klik salah satu baris pada tabel "Status Kesiapan Indikator" di bawah untuk memilih indikator lain.
                </p>
              </div>

              <span
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${selectedAturan
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  : "bg-amber-50 text-amber-700 border border-amber-100"
                  }`}
              >
                {selectedAturan ? (
                  <CheckCircle2 size={13} />
                ) : (
                  <AlertTriangle size={13} />
                )}
                {selectedAturan ? "Siap" : "Pending"}
              </span>
            </div>

            {selectedAturan ? (
              <>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-2xl bg-white p-4 border border-stone-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      Fungsi Fuzzy
                    </p>
                    <p className="mt-2 text-sm font-extrabold text-[#1D3557]">
                      {fuzzyLabel(selectedAturan.fungsi_fuzzy)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-4 border border-stone-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      Arah Preferensi
                    </p>
                    <p className="mt-2 text-sm font-extrabold text-[#1D3557]">
                      {arahLabel(
                        selectedAturan.arah || selectedIndikator?.arah_preferensi
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-4 border border-stone-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      Nilai Min
                    </p>
                    <p className="mt-2 text-sm font-extrabold text-[#1D3557]">
                      {formatValue(selectedAturan.nilai_min)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-4 border border-stone-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      Nilai Max
                    </p>
                    <p className="mt-2 text-sm font-extrabold text-[#1D3557]">
                      {formatValue(selectedAturan.nilai_max)}
                    </p>
                  </div>

                  {selectedAturan.midpoint !== null &&
                  selectedAturan.midpoint !== undefined && (
                    <div className="rounded-2xl bg-white p-4 border border-stone-100">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                        Midpoint
                      </p>
                      <p className="mt-2 text-sm font-extrabold text-[#1D3557]">
                        {formatValue(selectedAturan.midpoint)}
                      </p>
                    </div>
                  )}

                {selectedAturan.spread !== null &&
                  selectedAturan.spread !== undefined && (
                    <div className="rounded-2xl bg-white p-4 border border-stone-100">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                        Spread
                      </p>
                      <p className="mt-2 text-sm font-extrabold text-[#1D3557]">
                        {formatValue(selectedAturan.spread)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Tombol Edit Aturan */}
                {selectedIndikator && selectedIndikator.tipe_nilai !== "MASK" && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => handleOpenRuleModal(selectedIndikator)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#1D3557] px-4 py-2 text-xs font-bold text-white hover:bg-[#2c4c78] transition cursor-pointer"
                    >
                      <Sigma size={14} />
                      {selectedAturan ? "Edit Aturan Fuzzy" : "Tambah Aturan Fuzzy"}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 text-sm leading-6 text-amber-900">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                    <p>
                      Indikator ini belum memiliki aturan fuzzy di database.
                      Tambahkan aturan fuzzy terlebih dahulu agar tombol proses
                      dapat digunakan.
                    </p>
                  </div>
                </div>

                {/* Tombol Tambah Aturan */}
                {selectedIndikator && selectedIndikator.tipe_nilai !== "MASK" && (
                  <button
                    type="button"
                    onClick={() => handleOpenRuleModal(selectedIndikator)}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition cursor-pointer"
                  >
                    <Sigma size={14} />
                    Tambah Aturan Fuzzy
                  </button>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* ============================================================ */}
        {/* PENJELASAN GRAFIK FUZZY */}
        {/* ============================================================ */}
        <Card className="p-8 border border-stone-200/60 shadow-xs rounded-3xl bg-white w-full">
          <div>
            <h3 className="text-base font-extrabold text-[#1D3557] tracking-wide">
              Penjelasan 3 Jenis Fungsi Fuzzy
            </h3>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-500">
              Grafik berikut menunjukkan bagaimana derajat keanggotaan μ(x)
              dihitung dari nilai indikator (x) untuk setiap jenis fungsi
              fuzzy.
            </p>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {/* -------------------- BENEFIT (LINEAR INCREASING) -------------------- */}
            <div className="rounded-2xl border border-stone-100 bg-stone-50/40 p-4">
              <div className="flex items-center gap-2">
                <span className="rounded-xl bg-emerald-50 p-2 text-emerald-700 border border-emerald-100">
                  <TrendingUp size={16} />
                </span>
                <p className="text-sm font-extrabold text-[#1D3557]">
                  Benefit (Linear Increasing)
                </p>
              </div>

              <svg
                viewBox="0 0 220 150"
                className="mt-4 w-full"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* axes */}
                <line x1="30" y1="10" x2="30" y2="115" stroke="#d6d3d1" strokeWidth="1.5" />
                <line x1="30" y1="115" x2="205" y2="115" stroke="#d6d3d1" strokeWidth="1.5" />
                {/* fill under curve */}
                <polygon points="30,115 205,15 205,115" fill="#10b981" fillOpacity="0.12" />
                {/* curve */}
                <polyline points="30,115 205,15" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
                {/* labels */}
                <text x="14" y="18" fontSize="9" fill="#78716c">1</text>
                <text x="14" y="118" fontSize="9" fill="#78716c">0</text>
                <text x="26" y="128" fontSize="9" fill="#78716c">Min</text>
                <text x="188" y="128" fontSize="9" fill="#78716c">Max</text>
                <text x="95" y="140" fontSize="9" fill="#a8a29e">Nilai (x)</text>
              </svg>

              <p className="mt-2 text-xs leading-5 text-stone-500">
                Semakin besar nilai x, semakin tinggi derajat keanggotaannya.
                Cocok untuk indikator yang &ldquo;semakin besar semakin
                baik&rdquo;.
              </p>
            </div>

            {/* -------------------- COST (LINEAR DECREASING) -------------------- */}
            <div className="rounded-2xl border border-stone-100 bg-stone-50/40 p-4">
              <div className="flex items-center gap-2">
                <span className="rounded-xl bg-amber-50 p-2 text-amber-700 border border-amber-100">
                  <TrendingDown size={16} />
                </span>
                <p className="text-sm font-extrabold text-[#1D3557]">
                  Cost (Linear Decreasing)
                </p>
              </div>

              <svg
                viewBox="0 0 220 150"
                className="mt-4 w-full"
                xmlns="http://www.w3.org/2000/svg"
              >
                <line x1="30" y1="10" x2="30" y2="115" stroke="#d6d3d1" strokeWidth="1.5" />
                <line x1="30" y1="115" x2="205" y2="115" stroke="#d6d3d1" strokeWidth="1.5" />
                <polygon points="30,15 205,115 30,115" fill="#d97706" fillOpacity="0.12" />
                <polyline points="30,15 205,115" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" />
                <text x="14" y="18" fontSize="9" fill="#78716c">1</text>
                <text x="14" y="118" fontSize="9" fill="#78716c">0</text>
                <text x="26" y="128" fontSize="9" fill="#78716c">Min</text>
                <text x="188" y="128" fontSize="9" fill="#78716c">Max</text>
                <text x="95" y="140" fontSize="9" fill="#a8a29e">Nilai (x)</text>
              </svg>

              <p className="mt-2 text-xs leading-5 text-stone-500">
                Semakin kecil nilai x, semakin tinggi derajat keanggotaannya.
                Cocok untuk indikator yang &ldquo;semakin kecil semakin
                baik&rdquo;.
              </p>
            </div>

            {/* -------------------- OPTIMUM (NEAR) -------------------- */}
            <div className="rounded-2xl border border-stone-100 bg-stone-50/40 p-4">
              <div className="flex items-center gap-2">
                <span className="rounded-xl bg-blue-50 p-2 text-[#577590] border border-blue-100/50">
                  <Target size={16} />
                </span>
                <p className="text-sm font-extrabold text-[#1D3557]">
                  Optimum (Near)
                </p>
              </div>

              <svg
                viewBox="0 0 220 150"
                className="mt-4 w-full"
                xmlns="http://www.w3.org/2000/svg"
              >
                <line x1="30" y1="10" x2="30" y2="115" stroke="#d6d3d1" strokeWidth="1.5" />
                <line x1="30" y1="115" x2="205" y2="115" stroke="#d6d3d1" strokeWidth="1.5" />
                <polygon points="30,115 117,15 205,115" fill="#577590" fillOpacity="0.12" />
                <polyline points="30,115 117,15 205,115" fill="none" stroke="#1D3557" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="117" y1="15" x2="117" y2="115" stroke="#1D3557" strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />
                <text x="14" y="18" fontSize="9" fill="#78716c">1</text>
                <text x="14" y="118" fontSize="9" fill="#78716c">0</text>
                <text x="100" y="128" fontSize="9" fill="#78716c">Optimum</text>
                <text x="95" y="140" fontSize="9" fill="#a8a29e">Nilai (x)</text>
              </svg>

              <p className="mt-2 text-xs leading-5 text-stone-500">
                Derajat keanggotaan tertinggi saat nilai x mendekati titik
                optimum, dan menurun ke dua arah menjauhi titik tersebut.
              </p>
            </div>
          </div>
        </Card>

        {/* ============================================================ */}
        {/* STATUS LIST */}
        {/* ============================================================ */}
        <Card className="flex flex-col justify-between p-0 border border-stone-200/60 shadow-xs rounded-3xl bg-white w-full overflow-hidden">
          <div className="flex items-center justify-between border-b border-stone-100 px-6 py-5 bg-white">
            <div>
              <h2 className="text-[#1D3557] font-extrabold text-sm tracking-wide">
                Status Kesiapan Indikator
              </h2>
              <p className="mt-1 text-xs text-stone-500">
                Daftar indikator dikelompokkan berdasarkan kriteria.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-left text-xs">
              <colgroup>
                <col className="w-16" />
                <col className="w-[32%]" />
                <col className="w-[18%]" />
                <col className="w-[18%]" />
                <col className="w-20" />
                <col className="w-24" />
              </colgroup>

              <thead className="bg-[#f8fafc]/50 border-b border-stone-100 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                <tr>
                  <th className="px-6 py-4 text-center">NO</th>
                  <th className="px-6 py-4">INDIKATOR</th>
                  <th className="px-6 py-4">TIPE FUZZY</th>
                  <th className="px-6 py-4">STATUS</th>
                  <th className="px-6 py-4 text-center">ATURAN</th>
                  <th className="px-6 py-4 text-right">PROSES</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100">
                {loadingAll ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-12 text-center text-xs font-semibold text-stone-400 bg-white"
                    >
                      Memuat data...
                    </td>
                  </tr>
                ) : indikatorList.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-12 text-center text-xs font-semibold text-stone-400 bg-white"
                    >
                      Belum ada indikator terdaftar.
                    </td>
                  </tr>
                ) : (
                  groups.map((group) => (
                    <Fragment key={group.id}>
                      <tr className="bg-amber-50/15">
                        <td
                          colSpan="6"
                          className="px-6 py-3 text-xs font-bold text-amber-600 bg-amber-50/5 border-y border-stone-100/50"
                        >
                          <span className="flex items-center gap-2">
                            <Folder
                              size={14}
                              className="text-amber-500 fill-amber-100"
                            />
                            Kriteria: {group.nama}
                          </span>
                        </td>
                      </tr>

                      {group.items.map((indikator, index) => {
                        const id = getIndikatorId(indikator);
                        const aturan = aturanMap[id];
                        const rowNumber =
                          indikatorList.findIndex(
                            (item) => getIndikatorId(item) === id
                          ) + 1;

                        const isMask = indikator.tipe_nilai === "MASK";
                        const hasRaw = indikator.raster_layers?.some(
                          (r) => r.tipe_raster === "RAW"
                        );
                        const hasRule = !!aturan;
                        const hasFuzzy = indikator.raster_layers?.some(
                          (r) => r.tipe_raster === "FUZZY"
                        );
                        const needsProcessing = !isMask && hasRaw && hasRule && !hasFuzzy;
                        const canProcess = !isMask && hasRaw && hasRule && !isProcessing;

                        return (
                          <tr
                            key={id}
                            onClick={() => setSelectedId(id)}
                            className={`transition cursor-pointer ${selectedId === id
                              ? "bg-blue-50/40"
                              : "hover:bg-stone-50/40"
                              }`}
                          >
                            <td className="px-6 py-4 text-center font-semibold text-stone-400 font-mono">
                              {String(rowNumber || index + 1).padStart(2, "0")}
                            </td>

                            <td className="px-6 py-4 truncate">
                              <div className="flex items-center gap-2 truncate">
                                {needsProcessing && (
                                  <span
                                    className="h-2 w-2 rounded-full bg-blue-500 animate-ping shrink-0"
                                    title="Butuh kalkulasi/proses ulang"
                                  />
                                )}
                                <p className={`font-extrabold text-xs sm:text-sm truncate ${
                                  needsProcessing ? "text-blue-600" : "text-[#1D3557]"
                                }`}>
                                  {indikator.nama_indikator}
                                </p>
                              </div>
                            </td>

                            <td className="px-6 py-4 text-stone-500 font-semibold text-xs truncate">
                              {aturan
                                ? fuzzyLabel(aturan.fungsi_fuzzy)
                                : fuzzyLabel(indikator.fungsi_fuzzy)}
                            </td>

                            <td className="px-6 py-4">
                              {(() => {
                                if (isMask) {
                                  return (
                                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-600 border border-stone-200">
                                      <Database size={13} />
                                      Constraint
                                    </span>
                                  );
                                }

                                if (!hasRaw) {
                                  return (
                                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-stone-50 text-stone-400 border border-stone-200/50">
                                      <AlertTriangle size={13} />
                                      No Dataset
                                    </span>
                                  );
                                }

                                if (!hasRule) {
                                  return (
                                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                                      <AlertTriangle size={13} />
                                      No Rule
                                    </span>
                                  );
                                }

                                if (!hasFuzzy) {
                                  return (
                                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100 animate-pulse">
                                      <RefreshCcw size={13} className="animate-spin shrink-0" />
                                      Fuzzy Ulang
                                    </span>
                                  );
                                }

                                return (
                                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                                    <CheckCircle2 size={13} />
                                    Selesai
                                  </span>
                                );
                              })()}
                            </td>

                            {/* Kolom Aturan */}
                            <td className="px-6 py-4 text-center">
                              {!isMask && (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleOpenRuleModal(indikator);
                                  }}
                                  className="rounded-lg p-1.5 transition active:scale-90 text-stone-400 hover:text-[#1D3557] hover:bg-stone-100 cursor-pointer"
                                  title={aturan ? "Edit Aturan" : "Tambah Aturan"}
                                >
                                  <Sigma size={15} />
                                </button>
                              )}
                            </td>

                            <td className="px-6 py-4 text-right">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleCalculate(id);
                                }}
                                disabled={!canProcess}
                                className={`rounded-lg p-1.5 transition active:scale-90 ${!canProcess
                                  ? "text-stone-200 cursor-not-allowed"
                                  : "text-stone-400 hover:text-[#1D3557] hover:bg-stone-100 cursor-pointer"
                                  }`}
                                title={hasRaw ? "Hitung Fuzzy" : "Upload dataset terlebih dahulu"}
                              >
                                <RefreshCcw size={15} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* MODAL ATURAN FUZZY */}
      <FuzzyRuleModal
        isOpen={isRuleModalOpen}
        onClose={() => {
          setIsRuleModalOpen(false);
          setEditingRuleIndikator(null);
        }}
        indikator={editingRuleIndikator}
        existingRule={editingRuleIndikator?.existingRule}
        rasterInfo={editingRuleIndikator?.rasterInfo}
        onSave={handleSaveRule}
        isSaving={isSavingRule}
      />

      {/* MODAL KONFIRMASI */}
      {modalConfig && (
        <ConfirmationModal
          isOpen={modalConfig.isOpen}
          title={modalConfig.title}
          message={modalConfig.message}
          variant={modalConfig.variant}
          onConfirm={modalConfig.onConfirm}
          onCancel={() => setModalConfig(null)}
        />
      )}

      {/* TOAST NOTIFIKASI */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </AdminLayout>
  );
}