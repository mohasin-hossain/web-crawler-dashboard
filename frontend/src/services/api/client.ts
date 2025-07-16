import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

// Create the axios instance with configuration
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
  timeout: 10000, // 10 second timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Token refresh queue
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string | null) => void;
  reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

// Extended request config type
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("auth_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig;

    // Handle 401 Unauthorized responses
    // Don't attempt token refresh for authentication endpoints
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/register")
    ) {
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

    // Handle specific error responses with user-friendly messages
    if (error.response?.data) {
      const errorData = error.response.data as {
        message?: string;
        error?: string;
      };

      // Create a new error with the backend message
      const enhancedError = new Error(
        errorData.message || errorData.error || "An error occurred"
      );
      enhancedError.name = error.name;
      (
        enhancedError as Error & { response: unknown; config: unknown }
      ).response = error.response;
      (enhancedError as Error & { response: unknown; config: unknown }).config =
        error.config;

      return Promise.reject(enhancedError);
    }

    // Handle network and timeout errors
    if (error.code === "ECONNABORTED") {
      const timeoutError = new Error(
        "Request timeout - please check your connection and try again"
      );
      timeoutError.name = "TimeoutError";
      return Promise.reject(timeoutError);
    }

    if (!error.response) {
      const networkError = new Error(
        "Network error - please check your connection and try again"
      );
      networkError.name = "NetworkError";
      return Promise.reject(networkError);
    }

    // Handle other HTTP errors
    const statusCode = error.response?.status;
    let errorMessage = "An unexpected error occurred";

    switch (statusCode) {
      case 400:
        errorMessage = "Bad request - please check your input";
        break;
      case 403:
        errorMessage = "Access forbidden - insufficient permissions";
        break;
      case 404:
        errorMessage = "Resource not found";
        break;
      case 409:
        errorMessage = "Conflict - resource already exists";
        break;
      case 429:
        errorMessage = "Too many requests - please try again later";
        break;
      case 500:
        errorMessage = "Server error - please try again later";
        break;
      case 502:
        errorMessage = "Bad gateway - service temporarily unavailable";
        break;
      case 503:
        errorMessage = "Service unavailable - please try again later";
        break;
      default:
        errorMessage = `Server error (${statusCode}) - please try again`;
    }

    const httpError = new Error(errorMessage);
    httpError.name = "HttpError";
    (httpError as Error & { response: unknown; config: unknown }).response =
      error.response;
    (httpError as Error & { response: unknown; config: unknown }).config =
      error.config;

    return Promise.reject(httpError);
  }
);

// Helper function to handle API errors (kept for backward compatibility)
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
  details?: unknown;
}
