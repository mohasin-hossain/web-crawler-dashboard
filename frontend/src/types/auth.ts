export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiResponse<T> {
  message: string;
  data: T;
  error?: string;
}

export interface AuthError {
  error: string;
  message: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean; // App-level loading (checking auth on startup)
  isSubmitting: boolean; // Form-level loading (login/register operations)
  error: string | null;
  isInitialized: boolean; // Whether auth state has been initialized
}
