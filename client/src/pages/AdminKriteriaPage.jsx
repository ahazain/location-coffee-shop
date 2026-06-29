import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import Badge from "../components/common/Badge";
import Card from "../components/common/Card";
import AdminLayout from "../layouts/AdminLayout";
import { kriteriaService } from "../services/api/kriteriaService";

export default function AdminKriteriaPage() {
  const [kriteriaList, setKriteriaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" | "edit"
  const [currentKriteria, setCurrentKriteria] = useState({
    id_kriteria: null,
    kode_kriteria: "",
    nama_kriteria: "",
    keterangan: "",
    urutan: 1,
  });

  const fetchKriteria = async () => {
    try {
      setLoading(true);
      const data = await kriteriaService.getAll();
      setKriteriaList(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKriteria();
  }, []);

  const handleOpenModal = (mode, kriteria = null) => {
    setModalMode(mode);
    if (mode === "edit" && kriteria) {
      setCurrentKriteria(kriteria);
    } else {
      setCurrentKriteria({
        id_kriteria: null,
        kode_kriteria: "",
        nama_kriteria: "",
        keterangan: "",
        urutan: kriteriaList.length + 1,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === "add") {
        await kriteriaService.create(currentKriteria);
      } else {
        await kriteriaService.update(currentKriteria.id_kriteria, currentKriteria);
      }
      handleCloseModal();
      fetchKriteria(); // Refresh data
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus kriteria ini? Semua indikator terkait juga mungkin terhapus!")) {
      try {
        await kriteriaService.delete(id);
        fetchKriteria();
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
            <Badge>Master Data Kriteria</Badge>
            <h2 className="mt-3 text-2xl font-black text-stone-950">Daftar Kriteria</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
              Kelola data kriteria untuk analisis AHP dan WLC. Kriteria ini akan menaungi berbagai indikator spasial.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="rounded-2xl bg-stone-50 p-4 text-center">
              <p className="text-2xl font-black text-stone-950">{kriteriaList.length}</p>
              <p className="text-xs text-stone-500">Total Kriteria</p>
            </div>
            <button
              onClick={() => handleOpenModal("add")}
              className="flex h-fit items-center gap-2 rounded-xl bg-amber-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-800"
            >
              <Plus size={18} />
              Tambah Kriteria
            </button>
          </div>
        </div>
      </Card>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          Error: {error}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-sm text-stone-600">
            <thead className="border-b border-stone-200 bg-stone-50 text-stone-900">
              <tr>
                <th className="px-6 py-4 font-semibold">Urutan</th>
                <th className="px-6 py-4 font-semibold">Kode</th>
                <th className="px-6 py-4 font-semibold">Nama Kriteria</th>
                <th className="px-6 py-4 font-semibold">Keterangan</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-stone-400">Loading data...</td>
                </tr>
              ) : kriteriaList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-stone-400">Belum ada data kriteria.</td>
                </tr>
              ) : (
                kriteriaList.map((item) => (
                  <tr key={item.id_kriteria} className="transition hover:bg-stone-50">
                    <td className="px-6 py-4 font-medium text-stone-900">{item.urutan}</td>
                    <td className="px-6 py-4"><Badge variant="outline">{item.kode_kriteria}</Badge></td>
                    <td className="px-6 py-4 font-medium text-stone-900">{item.nama_kriteria}</td>
                    <td className="px-6 py-4 whitespace-normal">{item.keterangan || "-"}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal("edit", item)}
                          className="rounded-lg p-2 text-stone-400 transition hover:bg-stone-100 hover:text-amber-700"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id_kriteria)}
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

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-xl font-bold text-stone-900">
              {modalMode === "add" ? "Tambah Kriteria" : "Edit Kriteria"}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Kode Kriteria</label>
                <input
                  type="text"
                  required
                  value={currentKriteria.kode_kriteria}
                  onChange={(e) => setCurrentKriteria({...currentKriteria, kode_kriteria: e.target.value})}
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-amber-700"
                  placeholder="Misal: C1"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Nama Kriteria</label>
                <input
                  type="text"
                  required
                  value={currentKriteria.nama_kriteria}
                  onChange={(e) => setCurrentKriteria({...currentKriteria, nama_kriteria: e.target.value})}
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-amber-700"
                  placeholder="Misal: Jarak ke Pusat Kota"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Keterangan</label>
                <textarea
                  value={currentKriteria.keterangan || ""}
                  onChange={(e) => setCurrentKriteria({...currentKriteria, keterangan: e.target.value})}
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-amber-700"
                  rows="3"
                  placeholder="Opsional"
                ></textarea>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Urutan (AHP)</label>
                <input
                  type="number"
                  required
                  value={currentKriteria.urutan}
                  onChange={(e) => setCurrentKriteria({...currentKriteria, urutan: parseInt(e.target.value)})}
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-amber-700"
                  min="1"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
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
