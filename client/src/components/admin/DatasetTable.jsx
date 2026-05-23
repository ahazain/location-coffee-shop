import Badge from "../common/Badge";
import Card from "../common/Card";

function statusVariant(status = "") {
  const normalized = status.toLowerCase();
  if (normalized.includes("perlu")) return "amber";
  if (normalized.includes("tervalidasi") || normalized.includes("dipublikasikan")) return "green";
  return "stone";
}

export default function DatasetTable({ layers }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-stone-200 p-5">
        <h2 className="text-lg font-bold text-stone-950">Layer Dataset Aktif</h2>
        <p className="mt-1 text-sm text-stone-500">Daftar layer pada mock backend. Nanti tabel ini diisi dari API database.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-5 py-3">Nama layer</th>
              <th className="px-5 py-3">Geometri</th>
              <th className="px-5 py-3">Records</th>
              <th className="px-5 py-3">Versi</th>
              <th className="px-5 py-3">Update terakhir</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {layers.map((layer) => (
              <tr key={layer.id} className="hover:bg-stone-50">
                <td className="px-5 py-4">
                  <p className="font-semibold text-stone-900">{layer.name}</p>
                  <p className="mt-1 text-xs text-stone-500">{layer.lastFileName}</p>
                </td>
                <td className="px-5 py-4 text-stone-600">{layer.type}</td>
                <td className="px-5 py-4 text-stone-600">{layer.records}</td>
                <td className="px-5 py-4 font-mono text-xs text-stone-600">{layer.version}</td>
                <td className="px-5 py-4 text-stone-600">{layer.freshness}</td>
                <td className="px-5 py-4"><Badge variant={statusVariant(layer.status)}>{layer.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
