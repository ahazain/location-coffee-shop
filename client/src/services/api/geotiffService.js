import { apiClient } from "./apiClient";

// POST /geotiff/indikator/:id_indikator/raw  → upload GeoTIFF (multipart)
// GET  /geotiff/indikator/:id_indikator      → list raster layers
// GET  /geotiff/indikator/:id/:tipe/active   → raster aktif
// DELETE /geotiff/raster/:id_raster_layer    → hapus raster
export const geotiffService = {
  async uploadRaw(id_indikator, file) {
    const formData = new FormData();
    formData.append("file", file);
    return await apiClient.postForm(`/geotiff/indikator/${id_indikator}/raw`, formData);
  },

  async listByIndikator(id_indikator) {
    return await apiClient.get(`/geotiff/indikator/${id_indikator}`);
  },

  async getActiveRaster(id_indikator, tipe_raster) {
    return await apiClient.get(`/geotiff/indikator/${id_indikator}/${tipe_raster}/active`);
  },

  async deleteRaster(id_raster_layer) {
    return await apiClient.delete(`/geotiff/raster/${id_raster_layer}`);
  },
};
