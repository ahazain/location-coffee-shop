const BASE_URL = "http://localhost:3001";

export const apiClient = {
  async get(endpoint) {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    return this.handleResponse(response);
  },

  async post(endpoint, data) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  },

  async put(endpoint, data) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  },

  async delete(endpoint) {
    const response = await fetch(`${BASE_URL}${endpoint}`, { method: "DELETE" });
    return this.handleResponse(response);
  },

  async postForm(endpoint, formData) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      body: formData,
    });
    return this.handleResponse(response);
  },

  async handleResponse(response) {
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.message || "Terjadi kesalahan pada server.");
    }
    return json.data; // Backend mengembalikan { success, statusCode, message, data }
  },
};
