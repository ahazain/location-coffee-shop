import Badge from "../common/Badge";
import Card from "../common/Card";

function statusVariant(status = "") {
  const normalized = status.toLowerCase();
  if (normalized === "aktif") return "green";
  return "stone";
}

export default function DatasetTable({ indicators, rastersMap, loading, onDeleteRaster }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-stone-200 p-5">
        <h2 className="text-lg font-bold text-stone-950">Status Dataset Raster Indikator</h2>
        <p className="mt-1 text-sm text-stone-500">Daftar file GeoTIFF yang aktif digunakan oleh masing-masing indikator di database.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-5 py-3">Nama Indikator</th>
              <th className="px-5 py-3">File GeoTIFF</th>
              <th className="px-5 py-3">Dimensi / CRS</th>
              <th className="px-5 py-3">Min / Max Nilai</th>
              <th className="px-5 py-3">Versi</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-5 py-10 text-center text-stone-400">Memuat data dataset...</td>
              </tr>
            ) : indicators.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-5 py-10 text-center text-stone-400">Belum ada indikator terdaftar.</td>
              </tr>
            ) : (
              indicators.map((ind) => {
                const activeRaw = rastersMap[ind.id]?.find(r => r.tipe_raster === "raw" && r.is_active);
                return (
                  <tr key={ind.id} className="hover:bg-stone-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-stone-900">{ind.nama_indikator}</p>
                      <p className="mt-1 text-xs text-stone-500">{ind.kode_indikator}</p>
                    </td>
                    <td className="px-5 py-4 text-stone-600">
                      {activeRaw ? (
                        <div>
                          <p className="font-medium text-stone-800 truncate max-w-[200px]" title={activeRaw.original_filename || activeRaw.file_path}>
                            {activeRaw.original_filename || "geotiff_file.tif"}
                          </p>
                          <p className="text-xs text-stone-400">
                            {new Date(activeRaw.created_at).toLocaleString("id-ID")}
                          </p>
                        </div>
                      ) : (
                        <span className="text-stone-400 italic">Belum ada file raw</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-stone-600">
                      {activeRaw ? (
                        <div>
                          <p className="text-xs font-semibold">{activeRaw.width} x {activeRaw.height} px</p>
                          <p className="text-xs text-stone-500">{activeRaw.crs || "EPSG:32749"}</p>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-5 py-4 text-stone-600">
                      {activeRaw ? (
                        <p className="text-xs font-mono">
                          {activeRaw.min_value?.toFixed(2)} / {activeRaw.max_value?.toFixed(2)}
                        </p>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-stone-600">
                      {activeRaw ? `v${activeRaw.versi}` : "-"}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={statusVariant(activeRaw ? "Aktif" : "Kosong")}>
                        {activeRaw ? "Aktif" : "Belum Ada"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {activeRaw && (
                        <button
                          onClick={() => onDeleteRaster(activeRaw.id_raster_layer)}
                          className="rounded-lg px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          Hapus File
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
