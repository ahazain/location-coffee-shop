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
  if (type === "linear_increasing") return "Benefit (Linear Increasing)";
  if (type === "linear_decreasing") return "Cost (Linear Decreasing)";
  if (type === "near") return "Optimum (Near)";
  return type || "-";
}

function arahLabel(arah) {
  if (arah === "benefit") return "Benefit";
  if (arah === "cost") return "Cost";
  if (arah === "optimum") return "Optimum";
  return arah || "-";
}

function getIndikatorId(indikator) {
  return indikator.id || indikator.id_indikator;
}

function getKriteriaId(indikator) {
  return (
    indikator.id_kriteria ||
    indikator.kriteria?.id_kriteria ||
    indikator.kriteria?.id ||
    999
  );
}

function getKriteriaName(indikator) {
  return indikator.kriteria?.nama_kriteria || "Lainnya";
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  return value;
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
  // ACTIONS
  // ------------------------------------------------------------
  async function handleCalculate(id) {
    if (!id) return;

    if (!aturanMap[id]) {
      setToast({
        type: "error",
        message:
          "Indikator ini belum memiliki aturan fuzzy. Tambahkan aturan fuzzy terlebih dahulu.",
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
    setModalConfig({
      isOpen: true,
      title: "Konfirmasi Hitung Semua Fuzzy",
      message:
        "Apakah Anda yakin ingin menjalankan proses fuzzy untuk semua indikator yang memiliki aturan fuzzy?",
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
            ) : (
              <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50/70 p-4 text-sm leading-6 text-amber-900">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                  <p>
                    Indikator ini belum memiliki aturan fuzzy di database.
                    Tambahkan aturan fuzzy terlebih dahulu agar tombol proses
                    dapat digunakan.
                  </p>
                </div>
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
                <col className="w-[38%]" />
                <col className="w-[22%]" />
                <col className="w-[20%]" />
                <col className="w-24" />
              </colgroup>

              <thead className="bg-[#f8fafc]/50 border-b border-stone-100 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                <tr>
                  <th className="px-6 py-4 text-center">NO</th>
                  <th className="px-6 py-4">INDIKATOR</th>
                  <th className="px-6 py-4">TIPE FUZZY</th>
                  <th className="px-6 py-4">STATUS</th>
                  <th className="px-6 py-4 text-right">PROSES</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100">
                {loadingAll ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-12 text-center text-xs font-semibold text-stone-400 bg-white"
                    >
                      Memuat data...
                    </td>
                  </tr>
                ) : indikatorList.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
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
                          colSpan="5"
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
                                <Sigma size={15} />
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