import { Globe } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LoginForm } from "../components/forms/LoginForm";
import { RegisterForm } from "../components/forms/RegisterForm";
import { useAuth } from "../stores/authStore";

export function LoginPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLoginSuccess = () => {
    toast.success("Login successful!", {
      duration: 3000,
    });

    setTimeout(() => {
      navigate("/dashboard", { replace: true });
    }, 1500);
  };

  const handleRegisterSuccess = () => {
    toast.success("Account created successfully!", {
      duration: 3000,
    });

    setTimeout(() => {
      navigate("/dashboard", { replace: true });
    }, 1500);
  };

  const handleError = (error: string) => {
    toast.error(error);
  };

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Globe className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Web Crawler
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {isLogin
              ? "Welcome back! Please sign in to continue."
              : "Create your account to get started."}
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-8">
          {/* Form Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                isLogin
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                !isLogin
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Forms */}
          {isLogin ? (
            <LoginForm onSuccess={handleLoginSuccess} onError={handleError} />
          ) : (
            <RegisterForm
              onSuccess={handleRegisterSuccess}
              onError={handleError}
            />
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Built with modern web technologies for efficient web crawling and
            monitoring.
          </p>
        </div>
      </div>
    </div>
  );
}
