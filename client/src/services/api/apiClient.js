const BASE_URL = "http://localhost:3001";

const getHeaders = (extraHeaders = {}) => {
  const headers = { ...extraHeaders };
  const token = localStorage.getItem("admin_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

export const apiClient = {
  async get(endpoint) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: getHeaders(),
    });
    return this.handleResponse(response);
  },

  async post(endpoint, data) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: getHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  },

  async put(endpoint, data) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: getHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  },

  async delete(endpoint) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return this.handleResponse(response);
  },

  async postForm(endpoint, formData) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: getHeaders(),
      body: formData,
    });
    return this.handleResponse(response);
  },

  async putForm(endpoint, formData) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: getHeaders(),
      body: formData,
    });
    return this.handleResponse(response);
  },

  async handleResponse(response) {
    if (response.status === 401) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_profile");
      if (!window.location.pathname.endsWith("/admin/login")) {
        window.location.href = "/admin/login";
      }
      throw new Error("Sesi login telah kedaluwarsa. Silakan login kembali.");
    }
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.message || "Terjadi kesalahan pada server.");
    }
    return json.data;
  },
};
