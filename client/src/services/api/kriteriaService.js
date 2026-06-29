import { apiClient } from "./apiClient";

// GET /kriteria → { data: { data_kriteria: [...], total } }
export const kriteriaService = {
  async getAll() {
    const res = await apiClient.get("/kriteria");
    return res.data_kriteria || [];
  },
  async getById(id) {
    return await apiClient.get(`/kriteria/${id}`);
  },
  async create(data) {
    return await apiClient.post("/kriteria", data);
  },
  async update(id, data) {
    return await apiClient.put(`/kriteria/${id}`, data);
  },
  async delete(id) {
    return await apiClient.delete(`/kriteria/${id}`);
  },
};
