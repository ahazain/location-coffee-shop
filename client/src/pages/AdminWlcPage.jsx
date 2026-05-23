import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Calculator, CheckCircle2, RefreshCcw, Sigma } from "lucide-react";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import AdminLayout from "../layouts/AdminLayout";
import { indicators } from "../data/indicators";
import { adminService } from "../services/adminService";

function getIndicatorName(code) {
  return indicators.find((item) => item.code === code)?.name || code;
}

function statusVariant(status) {
  if (["blocked_fuzzy", "needs_run"].includes(status)) return "amber";
  if (status === "failed") return "red";
  return "green";
}

export default function AdminWlcPage() {
  const [data, setData] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState(null);

  function loadData() {
    adminService.getWlcProcess().then(setData);
  }

  useEffect(() => {
    loadData();
  }, []);

  const classRows = useMemo(() => {
    if (!data?.map?.features) return [];

    const count = data.map.features.reduce((accumulator, feature) => {
      const className = feature.properties.suitabilityClass;
      accumulator[className] = (accumulator[className] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(count).map(([className, total]) => ({ className, total }));
  }, [data]);

  async function handleRunWlc() {
    setMessage(null);
    setIsRunning(true);
    const result = await adminService.runWlc();
    setIsRunning(false);
    setMessage({ type: result.ok ? "success" : "error", text: result.message });
    loadData();
  }

  const canRun = data?.runStatus?.canRun;
  const pendingFuzzy = data?.runStatus?.pendingFuzzy || [];
  const canPreview = ["ready_preview", "published", "up_to_date"].includes(data?.runStatus?.status);

  return (
    <AdminLayout>
      <Card className="mb-5 p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <Badge>Step 3 — Hitung WLC</Badge>
            <h2 className="mt-3 text-2xl font-black text-stone-950">Hitung ulang skor kesesuaian setelah fuzzy selesai</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-500">
              WLC baru dijalankan setelah semua indikator terdampak berstatus fuzzy terbaru. Perhitungan ini memakai nilai fuzzy sebagai Xi, bobot akhir AHP sebagai Wi, dan constraint sebagai pembatas area.
            </p>
          </div>
          <div className={canRun ? "rounded-3xl bg-green-50 p-4 text-green-800" : "rounded-3xl bg-amber-50 p-4 text-amber-900"}>
            <div className="flex items-center gap-2 font-bold">
              {canRun ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              {canRun ? "Siap menjalankan WLC" : "Menunggu fuzzy"}
            </div>
            <p className="mt-1 text-xs">{data?.runStatus?.statusLabel || "Memuat status"}</p>
          </div>
        </div>
      </Card>

      {message && (
        <div className={message.type === "success" ? "mb-5 rounded-3xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-800" : "mb-5 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"}>
          {message.text}
        </div>
      )}

      <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_420px]">
        <Card className="p-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div>
              <Badge variant={statusVariant(data?.runStatus?.status)}>{data?.runStatus?.statusLabel || "Memuat"}</Badge>
              <h2 className="mt-3 text-xl font-black text-stone-950">Kesiapan proses WLC</h2>
              <p className="mt-2 text-sm leading-6 text-stone-500">{data?.runStatus?.needsRunReason || "Memuat status proses."}</p>
            </div>
            <Button onClick={handleRunWlc} disabled={!canRun || isRunning}>
              <RefreshCcw size={16} /> {isRunning ? "Menghitung..." : "Hitung WLC ulang"}
            </Button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-3xl bg-stone-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Dataset</p>
              <p className="mt-2 text-sm font-semibold text-stone-900">{data?.runStatus?.sourceDataset || "-"}</p>
            </div>
            <div className="rounded-3xl bg-stone-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Fuzzy</p>
              <p className="mt-2 text-sm font-semibold text-stone-900">{data?.runStatus?.sourceFuzzy || "-"}</p>
            </div>
            <div className="rounded-3xl bg-stone-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Bobot</p>
              <p className="mt-2 text-sm font-semibold text-stone-900">{data?.runStatus?.sourceAhp || "-"}</p>
            </div>
          </div>

          {!canRun && (
            <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <p className="font-bold">WLC belum dapat dijalankan</p>
              <p className="mt-1 text-sm leading-6">Masih ada indikator yang harus difuzzy ulang:</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {pendingFuzzy.map((item) => (
                  <Badge key={item.code}>{getIndicatorName(item.code)}</Badge>
                ))}
              </div>
              <div className="mt-4">
                <Button as="link" to="/admin/fuzzy" variant="secondary">Kembali ke Fuzzy</Button>
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            {canPreview ? (
              <Button as="link" to="/admin/map-preview" variant="secondary">Preview peta draft</Button>
            ) : (
              <Button disabled variant="secondary">Preview menunggu WLC</Button>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <span className="inline-flex rounded-2xl bg-amber-100 p-3 text-amber-800"><Calculator /></span>
          <p className="mt-4 text-sm text-stone-500">Rumus</p>
          <h3 className="text-xl font-black text-stone-950">S = Σ(Wi × Xi) × C</h3>
          <p className="mt-2 text-sm leading-6 text-stone-500">Wi = bobot akhir indikator dari AHP, Xi = nilai fuzzy terbaru, C = constraint.</p>
          <div className="mt-4 rounded-3xl bg-stone-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Terakhir dihitung</p>
            <p className="mt-2 text-sm font-semibold text-stone-950">{data?.runStatus?.lastRun || "Belum ada"}</p>
          </div>
        </Card>
      </div>

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <span className="inline-flex rounded-2xl bg-amber-100 p-3 text-amber-800"><Sigma /></span>
          <p className="mt-4 text-sm text-stone-500">Grid terbaik</p>
          <h3 className="text-2xl font-black text-stone-950">{data?.topGrid?.gridCode || "-"}</h3>
          <p className="mt-2 text-sm leading-6 text-stone-500">Skor WLC {data?.topGrid?.scoreUsed?.toFixed(3) || "-"} di {data?.topGrid?.kelurahan || "-"}.</p>
        </Card>
        <Card className="p-5">
          <span className="inline-flex rounded-2xl bg-amber-100 p-3 text-amber-800"><CheckCircle2 /></span>
          <p className="mt-4 text-sm text-stone-500">Grid direkomendasikan</p>
          <h3 className="text-2xl font-black text-stone-950">{data?.map?.summary?.recommended ?? "-"}</h3>
          <p className="mt-2 text-sm leading-6 text-stone-500">Kelas Sesuai dan Sangat sesuai.</p>
        </Card>
        <Card className="p-5">
          <span className="inline-flex rounded-2xl bg-amber-100 p-3 text-amber-800"><RefreshCcw /></span>
          <p className="mt-4 text-sm text-stone-500">Draft WLC</p>
          <h3 className="text-lg font-black text-stone-950">{data?.runStatus?.draftVersion || "-"}</h3>
          <p className="mt-2 text-sm leading-6 text-stone-500">Versi draft yang akan dicek sebelum publish.</p>
        </Card>
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-5">
          <h2 className="text-lg font-bold text-stone-950">Klasifikasi hasil</h2>
          <p className="mt-1 text-sm text-stone-500">Equal interval 0 sampai 1.</p>
          <div className="mt-4 space-y-3">
            {[
              ["Tidak sesuai", "0,00 - 0,20"],
              ["Kurang sesuai", ">0,20 - 0,40"],
              ["Cukup sesuai", ">0,40 - 0,60"],
              ["Sesuai", ">0,60 - 0,80"],
              ["Sangat sesuai", ">0,80 - 1,00"],
            ].map(([label, range]) => (
              <div key={label} className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 p-3">
                <span className="font-semibold text-stone-800">{label}</span>
                <span className="text-sm text-stone-500">{range}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold text-stone-950">Jumlah grid per kelas</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {classRows.map((row) => (
              <div key={row.className} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <p className="text-sm text-stone-500">{row.className}</p>
                <p className="mt-1 text-2xl font-black text-stone-950">{row.total}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-stone-200 p-5">
          <h2 className="text-lg font-bold text-stone-950">Kontribusi indikator pada grid terbaik</h2>
          <p className="mt-1 text-sm text-stone-500">Kontribusi = nilai fuzzy × bobot akhir indikator.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-5 py-3">Indikator</th>
                <th className="px-5 py-3 text-right">Nilai fuzzy</th>
                <th className="px-5 py-3 text-right">Bobot</th>
                <th className="px-5 py-3 text-right">Kontribusi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {(data?.breakdown || []).map((row) => (
                <tr key={row.indicatorCode} className="hover:bg-stone-50">
                  <td className="px-5 py-4 font-semibold text-stone-900">{getIndicatorName(row.indicatorCode)}</td>
                  <td className="px-5 py-4 text-right text-stone-600">{row.fuzzyValue}</td>
                  <td className="px-5 py-4 text-right text-stone-600">{(row.weight * 100).toFixed(2)}%</td>
                  <td className="px-5 py-4 text-right font-bold text-stone-950">{row.contribution}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminLayout>
  );
}
