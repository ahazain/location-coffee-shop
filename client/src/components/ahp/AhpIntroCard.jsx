import { BookOpenCheck, BrainCircuit, Calculator, MapPinned } from "lucide-react";
import Badge from "../common/Badge";
import Card from "../common/Card";

const steps = [
  {
    icon: BrainCircuit,
    title: "Bandingkan faktor",
    text: "Pelaku usaha memilih faktor mana yang lebih penting berdasarkan pengalaman dan strategi bisnis.",
  },
  {
    icon: BookOpenCheck,
    title: "Sistem hitung AHP",
    text: "Jawaban diubah menjadi matriks perbandingan berpasangan, bobot prioritas, CI, dan CR.",
  },
  {
    icon: Calculator,
    title: "Bobot masuk ke WLC",
    text: "Bobot AHP dikalikan nilai fuzzy setiap indikator untuk menghasilkan skor lokasi.",
  },
  {
    icon: MapPinned,
    title: "Peta diperbarui",
    text: "Jika CR konsisten, peta rekomendasi menampilkan hasil sesuai prioritas pelaku usaha.",
  },
];

export default function AhpIntroCard() {
  return (
    <Card className="overflow-hidden p-0">
      <div className="bg-stone-950 p-6 text-white">
        <Badge variant="green">Pembobotan pelaku usaha</Badge>
        <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">Atur Bobot dengan AHP</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-300">
          Halaman ini dibuat seperti kuesioner digital. Anda cukup membandingkan dua faktor, memilih mana yang lebih penting, lalu menentukan tingkat kepentingannya memakai skala Saaty 1 sampai 9.
        </p>
      </div>

      <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <div key={step.title} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-800 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <span className="rounded-2xl bg-amber-100 p-2 text-amber-800">
                  <Icon size={18} />
                </span>
              </div>
              <h3 className="mt-4 font-bold text-stone-950">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-600">{step.text}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
