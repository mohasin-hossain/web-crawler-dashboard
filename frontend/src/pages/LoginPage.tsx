import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LoginForm } from "../components/forms/LoginForm";
import { RegisterForm } from "../components/forms/RegisterForm";
import { useAuth } from "../stores/authStore";

export function LoginPage() {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(true);
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated (but allow time for success toast)
  useEffect(() => {
    if (isAuthenticated && shouldRedirect) {
      window.location.href = "/dashboard";
    }
  }, [isAuthenticated, shouldRedirect]);

  // If already authenticated on initial load, redirect immediately
  if (isAuthenticated && shouldRedirect) {
    window.location.href = "/dashboard";
    return null;
  }

  const handleSuccess = () => {
    // Show toast immediately
    toast.success(
      isRegisterMode ? "Account created successfully!" : "Login successful!",
      {
        duration: 3000,
      }
    );

    // Temporarily prevent redirect to show toast
    setShouldRedirect(false);

    // Allow redirect after toast is visible
    setTimeout(() => {
      setShouldRedirect(true);
    }, 2000);
  };

  const handleError = (error: string) => {
    toast.error(error);
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Web Crawler Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Analyze websites and track SEO metrics
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-8">
          {isRegisterMode ? (
            <RegisterForm onSuccess={handleSuccess} onError={handleError} />
          ) : (
            <LoginForm onSuccess={handleSuccess} onError={handleError} />
          )}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-blue-600 hover:text-blue-500 underline"
            >
              {isRegisterMode
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Web Crawler Dashboard. All rights
          reserved.
        </div>
      </div>
    </div>
  );
}
