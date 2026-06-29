import { Edit2, Trash2 } from "lucide-react";
import Badge from "../common/Badge";
import Card from "../common/Card";

function fuzzyLabel(type) {
  if (type === "linear_increasing") return "Benefit (Linear Increasing)";
  if (type === "linear_decreasing") return "Cost (Linear Decreasing)";
  if (type === "near") return "Optimum (Near)";
  return type; // fallback
}

export default function IndicatorTable({ indicators, loading, onEdit, onDelete }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-stone-200 p-5">
        <h2 className="text-lg font-bold text-stone-950">Daftar Indikator Penilaian</h2>
        <p className="mt-1 text-sm text-stone-500">Data indikator untuk proses Fuzzy dan WLC.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-5 py-3">Urutan</th>
              <th className="px-5 py-3">Indikator</th>
              <th className="px-5 py-3">Kriteria</th>
              <th className="px-5 py-3">Satuan</th>
              <th className="px-5 py-3">Tipe Fuzzy</th>
              <th className="px-5 py-3">Arah Preferensi</th>
              <th className="px-5 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-5 py-10 text-center text-stone-400">Loading data...</td>
              </tr>
            ) : indicators.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-5 py-10 text-center text-stone-400">Tidak ada indikator yang sesuai kriteria pencarian.</td>
              </tr>
            ) : (
              indicators.map((indicator) => (
                <tr key={indicator.id_indikator} className="hover:bg-stone-50">
                  <td className="px-5 py-4 font-medium text-stone-900">{indicator.urutan}</td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-stone-900">{indicator.nama_indikator}</p>
                    <p className="mt-1 text-xs text-stone-500">{indicator.kode_indikator}</p>
                  </td>
                  <td className="px-5 py-4 text-stone-600">
                    {indicator.kriteria ? indicator.kriteria.nama_kriteria : "-"}
                  </td>
                  <td className="px-5 py-4 text-stone-600">{indicator.satuan || "-"}</td>
                  <td className="px-5 py-4"><Badge variant="amber">{fuzzyLabel(indicator.fungsi_fuzzy)}</Badge></td>
                  <td className="px-5 py-4 text-stone-600 capitalize">{indicator.arah_preferensi}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onEdit(indicator)}
                        className="rounded-lg p-2 text-stone-400 transition hover:bg-stone-100 hover:text-amber-700"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(indicator.id_indikator)}
                        className="rounded-lg p-2 text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
