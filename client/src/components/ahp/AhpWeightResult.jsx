import { BarChart3 } from "lucide-react";
import { criteria } from "../../data/criteria";
import { indicators } from "../../data/indicators";
import { formatPercent } from "../../utils/ahp";
import Card from "../common/Card";

function WeightBar({ label, value, helper }) {
  const numericValue = Number(value || 0);

  return (
    <div>
      <div className="mb-1 flex items-start justify-between gap-3 text-sm">
        <div>
          <p className="font-semibold text-stone-800">{label}</p>
          {helper && <p className="text-xs leading-5 text-stone-500">{helper}</p>}
        </div>
        <span className="font-black text-stone-950">{formatPercent(numericValue)}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-stone-100">
        <div className="h-full rounded-full bg-amber-800" style={{ width: `${Math.min(numericValue, 100)}%` }} />
      </div>
    </div>
  );
}

export default function AhpWeightResult({ criteriaWeights = {}, localIndicatorWeights = {}, globalIndicatorWeights = {} }) {
  const sortedIndicators = [...indicators].sort((a, b) => Number(globalIndicatorWeights[b.code] || 0) - Number(globalIndicatorWeights[a.code] || 0));

  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-amber-100 p-2 text-amber-800"><BarChart3 size={18} /></span>
          <div>
            <h3 className="font-bold text-stone-950">Bobot Kriteria</h3>
            <p className="text-sm text-stone-500">Hasil dari perbandingan antar 6 kriteria.</p>
          </div>
        </div>
        <div className="mt-4 space-y-4">
          {criteria.map((criterion) => (
            <WeightBar
              key={criterion.code}
              label={criterion.name}
              value={criteriaWeights[criterion.code]}
              helper={criterion.shortName}
            />
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-stone-100 p-2 text-stone-700"><BarChart3 size={18} /></span>
          <div>
            <h3 className="font-bold text-stone-950">Bobot Akhir Indikator</h3>
            <p className="text-sm text-stone-500">Bobot akhir = bobot kriteria × bobot lokal indikator.</p>
          </div>
        </div>
        <div className="mt-4 space-y-4">
          {sortedIndicators.map((indicator) => (
            <WeightBar
              key={indicator.code}
              label={indicator.name}
              value={globalIndicatorWeights[indicator.code]}
              helper={`Lokal: ${formatPercent(localIndicatorWeights[indicator.criteriaCode]?.[indicator.code] || 0)}`}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
