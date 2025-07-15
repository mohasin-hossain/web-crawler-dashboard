import type { AxiosError } from "axios";
import type {
  AnalysisResult,
  BulkActionRequest,
  BulkActionResponse,
  CreateUrlRequest,
  Url,
  UrlActionResponse,
  UrlResponse,
  UrlsQueryParams,
  UrlsResponse,
} from "../../types/url";
import { apiClient } from "./client";

// Helper function to handle API errors
const handleApiError = (error: AxiosError): string => {
  if (
    error.response?.data &&
    typeof error.response.data === "object" &&
    "message" in error.response.data
  ) {
    return (error.response.data as { message: string }).message;
  }
  if (error.message) {
    return error.message;
  }
  return "An unexpected error occurred";
};

// URL API functions
export const urlsApi = {
  // Get list of URLs with optional filtering and pagination
  getUrls: async (params?: UrlsQueryParams): Promise<UrlsResponse> => {
    try {
      const queryParams = new URLSearchParams();

      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.search) queryParams.append("search", params.search);
      if (params?.status) queryParams.append("status", params.status);

      const queryString = queryParams.toString();
      const url = `/api/urls${queryString ? `?${queryString}` : ""}`;

      const response = await apiClient.get<UrlsResponse>(url);
      return response.data; // Backend returns direct response, not wrapped in 'data'
    } catch (error: unknown) {
      throw new Error(handleApiError(error as import("axios").AxiosError));
    }
  },

  // Get a specific URL by ID
  getUrl: async (id: number): Promise<Url> => {
    try {
      const response = await apiClient.get<Url>(`/api/urls/${id}`);
      return response.data;
    } catch (error: unknown) {
      throw new Error(handleApiError(error as import("axios").AxiosError));
    }
  },

  // Create a new URL for analysis
  createUrl: async (data: CreateUrlRequest): Promise<UrlResponse> => {
    try {
      const response = await apiClient.post<UrlResponse>("/api/urls", data);
      return response.data;
    } catch (error: unknown) {
      throw new Error(handleApiError(error as import("axios").AxiosError));
    }
  },

  // Delete a URL
  deleteUrl: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/api/urls/${id}`);
    } catch (error: unknown) {
      throw new Error(handleApiError(error as import("axios").AxiosError));
    }
  },

  // Start analysis for a URL
  startAnalysis: async (id: number): Promise<UrlActionResponse> => {
    try {
      const response = await apiClient.post<UrlActionResponse>(
        `/api/urls/${id}/analyze`
      );
      return response.data;
    } catch (error: unknown) {
      throw new Error(handleApiError(error as import("axios").AxiosError));
    }
  },

  // Stop analysis for a URL
  stopAnalysis: async (id: number): Promise<UrlActionResponse> => {
    try {
      const response = await apiClient.post<UrlActionResponse>(
        `/api/urls/${id}/stop`
      );
      return response.data;
    } catch (error: unknown) {
      throw new Error(handleApiError(error as import("axios").AxiosError));
    }
  },

  // Re-run analysis for a URL
  rerunAnalysis: async (id: number): Promise<UrlActionResponse> => {
    try {
      const response = await apiClient.post<UrlActionResponse>(
        `/api/urls/${id}/rerun`
      );
      return response.data;
    } catch (error: unknown) {
      throw new Error(handleApiError(error as import("axios").AxiosError));
    }
  },

  // Get detailed analysis results for a URL
  getAnalysisResult: async (id: number): Promise<AnalysisResult> => {
    try {
      const response = await apiClient.get<AnalysisResult>(
        `/api/urls/${id}/result`
      );
      return response.data;
    } catch (error: unknown) {
      throw new Error(handleApiError(error as import("axios").AxiosError));
    }
  },

  // Bulk operations (fallback implementation since backend doesn't have bulk endpoints yet)
  bulkAction: async (
    request: BulkActionRequest
  ): Promise<BulkActionResponse> => {
    const { action, urlIds } = request;
    let processed = 0;
    let failed = 0;

    // Execute action for each URL individually
    for (const urlId of urlIds) {
      try {
        switch (action) {
          case "delete":
            await urlsApi.deleteUrl(urlId);
            break;
          case "analyze":
            await urlsApi.startAnalysis(urlId);
            break;
          case "stop":
            await urlsApi.stopAnalysis(urlId);
            break;
          case "rerun":
            await urlsApi.rerunAnalysis(urlId);
            break;
        }
        processed++;
      } catch (error: unknown) {
        failed++;
        console.error(`Failed to ${action} URL ${urlId}:`, error);
      }
    }

    return {
      processed,
      failed,
      success: failed === 0,
      message:
        failed === 0
          ? `Successfully ${
              action === "analyze"
                ? "started analysis for"
                : action === "stop"
                ? "stopped analysis for"
                : action === "rerun"
                ? "re-ran analysis for"
                : "deleted"
            } ${processed} URLs`
          : `${
              action === "analyze"
                ? "Started analysis for"
                : action === "stop"
                ? "Stopped analysis for"
                : action === "rerun"
                ? "Re-ran analysis for"
                : "Deleted"
            } ${processed} URLs, ${failed} failed`,
    };
  },

  // Bulk delete URLs
  bulkDelete: async (urlIds: number[]): Promise<BulkActionResponse> => {
    return urlsApi.bulkAction({ action: "delete", urlIds });
  },

  // Bulk start analysis
  bulkAnalyze: async (urlIds: number[]): Promise<BulkActionResponse> => {
    return urlsApi.bulkAction({ action: "analyze", urlIds });
  },

  // Bulk stop analysis
  bulkStop: async (urlIds: number[]): Promise<BulkActionResponse> => {
    return urlsApi.bulkAction({ action: "stop", urlIds });
  },

  // Bulk re-run analysis
  bulkRerun: async (urlIds: number[]): Promise<BulkActionResponse> => {
    return urlsApi.bulkAction({ action: "rerun", urlIds });
  },

  // Helper function to check if URL is processing
  isProcessing: (url: Url): boolean => {
    return url.status === "processing";
  },

  // Helper function to check if URL is completed
  isCompleted: (url: Url): boolean => {
    return url.status === "completed";
  },

  // Helper function to check if URL has error
  hasError: (url: Url): boolean => {
    return url.status === "error";
  },

  // Helper function to get status display text
  getStatusText: (status: string): string => {
    switch (status) {
      case "pending":
        return "Pending";
      case "processing":
        return "Processing";
      case "completed":
        return "Completed";
      case "error":
        return "Error";
      default:
        return "Unknown";
    }
  },

  // Helper function to get status color
  getStatusColor: (status: string): string => {
    switch (status) {
      case "pending":
        return "yellow";
      case "processing":
        return "blue";
      case "completed":
        return "green";
      case "error":
        return "red";
      default:
        return "gray";
    }
  },

  // Validate URL format
  validateUrl: (url: string): { isValid: boolean; error?: string } => {
    if (!url.trim()) {
      return { isValid: false, error: "URL is required" };
    }

    try {
      const urlObj = new URL(url);
      if (!["http:", "https:"].includes(urlObj.protocol)) {
        return { isValid: false, error: "URL must use HTTP or HTTPS protocol" };
      }
      return { isValid: true };
    } catch {
      return { isValid: false, error: "Invalid URL format" };
    }
  },

  // Format URL for display (remove protocol and trailing slash)
  formatUrlForDisplay: (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.host + urlObj.pathname + urlObj.search;
    } catch {
      return url;
    }
  },

  // Calculate estimated time for analysis based on link count
  getEstimatedAnalysisTime: (
    internalLinks: number,
    externalLinks: number
  ): string => {
    const totalLinks = internalLinks + externalLinks;
    if (totalLinks === 0) return "< 1 min";
    if (totalLinks <= 10) return "1-2 min";
    if (totalLinks <= 50) return "2-5 min";
    if (totalLinks <= 100) return "5-10 min";
    return "10+ min";
  },
};
