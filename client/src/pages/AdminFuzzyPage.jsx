import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Database, Filter, RefreshCcw, Sigma } from "lucide-react";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import AdminLayout from "../layouts/AdminLayout";
import { fuzzyService } from "../services/api/fuzzyService";
import { indikatorService } from "../services/api/indikatorService";

function fuzzyLabel(type) {
  if (type === "linear_increasing") return "Linear Increasing";
  if (type === "linear_decreasing") return "Linear Decreasing";
  if (type === "near") return "Near (Optimum)";
  return type || "-";
}

function arahLabel(arah) {
  if (arah === "benefit") return "Benefit";
  if (arah === "cost") return "Cost";
  return "Optimum";
}

export default function AdminFuzzyPage() {
  const [indikatorList, setIndikatorList] = useState([]);
  const [aturanMap, setAturanMap] = useState({}); // { id_indikator: aturan }
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(null);
  const [loadingAll, setLoadingAll] = useState(true);

  async function loadData() {
    try {
      setLoadingAll(true);
      const [indData, aturanData] = await Promise.all([
        indikatorService.getAll(),
        fuzzyService.getAllAturan(),
      ]);
      setIndikatorList(indData);
      // Build map: id_indikator → aturan
      const map = {};
      aturanData.forEach((a) => {
        map[a.id_indikator] = a;
      });
      setAturanMap(map);
      // Pilih yang pertama belum punya aturan, atau yang pertama
      const firstWithoutAturan = indData.find((i) => !map[i.id]);
      setSelectedId(firstWithoutAturan?.id || indData[0]?.id || null);
    } catch (err) {
      setMessage({ type: "error", text: `Gagal memuat data: ${err.message}` });
    } finally {
      setLoadingAll(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRows = useMemo(() => {
    return indikatorList.filter((ind) => {
      if (filter === "pending") return !aturanMap[ind.id];
      if (filter === "ready") return Boolean(aturanMap[ind.id]);
      return true;
    });
  }, [indikatorList, aturanMap, filter]);

  const selectedIndikator = useMemo(
    () => indikatorList.find((i) => i.id === selectedId),
    [indikatorList, selectedId],
  );
  const selectedAturan = selectedId ? aturanMap[selectedId] : null;
  const pendingCount = indikatorList.filter((i) => !aturanMap[i.id]).length;

  async function handleCalculate(id) {
    if (!id) return;
    setMessage(null);
    setIsProcessing(true);
    try {
      await fuzzyService.calculateByIndikator(id);
      setMessage({ type: "success", text: `Fuzzy indikator berhasil dihitung!` });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleCalculateAll() {
    setMessage(null);
    setIsProcessing(true);
    try {
      const result = await fuzzyService.calculateAll();
      setMessage({ type: "success", text: `Semua indikator berhasil dihitung fuzzy! Total: ${result?.total_calculated || "-"}` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <AdminLayout>
      <Card className="mb-5 p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <Badge>Step 2 — Fuzzy per indikator</Badge>
            <h2 className="mt-3 text-2xl font-black text-stone-950">Aturan Fuzzy & Kalkulasi</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-stone-500">
              Setiap indikator memiliki aturan fuzzifikasi (fungsi, arah, nilai min/max) yang tersimpan di database. Klik tombol hitung untuk menjalankan kalkulasi fuzzy per indikator.
            </p>
          </div>
          <div className={pendingCount ? "rounded-3xl bg-amber-50 p-4 text-amber-900" : "rounded-3xl bg-green-50 p-4 text-green-800"}>
            <div className="flex items-center gap-2 font-bold">
              {pendingCount ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
              {pendingCount ? `${pendingCount} indikator belum ada aturan fuzzy` : "Semua aturan fuzzy terdaftar"}
            </div>
            <p className="mt-1 text-xs">Output fuzzy menjadi nilai Xi pada WLC</p>
          </div>
        </div>
      </Card>

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <span className="inline-flex rounded-2xl bg-amber-100 p-3 text-amber-800"><Database /></span>
          <p className="mt-4 text-sm text-stone-500">Indikator terdaftar</p>
          <h3 className="text-2xl font-black text-stone-950">{indikatorList.length}</h3>
          <p className="mt-2 text-sm leading-6 text-stone-500">Setiap indikator punya aturan fuzzifikasi masing-masing.</p>
        </Card>
        <Card className="p-5">
          <span className="inline-flex rounded-2xl bg-amber-100 p-3 text-amber-800"><Sigma /></span>
          <p className="mt-4 text-sm text-stone-500">Aturan fuzzy terdaftar</p>
          <h3 className="text-2xl font-black text-stone-950">{Object.keys(aturanMap).length}</h3>
          <p className="mt-2 text-sm leading-6 text-stone-500">Aturan dari database, siap digunakan untuk kalkulasi.</p>
        </Card>
        <Card className="p-5">
          <span className="inline-flex rounded-2xl bg-amber-100 p-3 text-amber-800"><RefreshCcw /></span>
          <p className="mt-4 text-sm text-stone-500">Hitung semua sekaligus</p>
          <Button onClick={handleCalculateAll} disabled={isProcessing} className="mt-3 w-full">
            {isProcessing ? "Memproses..." : "Hitung Semua Fuzzy"}
          </Button>
        </Card>
      </div>

      {message && (
        <div className={message.type === "success"
          ? "mb-5 rounded-3xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-800"
          : "mb-5 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
        }>
          {message.text}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-stone-200 p-5">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <h2 className="text-lg font-bold text-stone-950">Daftar Indikator & Aturan Fuzzy</h2>
                <p className="mt-1 text-sm text-stone-500">Pilih indikator untuk melihat parameter fuzzifikasinya.</p>
              </div>
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-stone-500" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-amber-700"
                >
                  <option value="all">Semua</option>
                  <option value="pending">Belum ada aturan</option>
                  <option value="ready">Sudah ada aturan</option>
                </select>
              </div>
            </div>
          </div>
          <div className="divide-y divide-stone-100">
            {loadingAll ? (
              <div className="p-6 text-center text-sm text-stone-400">Memuat data...</div>
            ) : filteredRows.map((ind) => {
              const aturan = aturanMap[ind.id];
              const isSelected = ind.id === selectedId;
              return (
                <button
                  key={ind.id}
                  type="button"
                  onClick={() => setSelectedId(ind.id)}
                  className={isSelected ? "w-full bg-amber-50 p-4 text-left" : "w-full bg-white p-4 text-left hover:bg-stone-50"}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-stone-950">{ind.nama_indikator}</p>
                      <p className="mt-1 text-xs text-stone-500">
                        {ind.kriteria?.nama_kriteria || "-"} • {ind.kode_indikator}
                      </p>
                    </div>
                    <Badge variant={aturan ? "green" : "amber"}>
                      {aturan ? "Ada aturan" : "Belum ada aturan"}
                    </Badge>
                  </div>
                  {aturan && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="stone">{fuzzyLabel(aturan.fungsi_fuzzy)}</Badge>
                      <Badge variant="stone">{arahLabel(aturan.arah)}</Badge>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div>
                <Badge variant={selectedAturan ? "green" : "amber"}>
                  {selectedAturan ? "Aturan terdaftar" : "Belum ada aturan"}
                </Badge>
                <h2 className="mt-3 text-xl font-black text-stone-950">
                  {selectedIndikator?.nama_indikator || "Pilih indikator"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-stone-500">
                  {selectedAturan?.keterangan || selectedIndikator?.keterangan || "-"}
                </p>
              </div>
              <Button
                onClick={() => handleCalculate(selectedId)}
                disabled={!selectedId || isProcessing || !selectedAturan}
              >
                <Sigma size={16} /> {isProcessing ? "Memproses..." : "Hitung Fuzzy Ini"}
              </Button>
            </div>

            {selectedAturan ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-3xl bg-stone-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Fungsi Fuzzy</p>
                  <p className="mt-2 font-semibold text-stone-950">{fuzzyLabel(selectedAturan.fungsi_fuzzy)}</p>
                </div>
                <div className="rounded-3xl bg-stone-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Arah Preferensi</p>
                  <p className="mt-2 font-semibold text-stone-950">{arahLabel(selectedAturan.arah)}</p>
                </div>
                <div className="rounded-3xl bg-stone-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Nilai Min</p>
                  <p className="mt-2 font-semibold text-stone-950">{selectedAturan.nilai_min ?? "-"}</p>
                </div>
                <div className="rounded-3xl bg-stone-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Nilai Max</p>
                  <p className="mt-2 font-semibold text-stone-950">{selectedAturan.nilai_max ?? "-"}</p>
                </div>
                {selectedAturan.midpoint != null && (
                  <div className="rounded-3xl bg-stone-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Midpoint</p>
                    <p className="mt-2 font-semibold text-stone-950">{selectedAturan.midpoint}</p>
                  </div>
                )}
                {selectedAturan.spread != null && (
                  <div className="rounded-3xl bg-stone-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Spread</p>
                    <p className="mt-2 font-semibold text-stone-950">{selectedAturan.spread}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <AlertTriangle size={16} className="mb-2" />
                Indikator ini belum memiliki aturan fuzzy di database. Aturan fuzzy perlu ditambahkan melalui API seeder atau proses awal.
              </div>
            )}
          </Card>

          <div className="flex flex-wrap gap-3">
            {pendingCount === 0 ? (
              <Button as="link" to="/admin/wlc"><RefreshCcw size={16} /> Lanjut Hitung WLC</Button>
            ) : (
              <Button disabled><AlertTriangle size={16} /> Daftarkan aturan fuzzy semua indikator dahulu</Button>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
