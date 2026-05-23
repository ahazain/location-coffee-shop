import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Database, Filter, RefreshCcw, Sigma } from "lucide-react";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import AdminLayout from "../layouts/AdminLayout";
import { criteria } from "../data/criteria";
import { adminService } from "../services/adminService";

function criteriaName(code) {
  return criteria.find((item) => item.code === code)?.name || code;
}

function fuzzyBadge(type) {
  if (type === "increasing") return "Linear increasing";
  if (type === "decreasing") return "Linear decreasing";
  return "Near optimum";
}

function statusVariant(status) {
  if (status === "needs_fuzzy") return "amber";
  if (status === "failed") return "red";
  if (status === "up_to_date") return "green";
  return "stone";
}

export default function AdminFuzzyPage() {
  const [data, setData] = useState(null);
  const [selectedCode, setSelectedCode] = useState("");
  const [filter, setFilter] = useState("all");
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(null);

  function loadData(nextSelectedCode = selectedCode) {
    adminService.getFuzzyProcess().then((response) => {
      setData(response);
      const fallback = response.pendingRows[0]?.code || response.rows[0]?.code || "";
      setSelectedCode(nextSelectedCode || fallback);
    });
  }

  useEffect(() => {
    loadData("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRows = useMemo(() => {
    const rows = data?.rows || [];
    if (filter === "pending") return rows.filter((row) => row.status === "needs_fuzzy");
    if (filter === "ready") return rows.filter((row) => row.status === "up_to_date");
    return rows;
  }, [data, filter]);

  const selectedIndicator = useMemo(
    () => data?.rows?.find((row) => row.code === selectedCode) || data?.rows?.[0],
    [data, selectedCode],
  );

  async function handleRunSelected() {
    if (!selectedIndicator) return;
    setMessage(null);
    setIsProcessing(true);
    const result = await adminService.runFuzzyIndicator(selectedIndicator.code);
    setIsProcessing(false);
    setMessage({ type: result.ok ? "success" : "error", text: result.message });
    loadData(selectedIndicator.code);
  }

  async function handleRunAllPending() {
    setMessage(null);
    setIsProcessing(true);
    const result = await adminService.runAllPendingFuzzy();
    setIsProcessing(false);
    setMessage({ type: result.ok ? "success" : "error", text: result.message });
    loadData(selectedCode);
  }

  const pendingCount = data?.processingSummary?.pendingFuzzyCount || 0;

  return (
    <AdminLayout>
      <Card className="mb-5 p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <Badge>Step 2 — Fuzzy per indikator</Badge>
            <h2 className="mt-3 text-2xl font-black text-stone-950">Normalisasi fuzzy hanya pada indikator terdampak</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-stone-500">
              Setelah admin upload GeoJSON, sistem menandai indikator yang terdampak. Admin tidak perlu fuzzy semua indikator. Pilih indikator yang berstatus perlu fuzzy ulang, jalankan prosesnya, lalu lanjutkan WLC jika semua indikator sudah terbaru.
            </p>
          </div>
          <div className={pendingCount ? "rounded-3xl bg-amber-50 p-4 text-amber-900" : "rounded-3xl bg-green-50 p-4 text-green-800"}>
            <div className="flex items-center gap-2 font-bold">
              {pendingCount ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
              {pendingCount ? `${pendingCount} indikator perlu fuzzy` : "Semua fuzzy terbaru"}
            </div>
            <p className="mt-1 text-xs">Output fuzzy menjadi nilai Xi pada WLC</p>
          </div>
        </div>
      </Card>

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <span className="inline-flex rounded-2xl bg-amber-100 p-3 text-amber-800"><Database /></span>
          <p className="mt-4 text-sm text-stone-500">Indikator terdaftar</p>
          <h3 className="text-2xl font-black text-stone-950">{data?.rows?.length ?? "-"}</h3>
          <p className="mt-2 text-sm leading-6 text-stone-500">Setiap indikator punya fungsi fuzzy dan layer sumber masing-masing.</p>
        </Card>
        <Card className="p-5">
          <span className="inline-flex rounded-2xl bg-amber-100 p-3 text-amber-800"><Sigma /></span>
          <p className="mt-4 text-sm text-stone-500">Perlu diproses</p>
          <h3 className="text-2xl font-black text-stone-950">{pendingCount}</h3>
          <p className="mt-2 text-sm leading-6 text-stone-500">WLC menunggu sampai indikator terdampak selesai fuzzy.</p>
        </Card>
        <Card className="p-5">
          <span className="inline-flex rounded-2xl bg-amber-100 p-3 text-amber-800"><RefreshCcw /></span>
          <p className="mt-4 text-sm text-stone-500">Status WLC</p>
          <h3 className="text-lg font-black text-stone-950">{data?.processingSummary?.wlcStatusLabel || "-"}</h3>
          <p className="mt-2 text-sm leading-6 text-stone-500">WLC bisa dijalankan setelah semua status fuzzy terbaru.</p>
        </Card>
      </div>

      {message && (
        <div className={message.type === "success" ? "mb-5 rounded-3xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-800" : "mb-5 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"}>
          {message.text}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-stone-200 p-5">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <h2 className="text-lg font-bold text-stone-950">Daftar indikator fuzzy</h2>
                <p className="mt-1 text-sm text-stone-500">Pilih indikator untuk melihat parameter dan menjalankan fuzzyfikasi.</p>
              </div>
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-stone-500" />
                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-100"
                >
                  <option value="all">Semua</option>
                  <option value="pending">Perlu fuzzy ulang</option>
                  <option value="ready">Sudah terbaru</option>
                </select>
              </div>
            </div>
          </div>
          <div className="divide-y divide-stone-100">
            {filteredRows.map((row) => (
              <button
                key={row.code}
                type="button"
                onClick={() => setSelectedCode(row.code)}
                className={row.code === selectedIndicator?.code ? "w-full bg-amber-50 p-4 text-left" : "w-full bg-white p-4 text-left hover:bg-stone-50"}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-stone-950">{row.name}</p>
                    <p className="mt-1 text-xs text-stone-500">{criteriaName(row.criteriaCode)} • sumber: {row.sourceLayerName}</p>
                  </div>
                  <Badge variant={statusVariant(row.status)}>{row.statusLabel}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="stone">{fuzzyBadge(row.fuzzyType)}</Badge>
                  <Badge variant="stone">{row.version}</Badge>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div>
                <Badge variant={statusVariant(selectedIndicator?.status)}>{selectedIndicator?.statusLabel || "Memuat"}</Badge>
                <h2 className="mt-3 text-xl font-black text-stone-950">{selectedIndicator?.name || "Pilih indikator"}</h2>
                <p className="mt-2 text-sm leading-6 text-stone-500">{selectedIndicator?.reason}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleRunSelected} disabled={!selectedIndicator || isProcessing}>
                  <Sigma size={16} /> {isProcessing ? "Memproses..." : "Fuzzyfikasi indikator ini"}
                </Button>
                <Button variant="secondary" onClick={handleRunAllPending} disabled={!pendingCount || isProcessing}>
                  <RefreshCcw size={16} /> Proses semua pending
                </Button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-3xl bg-stone-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Layer sumber</p>
                <p className="mt-2 font-semibold text-stone-950">{selectedIndicator?.sourceLayerName || "-"}</p>
              </div>
              <div className="rounded-3xl bg-stone-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Fungsi fuzzy</p>
                <p className="mt-2 font-semibold text-stone-950">{selectedIndicator ? fuzzyBadge(selectedIndicator.fuzzyType) : "-"}</p>
              </div>
              <div className="rounded-3xl bg-stone-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Parameter</p>
                <p className="mt-2 text-sm font-semibold text-stone-950">{selectedIndicator?.fuzzyConfig?.parameter || "-"}</p>
              </div>
              <div className="rounded-3xl bg-stone-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Rumus</p>
                <p className="mt-2 font-mono text-xs text-stone-700">{selectedIndicator?.fuzzyConfig?.formula || "-"}</p>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-stone-200 p-5">
              <h2 className="text-lg font-bold text-stone-950">Preview hasil fuzzy indikator</h2>
              <p className="mt-1 text-sm text-stone-500">Nilai asli akan disimpan sebagai nilai fuzzy 0 sampai 1.</p>
            </div>
            <div className="grid gap-3 p-5 md:grid-cols-4">
              <div className="rounded-2xl bg-stone-50 p-3 text-center">
                <p className="text-xs text-stone-500">Raw min</p>
                <p className="text-lg font-black text-stone-950">{selectedIndicator?.rawMin ?? "-"}</p>
              </div>
              <div className="rounded-2xl bg-stone-50 p-3 text-center">
                <p className="text-xs text-stone-500">Raw max</p>
                <p className="text-lg font-black text-stone-950">{selectedIndicator?.rawMax ?? "-"}</p>
              </div>
              <div className="rounded-2xl bg-stone-50 p-3 text-center">
                <p className="text-xs text-stone-500">Optimum</p>
                <p className="text-lg font-black text-stone-950">{selectedIndicator?.optimum ?? "-"}</p>
              </div>
              <div className="rounded-2xl bg-stone-50 p-3 text-center">
                <p className="text-xs text-stone-500">Rata-rata fuzzy</p>
                <p className="text-lg font-black text-stone-950">{selectedIndicator?.averageFuzzy ?? "-"}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className="px-5 py-3">Grid</th>
                    <th className="px-5 py-3">Nilai asli</th>
                    <th className="px-5 py-3">Nilai fuzzy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {(selectedIndicator?.previewRows || []).map((row) => (
                    <tr key={row.gridCode}>
                      <td className="px-5 py-3 font-semibold text-stone-900">{row.gridCode}</td>
                      <td className="px-5 py-3 text-stone-600">{row.rawValue}</td>
                      <td className="px-5 py-3 font-bold text-stone-950">{row.fuzzyValue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="flex flex-wrap gap-3">
            {pendingCount === 0 ? (
              <Button as="link" to="/admin/wlc"><RefreshCcw size={16} /> Lanjut hitung WLC</Button>
            ) : (
              <Button disabled><AlertTriangle size={16} /> Selesaikan fuzzy dahulu</Button>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
