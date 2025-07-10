import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { LoadingSpinner } from "./components/common/LoadingSpinner";
import { Layout } from "./components/layout/Layout";
import { Toaster } from "./components/ui/sonner";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { UrlDetailPage } from "./pages/UrlDetailPage";
import { useAuth, useAuthActions } from "./stores/authStore";

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
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LoginPage />
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
                <UrlDetailPage />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/"
            element={
              <Navigate
                to={isAuthenticated ? "/dashboard" : "/login"}
                replace
              />
            }
          />
          <Route
            path="*"
            element={
              <Navigate
                to={isAuthenticated ? "/dashboard" : "/login"}
                replace
              />
            }
          />
        </Routes>
        <Toaster position="bottom-right" richColors closeButton />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
