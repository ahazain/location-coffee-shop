import Badge from "../common/Badge";
import Card from "../common/Card";
import { indicators } from "../../data/indicators";
import { getSuitabilityBadgeClass } from "../../utils/mapStyle";

const codeMapping = {
  kepadatan_makan: "kepadatan_layanan_makan_non_coffee",
  kepadatan_olahraga: "kepadatan_layanan_olahraga_rekreasi",
  hunian_komersial: "kepadatan_hunian",
  jarak_pusat_komersial: "kedekatan_pusat_belanja",
  kepadatan_pendidikan: "kepadatan_kampus_fasilitas_pendidikan",
  kepadatan_kantor: "kepadatan_kantor_jasa_keuangan_bisnis",
  cahaya_malam: "intensitas_cahaya_malam",
  kepadatan_populasi: "kepadatan_populasi",
  jarak_jalan: "jarak_jalan_utama",
  jarak_transportasi: "kedekatan_simpul_transportasi",
  kepadatan_simpang: "kepadatan_simpang_jalan",
  kepadatan_pesaing: "kepadatan_coffee_shop_existing",
  jarak_pesaing: "jarak_coffee_shop_existing_terdekat",
};

export default function GridDetailPanel({ selectedGrid }) {
  if (!selectedGrid) {
    return (
      <Card className="p-4">
        <h3 className="font-semibold text-stone-900">Detail Lokasi</h3>
        <p className="mt-2 text-sm text-stone-500">
          Klik salah satu grid pada peta untuk melihat detail skor lokasi, kelas kesesuaian, dan kontribusi indikator.
        </p>
      </Card>
    );
  }

  const score = selectedGrid.scoreUsed ?? selectedGrid.scoreDefault ?? 0;
  const percentageScore = Math.round(score * 100);
  const scores = selectedGrid.indicatorScores || {};

  return (
    <Card className="p-5">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Kolom 1: Detail & Status Constraint */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Detail Lokasi</p>
              <h3 className="mt-1 text-xl font-bold text-stone-950">{selectedGrid.gridCode}</h3>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${getSuitabilityBadgeClass(selectedGrid.suitabilityClass)}`}>
              {selectedGrid.suitabilityClass}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-stone-50 p-3">
              <p className="text-xs text-stone-500">Kecamatan</p>
              <p className="font-semibold text-stone-900">{selectedGrid.kecamatan || "-"}</p>
            </div>
            <div className="rounded-2xl bg-stone-50 p-3">
              <p className="text-xs text-stone-500">Kelurahan</p>
              <p className="font-semibold text-stone-900">{selectedGrid.kelurahan || "-"}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-amber-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-amber-900">Skor WLC</span>
              <span className="text-2xl font-bold text-amber-900">{score.toFixed(4)}</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white">
              <div className="h-2 rounded-full bg-amber-800" style={{ width: `${percentageScore}%` }} />
            </div>
            <p className="mt-2 text-[10px] text-amber-950/80 leading-relaxed">
              Skor skala 0-1. S = Σ(Wi × Xi) × C, dengan Wi bobot AHP, Xi nilai fuzzy, dan C constraint (0=melanggar, 1=aman).
            </p>
          </div>

          {/* Constraints Status */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-stone-700">Status Pembatas Lahan (Constraint)</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className={`rounded-xl p-2.5 border flex flex-col justify-between ${scores.sawah === 0 ? "border-red-200 bg-red-50 text-red-700" : "border-stone-200 bg-stone-50 text-stone-600"}`}>
                <span className="text-[10px] uppercase font-semibold">Lahan Sawah</span>
                <span className="mt-1 font-bold">{scores.sawah === 0 ? "⚠️ Melanggar" : "✅ Aman"}</span>
              </div>
              <div className={`rounded-xl p-2.5 border flex flex-col justify-between ${scores.sempadan_sungai === 0 ? "border-red-200 bg-red-50 text-red-700" : "border-stone-200 bg-stone-50 text-stone-600"}`}>
                <span className="text-[10px] uppercase font-semibold">Sungai</span>
                <span className="mt-1 font-bold">{scores.sempadan_sungai === 0 ? "⚠️ Melanggar" : "✅ Aman"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom 2 & 3: Indicators List (Tampil 2-Column Grid) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <p className="text-xs font-semibold text-stone-700 font-bold">Nilai & Fuzzy Indikator</p>
            <span className="text-[10px] text-stone-400 font-medium">13 Indikator</span>
          </div>

          <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 max-h-[38vh] lg:max-h-none overflow-y-auto pr-1">
            {indicators.map((item) => {
              const backendKey = codeMapping[item.code] || item.code;
              const rawVal = scores[backendKey] !== undefined ? scores[backendKey] : "-";
              const fuzzyVal = scores["fuzzy_" + backendKey] !== undefined ? scores["fuzzy_" + backendKey] : "-";
              const bobotVal = scores["bobot_" + backendKey] !== undefined ? scores["bobot_" + backendKey] : "-";
              const terbobotVal = scores["terbobot_" + backendKey] !== undefined ? scores["terbobot_" + backendKey] : "-";

              return (
                <div key={item.code} className="text-xs flex flex-col gap-1.5 border-b border-stone-100 pb-2">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-stone-850 leading-tight pr-2">{item.name}</span>
                    <span className="shrink-0 text-[10px] font-mono rounded bg-stone-100 px-1.5 py-0.5 text-stone-600 font-bold">
                      Fuzzy: <span className="text-stone-950 font-bold">{typeof fuzzyVal === "number" ? fuzzyVal.toFixed(3) : fuzzyVal}</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 bg-stone-50 rounded-lg p-1.5 text-[10px] text-stone-650 font-mono">
                    <div>
                      <span className="text-[9px] uppercase text-stone-400 block font-sans">Nilai Asli</span>
                      <span className="font-bold text-stone-800">{rawVal}</span> <span className="text-[8px] text-stone-400 font-sans">{item.unit}</span>
                    </div>
                    <div className="border-l border-stone-200 pl-2">
                      <span className="text-[9px] uppercase text-stone-400 block font-sans">Bobot AHP</span>
                      <span className="font-bold text-stone-800">{typeof bobotVal === "number" ? bobotVal.toFixed(4) : bobotVal}</span>
                    </div>
                    <div className="border-l border-stone-200 pl-2">
                      <span className="text-[9px] uppercase text-stone-400 block font-sans">Terbobot</span>
                      <span className="font-bold text-stone-900">{typeof terbobotVal === "number" ? terbobotVal.toFixed(4) : terbobotVal}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
