import { apiClient } from "./apiClient";

// POST /wlc/calculate → { data: { run, layer, totalGrids } }
// GET  /wlc/active   → { data: { raster layer aktif } }
// GET  /wlc/grids    → { data: { type: "FeatureCollection", features: [...] } }
export const wlcService = {
  async calculate() {
    return await apiClient.post("/wlc/calculate", {});
  },

  async getActive() {
    return await apiClient.get("/wlc/active");
  },

  async getGrids() {
    return await apiClient.get("/wlc/grids");
  },

  async getBoundary() {
    return await apiClient.get("/wlc/boundary");
  },

  async getValidationStats() {
    return await apiClient.get("/wlc/validation/stats");
  },

  async getValidationPoints() {
    return await apiClient.get("/wlc/validation/points");
  },

  async syncValidationPoints() {
    return await apiClient.post("/wlc/validation/sync", {});
  },
};
