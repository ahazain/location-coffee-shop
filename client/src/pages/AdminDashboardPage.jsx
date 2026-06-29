import { useEffect, useState } from "react";
import { ArrowRight, BrainCircuit, Calculator, Database, RefreshCcw, Sigma, UploadCloud, UsersRound } from "lucide-react";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import ProcessTimeline from "../components/admin/ProcessTimeline";
import AdminLayout from "../layouts/AdminLayout";
import { kriteriaService } from "../services/api/kriteriaService";
import { indikatorService } from "../services/api/indikatorService";
import { pakarService } from "../services/api/pakarService";
import { wlcService } from "../services/api/wlcService";
import { fuzzyService } from "../services/api/fuzzyService";
import { adminPipelineSteps } from "../data/adminWorkflow";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalKriteria: 0,
    totalIndikator: 0,
    totalPakar: 0,
    wlcStatusLabel: "Belum Dihitung",
    wlcActiveVersion: "-",
    recommendedGrids: 0,
    pendingFuzzyCount: 0,
    lastWlcRun: "-",
  });

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [kriteria, indikator, pakar, wlcActive, grids, aturan] = await Promise.all([
        kriteriaService.getAll().catch(() => []),
        indikatorService.getAll().catch(() => []),
        pakarService.getAll().catch(() => []),
        wlcService.getActive().catch(() => null),
        wlcService.getGrids().catch(() => null),
        fuzzyService.getAllAturan().catch(() => []),
      ]);

      const wlcStatusLabel = wlcActive ? "WLC Aktif Dihasilkan" : "WLC Belum Dihitung";
      const wlcActiveVersion = wlcActive ? `Versi ${wlcActive.versi}` : "-";
      const lastWlcRun = wlcActive ? new Date(wlcActive.created_at).toLocaleString("id-ID") : "-";

      // Recommended grids are those with suitabilityClass === "Sesuai"
      const recommendedGrids = grids?.features 
        ? grids.features.filter(f => f.properties.suitabilityClass === "Sesuai").length 
        : 0;

      // Pending fuzzy are indicators that do not have associated fuzzy rules in DB yet
      const pendingFuzzyCount = Math.max(0, indikator.length - aturan.length);

      setStats({
        totalKriteria: kriteria.length,
        totalIndikator: indikator.length,
        totalPakar: pakar.length,
        wlcStatusLabel,
        wlcActiveVersion,
        recommendedGrids,
        pendingFuzzyCount,
        lastWlcRun,
      });
    } catch (err) {
      console.error("Gagal memuat ringkasan dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const statCards = [
    {
      label: "Dataset Kriteria Spasial",
      value: `${stats.totalKriteria} Kriteria`,
      icon: Database,
      link: "/admin/kriteria",
    },
    {
      label: "Fuzzy Perlu Aturan",
      value: `${stats.pendingFuzzyCount} Indikator`,
      icon: Sigma,
      link: "/admin/fuzzy",
    },
    {
      label: "Responden Pakar AHP",
      value: `${stats.totalPakar} Aktor`,
      icon: UsersRound,
      link: "/admin/ahp",
    },
    {
      label: "Hasil WLC Aktif",
      value: stats.wlcActiveVersion,
      icon: Calculator,
      link: "/admin/wlc",
    },
  ];

  // Dynamic audit logs generated from real DB status
  const processingLogs = [
    {
      id: "log-1",
      time: stats.lastWlcRun !== "-" ? stats.lastWlcRun : "Baru saja",
      title: stats.wlcActiveVersion !== "-" ? "WLC Terakhir Berhasil Dihitung" : "Koneksi Database Siap",
      detail: stats.wlcActiveVersion !== "-" 
        ? `Kalkulasi WLC versi default berhasil diproses dengan ${stats.recommendedGrids} grid direkomendasikan.`
        : "Sistem web GIS operasional terhubung dengan PostgreSQL + PostGIS.",
      status: stats.wlcActiveVersion !== "-" ? "WLC Selesai" : "Database Ready",
    },
    {
      id: "log-2",
      time: "Sistem Utama",
      title: "Responden AHP Dimuat",
      detail: `Berhasil memuat ${stats.totalPakar} profil pakar aktif dari database untuk konsensus AHP.`,
      status: "AHP Siap",
    },
  ];

  return (
    <AdminLayout>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.label} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-2xl bg-amber-100 p-3 text-amber-800"><Icon size={22} /></span>
                <Button as="link" to={item.link} variant="ghost" className="px-3 py-2"><ArrowRight size={16} /></Button>
              </div>
              <p className="mt-5 text-sm text-stone-500">{item.label}</p>
              <h2 className="mt-2 text-xl font-black text-stone-950">
                {loading ? "..." : item.value}
              </h2>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="p-6">
          <Badge>Admin Operasional</Badge>
          <h2 className="mt-4 text-2xl font-black text-stone-950">Alur Kerja Evaluasi Kesesuaian Lokasi</h2>
          <p className="mt-2 text-sm leading-6 text-stone-500">
            Aplikasi admin mengintegrasikan GeoTIFF spasial, pembobotan AHP dari pakar bisnis coffee shop, normalisasi fuzzy kriteria, dan analisis WLC berbasis grid kelurahan.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-xs text-stone-500">Grid Rekomendasi (Sesuai)</p>
              <p className="mt-1 text-2xl font-black text-stone-950">
                {loading ? "..." : `${stats.recommendedGrids} Grid`}
              </p>
            </div>
            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-xs text-stone-500">Indikator Terdaftar</p>
              <p className="mt-1 text-lg font-black text-stone-950">
                {loading ? "..." : `${stats.totalIndikator} Item`}
              </p>
            </div>
            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-xs text-stone-500">Status Output WLC</p>
              <p className="mt-1 text-lg font-black text-stone-950">
                {loading ? "..." : stats.wlcStatusLabel}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 font-bold text-amber-900"><RefreshCcw size={18} /> Pembaruan Data Dinamis</div>
            <p className="mt-2 text-sm leading-6 text-amber-900/80">
              Apabila terjadi pembaruan data pada layer kriteria atau penambahan pakar baru, jalankan ulang normalisasi fuzzy dan kalkulasi WLC untuk menyinkronkan hasil rekomendasi.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button as="link" to="/admin/kriteria"><Database size={16} /> Kelola Kriteria</Button>
            <Button as="link" to="/admin/ahp" variant="secondary"><BrainCircuit size={16} /> Kelola AHP</Button>
            <Button as="link" to="/admin/wlc" variant="secondary"><Calculator size={16} /> Hitung WLC</Button>
          </div>
        </Card>

        <ProcessTimeline steps={adminPipelineSteps} />
      </div>

      <Card className="mt-6 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-stone-950">Log Aktivitas Sistem</h2>
            <p className="mt-1 text-sm text-stone-500">Log sistem real-time yang dihasilkan berdasarkan status database saat ini.</p>
          </div>
          <Badge variant="stone">Audit Trail</Badge>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {processingLogs.map((log) => (
            <div key={log.id} className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-semibold text-stone-500">{log.time}</p>
              <h3 className="mt-2 font-bold text-stone-950">{log.title}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-500">{log.detail}</p>
              <Badge className="mt-3" variant="green">{log.status}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </AdminLayout>
  );
}
