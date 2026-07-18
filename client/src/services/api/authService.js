import { apiClient } from "./apiClient";

export const authService = {
  async login(email, password) {
    const res = await apiClient.post("/auth/login", { email, password });
    return res; // returns { token, profile: { name, email, role } }
  },

  async register(nama, email, password) {
    const res = await apiClient.post("/auth/register", { nama, email, password });
    return res; // returns { token, profile: { name, email, role } }
  },
};
