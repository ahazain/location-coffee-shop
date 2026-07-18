import { ArrowDown, ArrowRight, BarChart3, BrainCircuit, Calculator, Database, Map, ShieldCheck, Sigma, Store } from "lucide-react";
import Card from "../components/common/Card";
import PublicLayout from "../layouts/PublicLayout";
import { criteria } from "../data/criteria";

// Layer disusun dari dasar (raster mentah) ke puncak (constraint), meniru urutan proses WLC
const previewLayers = [
  { label: "Kepadatan Populasi", swatch: "bg-blue-400", tint: "bg-blue-500/75" },
  { label: "Jalan & Akses", swatch: "bg-emerald-400", tint: "bg-emerald-500/75" },
  { label: "Titik Pesaing", swatch: "bg-amber-400", tint: "bg-amber-500/75" },
  { label: "Constraint Mask", swatch: "bg-rose-400", tint: "bg-rose-500/75" },
];

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
          <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#577590] shadow-xs">
            WebGIS Coffee Shop Location
          </span>
          <h1 className="mt-6 max-w-4xl text-4xl font-extrabold tracking-tight text-[#1D3557] md:text-6xl">
            Sistem Pendukung Keputusan Lokasi Coffee Shop
          </h1>
          <p className="mt-6 max-w-2xl text-base font-medium leading-8 text-stone-500">
            Aplikasi WebGIS ini dikembangkan untuk membantu pelaku usaha menemukan lokasi pendirian kedai kopi yang sesuai melalui analisis berbagai indikator. Sistem mengolah data menggunakan standardisasi fuzzy, bobot AHP berdasarkan penilaian pemilik kedai kopi berpengalaman di industri F&B, serta metode Weighted Linear Combination (WLC) untuk menghasilkan rekomendasi lokasi yang sistematis dan berbasis pengalaman praktis.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="/peta-rekomendasi"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1D3557] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-[#2c4c78] active:scale-95"
            >
              Buka Peta Default <ArrowRight size={16} />
            </a>
            <a
              href="/pembobotan-ahp"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-6 py-3 text-xs font-bold uppercase tracking-wider text-stone-600 shadow-xs transition hover:bg-stone-50 active:scale-95"
            >
              Atur Bobot AHP Saya
            </a>
          </div>


        </div>

        <Card className="relative overflow-hidden p-5 border border-stone-200/60 shadow-xs rounded-3xl lg:p-6">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-100/50 blur-3xl" />
          <div className="relative rounded-3xl bg-[#1D3557] p-5 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-white/10 p-2.5 text-white"><Store size={22} /></span>
                <div>
                  <p className="text-sm font-extrabold tracking-wide">Preview rekomendasi</p>
                  <p className="text-[11px] font-medium text-blue-100/70">Sumbersari, Kaliwates, Patrang</p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full border border-amber-200/40 bg-amber-50/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                WLC
              </span>
            </div>

            {/* Ilustrasi 3D: tumpukan layer GIS yang di-overlay menjadi satu skor */}
            <div className="mt-8 flex flex-col items-center">
              <div className="flex items-center justify-center py-2" style={{ perspective: "900px" }}>
                <div
                  className="relative h-24 w-44"
                  style={{ transformStyle: "preserve-3d", transform: "rotateX(55deg) rotateZ(-38deg)" }}
                >
                  {previewLayers.map((layer, index) => (
                    <div
                      key={layer.label}
                      className={`absolute inset-0 rounded-2xl border border-white/25 shadow-lg ${layer.tint}`}
                      style={{ transform: `translateZ(${index * 20}px)` }}
                    >
                      <div className="grid h-full grid-cols-5 grid-rows-3 gap-[2px] p-[3px]">
                        {Array.from({ length: 15 }).map((_, cellIndex) => (
                          <div key={cellIndex} className="rounded-[2px] bg-white/15" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                {previewLayers.map((layer) => (
                  <div key={layer.label} className="flex items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${layer.swatch}`} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-100/80">{layer.label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-col items-center gap-1 text-blue-100/60">
                <span className="text-[10px] font-bold uppercase tracking-widest">S = Σ(Wi × Xi) × C</span>
                <ArrowDown size={14} />
              </div>
            </div>

            <div className="mt-4 rounded-3xl bg-white p-4 text-stone-950 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Grid terbaik</p>
                  <p className="mt-1 text-xl font-extrabold text-[#1D3557]">G001 - Tegal Gede</p>
                </div>
                <p className="text-3xl font-extrabold text-emerald-600">0.84</p>
              </div>
              <div className="mt-4 h-2 rounded-full bg-stone-100">
                <div className="h-2 w-[84%] rounded-full bg-emerald-600" />
              </div>
              <p className="mt-3 text-[11px] font-medium text-stone-400">Skor = Σ bobot AHP × nilai fuzzy × constraint</p>
            </div>
          </div>
        </Card>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12">
        <div className="grid gap-4 md:grid-cols-3">
          {featureCards.map((feature) => {
            const Icon = feature.icon;

            return (
              <Card key={feature.title} className="p-6 border border-stone-200/60 shadow-xs rounded-3xl">
                <span className="inline-flex rounded-2xl bg-blue-50 p-3.5 text-[#577590] border border-blue-100/50 shadow-xs">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-base font-extrabold text-[#1D3557] tracking-wide">{feature.title}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-stone-500">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-16 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="p-6 border border-stone-200/60 shadow-xs rounded-3xl">
          <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
            <span className="rounded-2xl bg-blue-50 p-3.5 text-[#577590] border border-blue-100/50 shadow-xs"><BarChart3 className="h-5 w-5" /></span>
            <div>
              <h2 className="text-base font-extrabold text-[#1D3557] tracking-wide">Alur Perhitungan Teknis</h2>
              <p className="text-xs font-medium text-stone-400">Dikemas agar mudah dijelaskan pada Bab 4.</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {processSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="flex gap-3 rounded-2xl border border-stone-100 bg-stone-50/50 p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1D3557] text-sm font-bold text-white">{index + 1}</span>
                  <div>
                    <p className="font-extrabold text-[#1D3557] text-sm"><Icon size={15} className="mr-1 inline text-[#577590]" /> {step.title}</p>
                    <p className="mt-1 text-xs font-medium leading-6 text-stone-500">{step.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6 border border-stone-200/60 shadow-xs rounded-3xl">
          <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
            <span className="rounded-2xl bg-blue-50 p-3.5 text-[#577590] border border-blue-100/50 shadow-xs"><Database className="h-5 w-5" /></span>
            <div>
              <h2 className="text-base font-extrabold text-[#1D3557] tracking-wide">Kriteria yang Dipakai</h2>
              <p className="text-xs font-medium text-stone-400">Sesuai struktur kuesioner AHP.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {criteria.map((item) => (
              <div key={item.code} className="rounded-2xl border border-stone-100 bg-stone-50/50 p-4">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600">
                  {item.code}
                </p>
                <p className="mt-2 font-extrabold text-[#1D3557] text-sm">{item.name}</p>
                <p className="mt-2 text-xs font-medium leading-6 text-stone-500">{item.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </PublicLayout>
  );
}