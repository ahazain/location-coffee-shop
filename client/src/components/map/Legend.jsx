import Card from "../common/Card";
import { suitabilityStyles } from "../../utils/mapStyle";

const legendOrder = [
  "Sesuai",
  "Kurang sesuai",
  "Tidak sesuai",
];

export default function Legend() {
  return (
    <Card className="p-4">
      <h3 className="font-semibold text-stone-900">Legenda Kesesuaian</h3>
      <p className="mt-1 text-xs text-stone-500">Warna mengikuti kelas skor WLC.</p>

      <div className="mt-4 grid gap-2">
        {legendOrder.map((label) => (
          <div key={label} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span
                className="h-4 w-4 rounded-md border border-white shadow-sm"
                style={{ backgroundColor: suitabilityStyles[label].color }}
              />
              <span className="text-stone-700">{label}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}