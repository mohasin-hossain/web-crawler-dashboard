import {
  Activity,
  CheckCircle,
  CheckCircle2,
  Clock,
  Globe,
  XCircle,
} from "lucide-react";
import { useEffect } from "react";
import { StatsCardSkeleton } from "../components/common";
import { RecentActivityFeed } from "../components/dashboard/RecentActivityFeed";
import { useHealth } from "../hooks/useHealth";
import { useUrlPolling } from "../hooks/useUrlPolling";
import { useAuth } from "../stores/authStore";
import { useUrlStore } from "../stores/urlStore";

export function DashboardPage() {
  const { data: health, isLoading: healthLoading, isHealthy } = useHealth();
  const { user, isAuthenticated } = useAuth();

  const urlStoreData = useUrlStore();

  // Safely extract data with proper null/undefined handling
  const stats = urlStoreData.stats;
  const loadingStates = urlStoreData.loadingStates;
  const error = urlStoreData.error;

  // Actions
  const { fetchUrls, clearError } = urlStoreData;

  // Use smart polling for stats updates
  const { hasProcessingUrls } = useUrlPolling({
    enabled: isAuthenticated && !!user,
    pollingInterval: 5000, // 5 seconds for overview
    queryParams: {
      page: 1,
      limit: 10,
    },
  });

  // Initial fetch for stats
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUrls().catch((error) => {
        console.error("Failed to fetch URL stats:", error);
      });
    }
  }, [fetchUrls, isAuthenticated, user]);

  // Don't render anything if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Please log in to access the dashboard.
          </p>
        </div>
      </div>
    );
  }

  // Enhanced stats cards with trends
  const statsCards = [
    {
      name: "Total URLs",
      value: stats?.total?.toString() || "0",
      icon: Globe,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      name: "Success Rate",
      value: stats?.successRate ? `${stats.successRate}%` : "0%",
      icon: CheckCircle,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-900/20",
    },
    {
      name: "Processing",
      value: stats?.processing?.toString() || "0",
      icon: Clock,
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      showProcessing: hasProcessingUrls,
    },
    {
      name: "Completed",
      value: stats?.completed?.toString() || "0",
      icon: CheckCircle2,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-900/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-600"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* System Status - Top Priority */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 shadow-sm">
        {/* Mobile: stacked, md+: horizontal */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0">
          {/* Icon + Title */}
          <div className="flex items-center space-x-2 md:space-x-3 mb-2 md:mb-0">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
            <h2 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-white">
              System Status
            </h2>
          </div>

          {/* Statuses */}
          <div className="flex flex-col md:flex-row md:items-center md:space-x-6 gap-2 md:gap-0 text-sm">
            {healthLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full animate-pulse"></div>
                <span className="text-gray-400 dark:text-gray-500 text-xs">
                  Checking...
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-2 px-2 py-1 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-800">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      isHealthy ? "bg-green-400" : "bg-red-400"
                    }`}
                  ></div>
                  <span className="text-gray-700 dark:text-gray-300 text-xs font-medium">
                    Backend:
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 text-xs font-normal">
                    {isHealthy ? "Healthy" : "Error"}
                  </span>
                </div>
                <div className="flex items-center space-x-2 px-2 py-1 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-800">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      health?.database === "connected"
                        ? "bg-green-400"
                        : "bg-red-400"
                    }`}
                  ></div>
                  <span className="text-gray-700 dark:text-gray-300 text-xs font-medium">
                    Database:
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 text-xs font-normal">
                    {health?.database === "connected" ? "Connected" : "Error"}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loadingStates?.list && !stats ? (
          <StatsCardSkeleton />
        ) : (
          statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.name}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>

                <div className="mt-3">
                  <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    {stat.name}
                  </h3>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Recent Activity Feed */}
      {stats?.recentActivity && (
        <RecentActivityFeed activities={stats.recentActivity} />
      )}
    </div>
  );
}
