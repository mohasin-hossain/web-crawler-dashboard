import type { AxiosError, AxiosInstance } from "axios";
import axios from "axios";

// Token management to prevent race conditions
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

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

// Response interceptor for handling errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Handle 401 Unauthorized responses
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If we're already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token
        const refreshResponse = await apiClient.post("/api/auth/refresh");
        const newToken = refreshResponse.data.data.token;

        if (newToken) {
          localStorage.setItem("auth_token", newToken);
          processQueue(null, newToken);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        } else {
          throw new Error("No token received from refresh");
        }
      } catch (refreshError) {
        // Refresh failed - logout user
        processQueue(refreshError, null);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");

        // Only redirect if we're not already on the login page
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other error scenarios
    if (error.response?.status === 403) {
      // Forbidden - show error message but don't redirect
      console.error("Access forbidden - insufficient permissions");
    } else if (error.response && error.response.status >= 500) {
      // Server errors
      console.error("Server error:", error.response.status);
    } else if (error.code === "ECONNABORTED") {
      // Timeout
      console.error("Request timeout - please check your connection");
    } else if (!error.response) {
      // Network error
      console.error("Network error - please check your connection");
    }

    return Promise.reject(error);
  }
);

export default apiClient;
export { apiClient };

// Helper function to handle API errors
export const handleApiError = (error: AxiosError) => {
  if (error.response?.data) {
    const errorData = error.response.data as {
      message?: string;
      error?: string;
    };
    return errorData.message || errorData.error || "An error occurred";
  }

  // Handle different error types
  if (error.code === "ECONNABORTED") {
    return "Request timeout - please check your connection";
  }

  if (!error.response) {
    return "Network error - please check your connection";
  }

  return error.message || "An unexpected error occurred";
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
