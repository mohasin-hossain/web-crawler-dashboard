import type { AxiosError, AxiosInstance } from "axios";
import axios from "axios";

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle common error scenarios
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
    } else if (error.response?.status === 403) {
      // Forbidden
      console.error("Access forbidden");
    } else if (error.response && error.response.status >= 500) {
      // Server errors
      console.error("Server error:", error.response.status);
    } else if (error.code === "ECONNABORTED") {
      // Timeout
      console.error("Request timeout");
    } else if (!error.response) {
      // Network error
      console.error("Network error");
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// Helper function to handle API errors
export const handleApiError = (error: AxiosError) => {
  if (error.response?.data) {
    const errorData = error.response.data as {
      message?: string;
      error?: string;
    };
    return errorData.message || errorData.error || "An error occurred";
  }
  return error.message || "Network error";
};

// Types for API responses
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  message: string;
  details?: any;
}
