import { apiClient } from "./apiClient";

// GET /ahp/bobot-konsensus → { data: { total_pakar, pakar, bobot_kriteria, bobot_indikator } }
// GET /ahp/kriteria/items → { data: { items: [...], total } }
export const ahpService = {
  async getBobotKonsensus() {
    return await apiClient.get("/ahp/bobot-konsensus");
  },

  // Kriteria items (daftar kriteria untuk matriks AHP)
  async getKriteriaItems() {
    const res = await apiClient.get("/ahp/kriteria/items");
    return res.items || [];
  },

  // Kalkulasi saja (tanpa simpan)
  async calculateKriteria(payload) {
    return await apiClient.post("/ahp/kriteria/calculate", payload);
  },

  // Simpan hasil AHP kriteria per pakar
  async saveKriteria(payload) {
    // payload: { id_pakar, matrix: [[...]], item_ids: [...] }
    return await apiClient.post("/ahp/kriteria/save", payload);
  },

  // Indikator items untuk satu kriteria
  async getIndikatorItems(id_kriteria) {
    const res = await apiClient.get(`/ahp/indikator/${id_kriteria}/items`);
    return res.items || [];
  },

  // Kalkulasi saja
  async calculateIndikator(id_kriteria, payload) {
    return await apiClient.post(`/ahp/indikator/${id_kriteria}/calculate`, payload);
  },

  // Simpan hasil AHP indikator per pakar per kriteria
  async saveIndikator(id_kriteria, payload) {
    // payload: { id_pakar, matrix: [[...]], item_ids: [...] }
    return await apiClient.post(`/ahp/indikator/${id_kriteria}/save`, payload);
  },

  // Recalculate consensus (general AHP)
  async calculate(payload) {
    return await apiClient.post("/ahp/calculate", payload);
  },
};
