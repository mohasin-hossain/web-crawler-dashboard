import { ChevronDown, Globe, LogOut, Shield, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth, useAuthActions } from "../../stores/authStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export function Header() {
  const { user, isAuthenticated } = useAuth();
  const { logout } = useAuthActions();
  const navigate = useNavigate();

  const handleLogout = () => {
    toast.success("Logged out successfully", {
      duration: 3000,
    });

    logout();

    setTimeout(() => {
      navigate("/login", { replace: true });
    }, 1500);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 fixed w-full top-0 z-30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Title */}
          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
                Web crawler
              </h1>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* User Profile Dropdown */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user?.username
                      ? user.username.charAt(0).toUpperCase() +
                        user.username.slice(1)
                      : "User"}
                  </span>
                  <ChevronDown className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                </div>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-64 p-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {user?.username
                          ? user.username.charAt(0).toUpperCase()
                          : "U"}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.username
                          ? user.username.charAt(0).toUpperCase() +
                            user.username.slice(1)
                          : "User"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user?.email || "user@example.com"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Account Status */}
                <div className="px-4 py-3">
                  <div className="flex items-center space-x-2 text-xs">
                    <Shield className="w-3 h-3 text-green-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Account Status:
                    </span>
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      Active
                    </span>
                  </div>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-100 dark:border-gray-700 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
