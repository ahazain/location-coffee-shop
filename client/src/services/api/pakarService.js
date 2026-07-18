import { apiClient } from "./apiClient";

// GET /ahp/pakar → { data: [...] }   (array langsung)
// GET /ahp/pakar/:id → { data: {...} }
export const pakarService = {
  async getAll() {
    const res = await apiClient.get("/ahp/pakar");
    // Backend returns the array directly as data
    return Array.isArray(res) ? res : [];
  },
  async getById(id) {
    return await apiClient.get(`/ahp/pakar/${id}`);
  },
  async create(data) {
    return await apiClient.post("/ahp/pakar", data);
  },
  async update(id, data) {
    return await apiClient.put(`/ahp/pakar/${id}`, data);
  },
  async delete(id) {
    return await apiClient.delete(`/ahp/pakar/${id}`);
  },
};
