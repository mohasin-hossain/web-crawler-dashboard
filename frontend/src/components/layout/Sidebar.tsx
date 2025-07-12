import {
  ChevronDown,
  LayoutDashboard,
  Link as LinkIcon,
  LogOut,
  Shield,
  Sidebar as SidebarIcon,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth, useAuthActions } from "../../stores/authStore";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

type NavigationItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  action?: () => void;
};

const navigation: NavigationItem[] = [
  {
    name: "URL Management",
    href: "/urls",
    icon: LinkIcon,
  },
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { logout } = useAuthActions();

  // Track screen size to disable expand/collapse below md
  const [isMdUp, setIsMdUp] = useState(true);
  useEffect(() => {
    const checkScreen = () => setIsMdUp(window.innerWidth >= 768);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  const handleItemClick = (item: NavigationItem) => {
    if (item.action) {
      item.action();
    } else if (item.href) {
      navigate(item.href);
    }
  };

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

  // Always collapsed below md
  const effectiveCollapsed = isMdUp ? isCollapsed : true;

  return (
    <div
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-r border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 ease-in-out z-20 ${
        effectiveCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Toggle Button - hidden below md */}
        <div className="md:flex hidden justify-end p-4 border-b border-gray-100 dark:border-gray-800">
          <Button
            onClick={onToggle}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <SidebarIcon className="w-4 h-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pt-4 pb-6 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <div key={item.name} className="relative group">
                <button
                  onClick={() => handleItemClick(item)}
                  className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100"
                  } ${effectiveCollapsed ? "justify-center" : "justify-start"}`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? "text-blue-600 dark:text-blue-400" : ""
                    } ${effectiveCollapsed ? "" : "mr-3"}`}
                  />
                  {!effectiveCollapsed && (
                    <span className="truncate">{item.name}</span>
                  )}

                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 dark:bg-blue-400 rounded-r-full" />
                  )}
                </button>

                {/* Tooltip for collapsed state */}
                {effectiveCollapsed && (
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {item.name}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45" />
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Profile - Bottom */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800">
          <div className="relative group">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <div
                  className={`flex items-center space-x-3 px-3 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    effectiveCollapsed ? "justify-center" : "justify-start"
                  }`}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  {!effectiveCollapsed && (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                          {user?.username
                            ? user.username.charAt(0).toUpperCase() +
                              user.username.slice(1)
                            : "User"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user?.email || "user@example.com"}
                        </p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    </>
                  )}
                </div>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align={effectiveCollapsed ? "end" : "start"}
                side={effectiveCollapsed ? "right" : "top"}
                className="w-64 p-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
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

            {/* Tooltip for collapsed state */}
            {effectiveCollapsed && (
              <div className="absolute left-full ml-2 bottom-3 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                {user?.username
                  ? user.username.charAt(0).toUpperCase() +
                    user.username.slice(1)
                  : "User"}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
