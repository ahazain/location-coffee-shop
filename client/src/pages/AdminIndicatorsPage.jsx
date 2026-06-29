import { useEffect, useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";
import Badge from "../components/common/Badge";
import Card from "../components/common/Card";
import IndicatorTable from "../components/admin/IndicatorTable";
import AdminLayout from "../layouts/AdminLayout";
import { indikatorService } from "../services/api/indikatorService";
import { kriteriaService } from "../services/api/kriteriaService";

export default function AdminIndicatorsPage() {
  const [indicators, setIndicators] = useState([]);
  const [kriteriaList, setKriteriaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [criteriaFilter, setCriteriaFilter] = useState("Semua");
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" | "edit"
  const [currentIndikator, setCurrentIndikator] = useState({
    id_indikator: null,
    id_kriteria: "",
    kode_indikator: "",
    nama_indikator: "",
    keterangan: "",
    satuan: "",
    arah_preferensi: "benefit",
    fungsi_fuzzy: "linear_increasing",
    urutan: 1,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [indData, kritData] = await Promise.all([
        indikatorService.getAll(),
        kriteriaService.getAll(),
      ]);
      setIndicators(indData);
      setKriteriaList(kritData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredIndicators = useMemo(() => {
    return indicators.filter((indicator) => {
      const q = query.toLowerCase();
      const matchesQuery = (
        (indicator.nama_indikator || "").toLowerCase().includes(q) ||
        (indicator.kode_indikator || "").toLowerCase().includes(q) ||
        (indicator.arah_preferensi || "").toLowerCase().includes(q)
      );
      const matchesCriteria = criteriaFilter === "Semua" || indicator.id_kriteria?.toString() === criteriaFilter;
      return matchesQuery && matchesCriteria;
    });
  }, [criteriaFilter, indicators, query]);

  const handleOpenModal = (mode, indikator = null) => {
    setModalMode(mode);
    if (mode === "edit" && indikator) {
      setCurrentIndikator(indikator);
    } else {
      setCurrentIndikator({
        id_indikator: null,
        id_kriteria: kriteriaList.length > 0 ? kriteriaList[0].id_kriteria : "",
        kode_indikator: "",
        nama_indikator: "",
        keterangan: "",
        satuan: "",
        arah_preferensi: "benefit",
        fungsi_fuzzy: "linear_increasing",
        urutan: indicators.length + 1,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === "add") {
        await indikatorService.create({
          ...currentIndikator,
          id_kriteria: Number(currentIndikator.id_kriteria),
        });
      } else {
        await indikatorService.update(currentIndikator.id_indikator, {
          ...currentIndikator,
          id_kriteria: Number(currentIndikator.id_kriteria),
        });
      }
      handleCloseModal();
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus indikator ini? Data AHP dan file GeoTIFF terkait indikator ini bisa terdampak!")) {
      try {
        await indikatorService.delete(id);
        fetchData();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <AdminLayout>
      <Card className="mb-5 p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <Badge>Hierarki Kriteria & Indikator</Badge>
            <h2 className="mt-3 text-2xl font-black text-stone-950">Indikator Penilaian Lokasi</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
              Kelola data 13 indikator sesuai hierarki kuesioner. Atur tipe fuzzy, satuan, dan arah preferensi sebelum proses perhitungan WLC.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="rounded-2xl bg-stone-50 p-4 text-center">
              <p className="text-2xl font-black text-stone-950">{filteredIndicators.length}</p>
              <p className="text-xs text-stone-500">Indikator Tampil</p>
            </div>
            <button
              onClick={() => handleOpenModal("add")}
              className="flex h-fit items-center gap-2 rounded-xl bg-amber-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-800"
            >
              <Plus size={18} />
              Tambah Indikator
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_260px]">
          <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 focus-within:border-amber-700">
            <Search size={18} className="text-stone-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama indikator, kode, atau arah preferensi..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </label>
          <select
            value={criteriaFilter}
            onChange={(event) => setCriteriaFilter(event.target.value)}
            className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-700 outline-none focus:border-amber-700"
          >
            <option value="Semua">Semua Kriteria</option>
            {kriteriaList.map((item) => (
              <option key={item.id_kriteria} value={item.id_kriteria}>{item.nama_kriteria}</option>
            ))}
          </select>
        </div>
      </Card>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          Error: {error}
        </div>
      )}

      <IndicatorTable 
        indicators={filteredIndicators} 
        loading={loading} 
        onEdit={(ind) => handleOpenModal("edit", ind)}
        onDelete={handleDelete}
      />

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="mb-4 text-xl font-bold text-stone-900">
              {modalMode === "add" ? "Tambah Indikator" : "Edit Indikator"}
            </h3>
            <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-stone-700">Pilih Kriteria Induk</label>
                <select
                  required
                  value={currentIndikator.id_kriteria}
                  onChange={(e) => setCurrentIndikator({...currentIndikator, id_kriteria: e.target.value})}
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-amber-700"
                >
                  <option value="" disabled>-- Pilih Kriteria --</option>
                  {kriteriaList.map(k => (
                    <option key={k.id_kriteria} value={k.id_kriteria}>{k.kode_kriteria} - {k.nama_kriteria}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Kode Indikator</label>
                <input
                  type="text"
                  required
                  value={currentIndikator.kode_indikator}
                  onChange={(e) => setCurrentIndikator({...currentIndikator, kode_indikator: e.target.value})}
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-amber-700"
                  placeholder="Misal: C1.1"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Nama Indikator</label>
                <input
                  type="text"
                  required
                  value={currentIndikator.nama_indikator}
                  onChange={(e) => setCurrentIndikator({...currentIndikator, nama_indikator: e.target.value})}
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-amber-700"
                  placeholder="Misal: Kepadatan Penduduk"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Arah Preferensi</label>
                <select
                  required
                  value={currentIndikator.arah_preferensi}
                  onChange={(e) => setCurrentIndikator({...currentIndikator, arah_preferensi: e.target.value})}
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-amber-700"
                >
                  <option value="benefit">Benefit (Semakin besar semakin baik)</option>
                  <option value="cost">Cost (Semakin kecil semakin baik)</option>
                  <option value="optimum">Optimum (Mendekati titik tertentu)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Fungsi Fuzzy</label>
                <select
                  required
                  value={currentIndikator.fungsi_fuzzy}
                  onChange={(e) => setCurrentIndikator({...currentIndikator, fungsi_fuzzy: e.target.value})}
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-amber-700"
                >
                  <option value="linear_increasing">Linear Increasing</option>
                  <option value="linear_decreasing">Linear Decreasing</option>
                  <option value="near">Near (Bell shape)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Satuan</label>
                <input
                  type="text"
                  value={currentIndikator.satuan || ""}
                  onChange={(e) => setCurrentIndikator({...currentIndikator, satuan: e.target.value})}
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-amber-700"
                  placeholder="Misal: meter, jiwa/km2 (opsional)"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Urutan (AHP)</label>
                <input
                  type="number"
                  required
                  value={currentIndikator.urutan}
                  onChange={(e) => setCurrentIndikator({...currentIndikator, urutan: parseInt(e.target.value)})}
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-amber-700"
                  min="1"
                />
              </div>

              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-stone-700">Keterangan</label>
                <textarea
                  value={currentIndikator.keterangan || ""}
                  onChange={(e) => setCurrentIndikator({...currentIndikator, keterangan: e.target.value})}
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-amber-700"
                  rows="2"
                  placeholder="Penjelasan opsional..."
                ></textarea>
              </div>

              <div className="col-span-2 mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold text-stone-600 transition hover:bg-stone-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-800"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
