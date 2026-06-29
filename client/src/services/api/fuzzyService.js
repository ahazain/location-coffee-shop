import { apiClient } from "./apiClient";

// GET /fuzzy/aturan → { data: { data_aturan: [...], total } }
// GET /fuzzy/aturan/:id_indikator → { data: {...} }
// POST /fuzzy/hitung-semua → kalkulasi semua
// POST /fuzzy/hitung/:id_indikator → kalkulasi satu indikator
export const fuzzyService = {
  async getAllAturan() {
    const res = await apiClient.get("/fuzzy/aturan");
    return res.data_aturan || [];
  },

  async getAturanByIndikator(id_indikator) {
    return await apiClient.get(`/fuzzy/aturan/${id_indikator}`);
  },

  async saveAturan(data) {
    return await apiClient.post("/fuzzy/aturan", data);
  },

  async updateAturan(id_indikator, data) {
    return await apiClient.put(`/fuzzy/aturan/${id_indikator}`, data);
  },

  async deleteAturan(id_indikator) {
    return await apiClient.delete(`/fuzzy/aturan/${id_indikator}`);
  },

  async calculateAll() {
    return await apiClient.post("/fuzzy/hitung-semua", {});
  },

  async calculateByIndikator(id_indikator) {
    return await apiClient.post(`/fuzzy/hitung/${id_indikator}`, {});
  },
};
