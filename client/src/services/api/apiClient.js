const getBaseUrl = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  if (hostname.includes("5173")) {
    const dynamicBackend = hostname.replace("5173", "3001");
    return `${protocol}//${dynamicBackend}`;
  }
  
  return `http://${hostname}:3001`;
};

const BASE_URL = getBaseUrl();

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
      const isLoginRequest = response.url.includes("/auth/login");
      if (isLoginRequest) {
        const json = await response.json().catch(() => ({}));
        throw new Error(json.message || "Email atau password salah.");
      }

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
