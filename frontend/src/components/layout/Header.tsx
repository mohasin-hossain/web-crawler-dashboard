import { Globe } from "lucide-react";

interface HeaderProps {
  sidebarCollapsed: boolean;
}

export function Header({ sidebarCollapsed }: HeaderProps) {
  return (
    <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 fixed w-full top-0 z-30">
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? "ml-16 mr-0" : "ml-64 mr-0"
        }`}
      >
        <div className="px-8">
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
          </div>
        </div>
      </div>
    </header>
  );
}
