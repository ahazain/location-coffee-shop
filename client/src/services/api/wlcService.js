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
};
