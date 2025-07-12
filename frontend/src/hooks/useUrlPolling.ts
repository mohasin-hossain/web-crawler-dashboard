import { useQuery } from "@tanstack/react-query";
import { urlsApi } from "../services/api/urls";
import type { Url, UrlsQueryParams } from "../types/url";

interface UseUrlPollingOptions {
  enabled?: boolean;
  pollingInterval?: number;
  queryParams?: UrlsQueryParams;
}

interface UseUrlPollingResult {
  urls: Url[];
  isLoading: boolean;
  hasProcessingUrls: boolean;
  refetch: () => void;
}

export function useUrlPolling({
  enabled = true,
  pollingInterval = 2000,
  queryParams = {},
}: UseUrlPollingOptions): UseUrlPollingResult {
  const queryKey = ["urls", "polling", queryParams];

  const {
    data: urlsResponse,
    isLoading,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => urlsApi.getUrls(queryParams),
    enabled,
    refetchInterval: pollingInterval,
    gcTime: 0, // Disable caching
    staleTime: 0, // Always consider data stale
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const urls: Url[] = urlsResponse?.urls || [];

  // Check if there are any processing URLs
  const hasProcessingUrls = urls.some(
    (url) => url.status?.toLowerCase() === "processing"
  );

  return {
    urls,
    isLoading,
    hasProcessingUrls,
    refetch,
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
