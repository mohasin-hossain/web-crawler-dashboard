import type { Url } from "../types/url";
import { useUrlBulkActions } from "./urlBulkActions";
import { useUrlDataStore } from "./urlDataStore";
import { useUrlSelectionStore } from "./urlSelectionStore";
import { useUrlUIStore } from "./urlUIActions";

// Helper function to determine action from URL status and timestamps
function getActionFromUrl(
  url: Url
): "added" | "completed" | "failed" | "started" {
  const now = new Date().getTime();
  const updated = new Date(url.updated_at).getTime();
  const created = new Date(url.created_at).getTime();

  // If URL was recently created (within last hour)
  if (now - created < 60 * 60 * 1000) {
    return "added";
  }

  // If recently updated and completed
  if (url.status === "completed" && now - updated < 60 * 60 * 1000) {
    return "completed";
  }

  // If recently updated and failed
  if (url.status === "error" && now - updated < 60 * 60 * 1000) {
    return "failed";
  }

  // If currently processing
  if (url.status === "processing") {
    return "started";
  }

  // Default to completed for completed URLs, added for others
  return url.status === "completed" ? "completed" : "added";
}

// Helper function to truncate URL for toast messages
const truncateUrl = (url: string, maxLength: number = 50): string => {
  if (url.length <= maxLength) return url;
  const start = url.substring(0, Math.floor(maxLength / 2));
  const end = url.substring(url.length - Math.floor(maxLength / 2));
  return `${start}...${end}`;
};

// Main URL store that combines all sub-stores
export const useUrlStore = () => {
  const dataStore = useUrlDataStore();
  const uiStore = useUrlUIStore();
  const selectionStore = useUrlSelectionStore();
  const bulkActions = useUrlBulkActions();

  return {
    // Data state
    urls: dataStore.urls,
    selectedUrl: dataStore.selectedUrl,
    analysisResult: dataStore.analysisResult,
    stats: dataStore.stats,
    error: dataStore.error,

    // UI state
    loading: uiStore.loading,
    loadingStates: uiStore.loadingStates,
    pagination: uiStore.pagination,
    filters: uiStore.filters,

    // Selection state
    selectedUrls: selectionStore.selectedUrls,

    // Data actions
    fetchUrls: dataStore.fetchUrls,
    createUrl: dataStore.createUrl,
    deleteUrl: dataStore.deleteUrl,
    startAnalysis: dataStore.startAnalysis,
    stopAnalysis: dataStore.stopAnalysis,
    getAnalysisResult: dataStore.getAnalysisResult,
    refreshUrls: dataStore.refreshUrls,
    calculateStats: dataStore.calculateStats,
    syncUrlsData: dataStore.syncUrlsData,
    clearError: dataStore.clearError,
    setSelectedUrl: dataStore.setSelectedUrl,

    // UI actions
    setFilters: uiStore.setFilters,
    applyFilters: uiStore.applyFilters,
    setPage: uiStore.setPage,
    setSearch: uiStore.setSearch,
    resetFilters: uiStore.resetFilters,
    setLoading: uiStore.setLoading,
    setLoadingState: uiStore.setLoadingState,
    setPagination: uiStore.setPagination,

    // Selection actions
    selectUrl: selectionStore.selectUrl,
    deselectUrl: selectionStore.deselectUrl,
    selectAllUrls: selectionStore.selectAllUrls,
    deselectAllUrls: selectionStore.deselectAllUrls,
    isUrlSelected: selectionStore.isUrlSelected,
    getSelectedCount: selectionStore.getSelectedCount,
    clearSelection: selectionStore.clearSelection,

    // Bulk actions
    bulkDelete: bulkActions.bulkDelete,
    bulkAnalyze: bulkActions.bulkAnalyze,
    bulkStop: bulkActions.bulkStop,
    bulkRerun: bulkActions.bulkRerun,

    // Helper functions
    getActionFromUrl,
    truncateUrl,
  };
};
