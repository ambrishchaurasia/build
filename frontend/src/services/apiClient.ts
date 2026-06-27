import axios from "axios";

const apiClient = axios.create({
  baseURL: "", // Configured via Vite dev proxy (/api routes proxy to http://localhost:5000)
  headers: {
    "Content-Type": "application/json"
  },
  withCredentials: true // Supports HTTP-Only Cookie auth
});

// Request interceptor to append authorization header if JWT exists in localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle unauthorized errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem("token");
      if (!window.location.pathname.includes("/login") && !window.location.pathname.includes("/signup")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
