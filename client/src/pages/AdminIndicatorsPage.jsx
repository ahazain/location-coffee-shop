import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import Card from "../components/common/Card";
import Toast from "../components/common/Toast";
import ConfirmationModal from "../components/common/ConfirmationModal";
import IndicatorTable from "../components/admin/IndicatorTable";
import AdminLayout from "../layouts/AdminLayout";
import { indikatorService } from "../services/api/indikatorService";
import { kriteriaService } from "../services/api/kriteriaService";

export default function AdminIndicatorsPage() {
  const [indicators, setIndicators] = useState([]);
  const [kriteriaList, setKriteriaList] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI States
  const [toast, setToast] = useState(null);
  const [modalConfig, setModalConfig] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" | "edit"

  const [currentIndikator, setCurrentIndikator] = useState({
    id_indikator: null,
    id_kriteria: "",
    nama_indikator: "",
    deskripsi: "",
    satuan: "",
    tipe_nilai: "KEPADATAN",
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
      setToast({
        type: "error",
        message: `Gagal memuat data: ${err.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (mode, indikator = null) => {
    setModalMode(mode);

    if (mode === "edit" && indikator) {
      setCurrentIndikator({
        id_indikator: indikator.id || indikator.id_indikator,
        id_kriteria:
          indikator.id_kriteria ||
          indikator.kriteria?.id_kriteria ||
          indikator.kriteria?.id ||
          "",
        nama_indikator: indikator.nama_indikator || "",
        deskripsi: indikator.deskripsi || "",
        satuan: indikator.satuan || "",
        tipe_nilai: indikator.tipe_nilai || "KEPADATAN",
      });
    } else {
      setCurrentIndikator({
        id_indikator: null,
        id_kriteria:
          kriteriaList.length > 0 ? kriteriaList[0].id : "",
        nama_indikator: "",
        deskripsi: "",
        satuan: "",
        tipe_nilai: "KEPADATAN",
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
      const payload = {
        ...currentIndikator,
        id_kriteria: Number(currentIndikator.id_kriteria),
      };

      if (modalMode === "add") {
        await indikatorService.create(payload);
        setToast({
          type: "success",
          message: "Indikator berhasil ditambahkan.",
        });
      } else {
        await indikatorService.update(
          currentIndikator.id_indikator,
          payload
        );
        setToast({
          type: "success",
          message: "Indikator berhasil diperbarui.",
        });
      }

      handleCloseModal();
      await fetchData();
    } catch (err) {
      setToast({
        type: "error",
        message: err.message || "Gagal menyimpan indikator.",
      });
    }
  };

  const handleDelete = (id, namaIndikator) => {
    setModalConfig({
      isOpen: true,
      title: "Konfirmasi Hapus Indikator",
      message: `Apakah Anda yakin ingin menghapus indikator "${namaIndikator}"? Data AHP dan file GeoTIFF terkait indikator ini bisa terdampak.`,
      variant: "danger",
      onConfirm: () => executeDelete(id),
    });
  };

  const executeDelete = async (id) => {
    setModalConfig(null);
    setLoading(true);

    try {
      await indikatorService.delete(id);
      setToast({
        type: "success",
        message: "Indikator berhasil dihapus.",
      });
      await fetchData();
    } catch (err) {
      setToast({
        type: "error",
        message: err.message || "Gagal menghapus indikator.",
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
                Indikator Penilaian Lokasi
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
                Kelola indikator berdasarkan kriteria untuk proses fuzzy dan
                perhitungan WLC.
              </p>
            </div>

            <div className="flex gap-4">
              <div className="rounded-2xl bg-stone-50 p-4 text-center border border-stone-100">
                <p className="text-2xl font-black text-[#1D3557]">
                  {indicators.length}
                </p>
                <p className="text-xs text-stone-500">Total Indikator</p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenModal("add")}
                className="flex h-fit items-center gap-2 rounded-2xl bg-[#1D3557] px-5 py-3 text-xs font-bold text-white shadow-md transition hover:bg-[#2c4c78] active:scale-95 cursor-pointer uppercase tracking-wider"
              >
                <Plus size={18} />
                Tambah Indikator
              </button>
            </div>
          </div>
        </Card>

        {/* TABLE */}
        <IndicatorTable
          indicators={indicators}
          loading={loading}
          onEdit={(indicator) => handleOpenModal("edit", indicator)}
          onDelete={(id, namaIndikator) => handleDelete(id, namaIndikator)}
        />
      </div>

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl border border-stone-200/60 max-h-[90vh] overflow-y-auto">
            <h3 className="mb-5 text-xl font-extrabold text-[#1D3557] tracking-wide">
              {modalMode === "add" ? "Tambah Indikator" : "Edit Indikator"}
            </h3>

            <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Pilih Kriteria Induk
                </label>
                <select
                  required
                  value={currentIndikator.id_kriteria}
                  onChange={(e) =>
                    setCurrentIndikator({
                      ...currentIndikator,
                      id_kriteria: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-[#1D3557] focus:ring-4 focus:ring-blue-50/50"
                >
                  <option value="" disabled>
                    -- Pilih Kriteria --
                  </option>
                  {kriteriaList.map((kriteria) => (
                    <option
                      key={kriteria.id}
                      value={kriteria.id}
                    >
                      {kriteria.nama_kriteria}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Nama Indikator
                </label>
                <input
                  type="text"
                  required
                  value={currentIndikator.nama_indikator}
                  onChange={(e) =>
                    setCurrentIndikator({
                      ...currentIndikator,
                      nama_indikator: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-[#1D3557] focus:ring-4 focus:ring-blue-50/50"
                  placeholder="Misal: Kepadatan Penduduk"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Satuan
                </label>
                <input
                  type="text"
                  value={currentIndikator.satuan || ""}
                  onChange={(e) =>
                    setCurrentIndikator({
                      ...currentIndikator,
                      satuan: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-[#1D3557] focus:ring-4 focus:ring-blue-50/50"
                  placeholder="Misal: meter, jiwa/km2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Tipe Nilai
                </label>
                <select
                  required
                  value={currentIndikator.tipe_nilai}
                  onChange={(e) =>
                    setCurrentIndikator({
                      ...currentIndikator,
                      tipe_nilai: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-[#1D3557] focus:ring-4 focus:ring-blue-50/50"
                >
                  <option value="KEPADATAN">Kepadatan</option>
                  <option value="JARAK">Jarak</option>
                  <option value="INTENSITAS">Intensitas</option>
                  <option value="MASK">Mask (Constraint)</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Deskripsi
                </label>
                <textarea
                  value={currentIndikator.deskripsi || ""}
                  onChange={(e) =>
                    setCurrentIndikator({
                      ...currentIndikator,
                      deskripsi: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-[#1D3557] focus:ring-4 focus:ring-blue-50/50"
                  rows="2"
                  placeholder="Penjelasan opsional mengenai indikator"
                ></textarea>
              </div>

              <div className="col-span-2 mt-4 flex justify-end gap-3">
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