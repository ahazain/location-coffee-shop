import Badge from "../common/Badge";
import Card from "../common/Card";
import { criteria } from "../../data/criteria";

function getCriteriaName(code) {
  return criteria.find((item) => item.code === code)?.shortName || code;
}

function fuzzyLabel(type) {
  if (type === "increasing") return "Benefit";
  if (type === "decreasing") return "Cost";
  return "Optimum";
}

export default function IndicatorTable({ indicators }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-stone-200 p-5">
        <h2 className="text-lg font-bold text-stone-950">Indikator Fuzzy</h2>
        <p className="mt-1 text-sm text-stone-500">Indikator masih dummy untuk validasi tampilan halaman admin.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-5 py-3">Indikator</th>
              <th className="px-5 py-3">Kriteria</th>
              <th className="px-5 py-3">Satuan</th>
              <th className="px-5 py-3">Fuzzy</th>
              <th className="px-5 py-3">Arah Preferensi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {indicators.map((indicator) => (
              <tr key={indicator.code} className="hover:bg-stone-50">
                <td className="px-5 py-4">
                  <p className="font-semibold text-stone-900">{indicator.name}</p>
                  <p className="mt-1 text-xs text-stone-500">{indicator.code}</p>
                </td>
                <td className="px-5 py-4 text-stone-600">{getCriteriaName(indicator.criteriaCode)}</td>
                <td className="px-5 py-4 text-stone-600">{indicator.unit}</td>
                <td className="px-5 py-4"><Badge variant="amber">{fuzzyLabel(indicator.fuzzyType)}</Badge></td>
                <td className="px-5 py-4 text-stone-600">{indicator.direction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
