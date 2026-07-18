import { useEffect, useState, useRef } from "react";
import AdminLayout from "../layouts/AdminLayout";
import LayerUploadForm from "../components/admin/LayerUploadForm";
import DatasetTable from "../components/admin/DatasetTable";
import Toast from "../components/common/Toast";
import ConfirmationModal from "../components/common/ConfirmationModal";
import { indikatorService } from "../services/api/indikatorService";
import { geotiffService } from "../services/api/geotiffService";
import { fuzzyService } from "../services/api/fuzzyService";

export default function AdminDatasetsPage() {
  const [indicators, setIndicators] = useState([]);
  const [rastersMap, setRastersMap] = useState({});
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // UI States
  const [toast, setToast] = useState(null);
  const [modalConfig, setModalConfig] = useState(null); // { isOpen, title, message, onConfirm, variant }

  // Hidden upload handler for the table row "Update" button
  const fileInputRef = useRef(null);
  const [updateTargetId, setUpdateTargetId] = useState(null);
  const [updateTargetName, setUpdateTargetName] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const list = await indikatorService.getAll();
      setIndicators(list);

      // Fetch fuzzy rules to retrieve midpoints
      const allRules = await fuzzyService.getAllAturan();
      setRules(allRules);

      // Fetch all rasters for each indicator
      const map = {};
      await Promise.all(
        list.map(async (ind) => {
          try {
            const data = await geotiffService.listByIndikator(ind.id);
            map[ind.id] = data.rasters || [];
          } catch (e) {
            map[ind.id] = [];
          }
        })
      );
      setRastersMap(map);
    } catch (err) {
      setToast({ type: "error", message: `Gagal memuat data: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle adding/replacing new raster from Form
  async function handleAddDataset(idIndikator, file) {
    const existingActive = rastersMap[idIndikator]?.some(r => r.tipe_raster === "raw" && r.is_active);
    setIsUploading(true);
    try {
      if (existingActive) {
        await geotiffService.updateRaw(idIndikator, file);
      } else {
        await geotiffService.uploadRaw(idIndikator, file);
      }
      setToast({ type: "success", message: "Successfully toasted! (Berkas GeoTIFF berhasil diunggah)" });
      await loadData();
    } catch (err) {
      setToast({ type: "error", message: err.message || "Gagal mengunggah berkas." });
      throw err;
    } finally {
      setIsUploading(false);
    }
  }

  // Handle clicking "Update" inside table row
  function handleTableUpdateClick(idIndikator) {
    const ind = indicators.find(i => i.id === idIndikator);
    setUpdateTargetId(idIndikator);
    setUpdateTargetName(ind ? ind.nama_indikator : "Indikator");

    // Trigger hidden file selection dialog
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }

  // File selected from the hidden input for table updates
  function handleHiddenFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".tif") && !file.name.toLowerCase().endsWith(".tiff")) {
      setToast({ type: "error", message: "Format file tidak didukung. Harap pilih file GeoTIFF (.tif/.tiff)." });
      return;
    }

    // Show confirmation modal
    setModalConfig({
      isOpen: true,
      title: "Konfirmasi Perbaruan GeoTIFF",
      message: `Apakah Anda yakin ingin memperbarui berkas GeoTIFF untuk indikator "${updateTargetName}"? Berkas lama di database dan folder penyimpanan akan dihapus secara permanen.`,
      variant: "warning",
      onConfirm: () => executeTableUpdate(updateTargetId, file)
    });
  }

  // Execute the PUT update after confirmation
  async function executeTableUpdate(idIndikator, file) {
    setModalConfig(null);
    setLoading(true);
    try {
      await geotiffService.updateRaw(idIndikator, file);
      setToast({ type: "success", message: "Successfully toasted! (File GeoTIFF berhasil diperbarui)" });
      await loadData();
    } catch (err) {
      setToast({ type: "error", message: err.message || "Gagal memperbarui berkas GeoTIFF." });
    } finally {
      setLoading(false);
    }
  }

  // Handle clicking "Delete" inside table row
  function handleTableDeleteClick(idRasterLayer, indicatorName) {
    setModalConfig({
      isOpen: true,
      title: "Konfirmasi Hapus GeoTIFF",
      message: `Apakah Anda yakin ingin menghapus berkas GeoTIFF untuk indikator "${indicatorName}"? Berkas di database dan penyimpanan akan dihapus secara permanen.`,
      variant: "danger",
      onConfirm: () => executeTableDelete(idRasterLayer)
    });
  }

  // Execute DELETE after confirmation
  async function executeTableDelete(idRasterLayer) {
    setModalConfig(null);
    setLoading(true);
    try {
      await geotiffService.deleteRaster(idRasterLayer);
      setToast({ type: "success", message: "Successfully toasted! (File GeoTIFF berhasil dihapus)" });
      await loadData();
    } catch (err) {
      setToast({ type: "error", message: err.message || "Gagal menghapus berkas GeoTIFF." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminLayout>
      {/* Hidden file input for table update trigger */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".tif,.tiff"
        className="hidden"
        onChange={handleHiddenFileChange}
      />

      <div className="space-y-6">


        {/* UPLOAD FORM (TOP) */}
        <div className="w-full">
          <LayerUploadForm
            indicators={indicators}
            rastersMap={rastersMap}
            onUpload={handleAddDataset}
            isUploadingExternal={isUploading}
          />
        </div>

        {/* DATA TABLE (BOTTOM) */}
        <div className="w-full">
          <DatasetTable
            indicators={indicators}
            rastersMap={rastersMap}
            loading={loading}
            onDeleteRaster={handleTableDeleteClick}
            onUpdateClick={handleTableUpdateClick}
          />
        </div>
      </div>

      {/* Confirmation Modal */}
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

      {/* Toast Notification */}
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
