import {
  Activity,
  CheckCircle,
  Clock,
  Globe,
  Plus,
  XCircle,
} from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { BulkActions } from "../components/dashboard/BulkActions";
import { FilterBar } from "../components/dashboard/FilterBar";
import { UrlTable } from "../components/dashboard/UrlTable";
import { AddUrlForm } from "../components/forms/AddUrlForm";
import { useHealth } from "../hooks/useHealth";
import { useAuth } from "../stores/authStore";
import { useUrlStore } from "../stores/urlStore";
import type { Url } from "../types/url";

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: health, isLoading: healthLoading, isHealthy } = useHealth();
  const { user, isAuthenticated } = useAuth();

  const urlStoreData = useUrlStore();

  // Safely extract data with proper null/undefined handling
  const urls = urlStoreData.urls || [];
  const pagination = urlStoreData.pagination;
  const filters = urlStoreData.filters;
  const selectedUrls = urlStoreData.selectedUrls || new Set();
  const stats = urlStoreData.stats;
  const loadingStates = urlStoreData.loadingStates;
  const error = urlStoreData.error;

  // Actions
  const {
    fetchUrls,
    createUrl,
    deleteUrl,
    startAnalysis,
    stopAnalysis,
    setFilters,
    resetFilters,
    setPage,
    selectUrl,
    deselectUrl,
    selectAllUrls,
    deselectAllUrls,
    bulkDelete,
    bulkAnalyze,
    bulkStop,
    clearError,
  } = urlStoreData;

  // Only fetch URLs if user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUrls().catch((error) => {
        console.error("Failed to fetch URLs:", error);
      });
    }
  }, [fetchUrls, isAuthenticated, user]);

  // Auto-refresh processing URLs every 10 seconds (only if authenticated)
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const processingUrls = urls.filter((url) => url.status === "processing");
    if (processingUrls.length > 0) {
      const interval = setInterval(() => {
        fetchUrls().catch((error) => {
          console.error("Failed to refresh URLs:", error);
        });
      }, 10000); // 10 seconds

      return () => clearInterval(interval);
    }
  }, [urls, fetchUrls, isAuthenticated, user]);

  const handleAddUrl = () => {
    // Dialog is handled by the AddUrlForm component
  };

  const handleAddUrlSuccess = () => {
    if (isAuthenticated) {
      fetchUrls(); // Refresh the list
    }
  };

  const handleViewDetails = (url: Url) => {
    navigate(`/urls/${url.id}`);
  };

  // Don't render anything if not authenticated (should be handled by App.tsx routing)
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

  const statsCards = [
    {
      name: "Total URLs",
      value: stats?.total?.toString() || "0",
      icon: Globe,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      change: "+0%",
    },
    {
      name: "Completed",
      value: stats?.completed?.toString() || "0",
      icon: CheckCircle,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-900/20",
      change: "+0%",
    },
    {
      name: "Processing",
      value: stats?.processing?.toString() || "0",
      icon: Clock,
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      change: "+0%",
    },
    {
      name: "Broken Links",
      value: stats?.totalBrokenLinks?.toString() || "0",
      icon: XCircle,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-900/20",
      change: "+0%",
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

      {/* Primary: URL Management */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                URL Management
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Add, analyze, and manage your website URLs
              </p>
            </div>

            <AddUrlForm
              onSuccess={handleAddUrlSuccess}
              onSubmit={createUrl}
              loading={loadingStates?.create || false}
              trigger={
                <button
                  onClick={handleAddUrl}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add URL
                </button>
              }
            />
          </div>

          {/* Filter Bar */}
          {filters && pagination && (
            <FilterBar
              filters={filters}
              onFiltersChange={setFilters}
              onResetFilters={resetFilters}
              totalUrls={pagination.total || 0}
              loading={loadingStates?.list || false}
            />
          )}

          {/* Bulk Actions */}
          {selectedUrls.size > 0 && (
            <div className="mt-4">
              <BulkActions
                selectedCount={selectedUrls.size}
                onBulkDelete={() => bulkDelete(Array.from(selectedUrls))}
                onBulkAnalyze={() => bulkAnalyze(Array.from(selectedUrls))}
                onBulkStop={() => bulkStop(Array.from(selectedUrls))}
                onClearSelection={deselectAllUrls}
                loading={loadingStates?.bulk || false}
              />
            </div>
          )}

          {/* URL Table */}
          <div className="mt-6">
            {loadingStates?.list && urls.length === 0 ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <UrlTable
                urls={urls}
                filters={filters}
                pagination={pagination}
                selectedUrls={selectedUrls}
                loading={loadingStates?.list || false}
                onUrlSelect={selectUrl}
                onUrlDeselect={deselectUrl}
                onSelectAll={selectAllUrls}
                onDeselectAll={deselectAllUrls}
                onPageChange={setPage}
                onStartAnalysis={startAnalysis}
                onStopAnalysis={stopAnalysis}
                onDeleteUrl={deleteUrl}
                onViewDetails={handleViewDetails}
                loadingStates={loadingStates}
              />
            )}
          </div>
        </div>
      </div>

      {/* Secondary: Quick Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  {stat.change}
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
        })}
      </div>

      {/* System Status - Compact */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              System Status
            </h3>
          </div>

          <div className="flex items-center space-x-4 text-xs">
            {healthLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                <span className="text-gray-500 dark:text-gray-400">
                  Checking...
                </span>
              </div>
            ) : isHealthy ? (
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-700 dark:text-green-400 font-medium">
                  All systems operational
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-700 dark:text-red-400 font-medium">
                  System issues
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
                <span className="text-gray-600 dark:text-gray-400">
                  Database:{" "}
                  {health.database === "connected"
                    ? "Connected"
                    : "Disconnected"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
