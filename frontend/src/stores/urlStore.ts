import { toast } from "sonner";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { urlsApi } from "../services/api/urls";
import type {
  AnalysisResult,
  CreateUrlRequest,
  Url,
  UrlsQueryParams,
  UrlsResponse,
  UrlStats,
  UrlTableFilters,
} from "../types/url";

interface UrlState {
  // Data state
  urls: Url[];
  selectedUrl: Url | null;
  analysisResult: AnalysisResult | null;

  // UI state
  loading: boolean;
  loadingStates: {
    list: boolean;
    create: boolean;
    delete: boolean;
    analyze: boolean;
    stop: boolean;
    bulk: boolean;
  };

  // Pagination and filtering
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  filters: UrlTableFilters;

  // Selection state for bulk operations
  selectedUrls: Set<number>;

  // Statistics
  stats: UrlStats | null;

  // Error state
  error: string | null;
}

interface UrlActions {
  // Data actions
  fetchUrls: (params?: UrlsQueryParams) => Promise<void>;
  createUrl: (data: CreateUrlRequest) => Promise<void>;
  deleteUrl: (id: number) => Promise<void>;
  startAnalysis: (id: number) => Promise<void>;
  stopAnalysis: (id: number) => Promise<void>;
  getAnalysisResult: (id: number) => Promise<void>;

  // Bulk actions
  bulkDelete: (urlIds: number[]) => Promise<void>;
  bulkAnalyze: (urlIds: number[]) => Promise<void>;
  bulkStop: (urlIds: number[]) => Promise<void>;

  // UI actions
  setFilters: (filters: Partial<UrlTableFilters>) => void;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  resetFilters: () => void;

  // Selection actions
  selectUrl: (id: number) => void;
  deselectUrl: (id: number) => void;
  selectAllUrls: () => void;
  deselectAllUrls: () => void;
  isUrlSelected: (id: number) => boolean;

  // Utility actions
  clearError: () => void;
  setSelectedUrl: (url: Url | null) => void;
  refreshUrls: () => Promise<void>;
  calculateStats: () => void;
}

type UrlStore = UrlState & UrlActions;

const defaultFilters: UrlTableFilters = {
  search: "",
  status: "all",
  page: 1,
  limit: 10,
};

const defaultPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};

const defaultLoadingStates = {
  list: false,
  create: false,
  delete: false,
  analyze: false,
  stop: false,
  bulk: false,
};

export const useUrlStore = create<UrlStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      urls: [],
      selectedUrl: null,
      analysisResult: null,
      loading: false,
      loadingStates: defaultLoadingStates,
      pagination: defaultPagination,
      filters: defaultFilters,
      selectedUrls: new Set(),
      stats: null,
      error: null,

      // Fetch URLs with optional parameters
      fetchUrls: async (params?: UrlsQueryParams) => {
        const state = get();
        set({
          loadingStates: { ...state.loadingStates, list: true },
          error: null,
        });

        try {
          const queryParams = params || {
            page: state.filters.page,
            limit: state.filters.limit,
            search: state.filters.search || undefined,
            status:
              state.filters.status !== "all" ? state.filters.status : undefined,
          };

          const response: UrlsResponse = await urlsApi.getUrls(queryParams);

          set({
            urls: response.urls,
            pagination: {
              page: response.page,
              limit: response.limit,
              total: response.total,
              totalPages: response.total_pages,
            },
            loadingStates: { ...state.loadingStates, list: false },
          });

          // Calculate stats after fetching URLs
          get().calculateStats();
        } catch (error: any) {
          set({
            error: error.message,
            loadingStates: { ...state.loadingStates, list: false },
          });
          toast.error("Failed to fetch URLs: " + error.message);
        }
      },

      // Create new URL
      createUrl: async (data: CreateUrlRequest) => {
        const state = get();
        set({
          loadingStates: { ...state.loadingStates, create: true },
          error: null,
        });

        try {
          await urlsApi.createUrl(data);
          toast.success("URL added successfully!");

          // Refresh the list
          await get().refreshUrls();

          set({ loadingStates: { ...state.loadingStates, create: false } });
        } catch (error: any) {
          set({
            error: error.message,
            loadingStates: { ...state.loadingStates, create: false },
          });
          toast.error("Failed to add URL: " + error.message);
        }
      },

      // Delete URL
      deleteUrl: async (id: number) => {
        const state = get();
        set({
          loadingStates: { ...state.loadingStates, delete: true },
          error: null,
        });

        try {
          await urlsApi.deleteUrl(id);
          toast.success("URL deleted successfully!");

          // Remove from selected if it was selected
          const newSelected = new Set(state.selectedUrls);
          newSelected.delete(id);
          set({ selectedUrls: newSelected });

          // Refresh the list
          await get().refreshUrls();

          set({ loadingStates: { ...state.loadingStates, delete: false } });
        } catch (error: any) {
          set({
            error: error.message,
            loadingStates: { ...state.loadingStates, delete: false },
          });
          toast.error("Failed to delete URL: " + error.message);
        }
      },

      // Start analysis
      startAnalysis: async (id: number) => {
        const state = get();
        set({
          loadingStates: { ...state.loadingStates, analyze: true },
          error: null,
        });

        try {
          await urlsApi.startAnalysis(id);
          toast.success("Analysis started!");

          // Update the URL status in the list
          const updatedUrls = state.urls.map((url) =>
            url.id === id ? { ...url, status: "processing" as const } : url
          );
          set({
            urls: updatedUrls,
            loadingStates: { ...state.loadingStates, analyze: false },
          });
        } catch (error: any) {
          set({
            error: error.message,
            loadingStates: { ...state.loadingStates, analyze: false },
          });
          toast.error("Failed to start analysis: " + error.message);
        }
      },

      // Stop analysis
      stopAnalysis: async (id: number) => {
        const state = get();
        set({
          loadingStates: { ...state.loadingStates, stop: true },
          error: null,
        });

        try {
          await urlsApi.stopAnalysis(id);
          toast.success("Analysis stopped!");

          // Update the URL status in the list
          const updatedUrls = state.urls.map((url) =>
            url.id === id ? { ...url, status: "pending" as const } : url
          );
          set({
            urls: updatedUrls,
            loadingStates: { ...state.loadingStates, stop: false },
          });
        } catch (error: any) {
          set({
            error: error.message,
            loadingStates: { ...state.loadingStates, stop: false },
          });
          toast.error("Failed to stop analysis: " + error.message);
        }
      },

      // Get analysis result
      getAnalysisResult: async (id: number) => {
        set({ loading: true, error: null });

        try {
          const result = await urlsApi.getAnalysisResult(id);
          set({ analysisResult: result, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          toast.error("Failed to get analysis result: " + error.message);
        }
      },

      // Bulk delete
      bulkDelete: async (urlIds: number[]) => {
        const state = get();
        set({
          loadingStates: { ...state.loadingStates, bulk: true },
          error: null,
        });

        try {
          const result = await urlsApi.bulkDelete(urlIds);
          toast.success(`Successfully deleted ${result.processed} URLs`);

          if (result.failed > 0) {
            toast.warning(`Failed to delete ${result.failed} URLs`);
          }

          // Clear selections and refresh
          set({ selectedUrls: new Set() });
          await get().refreshUrls();

          set({ loadingStates: { ...state.loadingStates, bulk: false } });
        } catch (error: any) {
          set({
            error: error.message,
            loadingStates: { ...state.loadingStates, bulk: false },
          });
          toast.error("Bulk delete failed: " + error.message);
        }
      },

      // Bulk analyze
      bulkAnalyze: async (urlIds: number[]) => {
        const state = get();
        set({
          loadingStates: { ...state.loadingStates, bulk: true },
          error: null,
        });

        try {
          const result = await urlsApi.bulkAnalyze(urlIds);
          toast.success(`Started analysis for ${result.processed} URLs`);

          if (result.failed > 0) {
            toast.warning(`Failed to start analysis for ${result.failed} URLs`);
          }

          // Update statuses and refresh
          await get().refreshUrls();

          set({ loadingStates: { ...state.loadingStates, bulk: false } });
        } catch (error: any) {
          set({
            error: error.message,
            loadingStates: { ...state.loadingStates, bulk: false },
          });
          toast.error("Bulk analyze failed: " + error.message);
        }
      },

      // Bulk stop
      bulkStop: async (urlIds: number[]) => {
        const state = get();
        set({
          loadingStates: { ...state.loadingStates, bulk: true },
          error: null,
        });

        try {
          const result = await urlsApi.bulkStop(urlIds);
          toast.success(`Stopped analysis for ${result.processed} URLs`);

          if (result.failed > 0) {
            toast.warning(`Failed to stop analysis for ${result.failed} URLs`);
          }

          // Update statuses and refresh
          await get().refreshUrls();

          set({ loadingStates: { ...state.loadingStates, bulk: false } });
        } catch (error: any) {
          set({
            error: error.message,
            loadingStates: { ...state.loadingStates, bulk: false },
          });
          toast.error("Bulk stop failed: " + error.message);
        }
      },

      // Set filters
      setFilters: (newFilters: Partial<UrlTableFilters>) => {
        const state = get();
        const updatedFilters = { ...state.filters, ...newFilters };
        set({ filters: updatedFilters });

        // Auto-fetch when filters change
        get().fetchUrls();
      },

      // Set page
      setPage: (page: number) => {
        get().setFilters({ page });
      },

      // Set search
      setSearch: (search: string) => {
        get().setFilters({ search, page: 1 }); // Reset to first page when searching
      },

      // Reset filters
      resetFilters: () => {
        set({ filters: defaultFilters });
        get().fetchUrls();
      },

      // Select URL
      selectUrl: (id: number) => {
        const state = get();
        const newSelected = new Set(state.selectedUrls);
        newSelected.add(id);
        set({ selectedUrls: newSelected });
      },

      // Deselect URL
      deselectUrl: (id: number) => {
        const state = get();
        const newSelected = new Set(state.selectedUrls);
        newSelected.delete(id);
        set({ selectedUrls: newSelected });
      },

      // Select all URLs
      selectAllUrls: () => {
        const state = get();
        const urls = state.urls || [];
        const allIds = new Set(urls.map((url) => url.id));
        set({ selectedUrls: allIds });
      },

      // Deselect all URLs
      deselectAllUrls: () => {
        set({ selectedUrls: new Set() });
      },

      // Check if URL is selected
      isUrlSelected: (id: number) => {
        return get().selectedUrls.has(id);
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Set selected URL
      setSelectedUrl: (url: Url | null) => {
        set({ selectedUrl: url });
      },

      // Refresh URLs
      refreshUrls: async () => {
        const state = get();
        await get().fetchUrls({
          page: state.filters.page,
          limit: state.filters.limit,
          search: state.filters.search || undefined,
          status:
            state.filters.status !== "all" ? state.filters.status : undefined,
        });
      },

      // Calculate stats
      calculateStats: () => {
        const state = get();
        const urls = state.urls || []; // Ensure urls is always an array

        if (urls.length === 0) {
          set({ stats: null });
          return;
        }

        const stats: UrlStats = {
          total: state.pagination?.total || 0,
          pending: urls.filter((url) => url.status === "pending").length,
          processing: urls.filter((url) => url.status === "processing").length,
          completed: urls.filter((url) => url.status === "completed").length,
          error: urls.filter((url) => url.status === "error").length,
          totalBrokenLinks: urls.reduce(
            (sum, url) => sum + (url.broken_links || 0),
            0
          ),
          avgInternalLinks:
            urls.length > 0
              ? Math.round(
                  urls.reduce(
                    (sum, url) => sum + (url.internal_links || 0),
                    0
                  ) / urls.length
                )
              : 0,
          avgExternalLinks:
            urls.length > 0
              ? Math.round(
                  urls.reduce(
                    (sum, url) => sum + (url.external_links || 0),
                    0
                  ) / urls.length
                )
              : 0,
        };

        set({ stats });
      },
    }),
    {
      name: "url-store",
      partialize: (state: UrlStore) => ({
        filters: state.filters,
        pagination: state.pagination,
      }),
    }
  )
);
