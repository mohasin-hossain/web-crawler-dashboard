import { Link as LinkIcon, Plus, XCircle } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ProcessingIndicator } from "../components/common";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { BulkActions } from "../components/dashboard/BulkActions";
import { FilterBar } from "../components/dashboard/FilterBar";
import { UrlTable } from "../components/dashboard/UrlTable";
import { QuickAddUrlForm } from "../components/forms/AddUrlForm";
import { useUrlPolling } from "../hooks/useUrlPolling";
import { useAuth } from "../stores/authStore";
import { useUrlStore } from "../stores/urlStore";
import type { CreateUrlRequest, Url } from "../types/url";

export function UrlManagementPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const urlStoreData = useUrlStore();

  // Safely extract data with proper null/undefined handling
  const urls = urlStoreData.urls || [];
  const pagination = urlStoreData.pagination;
  const filters = urlStoreData.filters;
  const selectedUrls = urlStoreData.selectedUrls || new Set();
  const loadingStates = urlStoreData.loadingStates;
  const error = urlStoreData.error;

  // Actions
  const {
    fetchUrls,
    createUrl,
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
    syncUrlsData, // Add method to sync polling data
  } = urlStoreData;

  // Use smart polling instead of manual intervals
  const {
    urls: polledUrls,
    isLoading: pollingLoading,
    hasProcessingUrls,
    refetch: refetchPolling,
  } = useUrlPolling({
    enabled: isAuthenticated && !!user,
    pollingInterval: 3000, // 3 seconds
    queryParams: {
      page: filters?.page,
      limit: filters?.limit,
      search: filters?.search || undefined,
      status: filters?.status !== "all" ? filters?.status : undefined,
    },
  });

  // Sync polling data with store whenever polled data changes
  useEffect(() => {
    if (polledUrls && polledUrls.length > 0 && syncUrlsData) {
      syncUrlsData(polledUrls);
    }
  }, [polledUrls, syncUrlsData]);

  // Initial fetch and sync with store
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUrls().catch((error) => {
        console.error("Failed to fetch URLs:", error);
      });
    }
  }, [fetchUrls, isAuthenticated, user]);

  // Auto-select the latest pending URL when URLs list changes
  useEffect(() => {
    if (urls.length > 0 && selectedUrls.size === 0) {
      // Find the newest URL that can be analyzed (pending, unknown, or error status)
      const analyzableUrls = urls
        .filter((url) => {
          const status = url.status?.toLowerCase() || "";
          return (
            status === "pending" ||
            status === "unknown" ||
            status === "error" ||
            status === ""
          );
        })
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

      if (analyzableUrls.length > 0) {
        const latestAnalyzableUrl = analyzableUrls[0];
        selectUrl(latestAnalyzableUrl.id);
      }
    }
  }, [urls, selectedUrls.size, selectUrl]);

  // Get selected URL objects for BulkActions
  const selectedUrlObjects = urls.filter((url) => selectedUrls.has(url.id));

  const handleAddUrlSuccess = () => {
    if (isAuthenticated) {
      fetchUrls(); // Refresh the list
      refetchPolling(); // Also refresh polling data
    }
  };

  const handleCreateUrl = async (data: CreateUrlRequest) => {
    await createUrl(data);
    handleAddUrlSuccess();
  };

  const handleViewDetails = (url: Url) => {
    navigate(`/urls/${url.id}`);
  };

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

      {/* URL Management */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="p-6">
          {/* Add New URL Section */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Plus className="w-6 h-6 text-blue-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Add New URL
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Enter a website URL to analyze its structure, links, and
              performance
            </p>
            <QuickAddUrlForm
              onSubmit={handleCreateUrl}
              loading={loadingStates?.create || false}
            />
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700 mb-8"></div>

          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center mb-1">
                <LinkIcon className="w-6 h-6 text-blue-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  URL Management
                </h2>
              </div>
              <p className="ml-9 text-sm text-gray-500 dark:text-gray-400 mt-1">
                Analyze and manage your website URLs
                {hasProcessingUrls && (
                  <span className="ml-2 inline-flex items-center">
                    <ProcessingIndicator />
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          {filters && pagination && (
            <FilterBar
              filters={filters}
              onFiltersChange={setFilters}
              onResetFilters={resetFilters}
              totalUrls={pagination.total || 0}
              loading={loadingStates?.list || pollingLoading}
            />
          )}

          {/* Bulk Actions */}
          {selectedUrls.size > 0 && (
            <div className="mt-4">
              <BulkActions
                selectedCount={selectedUrls.size}
                selectedUrls={selectedUrlObjects}
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
                loading={loadingStates?.list || pollingLoading}
                onUrlSelect={selectUrl}
                onUrlDeselect={deselectUrl}
                onSelectAll={selectAllUrls}
                onDeselectAll={deselectAllUrls}
                onPageChange={setPage}
                onViewDetails={handleViewDetails}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
