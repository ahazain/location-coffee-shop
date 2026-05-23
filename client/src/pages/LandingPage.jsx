import { ArrowRight, BarChart3, BrainCircuit, Calculator, Database, Map, ShieldCheck, Sigma, Store } from "lucide-react";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import PublicLayout from "../layouts/PublicLayout";
import { criteria } from "../data/criteria";

const featureCards = [
  {
    icon: Map,
    title: "WebGIS Interaktif",
    description: "Menampilkan grid rekomendasi lokasi coffee shop berdasarkan skor kesesuaian spasial.",
  },
  {
    icon: BrainCircuit,
    title: "Bobot AHP Saaty",
    description: "Pembobotan pelaku usaha dipisahkan pada halaman khusus berbentuk wizard agar lebih mudah dipahami.",
  },
  {
    icon: ShieldCheck,
    title: "Admin Teknis",
    description: "Admin mengelola dataset, fuzzy otomatis, bobot default AHP, WLC, dan preview peta.",
  },
];

const processSteps = [
  { icon: Database, title: "Dataset spasial", text: "POI, jalan, populasi, cahaya malam, pesaing, grid, dan constraint disiapkan di admin." },
  { icon: Sigma, title: "Normalisasi fuzzy", text: "Nilai indikator distandarkan ke skala 0-1 sebagai Xi dalam WLC." },
  { icon: BrainCircuit, title: "Pembobotan AHP", text: "Bobot default berasal dari kuesioner pelaku usaha berpengalaman; pengguna dapat mengisi AHP pada halaman khusus." },
  { icon: Calculator, title: "Perhitungan WLC", text: "Skor akhir lokasi dihitung dengan S = Σ(Wi × Xi) × C lalu diklasifikasikan." },
  { icon: Map, title: "Peta rekomendasi", text: "Hasil ditampilkan sebagai peta, ranking grid, detail skor, dan alasan indikator terbesar." },
];

export default function LandingPage() {
  return (
    <PublicLayout>
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        <div>
          <Badge>WebGIS Coffee Shop Location</Badge>
          <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight text-stone-950 md:text-6xl">
            Sistem Pendukung Keputusan Lokasi Coffee Shop
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
            Prototype front end ini disesuaikan dengan proposal: fuzzy diproses otomatis di admin, bobot default dihitung dengan AHP dari kuesioner pelaku usaha berpengalaman, dan skor lokasi dihitung memakai Weighted Linear Combination.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button as="link" to="/peta-rekomendasi" className="px-6 py-3">
              Buka Peta Default <ArrowRight size={18} />
            </Button>
            <Button as="link" to="/pembobotan-ahp" variant="secondary" className="px-6 py-3">
              Atur Bobot AHP Saya
            </Button>
            <Button as="link" to="/admin/login" variant="secondary" className="px-6 py-3">
              Login Admin
            </Button>
          </div>

          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
            <div className="rounded-3xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur">
              <p className="text-2xl font-black text-stone-950">16</p>
              <p className="mt-1 text-xs text-stone-500">Grid dummy</p>
            </div>
            <div className="rounded-3xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur">
              <p className="text-2xl font-black text-stone-950">13</p>
              <p className="mt-1 text-xs text-stone-500">Indikator</p>
            </div>
            <div className="rounded-3xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur">
              <p className="text-2xl font-black text-stone-950">AHP</p>
              <p className="mt-1 text-xs text-stone-500">Wizard AHP</p>
            </div>
          </div>
        </div>

        <Card className="relative overflow-hidden p-5 lg:p-6">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-200/50 blur-3xl" />
          <div className="relative rounded-3xl bg-stone-950 p-5 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-amber-700 p-2"><Store size={24} /></span>
                <div>
                  <p className="text-sm font-semibold">Preview rekomendasi</p>
                  <p className="text-xs text-stone-300">Sumbersari, Kaliwates, Patrang</p>
                </div>
              </div>
              <Badge variant="green">WLC</Badge>
            </div>

            <div className="mt-6 grid grid-cols-4 gap-2">
              {["bg-green-700", "bg-lime-600", "bg-yellow-400", "bg-orange-500", "bg-lime-600", "bg-green-700", "bg-yellow-400", "bg-lime-600", "bg-yellow-400", "bg-orange-500", "bg-stone-500", "bg-red-600"].map((color, index) => (
                <div key={`${color}-${index}`} className={`h-20 rounded-2xl border border-white/20 ${color}`} />
              ))}
            </div>

            <div className="mt-6 rounded-3xl bg-white p-4 text-stone-950">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Grid terbaik</p>
                  <p className="mt-1 text-xl font-black">G001 - Tegal Gede</p>
                </div>
                <p className="text-3xl font-black text-green-700">0.84</p>
              </div>
              <div className="mt-4 h-2 rounded-full bg-stone-100">
                <div className="h-2 w-[84%] rounded-full bg-green-700" />
              </div>
              <p className="mt-3 text-xs text-stone-500">Skor = Σ bobot AHP × nilai fuzzy × constraint</p>
            </div>
          </div>
        </Card>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12">
        <div className="grid gap-4 md:grid-cols-3">
          {featureCards.map((feature) => {
            const Icon = feature.icon;

            return (
              <Card key={feature.title} className="p-6">
                <span className="inline-flex rounded-2xl bg-amber-100 p-3 text-amber-800">
                  <Icon />
                </span>
                <h3 className="mt-5 text-lg font-bold text-stone-950">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-16 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-amber-100 p-3 text-amber-800"><BarChart3 /></span>
            <div>
              <h2 className="text-xl font-bold text-stone-950">Alur Perhitungan Teknis</h2>
              <p className="text-sm text-stone-500">Dikemas agar mudah dijelaskan pada Bab 4.</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {processSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="flex gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-800 text-sm font-bold text-white">{index + 1}</span>
                  <div>
                    <p className="font-semibold text-stone-800"><Icon size={16} className="mr-1 inline" /> {step.title}</p>
                    <p className="mt-1 text-sm leading-6 text-stone-500">{step.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-stone-100 p-3 text-stone-700"><Database /></span>
            <div>
              <h2 className="text-xl font-bold text-stone-950">Kriteria yang Dipakai</h2>
              <p className="text-sm text-stone-500">Sesuai struktur kuesioner AHP.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {criteria.map((item) => (
              <div key={item.code} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <p className="font-semibold text-stone-950">{item.name}</p>
                <p className="mt-2 text-sm leading-6 text-stone-600">{item.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </PublicLayout>
  );
}
