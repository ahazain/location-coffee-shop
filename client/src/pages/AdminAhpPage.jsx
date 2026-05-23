import { useEffect, useMemo, useState } from "react";
import { BrainCircuit, CheckCircle2, RefreshCcw, UsersRound } from "lucide-react";
import Badge from "../components/common/Badge";
import Card from "../components/common/Card";
import AdminAhpRespondentWizard from "../components/admin/AdminAhpRespondentWizard";
import AdminLayout from "../layouts/AdminLayout";
import { criteria } from "../data/criteria";
import { indicators } from "../data/indicators";
import { adminService } from "../services/adminService";

function getCriterionName(code) {
  return criteria.find((item) => item.code === code)?.name || code;
}

function getIndicatorName(code) {
  return indicators.find((item) => item.code === code)?.name || code;
}

export default function AdminAhpPage() {
  const [analysis, setAnalysis] = useState(null);

  function loadAnalysis() {
    adminService.getAhpProcess().then(setAnalysis);
  }

  useEffect(() => {
    loadAnalysis();
  }, []);

  const globalRows = useMemo(() => {
    if (!analysis) return [];

    return Object.entries(analysis.globalIndicatorWeights)
      .map(([indicatorCode, globalWeight]) => {
        const indicator = indicators.find((item) => item.code === indicatorCode);
        return {
          indicatorCode,
          indicatorName: getIndicatorName(indicatorCode),
          criteriaName: getCriterionName(indicator?.criteriaCode),
          globalWeight,
        };
      })
      .sort((a, b) => b.globalWeight - a.globalWeight);
  }, [analysis]);

  return (
    <AdminLayout>
      <Card className="mb-5 p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <Badge>Step AHP — Bobot default</Badge>
            <h2 className="mt-3 text-2xl font-black text-stone-950">Kelola responden AHP dan rata-rata geometrik</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-stone-500">
              Halaman ini dibuat agar admin tidak hanya melihat bobot jadi. Admin dapat melihat responden default, menambah aktor/responden baru, mengecek CR, lalu menyimpan responden ke mock backend. Nanti proses penyimpanan ini tinggal diganti menjadi API.
            </p>
          </div>
          <div className="rounded-3xl bg-green-50 p-4 text-green-800">
            <div className="flex items-center gap-2 font-bold"><CheckCircle2 size={18} /> CR ≤ 0,1</div>
            <p className="mt-1 text-xs">Bobot default siap digunakan WLC</p>
          </div>
        </div>
      </Card>

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <span className="inline-flex rounded-2xl bg-amber-100 p-3 text-amber-800"><UsersRound /></span>
          <p className="mt-4 text-sm text-stone-500">Responden default</p>
          <h3 className="text-2xl font-black text-stone-950">{analysis?.respondentProfiles.length || "-"}</h3>
          <p className="mt-2 text-sm leading-6 text-stone-500">Pelaku usaha berjalan lebih dari 2 tahun dan memiliki cabang.</p>
        </Card>
        <Card className="p-5">
          <span className="inline-flex rounded-2xl bg-amber-100 p-3 text-amber-800"><BrainCircuit /></span>
          <p className="mt-4 text-sm text-stone-500">CR Kriteria Gabungan</p>
          <h3 className="text-2xl font-black text-stone-950">{analysis?.combinedCriteriaResult.cr ?? "-"}</h3>
          <p className="mt-2 text-sm leading-6 text-stone-500">Nilai diterima ketika maksimal 0,1.</p>
        </Card>
        <Card className="p-5">
          <span className="inline-flex rounded-2xl bg-amber-100 p-3 text-amber-800"><RefreshCcw /></span>
          <p className="mt-4 text-sm text-stone-500">Jika aktor ditambah</p>
          <h3 className="text-xl font-black text-stone-950">WLC perlu ulang</h3>
          <p className="mt-2 text-sm leading-6 text-stone-500">Jika responden baru disimpan, bobot default berubah dan WLC perlu dijalankan ulang.</p>
        </Card>
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-5">
          <h2 className="text-lg font-bold text-stone-950">Responden default saat ini</h2>
          <p className="mt-1 text-sm text-stone-500">Data dummy mengikuti latar belakang kuesioner skripsi.</p>
          <div className="mt-4 space-y-3">
            {analysis?.respondentProfiles.map((profile) => (
              <div key={profile.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-stone-950">{profile.coffeeShop}</p>
                    <p className="mt-1 text-sm text-stone-500">{profile.role} • {profile.experience}</p>
                  </div>
                  <Badge variant="green">Memiliki cabang</Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-stone-600">{profile.note}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold text-stone-950">Bobot kriteria gabungan</h2>
          <p className="mt-1 text-sm text-stone-500">Hasil rata-rata geometrik dari responden yang konsisten.</p>
          <div className="mt-4 space-y-3">
            {criteria.map((criterion) => {
              const value = analysis?.criteriaWeights[criterion.code] || 0;
              return (
                <div key={criterion.code}>
                  <div className="mb-1 flex items-center justify-between text-sm font-semibold text-stone-700">
                    <span>{criterion.name}</span>
                    <span>{Number(value).toFixed(2)}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-stone-100">
                    <div className="h-full rounded-full bg-amber-700" style={{ width: `${value}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <AdminAhpRespondentWizard onSaved={loadAnalysis} />

      <Card className="mt-5 overflow-hidden p-0">
        <div className="border-b border-stone-200 p-5">
          <h2 className="text-lg font-bold text-stone-950">Bobot akhir indikator untuk WLC</h2>
          <p className="mt-1 text-sm text-stone-500">Bobot akhir = bobot kriteria × bobot lokal indikator. Nilai ini dipakai oleh WLC sebagai Wi.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-5 py-3">Indikator</th>
                <th className="px-5 py-3">Kriteria</th>
                <th className="px-5 py-3 text-right">Bobot akhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {globalRows.map((row) => (
                <tr key={row.indicatorCode} className="hover:bg-stone-50">
                  <td className="px-5 py-4 font-semibold text-stone-900">{row.indicatorName}</td>
                  <td className="px-5 py-4 text-stone-600">{row.criteriaName}</td>
                  <td className="px-5 py-4 text-right font-bold text-stone-950">{(row.globalWeight * 100).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminLayout>
  );
}
