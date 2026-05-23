import { useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, Info, RotateCcw, TriangleAlert } from "lucide-react";
import Badge from "../common/Badge";
import Button from "../common/Button";
import Card from "../common/Card";
import { criteria } from "../../data/criteria";
import { indicators } from "../../data/indicators";
import {
  calculateAhpFromComparisons,
  createEqualComparisons,
  generatePairs,
  saatyScale,
} from "../../utils/ahp";
import { cn } from "../../utils/className";

function getIndicatorsByCriteria(criteriaCode) {
  return indicators.filter((indicator) => indicator.criteriaCode === criteriaCode);
}

function buildInitialIndicatorComparisons() {
  return Object.fromEntries(
    criteria.map((criterion) => {
      const items = getIndicatorsByCriteria(criterion.code);
      return [criterion.code, createEqualComparisons(generatePairs(items))];
    }),
  );
}

function AhpQuestionRow({ pair, value, onChange }) {
  const comparison = value || { preference: "equal", intensity: 1 };

  function updatePreference(preference) {
    onChange({
      preference,
      intensity: preference === "equal" ? 1 : Number(comparison.intensity || 3),
    });
  }

  function updateIntensity(intensity) {
    onChange({
      preference: comparison.preference === "equal" ? "left" : comparison.preference,
      intensity: Number(intensity),
    });
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-3 md:grid-cols-[1fr_160px_170px] md:items-center">
      <div>
        <p className="text-sm font-semibold text-stone-900">{pair.left.name}</p>
        <p className="text-xs text-stone-400">dibandingkan dengan</p>
        <p className="text-sm font-semibold text-stone-900">{pair.right.name}</p>
      </div>

      <select
        value={comparison.preference}
        onChange={(event) => updatePreference(event.target.value)}
        className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 outline-none focus:border-amber-700"
      >
        <option value="left">A lebih penting</option>
        <option value="equal">Sama penting</option>
        <option value="right">B lebih penting</option>
      </select>

      <select
        value={comparison.intensity}
        onChange={(event) => updateIntensity(event.target.value)}
        disabled={comparison.preference === "equal"}
        className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 outline-none focus:border-amber-700 disabled:bg-stone-100 disabled:text-stone-400"
      >
        {saatyScale.map((item) => (
          <option key={item.value} value={item.value}>{item.label}</option>
        ))}
      </select>
    </div>
  );
}

function ResultPills({ result }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      <div className="rounded-2xl bg-stone-50 p-3">
        <p className="text-xs text-stone-500">λ max</p>
        <p className="mt-1 font-black text-stone-950">{result.lambdaMax}</p>
      </div>
      <div className="rounded-2xl bg-stone-50 p-3">
        <p className="text-xs text-stone-500">CI</p>
        <p className="mt-1 font-black text-stone-950">{result.ci}</p>
      </div>
      <div className="rounded-2xl bg-stone-50 p-3">
        <p className="text-xs text-stone-500">CR</p>
        <p className={cn("mt-1 font-black", result.isConsistent ? "text-green-700" : "text-red-600")}>{result.cr}</p>
      </div>
    </div>
  );
}

function WeightList({ items, weights }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.code}>
          <div className="mb-1 flex items-center justify-between text-xs font-semibold text-stone-600">
            <span>{item.shortName || item.name}</span>
            <span>{Number(weights[item.code] || 0).toFixed(2)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full rounded-full bg-amber-700" style={{ width: `${Math.min(Number(weights[item.code] || 0), 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AhpWeightPanel({ onApply, onReset, isApplying = false }) {
  const criteriaPairs = useMemo(() => generatePairs(criteria), []);
  const [criteriaComparisons, setCriteriaComparisons] = useState(() => createEqualComparisons(criteriaPairs));
  const [indicatorComparisons, setIndicatorComparisons] = useState(() => buildInitialIndicatorComparisons());

  const criteriaResult = useMemo(
    () => calculateAhpFromComparisons(criteria, criteriaComparisons),
    [criteriaComparisons],
  );

  const localResults = useMemo(() => Object.fromEntries(
    criteria.map((criterion) => {
      const items = getIndicatorsByCriteria(criterion.code);
      return [criterion.code, calculateAhpFromComparisons(items, indicatorComparisons[criterion.code])];
    }),
  ), [indicatorComparisons]);

  const allLocalConsistent = Object.values(localResults).every((result) => result.isConsistent);
  const isConsistent = criteriaResult.isConsistent && allLocalConsistent;

  function updateCriteriaComparison(key, value) {
    setCriteriaComparisons((current) => ({ ...current, [key]: value }));
  }

  function updateIndicatorComparison(criteriaCode, key, value) {
    setIndicatorComparisons((current) => ({
      ...current,
      [criteriaCode]: {
        ...current[criteriaCode],
        [key]: value,
      },
    }));
  }

  function resetAhpForm() {
    setCriteriaComparisons(createEqualComparisons(criteriaPairs));
    setIndicatorComparisons(buildInitialIndicatorComparisons());
    onReset?.();
  }

  function applyAhp() {
    onApply({ criteriaComparisons, indicatorComparisons, criteriaResult, localResults });
  }

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <span className="rounded-2xl bg-amber-100 p-2 text-amber-800"><Info size={18} /></span>
        <div>
          <h3 className="font-bold text-stone-950">Pembobotan AHP Pelaku Usaha</h3>
          <p className="mt-1 text-sm leading-6 text-stone-500">
            Isi perbandingan berpasangan seperti kuesioner. Sistem menghitung bobot, λ max, CI, CR, lalu WLC dihitung ulang ketika CR ≤ 0,1.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <p className="font-semibold">Urutan logika untuk Bab 4</p>
        <p className="mt-1 leading-6">Nilai fuzzy indikator sudah tersedia dari admin. Pelaku usaha hanya mengisi prioritas AHP. Bobot akhir indikator = bobot kriteria × bobot lokal indikator. Skor lokasi = Σ(Wi × Xi) × C.</p>
      </div>

      <details className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-3" open>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-stone-900">
          Tahap 1 - Perbandingan antar kriteria
          <ChevronDown size={18} />
        </summary>
        <div className="mt-3 space-y-3">
          {criteriaPairs.map((pair) => (
            <AhpQuestionRow
              key={pair.key}
              pair={pair}
              value={criteriaComparisons[pair.key]}
              onChange={(value) => updateCriteriaComparison(pair.key, value)}
            />
          ))}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr]">
          <ResultPills result={criteriaResult} />
          <WeightList items={criteria} weights={criteriaResult.weightsPercent} />
        </div>
      </details>

      <details className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-3">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-stone-900">
          Tahap 2 - Perbandingan indikator dalam kriteria
          <ChevronDown size={18} />
        </summary>
        <div className="mt-3 space-y-4">
          {criteria.map((criterion) => {
            const items = getIndicatorsByCriteria(criterion.code);
            const pairs = generatePairs(items);
            const result = localResults[criterion.code];

            return (
              <div key={criterion.code} className="rounded-2xl bg-white p-3">
                <div className="mb-3 flex flex-col justify-between gap-2 md:flex-row md:items-center">
                  <div>
                    <p className="font-semibold text-stone-900">{criterion.name}</p>
                    <p className="text-xs text-stone-500">{items.length} indikator, {pairs.length} perbandingan</p>
                  </div>
                  <Badge variant={result.isConsistent ? "green" : "red"}>CR {result.cr}</Badge>
                </div>

                <div className="space-y-2">
                  {pairs.map((pair) => (
                    <AhpQuestionRow
                      key={pair.key}
                      pair={pair}
                      value={indicatorComparisons[criterion.code]?.[pair.key]}
                      onChange={(value) => updateIndicatorComparison(criterion.code, pair.key, value)}
                    />
                  ))}
                </div>

                <div className="mt-3">
                  <WeightList items={items} weights={result.weightsPercent} />
                </div>
              </div>
            );
          })}
        </div>
      </details>

      <div className="mt-4 rounded-2xl bg-stone-50 p-3">
        <div className="flex items-start gap-3">
          <span className={cn("rounded-2xl p-2", isConsistent ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
            {isConsistent ? <CheckCircle2 size={18} /> : <TriangleAlert size={18} />}
          </span>
          <div>
            <p className="font-semibold text-stone-900">
              {isConsistent ? "Penilaian konsisten" : "Penilaian belum konsisten"}
            </p>
            <p className="mt-1 text-sm leading-6 text-stone-500">
              {isConsistent
                ? "Bobot dapat diterapkan untuk menghitung ulang WLC dan memperbarui peta."
                : "Perbaiki nilai perbandingan hingga CR kriteria dan indikator bernilai maksimal 0,1."}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button variant="ghost" onClick={resetAhpForm}><RotateCcw size={16} /> Reset ke sama penting</Button>
        <Button onClick={applyAhp} disabled={!isConsistent || isApplying}>{isApplying ? "Menghitung..." : "Terapkan AHP ke Peta"}</Button>
      </div>
    </Card>
  );
}
