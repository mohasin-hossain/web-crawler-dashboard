import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi, tokenStorage, userStorage } from "../services/api/auth";
import type { AuthState, LoginRequest, RegisterRequest } from "../types/auth";

interface AuthActions {
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  checkAuth: () => void;
  setLoading: (loading: boolean) => void;
  refreshToken: () => Promise<void>;
}

type AuthStore = AuthState &
  AuthActions & {
    isInitialized: boolean;
  };

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false, // App-level loading (for checking auth on startup)
      isSubmitting: false, // Form-level loading (for login/register operations)
      error: null,
      isInitialized: false,

      // Actions
      login: async (data: LoginRequest) => {
        try {
          set({ isSubmitting: true, error: null });

          const response = await authApi.login(data);

          // Update state with new auth data
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isSubmitting: false,
            error: null,
            isInitialized: true,
          });
        } catch (error: unknown) {
          let errorMessage = "Login failed";

          // Handle specific error responses from backend
          if (error && typeof error === "object" && "response" in error) {
            const response = (
              error as {
                response?: { data?: { message?: string; error?: string } };
              }
            ).response;
            if (response?.data?.message) {
              errorMessage = response.data.message;
            } else if (response?.data?.error) {
              errorMessage = response.data.error;
            }
          } else if (error instanceof Error) {
            errorMessage = error.message;
          }

          // Map generic errors to user-friendly messages
          if (errorMessage.includes("Invalid email or password")) {
            errorMessage =
              "Invalid email or password. Please check your credentials and try again.";
          } else if (errorMessage.includes("Authentication failed")) {
            errorMessage =
              "Authentication failed. Please check your credentials.";
          } else if (errorMessage.includes("Network Error")) {
            errorMessage =
              "Network error. Please check your connection and try again.";
          } else if (errorMessage.includes("timeout")) {
            errorMessage = "Request timeout. Please try again.";
          }

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isSubmitting: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      register: async (data: RegisterRequest) => {
        try {
          set({ isSubmitting: true, error: null });

          const response = await authApi.register(data);

          // Update state with new auth data
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isSubmitting: false,
            error: null,
            isInitialized: true,
          });
        } catch (error: unknown) {
          let errorMessage = "Registration failed";

          // Handle specific error responses from backend
          if (error && typeof error === "object" && "response" in error) {
            const response = (
              error as {
                response?: { data?: { message?: string; error?: string } };
              }
            ).response;
            if (response?.data?.message) {
              errorMessage = response.data.message;
            } else if (response?.data?.error) {
              errorMessage = response.data.error;
            }
          } else if (error instanceof Error) {
            errorMessage = error.message;
          }

          // Map generic errors to user-friendly messages
          if (errorMessage.includes("User already exists")) {
            errorMessage =
              "An account with this email already exists. Please use a different email or try logging in.";
          } else if (errorMessage.includes("validation")) {
            errorMessage = "Please check your input and try again.";
          } else if (errorMessage.includes("Network Error")) {
            errorMessage =
              "Network error. Please check your connection and try again.";
          } else if (errorMessage.includes("timeout")) {
            errorMessage = "Request timeout. Please try again.";
          }

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isSubmitting: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      logout: () => {
        // Clear API storage first
        authApi.logout();

        // Then update state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          isSubmitting: false,
          error: null,
          isInitialized: true,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      checkAuth: () => {
        try {
          set({ isLoading: true });

          const token = tokenStorage.get();
          const user = userStorage.get();

          if (token && user) {
            // TODO: Optionally validate token with backend here
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              isInitialized: true,
            });
          } else {
            // Clear invalid auth state
            authApi.clearAuth();
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
              isInitialized: true,
            });
          }
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: "Failed to check authentication",
            isInitialized: true,
          });
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      refreshToken: async () => {
        try {
          const currentToken = get().token;
          if (!currentToken) {
            throw new Error("No token to refresh");
          }

          const newToken = await authApi.refreshToken();
          set({ token: newToken });
        } catch (error) {
          // If refresh fails, logout the user
          get().logout();
          throw error;
        }
      },
    }),
    {
      name: "auth-storage",
      // Only persist essential auth state
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      // Restore state and sync with localStorage
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Check if stored auth is still valid after rehydration
          state.checkAuth();
        }
      },
    }
  )
);

// Helper hooks for easier usage
export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    isSubmitting,
    isInitialized,
  } = useAuthStore();
  return {
    user,
    isAuthenticated,
    isLoading,
    isSubmitting,
    isInitialized,
  };
};

export const useAuthActions = () => {
  const { login, register, logout, clearError, checkAuth, refreshToken } =
    useAuthStore();
  return { login, register, logout, clearError, checkAuth, refreshToken };
};
