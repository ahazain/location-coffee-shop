import Badge from "../common/Badge";
import Card from "../common/Card";
import { indicators } from "../../data/indicators";
import { getSuitabilityBadgeClass } from "../../utils/mapStyle";

function getIndicatorName(code) {
  return indicators.find((item) => item.code === code)?.name || code;
}

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

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Detail Lokasi</p>
          <h3 className="mt-1 text-xl font-bold text-stone-950">{selectedGrid.gridCode}</h3>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${getSuitabilityBadgeClass(selectedGrid.suitabilityClass)}`}>
          {selectedGrid.suitabilityClass}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-stone-50 p-3">
          <p className="text-xs text-stone-500">Kecamatan</p>
          <p className="font-semibold text-stone-900">{selectedGrid.kecamatan}</p>
        </div>
        <div className="rounded-2xl bg-stone-50 p-3">
          <p className="text-xs text-stone-500">Kelurahan</p>
          <p className="font-semibold text-stone-900">{selectedGrid.kelurahan}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-amber-50 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-amber-900">Skor WLC</span>
          <span className="text-2xl font-bold text-amber-900">{score.toFixed(3)}</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-white">
          <div className="h-2 rounded-full bg-amber-800" style={{ width: `${percentageScore}%` }} />
        </div>
        <p className="mt-2 text-xs text-amber-900">Skor berada pada skala 0-1. Rumus: S = Σ(Wi × Xi) × C, dengan Wi bobot AHP, Xi nilai fuzzy, dan C constraint.</p>
      </div>

      {selectedGrid.scoreCustom !== undefined && (
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl border border-stone-200 p-3">
            <p className="text-xs text-stone-500">Default</p>
            <p className="text-lg font-bold text-stone-900">{selectedGrid.scoreDefault?.toFixed(3) ?? "-"}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs text-amber-800">Custom</p>
            <p className="text-lg font-bold text-amber-900">{selectedGrid.scoreCustom.toFixed(3)}</p>
          </div>
        </div>
      )}

      {selectedGrid.topIndicators?.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-stone-800">Alasan teknis terbesar</p>
            <Badge variant="stone">Top 3</Badge>
          </div>

          <div className="mt-3 space-y-2">
            {selectedGrid.topIndicators.map((item, index) => (
              <div key={item.indicatorCode} className="rounded-2xl bg-stone-50 p-3 text-xs text-stone-600">
                <p className="font-semibold text-stone-800">
                  {index + 1}. {getIndicatorName(item.indicatorCode)}
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <span>Fuzzy: {item.fuzzyValue}</span>
                  <span>Bobot: {(item.weight * 100).toFixed(1)}%</span>
                  <span>Kontribusi: {item.contribution}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
