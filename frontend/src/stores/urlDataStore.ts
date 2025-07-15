import { toast } from "sonner";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { NOTIFICATIONS } from "../lib/constants";
import { getSuccessMessage, handleApiError } from "../lib/errorHandling";
import { urlsApi } from "../services/api/urls";
import type {
  AnalysisResult,
  CreateUrlRequest,
  Url,
  UrlsQueryParams,
  UrlsResponse,
  UrlStats,
} from "../types/url";

interface UrlDataState {
  // Data state
  urls: Url[];
  selectedUrl: Url | null;
  analysisResult: AnalysisResult | null;
  stats: UrlStats | null;
  error: string | null;
}

interface UrlDataActions {
  // Data actions
  fetchUrls: (params?: UrlsQueryParams) => Promise<void>;
  createUrl: (data: CreateUrlRequest) => Promise<void>;
  deleteUrl: (id: number) => Promise<void>;
  startAnalysis: (id: number) => Promise<void>;
  stopAnalysis: (id: number) => Promise<void>;
  getAnalysisResult: (id: number) => Promise<void>;
  refreshUrls: () => Promise<void>;
  calculateStats: () => void;
  syncUrlsData: (polledUrls: Url[]) => void;
  clearError: () => void;
  setSelectedUrl: (url: Url | null) => void;
}

type UrlDataStore = UrlDataState & UrlDataActions;

export const useUrlDataStore = create<UrlDataStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      urls: [],
      selectedUrl: null,
      analysisResult: null,
      stats: null,
      error: null,

      // Fetch URLs with optional parameters
      fetchUrls: async (params?: UrlsQueryParams) => {
        set({ error: null });

        try {
          const response: UrlsResponse = await urlsApi.getUrls(params || {});

          set({
            urls: Array.isArray(response.urls) ? response.urls : [],
          });

          // Calculate stats after fetching URLs
          get().calculateStats();
        } catch (error: unknown) {
          const errorMessage = handleApiError(error, "fetch URLs");
          set({ error: errorMessage });
          toast.error(errorMessage, {
            duration: NOTIFICATIONS.TOAST_DURATION.NORMAL,
          });
        }
      },

      // Create new URL
      createUrl: async (data: CreateUrlRequest) => {
        set({ error: null });

        try {
          await urlsApi.createUrl(data);
          toast.success(getSuccessMessage("URL", "CREATED"), {
            duration: NOTIFICATIONS.TOAST_DURATION.NORMAL,
          });

          // Refresh the list
          await get().refreshUrls();
        } catch (error: unknown) {
          const errorMessage = handleApiError(error, "add URL");
          set({ error: errorMessage });
          toast.error(errorMessage, {
            duration: NOTIFICATIONS.TOAST_DURATION.NORMAL,
          });
        }
      },

      // Delete URL
      deleteUrl: async (id: number) => {
        set({ error: null });

        try {
          await urlsApi.deleteUrl(id);
          toast.success("URL deleted successfully!");

          // Refresh the list
          await get().refreshUrls();
        } catch (error: unknown) {
          const errorMessage = extractErrorMessage(
            error,
            "Failed to delete URL"
          );
          set({ error: errorMessage });
          toast.error("Failed to delete URL: " + errorMessage);
        }
      },

      // Start analysis
      startAnalysis: async (id: number) => {
        set({ error: null });

        try {
          const response = await urlsApi.startAnalysis(id);
          toast.success("Analysis started!");

          // Update the URL status in the list using the response
          const updatedUrls = get().urls.map((url) =>
            url.id === id
              ? {
                  ...url,
                  status: response.status,
                  updated_at: response.updated_at,
                }
              : url
          );
          set({ urls: updatedUrls });

          // Trigger an immediate refresh to ensure we have the latest data
          await get().refreshUrls();
        } catch (error: unknown) {
          const errorMessage = extractErrorMessage(
            error,
            "Failed to start analysis"
          );
          set({ error: errorMessage });
          toast.error("Failed to start analysis: " + errorMessage);
        }
      },

      // Stop analysis
      stopAnalysis: async (id: number) => {
        set({ error: null });

        try {
          await urlsApi.stopAnalysis(id);
          toast.success("Analysis stopped!");

          // Update the URL status in the list
          const updatedUrls = get().urls.map((url) =>
            url.id === id ? { ...url, status: "pending" as const } : url
          );
          set({ urls: updatedUrls });
        } catch (error: unknown) {
          const errorMessage = extractErrorMessage(
            error,
            "Failed to stop analysis"
          );
          set({ error: errorMessage });
          toast.error("Failed to stop analysis: " + errorMessage);
        }
      },

      // Get analysis result
      getAnalysisResult: async (id: number) => {
        set({ error: null });

        try {
          const result = await urlsApi.getAnalysisResult(id);
          set({ analysisResult: result });
        } catch (error: unknown) {
          const errorMessage = extractErrorMessage(
            error,
            "Failed to get analysis result"
          );
          set({ error: errorMessage });
          toast.error("Failed to get analysis result: " + errorMessage);
        }
      },

      // Refresh URLs
      refreshUrls: async () => {
        await get().fetchUrls();
      },

      // Calculate stats
      calculateStats: () => {
        const urls = get().urls;
        if (urls.length === 0) {
          set({ stats: null });
          return;
        }

        const completed = urls.filter(
          (url) => url.status === "completed"
        ).length;
        const error = urls.filter((url) => url.status === "error").length;
        const analyzed = completed + error;
        const successRate =
          analyzed > 0 ? Math.round((completed / analyzed) * 100) : 0;

        const stats: UrlStats = {
          total: urls.length,
          completed,
          processing: urls.filter((url) => url.status === "processing").length,
          pending: urls.filter((url) => url.status === "pending").length,
          error,
          successRate,
          recentActivity: urls
            .sort(
              (a, b) =>
                new Date(b.updated_at).getTime() -
                new Date(a.updated_at).getTime()
            )
            .slice(0, 10)
            .map((url) => ({
              id: url.id,
              url: url.url,
              action: "completed" as const, // Simplified for now
              timestamp: url.updated_at,
              status: url.status,
            })),
        };

        set({ stats });
      },

      // Sync URLs data from polling
      syncUrlsData: (polledUrls: Url[]) => {
        const currentUrls = get().urls;
        const updatedUrls = currentUrls.map((currentUrl) => {
          const polledUrl = polledUrls.find((url) => url.id === currentUrl.id);
          return polledUrl || currentUrl;
        });
        set({ urls: updatedUrls });
        get().calculateStats();
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Set selected URL
      setSelectedUrl: (url: Url | null) => {
        set({ selectedUrl: url });
      },
    }),
    { name: "url-data-store" }
  )
);

function extractErrorMessage(
  error: unknown,
  fallback = "An error occurred"
): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return fallback;
}
