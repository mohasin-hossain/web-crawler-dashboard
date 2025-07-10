import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { urlsApi } from "../services/api/urls";
import type {
  AnalysisResult,
  Url,
  UrlsQueryParams,
  UrlsResponse,
} from "../types/url";

interface UseUrlPollingOptions {
  enabled?: boolean;
  pollingInterval?: number;
  queryParams?: UrlsQueryParams;
}

interface PollingResult {
  urls: Url[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  hasProcessingUrls: boolean;
}

export function useUrlPolling(
  options: UseUrlPollingOptions = {}
): PollingResult {
  const {
    enabled = true,
    pollingInterval = 3000, // 3 seconds default
    queryParams = {},
  } = options;

  const queryClient = useQueryClient();
  const previousProcessingUrls = useRef<Set<number>>(new Set());

  // Query for URLs with polling enabled when there are processing URLs
  const {
    data: urlsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["urls", queryParams],
    queryFn: () => urlsApi.getUrls(queryParams),
    enabled,
    refetchInterval: (data) => {
      // Only poll if there are processing URLs
      const response = data as unknown as UrlsResponse;
      if (!response?.urls) return false;

      const processingUrls = response.urls.filter(
        (url: Url) => url.status?.toLowerCase() === "processing"
      );
      return processingUrls.length > 0 ? pollingInterval : false;
    },
    refetchOnWindowFocus: true,
    staleTime: 1000, // Consider data stale after 1 second
  });

  const urls: Url[] = urlsResponse?.urls || [];
  const hasProcessingUrls = urls.some(
    (url: Url) => url.status?.toLowerCase() === "processing"
  );

  // Handle status change notifications
  useEffect(() => {
    if (!urls.length) return;

    const currentProcessingUrls = new Set(
      urls
        .filter((url: Url) => url.status?.toLowerCase() === "processing")
        .map((url: Url) => url.id)
    );

    const completedUrls = Array.from(previousProcessingUrls.current).filter(
      (id: number) => !currentProcessingUrls.has(id)
    );

    // Show notifications for completed analyses
    if (completedUrls.length > 0) {
      completedUrls.forEach((urlId: number) => {
        const url = urls.find((u: Url) => u.id === urlId);
        if (url) {
          // You can add toast notifications here if needed
          console.log(`Analysis completed for: ${url.url}`);
        }
      });
    }

    previousProcessingUrls.current = currentProcessingUrls;
  }, [urls]);

  // Auto-refresh individual URL details if they're being viewed
  useEffect(() => {
    if (hasProcessingUrls) {
      // Invalidate URL detail queries to ensure they stay fresh
      queryClient.invalidateQueries({
        queryKey: ["urlResult"],
        exact: false,
      });
    }
  }, [hasProcessingUrls, queryClient]);

  return {
    urls,
    isLoading,
    error: error as Error | null,
    refetch,
    hasProcessingUrls,
  };
}

// Hook for polling a specific URL's analysis result
export function useUrlResultPolling(urlId: number, enabled: boolean = true) {
  return useQuery({
    queryKey: ["urlResult", urlId],
    queryFn: () => urlsApi.getAnalysisResult(urlId),
    enabled: enabled && !!urlId,
    refetchInterval: (data) => {
      // Poll every 2 seconds if the URL is still processing
      const result = data as unknown as AnalysisResult;
      return result && result.status?.toLowerCase() === "processing"
        ? 2000
        : false;
    },
    refetchOnWindowFocus: true,
    staleTime: 1000,
  });
}

// Hook for monitoring multiple URL statuses
export function useMultipleUrlPolling(
  urlIds: number[],
  enabled: boolean = true
) {
  const queries = useQuery({
    queryKey: ["multipleUrls", urlIds.sort()],
    queryFn: async () => {
      const urls = await Promise.all(
        urlIds.map(async (id: number) => {
          try {
            return await urlsApi.getUrl(id);
          } catch (error) {
            console.error(`Failed to fetch URL ${id}:`, error);
            return null;
          }
        })
      );
      return urls.filter((url): url is Url => url !== null);
    },
    enabled: enabled && urlIds.length > 0,
    refetchInterval: (data) => {
      if (!data) return false;
      const urlData = data as unknown as Url[];
      const hasProcessing = urlData.some(
        (url: Url) => url.status?.toLowerCase() === "processing"
      );
      return hasProcessing ? 3000 : false;
    },
    staleTime: 1000,
  });

  return {
    urls: queries.data || [],
    isLoading: queries.isLoading,
    error: queries.error as Error | null,
    refetch: queries.refetch,
  };
}
