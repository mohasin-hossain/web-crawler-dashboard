import { useEffect } from "react";
import { Toaster } from "./components/ui/sonner";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { useAuth, useAuthActions } from "./stores/authStore";

function App() {
  const { isAuthenticated } = useAuth();
  const { checkAuth } = useAuthActions();

  useEffect(() => {
    // Initialize auth state on app start
    checkAuth();
  }, [checkAuth]);

  // Simple routing based on authentication state
  const renderPage = () => {
    const path = window.location.pathname;

    if (path === "/dashboard") {
      return <DashboardPage />;
    }

    // Default route - login/register page
    return <LoginPage />;
  };

  return (
    <>
      {renderPage()}
      <Toaster position="bottom-right" richColors closeButton />
    </>
  );
}

export default App;
