import { ArrowLeftRight } from "lucide-react";
import { saatyScale } from "../../utils/ahp";
import { cn } from "../../utils/className";
import Card from "../common/Card";

const preferenceOptions = [
  { value: "left", label: "Pilihan A lebih penting" },
  { value: "equal", label: "Sama penting" },
  { value: "right", label: "Pilihan B lebih penting" },
];

export default function AhpPairwiseQuestion({
  pair,
  value,
  onChange,
  title = "Pertanyaan AHP",
  helper,
  questionNumber,
  totalQuestions,
}) {
  const comparison = value || { preference: "equal", intensity: 1 };

  function setPreference(preference) {
    onChange({
      preference,
      intensity: preference === "equal" ? 1 : Number(comparison.intensity || 3),
    });
  }

  function setIntensity(intensity) {
    onChange({
      preference: comparison.preference === "equal" ? "left" : comparison.preference,
      intensity: Number(intensity),
    });
  }

  return (
    <Card className="p-5">
      <div className="flex flex-col justify-between gap-3 border-b border-stone-100 pb-4 md:flex-row md:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">{title}</p>
          <h2 className="mt-1 text-2xl font-black text-stone-950">Mana yang lebih penting?</h2>
          {helper && <p className="mt-2 text-sm leading-6 text-stone-500">{helper}</p>}
        </div>
        {questionNumber && totalQuestions && (
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-600">
            {questionNumber} dari {totalQuestions}
          </span>
        )}
      </div>

      <div className="mt-5 grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
        <button
          type="button"
          onClick={() => setPreference("left")}
          className={cn(
            "min-h-32 rounded-3xl border p-5 text-left transition hover:border-amber-700 hover:bg-amber-50",
            comparison.preference === "left" ? "border-amber-700 bg-amber-50 ring-2 ring-amber-100" : "border-stone-200 bg-white",
          )}
        >
          <span className="text-xs font-bold uppercase tracking-wide text-stone-400">Pilihan A</span>
          <span className="mt-2 block text-xl font-black text-stone-950">{pair.left.name}</span>
          {pair.left.description && <span className="mt-2 block text-sm leading-6 text-stone-500">{pair.left.description}</span>}
        </button>

        <div className="flex justify-center">
          <span className="rounded-full bg-stone-100 p-3 text-stone-500">
            <ArrowLeftRight size={22} />
          </span>
        </div>

        <button
          type="button"
          onClick={() => setPreference("right")}
          className={cn(
            "min-h-32 rounded-3xl border p-5 text-left transition hover:border-amber-700 hover:bg-amber-50",
            comparison.preference === "right" ? "border-amber-700 bg-amber-50 ring-2 ring-amber-100" : "border-stone-200 bg-white",
          )}
        >
          <span className="text-xs font-bold uppercase tracking-wide text-stone-400">Pilihan B</span>
          <span className="mt-2 block text-xl font-black text-stone-950">{pair.right.name}</span>
          {pair.right.description && <span className="mt-2 block text-sm leading-6 text-stone-500">{pair.right.description}</span>}
        </button>
      </div>

      <div className="mt-5 rounded-3xl bg-stone-50 p-4">
        <p className="text-sm font-bold text-stone-800">Pilih arah perbandingan</p>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {preferenceOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPreference(option.value)}
              className={cn(
                "rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                comparison.preference === option.value
                  ? "border-amber-700 bg-white text-amber-900 shadow-sm"
                  : "border-stone-200 bg-white text-stone-600 hover:bg-amber-50",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-stone-800">Tingkat kepentingan</p>
            <p className="text-xs text-stone-500">{comparison.preference === "equal" ? "Otomatis 1 karena sama penting" : `Nilai dipilih: ${comparison.intensity}`}</p>
          </div>
          <div className="mt-3 grid grid-cols-9 gap-1.5">
            {saatyScale.map((item) => (
              <button
                key={item.value}
                type="button"
                disabled={comparison.preference === "equal"}
                onClick={() => setIntensity(item.value)}
                className={cn(
                  "rounded-xl border py-2 text-sm font-black transition disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-300",
                  Number(comparison.intensity) === item.value && comparison.preference !== "equal"
                    ? "border-amber-700 bg-amber-800 text-white"
                    : "border-stone-200 bg-white text-stone-700 hover:bg-amber-50",
                )}
                title={item.label}
              >
                {item.value}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
