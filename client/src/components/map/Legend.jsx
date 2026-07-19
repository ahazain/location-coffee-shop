import { useMemo } from "react";
import Card from "../common/Card";
import { suitabilityStyles } from "../../utils/mapStyle";

const legendOrder = [
  "Sesuai",
  "Cukup Sesuai",
  "Kurang Sesuai",
];

export default function Legend({ geojson }) {
  const classRanges = useMemo(() => {
    if (!geojson?.features) {
      return {
        "Kurang Sesuai": "Skor rendah atau terkena kendala",
        "Cukup Sesuai": "Skor sedang",
        "Sesuai": "Skor tinggi",
      };
    }

    const ranges = {
      "Kurang Sesuai": { min: Infinity, max: -Infinity },
      "Cukup Sesuai": { min: Infinity, max: -Infinity },
      "Sesuai": { min: Infinity, max: -Infinity },
    };

    geojson.features.forEach((feature) => {
      const className = feature.properties.suitabilityClass;
      const score = feature.properties.scoreUsed ?? feature.properties.scoreDefault ?? 0;
      const isConstrained =
        feature.properties.isConstrained ??
        (feature.properties.indicatorScores?.sawah === 0 ||
         feature.properties.indicatorScores?.sempadan_sungai === 0);

      if (ranges[className]) {
        if (!isConstrained && score > 0) {
          if (score < ranges[className].min) ranges[className].min = score;
          if (score > ranges[className].max) ranges[className].max = score;
        }
      }
    });

    const maxKurang = ranges["Kurang Sesuai"].max;
    const maxCukup = ranges["Cukup Sesuai"].max;

    return {
      "Kurang Sesuai": maxKurang !== -Infinity && maxKurang !== Infinity
        ? `Skor ≤ ${maxKurang.toFixed(4)} atau terkena kendala`
        : "Skor ≤ 0.3333 atau terkena kendala",
      "Cukup Sesuai": maxKurang !== -Infinity && maxKurang !== Infinity && maxCukup !== -Infinity && maxCukup !== Infinity
        ? `${maxKurang.toFixed(4)} < Skor ≤ ${maxCukup.toFixed(4)}`
        : "0.3333 < Skor ≤ 0.6667",
      "Sesuai": maxCukup !== -Infinity && maxCukup !== Infinity
        ? `Skor > ${maxCukup.toFixed(4)}`
        : "Skor > 0.6667",
    };
  }, [geojson]);

  return (
    <Card className="p-4">
      <h3 className="font-semibold text-stone-900 text-sm">Legenda Kesesuaian</h3>
      <p className="mt-1 text-xs text-stone-500">Rentang skor dihitung dinamis menggunakan Jenks Natural Breaks.</p>

      <div className="mt-4 grid gap-3">
        {legendOrder.map((label) => (
          <div key={label} className="flex flex-col gap-1 rounded-2xl border border-stone-200/50 bg-stone-50/50 p-3">
            <div className="flex items-center gap-2">
              <span
                className="h-4.5 w-4.5 rounded-lg border border-white shadow-sm shrink-0"
                style={{ backgroundColor: suitabilityStyles[label].color }}
              />
              <span className="text-sm font-black text-stone-800">{label}</span>
            </div>
            <span className="text-xs text-stone-500 pl-6.5 font-medium leading-relaxed">
              {classRanges[label]}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}