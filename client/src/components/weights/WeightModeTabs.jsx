import { BrainCircuit, ShieldCheck } from "lucide-react";
import Card from "../common/Card";
import { cn } from "../../utils/className";

const modes = [
  {
    key: "default",
    label: "Bobot default AHP",
    description: "Dari 3 pelaku usaha berpengalaman",
    icon: ShieldCheck,
  },
  {
    key: "ahp",
    label: "AHP pelaku usaha",
    description: "Perbandingan berpasangan Saaty",
    icon: BrainCircuit,
  },
];

export default function WeightModeTabs({ activeMode, onChange }) {
  return (
    <Card className="p-4">
      <h3 className="font-semibold text-stone-900">Mode Pembobotan</h3>
      <p className="mt-1 text-sm text-stone-500">Tidak ada mode cepat. Bobot custom dihitung dengan AHP sesuai kuesioner.</p>

      <div className="mt-4 grid gap-2">
        {modes.map((mode) => {
          const Icon = mode.icon;

          return (
            <button
              key={mode.key}
              onClick={() => onChange(mode.key)}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition",
                activeMode === mode.key
                  ? "border-amber-800 bg-amber-50 shadow-sm"
                  : "border-stone-200 bg-white hover:bg-stone-50",
              )}
            >
              <span className="rounded-xl bg-white p-2 text-amber-800 shadow-sm">
                <Icon size={18} />
              </span>
              <span>
                <span className="block font-semibold text-stone-900">{mode.label}</span>
                <span className="block text-xs text-stone-500">{mode.description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
