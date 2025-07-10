import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { LoadingSpinner } from "./components/common/LoadingSpinner";
import { Layout } from "./components/layout/Layout";
import { Toaster } from "./components/ui/sonner";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { UrlDetailPage } from "./pages/UrlDetailPage";
import { UrlManagementPage } from "./pages/UrlManagementPage";
import { useAuth, useAuthActions } from "./stores/authStore";

// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

function App() {
  const { isAuthenticated, isLoading, isInitialized } = useAuth();
  const { checkAuth } = useAuthActions();

  useEffect(() => {
    // Initialize auth state on app start
    checkAuth();
  }, [checkAuth]);

  // Show loading spinner while checking authentication
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" text="Loading application..." />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate to="/urls" replace />
                ) : (
                  <LoginPage />
                )
              }
            />
            <Route
              path="/urls"
              element={
                isAuthenticated ? (
                  <Layout>
                    <UrlManagementPage />
                  </Layout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/dashboard"
              element={
                isAuthenticated ? (
                  <Layout>
                    <DashboardPage />
                  </Layout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/urls/:id"
              element={
                isAuthenticated ? (
                  <Layout>
                    <UrlDetailPage />
                  </Layout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/"
              element={
                <Navigate to={isAuthenticated ? "/urls" : "/login"} replace />
              }
            />
            <Route
              path="*"
              element={
                <Navigate to={isAuthenticated ? "/urls" : "/login"} replace />
              }
            />
          </Routes>
          <Toaster position="bottom-right" richColors closeButton />
        </BrowserRouter>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
