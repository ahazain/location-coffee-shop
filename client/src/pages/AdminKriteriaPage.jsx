import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import Card from "../components/common/Card";
import Toast from "../components/common/Toast";
import ConfirmationModal from "../components/common/ConfirmationModal";
import AdminLayout from "../layouts/AdminLayout";
import { kriteriaService } from "../services/api/kriteriaService";

export default function AdminKriteriaPage() {
  const [kriteriaList, setKriteriaList] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI States
  const [toast, setToast] = useState(null);
  const [modalConfig, setModalConfig] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" | "edit"

  const [currentKriteria, setCurrentKriteria] = useState({
    id_kriteria: null,
    nama_kriteria: "",
    deskripsi: "",
  });

  const fetchKriteria = async () => {
    try {
      setLoading(true);
      const data = await kriteriaService.getAll();
      setKriteriaList(data);
    } catch (err) {
      setToast({
        type: "error",
        message: `Gagal memuat data: ${err.message}`,
      });
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
      setCurrentKriteria({
        id_kriteria: kriteria.id_kriteria,
        nama_kriteria: kriteria.nama_kriteria || "",
        deskripsi: kriteria.deskripsi || "",
      });
    } else {
      setCurrentKriteria({
        id_kriteria: null,
        nama_kriteria: "",
        deskripsi: "",
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
        setToast({
          type: "success",
          message: "Kriteria berhasil ditambahkan.",
        });
      } else {
        await kriteriaService.update(
          currentKriteria.id_kriteria,
          currentKriteria
        );
        setToast({
          type: "success",
          message: "Kriteria berhasil diperbarui.",
        });
      }

      handleCloseModal();
      await fetchKriteria();
    } catch (err) {
      setToast({
        type: "error",
        message: err.message || "Gagal menyimpan kriteria.",
      });
    }
  };

  const handleDelete = (id, namaKriteria) => {
    setModalConfig({
      isOpen: true,
      title: "Konfirmasi Hapus Kriteria",
      message: `Apakah Anda yakin ingin menghapus kriteria "${namaKriteria}"? Semua indikator terkait juga mungkin ikut terhapus.`,
      variant: "danger",
      onConfirm: () => executeDelete(id),
    });
  };

  const executeDelete = async (id) => {
    setModalConfig(null);
    setLoading(true);

    try {
      await kriteriaService.delete(id);
      setToast({
        type: "success",
        message: "Kriteria berhasil dihapus.",
      });
      await fetchKriteria();
    } catch (err) {
      setToast({
        type: "error",
        message: err.message || "Gagal menghapus kriteria.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* SUMMARY CARD */}
        <Card className="p-8 border border-stone-200/60 shadow-xs rounded-3xl bg-white w-full">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="mt-3 text-xl font-black text-[#1D3557] tracking-wide">
                Daftar Kriteria
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
                Kriteria ini akan menaungi berbagai indikator spasial untuk
                proses AHP dan WLC.
              </p>
            </div>

            <div className="flex gap-4">
              <div className="rounded-2xl bg-stone-50 p-4 text-center border border-stone-100">
                <p className="text-2xl font-black text-[#1D3557]">
                  {kriteriaList.length}
                </p>
                <p className="text-xs text-stone-500">Total Kriteria</p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenModal("add")}
                className="flex h-fit items-center gap-2 rounded-2xl bg-[#1D3557] px-5 py-3 text-xs font-bold text-white shadow-md transition hover:bg-[#2c4c78] active:scale-95 cursor-pointer uppercase tracking-wider"
              >
                <Plus size={18} />
                Tambah Kriteria
              </button>
            </div>
          </div>
        </Card>

        {/* TABLE CARD */}
        <Card className="flex flex-col justify-between p-0 border border-stone-200/60 shadow-xs rounded-3xl bg-white w-full overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[#f8fafc]/50 border-b border-stone-100 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                <tr>
                  <th className="px-6 py-4">No</th>
                  <th className="px-6 py-4">Nama Kriteria</th>
                  <th className="px-6 py-4">Deskripsi</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-12 text-center text-stone-400"
                    >
                      Loading data...
                    </td>
                  </tr>
                ) : kriteriaList.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-12 text-center text-stone-400"
                    >
                      Belum ada data kriteria.
                    </td>
                  </tr>
                ) : (
                  kriteriaList.map((item, index) => (
                    <tr
                      key={item.id_kriteria}
                      className="hover:bg-stone-50/40 transition"
                    >
                      <td className="px-6 py-4 font-semibold text-stone-400 font-mono">
                        {String(index + 1).padStart(2, "0")}
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-extrabold text-[#1D3557] text-xs sm:text-sm">
                          {item.nama_kriteria}
                        </p>
                      </td>

                      <td className="px-6 py-4 whitespace-normal text-stone-500 font-medium text-xs">
                        {item.deskripsi || "-"}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenModal("edit", item)}
                            className="rounded-lg p-2 text-stone-400 transition hover:bg-stone-100 hover:text-[#1D3557] active:scale-90 cursor-pointer"
                            title="Edit Kriteria"
                          >
                            <Edit2 size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                item.id_kriteria,
                                item.nama_kriteria
                              )
                            }
                            className="rounded-lg p-2 text-stone-400 transition hover:bg-red-50 hover:text-red-600 active:scale-90 cursor-pointer"
                            title="Hapus Kriteria"
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
      </div>

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl border border-stone-200/60">
            <h3 className="mb-5 text-xl font-extrabold text-[#1D3557] tracking-wide">
              {modalMode === "add" ? "Tambah Kriteria" : "Edit Kriteria"}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Nama Kriteria
                </label>
                <input
                  type="text"
                  required
                  value={currentKriteria.nama_kriteria}
                  onChange={(e) =>
                    setCurrentKriteria({
                      ...currentKriteria,
                      nama_kriteria: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-[#1D3557] focus:ring-4 focus:ring-blue-50/50"
                  placeholder="Misal: Jarak ke Pusat Kota"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Deskripsi
                </label>
                <textarea
                  value={currentKriteria.deskripsi || ""}
                  onChange={(e) =>
                    setCurrentKriteria({
                      ...currentKriteria,
                      deskripsi: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-[#1D3557] focus:ring-4 focus:ring-blue-50/50"
                  rows="3"
                  placeholder="Masukkan deskripsi kriteria"
                ></textarea>
              </div>



              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold text-stone-600 transition hover:bg-stone-100 active:scale-95 cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-[#577590] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1D3557] active:scale-95 cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {modalConfig && (
        <ConfirmationModal
          isOpen={modalConfig.isOpen}
          title={modalConfig.title}
          message={modalConfig.message}
          variant={modalConfig.variant}
          onConfirm={modalConfig.onConfirm}
          onCancel={() => setModalConfig(null)}
        />
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </AdminLayout>
  );
}