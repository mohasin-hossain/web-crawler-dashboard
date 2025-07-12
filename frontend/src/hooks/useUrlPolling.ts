import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { urlsApi } from "../services/api/urls";
import type { AnalysisResult, Url, UrlsQueryParams } from "../types/url";

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
    pollingInterval = 1000, // 1 second default
    queryParams = {},
  } = options;

  const queryClient = useQueryClient();
  const previousProcessingUrls = useRef<Set<number>>(new Set());
  const previousUrlStates = useRef<Map<number, string>>(new Map());

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
      // Always poll at the specified interval
      return pollingInterval;
    },
    refetchOnWindowFocus: true,
    staleTime: 0, // Consider data always stale
    cacheTime: 0, // Disable caching
    notifyOnChangeProps: ["data", "error"], // Only trigger re-render on data/error changes
  });

  const urls: Url[] = urlsResponse?.urls || [];
  const hasProcessingUrls = urls.some(
    (url: Url) =>
      url.status?.toLowerCase() === "processing" ||
      url.status?.toLowerCase() === "queued"
  );

  // Handle status change notifications and cache invalidation
  useEffect(() => {
    if (!urls.length) return;

    const currentUrlStates = new Map(
      urls.map((url) => [url.id, url.status?.toLowerCase() || ""])
    );

    urls.forEach((url) => {
      const prevStatus = previousUrlStates.current.get(url.id);
      const currentStatus = url.status?.toLowerCase();

      if (prevStatus && prevStatus !== currentStatus) {
        // Status has changed, invalidate cache
        queryClient.invalidateQueries({ queryKey: ["urls"] });
        queryClient.invalidateQueries({ queryKey: ["urlResult", url.id] });
      }
    });

    previousUrlStates.current = currentUrlStates;
  }, [urls, queryClient]);

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
