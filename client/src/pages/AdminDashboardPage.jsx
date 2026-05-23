import { useEffect, useState } from "react";
import { ArrowRight, BrainCircuit, Calculator, Database, RefreshCcw, Sigma, UploadCloud, UsersRound } from "lucide-react";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import ProcessTimeline from "../components/admin/ProcessTimeline";
import AdminLayout from "../layouts/AdminLayout";
import { adminService } from "../services/adminService";

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    adminService.getDashboardSummary().then(setSummary);
  }, []);

  const stats = [
    {
      label: "Dataset aktif",
      value: summary?.datasetSummary.activeVersion || "Memuat...",
      icon: Database,
      link: "/admin/datasets",
    },
    {
      label: "Job dataset menunggu",
      value: summary ? `${summary.pendingDatasetJobs} job` : "Memuat...",
      icon: UploadCloud,
      link: "/admin/datasets",
    },
    {
      label: "Fuzzy perlu dihitung",
      value: summary ? `${summary.pendingFuzzyJobs} indikator` : "Memuat...",
      icon: Sigma,
      link: "/admin/fuzzy",
    },
    {
      label: "Responden AHP default",
      value: summary ? `${summary.respondentCount} aktor` : "Memuat...",
      icon: UsersRound,
      link: "/admin/ahp",
    },
  ];

  return (
    <AdminLayout>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.label} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-2xl bg-amber-100 p-3 text-amber-800"><Icon size={22} /></span>
                <Button as="link" to={item.link} variant="ghost" className="px-3 py-2"><ArrowRight size={16} /></Button>
              </div>
              <p className="mt-5 text-sm text-stone-500">{item.label}</p>
              <h2 className="mt-2 text-xl font-black text-stone-950">{item.value}</h2>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="p-6">
          <Badge>Admin operasional</Badge>
          <h2 className="mt-4 text-2xl font-black text-stone-950">Admin dibuat seperti alur kerja nyata</h2>
          <p className="mt-2 text-sm leading-6 text-stone-500">
            Admin tidak hanya melihat tabel. Admin mengunggah GeoJSON spasial, sistem menandai indikator yang terdampak, admin menjalankan fuzzy per indikator, menghitung WLC ulang dengan AHP default, lalu mem-preview peta sebelum publikasi.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-xs text-stone-500">Grid rekomendasi</p>
              <p className="mt-1 text-2xl font-black text-stone-950">{summary?.mapSummary.recommended ?? "-"}</p>
            </div>
            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-xs text-stone-500">AHP default</p>
              <p className="mt-1 text-lg font-black text-stone-950">{summary?.ahpStatus ?? "-"}</p>
            </div>
            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-xs text-stone-500">Status publish</p>
              <p className="mt-1 text-lg font-black text-stone-950">{summary?.publishedMapStatus ?? "-"}</p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 font-bold text-amber-900"><RefreshCcw size={18} /> Contoh kasus update</div>
            <p className="mt-2 text-sm leading-6 text-amber-900/80">
              Jika admin menambah titik kedai kopi existing, layer kompetitor bertambah. Sistem menandai kepadatan pesaing dan jarak pesaing sebagai perlu fuzzy ulang. AHP tetap, lalu WLC dihitung ulang setelah fuzzy selesai.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button as="link" to="/admin/datasets"><UploadCloud size={16} /> Mulai input dataset</Button>
            <Button as="link" to="/admin/ahp" variant="secondary"><BrainCircuit size={16} /> Kelola AHP</Button>
            <Button as="link" to="/admin/wlc" variant="secondary"><Calculator size={16} /> Hitung WLC</Button>
          </div>
        </Card>

        <ProcessTimeline steps={summary?.pipelineSteps || []} />
      </div>

      <Card className="mt-6 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-stone-950">Log proses admin</h2>
            <p className="mt-1 text-sm text-stone-500">Log ini berasal dari mock backend localStorage. Nanti sumbernya tinggal diganti ke tabel log API backend.</p>
          </div>
          <Badge variant="stone">Audit trail</Badge>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {(summary?.processingLogs || []).map((log) => (
            <div key={log.id} className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-semibold text-stone-500">{log.time}</p>
              <h3 className="mt-2 font-bold text-stone-950">{log.title}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-500">{log.detail}</p>
              <Badge className="mt-3">{log.status}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </AdminLayout>
  );
}
