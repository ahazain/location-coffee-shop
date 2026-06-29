import { apiClient } from "./apiClient";

// GET /indikator → { data: { data_indikator: [...], total } }
export const indikatorService = {
  async getAll() {
    const res = await apiClient.get("/indikator");
    return res.data_indikator || [];
  },
  async getByKriteriaId(id_kriteria) {
    const res = await apiClient.get(`/indikator/kriteria/${id_kriteria}`);
    return res.data_indikator || [];
  },
  async getById(id) {
    return await apiClient.get(`/indikator/${id}`);
  },
  async create(data) {
    return await apiClient.post("/indikator", data);
  },
  async update(id, data) {
    return await apiClient.put(`/indikator/${id}`, data);
  },
  async delete(id) {
    return await apiClient.delete(`/indikator/${id}`);
  },
};
