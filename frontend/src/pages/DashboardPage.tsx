import {
  Activity,
  CheckCircle,
  Clock,
  Globe,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useHealth } from "../hooks/useHealth";

export function DashboardPage() {
  const { data: health, isLoading, isHealthy } = useHealth();

  const stats = [
    {
      name: "Total URLs",
      value: "0",
      icon: Globe,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      change: "+0%",
    },
    {
      name: "Crawled",
      value: "0",
      icon: CheckCircle,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-900/20",
      change: "+0%",
    },
    {
      name: "In Progress",
      value: "0",
      icon: Clock,
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      change: "+0%",
    },
    {
      name: "Success Rate",
      value: "0%",
      icon: TrendingUp,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-900/20",
      change: "+0%",
    },
  ];

  return (
    <div className="space-y-8">
      {/* System Status */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            System Status
          </h2>
        </div>

        <div className="flex items-center space-x-4">
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Checking system status...
              </span>
            </div>
          ) : isHealthy ? (
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                All systems operational
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium text-red-700 dark:text-red-400">
                System experiencing issues
              </span>
            </div>
          )}

          {health?.database && (
            <div className="flex items-center space-x-2 pl-4 border-l border-gray-200 dark:border-gray-700">
              <div
                className={`w-2 h-2 rounded-full ${
                  health.database === "connected"
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              ></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Database:{" "}
                {health.database === "connected" ? "Connected" : "Disconnected"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  {stat.change}
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.name}
                </h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Recent Activity
        </h2>

        <div className="text-center py-12">
          <Globe className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No crawling activity yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
            Start by adding URLs to crawl and monitor their performance from
            this dashboard.
          </p>
          <button
            onClick={() => (window.location.href = "/add-url")}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            <Globe className="w-4 h-4 mr-2" />
            Add Your First URL
          </button>
        </div>
      </div>
    </div>
  );
}
