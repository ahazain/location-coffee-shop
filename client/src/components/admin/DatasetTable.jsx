import { useState, Fragment } from "react";
import { Edit3, Trash2, Folder, ChevronLeft, ChevronRight } from "lucide-react";
import Card from "../common/Card";

export default function DatasetTable({ 
  indicators, 
  rastersMap, 
  loading, 
  onDeleteRaster, 
  onUpdateClick 
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Menampilkan 6 data saja per halaman

  // Hitung total halaman
  const totalPages = Math.ceil(indicators.length / itemsPerPage) || 1;

  // Ambil data untuk halaman aktif
  const startIndex = (currentPage - 1) * itemsPerPage;
  const selectedIndicators = indicators.slice(startIndex, startIndex + itemsPerPage);

  // Pasangkan data indikator aktif dengan indeks aslinya untuk kolom "NO"
  const indicatorsWithIndex = selectedIndicators.map((ind, localIdx) => ({
    ...ind,
    originalIndex: startIndex + localIdx + 1
  }));

  // Kelompokkan data indikator pada halaman ini berdasarkan kriteria
  const groupedByKriteria = indicatorsWithIndex.reduce((acc, ind) => {
    const kId = ind.id_kriteria || (ind.kriteria?.id) || 999;
    const kName = ind.kriteria?.nama_kriteria || "Lainnya";
    const kKode = ind.kriteria?.kode_kriteria || "";
    
    if (!acc[kId]) {
      acc[kId] = {
        id: kId,
        nama: kName,
        kode: kKode,
        items: []
      };
    }
    acc[kId].items.push(ind);
    return acc;
  }, {});

  const groups = Object.values(groupedByKriteria).sort((a, b) => a.id - b.id);

  function handlePrevPage() {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }

  function handleNextPage() {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }

  return (
    <Card className="flex flex-col justify-between p-0 border border-stone-200/60 shadow-xs rounded-3xl bg-white w-full min-h-[640px] overflow-hidden">
      <div>
        {/* HEADER TABEL */}
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-5 bg-white">
          <h2 className="text-[#1D3557] font-extrabold text-sm tracking-wide">Data Terinput Baru-baru Ini</h2>
          <button type="button" className="text-xs font-bold text-[#577590] hover:text-[#1D3557] transition uppercase tracking-wider cursor-pointer">
            Lihat Semua
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#f8fafc]/50 border-b border-stone-100 text-[10px] font-bold uppercase tracking-wider text-stone-400">
              <tr>
                <th className="px-6 py-4 w-16 text-center">NO</th>
                <th className="px-6 py-4">NAMA INDIKATOR</th>
                <th className="px-6 py-4 w-32">SATUAN</th>
                <th className="px-6 py-4 w-24 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-xs font-semibold text-stone-400 bg-white">Memuat data...</td>
                </tr>
              ) : indicators.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-xs font-semibold text-stone-400 bg-white">Belum ada data terdaftar.</td>
                </tr>
              ) : (
                groups.map((group, groupIdx) => (
                  <Fragment key={group.id}>
                    {/* KRITERIA GROUP ROW */}
                    <tr className="bg-amber-50/15">
                      <td colSpan="4" className="px-6 py-3 text-xs font-bold text-amber-600 bg-amber-50/5 border-y border-stone-100/50">
                        <span className="flex items-center gap-2">
                          <Folder size={14} className="text-amber-500 fill-amber-100" />
                          Kriteria: {group.nama}
                        </span>
                      </td>
                    </tr>

                    {/* INDICATOR ROWS */}
                    {group.items.map((ind) => {
                      const activeRaw = rastersMap[ind.id]?.find(r => r.tipe_raster === "raw" && r.is_active);
                      const noStr = String(ind.originalIndex).padStart(2, "0");

                      return (
                        <tr key={ind.id} className="hover:bg-stone-50/40 transition">
                          <td className="px-6 py-4 text-center font-semibold text-stone-400 font-mono">
                            {noStr}
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-extrabold text-[#1D3557] text-xs sm:text-sm">{ind.nama_indikator}</p>
                          </td>
                          <td className="px-6 py-4 text-stone-500 font-semibold text-xs">
                            {ind.satuan || "Persen"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end items-center gap-3.5">
                              <button
                                type="button"
                                onClick={() => onUpdateClick(ind.id)}
                                className="rounded-lg p-1.5 text-stone-400 hover:text-[#1D3557] hover:bg-stone-100 transition active:scale-90 cursor-pointer"
                                title="Update Dataset"
                              >
                                <Edit3 size={14} />
                              </button>
                              
                              {activeRaw ? (
                                <button
                                  type="button"
                                  onClick={() => onDeleteRaster(activeRaw.id_raster_layer, ind.nama_indikator)}
                                  className="rounded-lg p-1.5 text-stone-400 hover:text-red-650 hover:bg-red-50 transition active:scale-90 cursor-pointer"
                                  title="Hapus Dataset"
                                >
                                  <Trash2 size={14} />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled
                                  className="rounded-lg p-1.5 text-stone-200 cursor-not-allowed"
                                  title="Tidak ada berkas untuk dihapus"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION */}
      {!loading && indicators.length > 0 && (
        <div className="flex items-center justify-center gap-2 border-t border-stone-100 py-4 bg-white">
          <button 
            type="button" 
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className={`rounded-lg p-1 border transition ${
              currentPage === 1 
                ? "border-stone-100 text-stone-300 cursor-not-allowed" 
                : "border-stone-200 text-stone-500 hover:bg-stone-50 cursor-pointer"
            }`}
          >
            <ChevronLeft size={14} />
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              onClick={() => setCurrentPage(pageNum)}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                currentPage === pageNum
                  ? "bg-[#1D3557] text-white shadow-sm"
                  : "border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer"
              }`}
            >
              {pageNum}
            </button>
          ))}

          <button 
            type="button" 
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className={`rounded-lg p-1 border transition ${
              currentPage === totalPages 
                ? "border-stone-100 text-stone-300 cursor-not-allowed" 
                : "border-stone-200 text-stone-500 hover:bg-stone-50 cursor-pointer"
            }`}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </Card>
  );
}
