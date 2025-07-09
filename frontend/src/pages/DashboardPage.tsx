import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { useAuth, useAuthActions } from "../stores/authStore";

export function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const { logout } = useAuthActions();

  // Redirect if not authenticated
  if (!isAuthenticated) {
    window.location.href = "/";
    return null;
  }

  const handleLogout = () => {
    // Show toast immediately
    toast.success("Logged out successfully", {
      duration: 3000,
    });

    logout();

    // Delay redirect to show toast
    setTimeout(() => {
      window.location.href = "/";
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Web Crawler Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Welcome back,{" "}
                <b>
                  {user?.username
                    ? user.username.charAt(0).toUpperCase() +
                      user.username.slice(1)
                    : "User"}
                </b>
                !
              </p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="cursor-pointer"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Dashboard Coming Soon
              </h2>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
