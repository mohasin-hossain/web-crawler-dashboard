import { LayoutDashboard, Plus, Sidebar as SidebarIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Add URL",
    href: "/add-url",
    icon: Plus,
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-r border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 ease-in-out z-20 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Toggle Button */}
        <div className="flex justify-end p-4 border-b border-gray-100 dark:border-gray-800">
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
        <nav className="flex-1 px-3 py-6 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <div key={item.name} className="relative group">
                <button
                  onClick={() => navigate(item.href)}
                  className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100"
                  } ${isCollapsed ? "justify-center" : "justify-start"}`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? "text-blue-600 dark:text-blue-400" : ""
                    } ${isCollapsed ? "" : "mr-3"}`}
                  />
                  {!isCollapsed && (
                    <span className="truncate">{item.name}</span>
                  )}

                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 dark:bg-blue-400 rounded-r-full" />
                  )}
                </button>

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {item.name}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45" />
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
