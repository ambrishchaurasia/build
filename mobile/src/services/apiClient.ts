import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

// For an Android emulator, 10.0.2.2 points to host's localhost. 
// For a physical device or iOS simulator, this should be your local IP address.
// NOTE: Base URL is set to the host root because all API requests prepend "/api"
export let API_URL = process.env.EXPO_PUBLIC_API_URL || "https://build-gbiq.onrender.com";
if (API_URL.endsWith("/")) {
  API_URL = API_URL.slice(0, -1);
}

console.log("[apiClient] Resolved API_URL as:", API_URL);

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 65000, // 65 seconds to allow Render's free tier to wake up from sleep
  headers: {
    "Content-Type": "application/json",
    "bypass-tunnel-reminder": "true"
  },
  withCredentials: true 
});

// Request interceptor to append authorization header if JWT exists
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error("Error reading token from AsyncStorage", e);
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
  async (error) => {
    // Only redirect to login if the request was not to the auth endpoints
    const originalRequestUrl = error.config?.url || "";
    const isAuthEndpoint = originalRequestUrl.includes("/api/auth/login") || originalRequestUrl.includes("/api/auth/signup");
    
    if (error.response && error.response.status === 401 && !isAuthEndpoint) {
      // Clear token and redirect to login if unauthorized and not actively trying to log in
      try {
        await AsyncStorage.removeItem("token");
        router.replace("/login");
      } catch (e) {
        console.error("Error removing token", e);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
