import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Calculator, CheckCircle2, RefreshCcw } from "lucide-react";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import Toast from "../components/common/Toast";
import ConfirmationModal from "../components/common/ConfirmationModal";
import AdminLayout from "../layouts/AdminLayout";
import { wlcService } from "../services/api/wlcService";
import { ahpService } from "../services/api/ahpService";
import { indikatorService } from "../services/api/indikatorService";

export default function AdminWlcPage() {
  const [activeWlc, setActiveWlc] = useState(null);
  const [grids, setGrids] = useState(null);
  const [konsensus, setKonsensus] = useState(null);
  const [indikatorList, setIndikatorList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [sortDirection, setSortDirection] = useState("desc"); // "desc" = tertinggi dulu, "asc" = terendah dulu

  // UI States (disamakan dengan AdminDatasetsPage)
  const [toast, setToast] = useState(null);
  const [modalConfig, setModalConfig] = useState(null); // { isOpen, title, message, onConfirm, variant }

  const loadData = async () => {
    try {
      setLoading(true);
      const [wlcData, gridData, ahpData, indData] = await Promise.all([
        wlcService.getActive().catch(() => null), // If not run yet, returns null
        wlcService.getGrids().catch(() => null),  // If not run yet, returns null
        ahpService.getBobotKonsensus().catch(() => null),
        indikatorService.getAll(),
      ]);
      setActiveWlc(wlcData);
      setGrids(gridData);
      setKonsensus(ahpData);
      setIndikatorList(indData);
    } catch (err) {
      setToast({ type: "error", message: `Gagal memuat data: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const classRows = useMemo(() => {
    if (!grids?.features) return [];

    const count = grids.features.reduce((accumulator, feature) => {
      const className = feature.properties.suitabilityClass || "Tidak Diketahui";
      accumulator[className] = (accumulator[className] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(count).map(([className, total]) => ({ className, total }));
  }, [grids]);

  const topGrid = useMemo(() => {
    if (!grids?.features || grids.features.length === 0) return null;
    // Find the feature with the highest scoreDefault
    return [...grids.features].sort((a, b) => b.properties.scoreDefault - a.properties.scoreDefault)[0];
  }, [grids]);

  const breakdown = useMemo(() => {
    if (!topGrid || !konsensus?.bobot_indikator) return [];

    const scores = topGrid.properties.indicatorScores || {};

    const rows = konsensus.bobot_indikator.map((bobotInd) => {
      const rawVal = scores[bobotInd.kode] ?? 0;

      // Ambil nama indikator dari daftar indikator (indikatorList) berdasarkan kode,
      // fallback ke nama yang mungkin sudah ada di data konsensus.
      const matchedIndikator = indikatorList.find(
        (ind) => ind.kode_indikator === bobotInd.kode || ind.kode === bobotInd.kode
      );
      const indicatorName =
        matchedIndikator?.nama_indikator ||
        matchedIndikator?.nama ||
        bobotInd.name ||
        bobotInd.kode;

      return {
        indicatorCode: bobotInd.kode,
        indicatorName,
        rawValue: rawVal,
        weight: bobotInd.bobot_akhir,
        contribution: rawVal * bobotInd.bobot_akhir,
      };
    });

    // Urutkan berdasarkan nilai asli spasial (skor), sesuai arah yang dipilih pengguna.
    return rows.sort((a, b) =>
      sortDirection === "desc" ? b.rawValue - a.rawValue : a.rawValue - b.rawValue
    );
  }, [topGrid, konsensus, indikatorList, sortDirection]);

  // Klik tombol "Hitung WLC Ulang" -> tampilkan modal konfirmasi dulu
  function handleRunWlcClick() {
    setModalConfig({
      isOpen: true,
      title: "Konfirmasi Kalkulasi WLC",
      message: activeWlc
        ? "Apakah Anda yakin ingin menghitung ulang WLC? Hasil versi sebelumnya akan digantikan dengan versi baru berdasarkan data fuzzy dan bobot AHP terkini."
        : "Apakah Anda yakin ingin menjalankan kalkulasi WLC untuk pertama kali berdasarkan data fuzzy dan bobot AHP saat ini?",
      variant: "warning",
      onConfirm: executeRunWlc,
    });
  }

  // Eksekusi kalkulasi WLC setelah konfirmasi
  async function executeRunWlc() {
    setModalConfig(null);
    setIsRunning(true);
    try {
      await wlcService.calculate();
      setToast({ type: "success", message: "Successfully toasted! (Kalkulasi WLC berhasil dijalankan dan disimpan)" });
      await loadData();
    } catch (err) {
      setToast({ type: "error", message: err.message || "Gagal menjalankan kalkulasi WLC." });
    } finally {
      setIsRunning(false);
    }
  }

  // WLC is ready to run if we have consensus weight and active raster layers for fuzzying
  const canRun = useMemo(() => {
    return konsensus?.bobot_indikator?.length > 0;
  }, [konsensus]);

  const totalGridRecommended = useMemo(() => {
    if (!grids?.features) return 0;
    return grids.features.filter(f => f.properties.suitabilityClass === "Sesuai").length;
  }, [grids]);

  return (
    <AdminLayout>
      <Card className="mb-5 p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <Badge>Step 3 — Hitung WLC</Badge>
            <h2 className="mt-3 text-2xl font-black text-stone-950">Hitung Skor Kesesuaian Lahan (WLC)</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-500">
              Kalkulasi Weighted Linear Combination (WLC) menggabungkan bobot konsensus AHP dengan nilai normalisasi fuzzy pada grid spasial untuk menghasilkan kelas kesesuaian.
            </p>
          </div>
          <div className={canRun ? "rounded-3xl bg-green-50 p-4 text-green-800" : "rounded-3xl bg-amber-50 p-4 text-amber-900"}>
            <div className="flex items-center gap-2 font-bold">
              {canRun ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              {canRun ? "Siap menjalankan WLC" : "AHP Belum Lengkap"}
            </div>
            <p className="mt-1 text-xs">
              {canRun ? "Bobot kriteria & indikator tersedia" : "Harap selesaikan pembobotan AHP terlebih dahulu"}
            </p>
          </div>
        </div>
      </Card>

      <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_420px]">
        <Card className="p-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div>
              <Badge variant={activeWlc ? "green" : "amber"}>
                {activeWlc ? "WLC Aktif Tersedia" : "Belum Dihitung"}
              </Badge>
              <h2 className="mt-3 text-xl font-black text-stone-950">Kesiapan Kalkulasi WLC</h2>
              <p className="mt-2 text-sm leading-6 text-stone-500">
                {activeWlc
                  ? `Hasil WLC terakhir aktif sejak ${new Date(activeWlc.created_at).toLocaleString("id-ID")}`
                  : "Silakan tekan tombol kalkulasi untuk memproses skor kesesuaian grid berdasarkan data spasial terbaru."}
              </p>
            </div>
            <Button onClick={handleRunWlcClick} disabled={!canRun || isRunning}>
              <RefreshCcw size={16} /> {isRunning ? "Menghitung..." : "Hitung WLC Ulang"}
            </Button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-3xl bg-stone-50 p-4">
              <p className="text-xs text-stone-500">Resolution CRS</p>
              <p className="mt-2 text-sm font-semibold text-stone-900">{activeWlc?.crs || "-"}</p>
            </div>
            <div className="rounded-3xl bg-stone-50 p-4">
              <p className="text-xs text-stone-500">Grid Dimensi</p>
              <p className="mt-2 text-sm font-semibold text-stone-900">
                {activeWlc ? `${activeWlc.width} x ${activeWlc.height} px` : "-"}
              </p>
            </div>
            <div className="rounded-3xl bg-stone-50 p-4">
              <p className="text-xs text-stone-500">Total Pixel/Grid</p>
              <p className="mt-2 text-sm font-semibold text-stone-900">{activeWlc?.jumlah_pixel || "-"}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {activeWlc ? (
              <Button as="link" to="/admin/map-preview" variant="secondary">Preview Peta Hasil WLC</Button>
            ) : (
              <Button disabled variant="secondary">Preview Menunggu WLC</Button>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <span className="inline-flex rounded-2xl bg-amber-100 p-3 text-amber-800"><Calculator /></span>
          <p className="mt-4 text-sm text-stone-500">Rumus Spasial WLC</p>
          <h3 className="text-xl font-black text-stone-950">S = Σ (Wi × Xi) × C</h3>
          <p className="mt-2 text-sm leading-6 text-stone-500">
            Dimana Wi adalah bobot konsensus indikator, Xi nilai normalisasi fuzzy, dan C adalah nilai biner kendala (constraint).
          </p>
          <div className="mt-4 rounded-3xl bg-stone-50 p-4">
            <p className="text-xs text-stone-500">File Output Raster</p>
            <p className="mt-2 font-mono text-xs text-stone-700 break-all">
              {activeWlc?.file_path || "Belum dihitung"}
            </p>
          </div>
        </Card>
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-5">
          <h2 className="text-lg font-bold text-stone-950">Klasifikasi Kesesuaian Lahan</h2>
          <p className="mt-1 text-sm text-stone-500">Metode Equal Interval (3 Kelas) yang diterapkan di QGIS.</p>
          <div className="mt-4 space-y-3">
            {[
              ["Tidak Sesuai", "Skor < 0.333 atau terkena mask kendala (sawah/sungai)"],
              ["Kurang Sesuai", "Skor 0.333 - 0.667"],
              ["Sesuai", "Skor >= 0.667"],
            ].map(([label, range]) => (
              <div key={label} className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 p-3">
                <span className="font-semibold text-stone-800">{label}</span>
                <span className="text-sm text-stone-500">{range}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold text-stone-950">Jumlah Grid per Kelas Kesesuaian</h2>
          <p className="mt-1 text-sm text-stone-500">Hasil klasifikasi grid saat ini.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {loading ? (
              <div className="py-6 text-center text-sm text-stone-400 col-span-2">Memuat data...</div>
            ) : classRows.length === 0 ? (
              <div className="py-6 text-center text-sm text-stone-400 col-span-2">Belum ada hasil kalkulasi WLC.</div>
            ) : (
              classRows.map((row) => (
                <div key={row.className} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <p className="text-sm text-stone-500">{row.className}</p>
                  <p className="mt-1 text-2xl font-black text-stone-950">{row.total} Grid</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {topGrid && (
        <Card className="overflow-hidden p-0">
          <div className="flex flex-col justify-between gap-3 border-b border-stone-200 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-stone-950">Kontribusi Nilai pada Grid Terbaik ({topGrid.properties.gridCode})</h2>
              <p className="mt-1 text-sm text-stone-500">Menampilkan nilai asli masing-masing indikator pada grid dengan skor WLC tertinggi.</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"))}
            >
              <RefreshCcw size={16} />
              {sortDirection === "desc" ? "Skor Tertinggi" : "Skor Terendah"}
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-5 py-3">Indikator</th>
                  <th className="px-5 py-3 text-right">Nilai Asli Spasial</th>
                  <th className="px-5 py-3 text-right">Bobot Konsensus (Wi)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <tr><td colSpan="3" className="px-5 py-10 text-center text-stone-400">Memuat...</td></tr>
                ) : breakdown.length === 0 ? (
                  <tr><td colSpan="3" className="px-5 py-10 text-center text-stone-400">Data bobot tidak lengkap.</td></tr>
                ) : (
                  breakdown.map((row) => (
                    <tr key={row.indicatorCode} className="hover:bg-stone-50">
                      <td className="px-5 py-4 font-semibold text-stone-900">{row.indicatorName}</td>
                      <td className="px-5 py-4 text-right text-stone-600">
                        {row.rawValue.toLocaleString("id-ID")}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-stone-950">{(row.weight * 100).toFixed(4)}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Confirmation Modal */}
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

      {/* Toast Notification */}
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