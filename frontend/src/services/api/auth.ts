import type {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from "../../types/auth";
import { apiClient } from "./client";

// Token storage utilities
export const tokenStorage = {
  get: (): string | null => {
    try {
      return localStorage.getItem("auth_token");
    } catch (error) {
      console.error("Error getting token from localStorage:", error);
      return null;
    }
  },

  set: (token: string): void => {
    try {
      localStorage.setItem("auth_token", token);
    } catch (error) {
      console.error("Error setting token in localStorage:", error);
    }
  },

  remove: (): void => {
    try {
      localStorage.removeItem("auth_token");
    } catch (error) {
      console.error("Error removing token from localStorage:", error);
    }
  },
};

// User data storage utilities
export const userStorage = {
  get: () => {
    try {
      const userData = localStorage.getItem("auth_user");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error getting user from localStorage:", error);
      return null;
    }
  },

  set: (user: any): void => {
    try {
      localStorage.setItem("auth_user", JSON.stringify(user));
    } catch (error) {
      console.error("Error setting user in localStorage:", error);
    }
  },

  remove: (): void => {
    try {
      localStorage.removeItem("auth_user");
    } catch (error) {
      console.error("Error removing user from localStorage:", error);
    }
  },
};

// Authentication API functions
export const authApi = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      "/api/auth/register",
      data
    );

    // Store token and user data
    if (response.data.data.token) {
      tokenStorage.set(response.data.data.token);
      userStorage.set(response.data.data.user);
    }

    return response.data.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      console.log("Auth API: Making login request");
      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        "/api/auth/login",
        data
      );
      console.log("Auth API: Login response received", response.data);

      // Store token and user data
      if (response.data.data.token) {
        tokenStorage.set(response.data.data.token);
        userStorage.set(response.data.data.user);
      }

      return response.data.data;
    } catch (error) {
      console.error("Auth API: Login error", error);
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    // Clear stored data
    tokenStorage.remove();
    userStorage.remove();

    // Note: If we add a logout endpoint to the backend later, we can call it here
    // await apiClient.post('/auth/logout');
  },

  refreshToken: async (): Promise<string> => {
    const response = await apiClient.post<{ data: { token: string } }>(
      "/api/auth/refresh"
    );

    const newToken = response.data.data.token;
    if (newToken) {
      tokenStorage.set(newToken);
    }

    return newToken;
  },

  // Check if user is authenticated based on stored token
  isAuthenticated: (): boolean => {
    const token = tokenStorage.get();
    return !!token;
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    return userStorage.get();
  },

  // Clear all auth data
  clearAuth: (): void => {
    tokenStorage.remove();
    userStorage.remove();
  },
};
