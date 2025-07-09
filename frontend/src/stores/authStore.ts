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
      isLoading: true, // Start with loading true
      error: null,
      isInitialized: false,

      // Actions
      login: async (data: LoginRequest) => {
        try {
          set({ isLoading: true, error: null });

          const response = await authApi.login(data);

          // Update state with new auth data
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || error.message || "Login failed";
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      register: async (data: RegisterRequest) => {
        try {
          set({ isLoading: true, error: null });

          const response = await authApi.register(data);

          // Update state with new auth data
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message ||
            error.message ||
            "Registration failed";
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
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
          error: null,
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
          console.error("Error checking auth:", error);
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
  const { user, isAuthenticated, isLoading, error, isInitialized } =
    useAuthStore();
  return { user, isAuthenticated, isLoading, error, isInitialized };
};

export const useAuthActions = () => {
  const { login, register, logout, clearError, checkAuth, refreshToken } =
    useAuthStore();
  return { login, register, logout, clearError, checkAuth, refreshToken };
};
