import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  ExternalLink,
  Play,
  RefreshCw,
  Square,
  Trash2,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ProcessingIndicator } from "../components/common";
import { ErrorBoundary } from "../components/common/ErrorBoundary";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { AnalysisOverview } from "../components/details/AnalysisOverview";
import { BrokenLinksTable } from "../components/details/BrokenLinksTable";
import { LinksChart } from "../components/details/LinksChart";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Button } from "../components/ui/button";
import { useUrlResultPolling } from "../hooks/useUrlPolling";
import { NOTIFICATIONS } from "../lib/constants";
import { handleApiError } from "../lib/errorHandling";
import { urlsApi } from "../services/api/urls";
import type { AnalysisResult } from "../types/url";

export function UrlDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState({
    analyze: false,
    stop: false,
    delete: false,
  });

  const urlId = id ? Number(id) : 0;

  // Fetch basic URL info to determine current status independent of full analysis result
  const {
    data: urlInfo,
    isLoading: urlInfoLoading,
    error: urlInfoError,
  } = useQuery({
    queryKey: ["urlInfo", urlId],
    queryFn: () => urlsApi.getUrl(urlId),
    enabled: !!urlId,
    refetchInterval: (data) => {
      const status = (data as any)?.status?.toLowerCase?.();
      return status === "processing" || status === "queued" ? 2000 : false;
    },
    staleTime: 1000,
  });

  // Scroll to top when component mounts or ID changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Use smart polling for real-time updates
  const {
    data: polledAnalysis,
    isLoading: pollingLoading,
    error: pollingError,
    refetch,
  } = useUrlResultPolling(urlId, !!urlId);

  // Derive current status flags (computed early so hooks below can use them)
  const combinedStatus = (
    analysis?.status ||
    urlInfo?.status ||
    ""
  ).toLowerCase();
  const isQueued = combinedStatus === "queued";
  const isProcessing = combinedStatus === "processing";
  const isPending = combinedStatus === "pending";
  const isErrorStatus = combinedStatus === "error";

  // Ensure we keep trying to fetch analysis result while the crawl is processing or queued
  useEffect(() => {
    if (!isProcessing && !isQueued) return;

    const intervalId = setInterval(() => {
      refetch();
    }, 2000);

    return () => clearInterval(intervalId);
  }, [isProcessing, isQueued, refetch]);

  // Sync polled data with local state
  useEffect(() => {
    if (polledAnalysis) {
      setAnalysis(polledAnalysis);
      setError(null);
    }
  }, [polledAnalysis]);

  // Handle polling errors
  useEffect(() => {
    if (pollingError) {
      // Only set error if we don't have analysis yet or analysis itself returned error
      if (!polledAnalysis || polledAnalysis.status === "error") {
        setError(pollingError.message);
      }
    }
  }, [pollingError, polledAnalysis]);

  // Handle URL info error (e.g., URL not found).
  useEffect(() => {
    if (urlInfoError) {
      setError(urlInfoError.message);
    }
  }, [urlInfoError]);

  const handleStartAnalysis = useCallback(async () => {
    if (!analysis) return;
    try {
      setActionLoading({ ...actionLoading, analyze: true });
      await urlsApi.startAnalysis(analysis.id);
      toast.success("Analysis started successfully", {
        duration: NOTIFICATIONS.TOAST_DURATION.NORMAL,
      });
      setTimeout(() => {
        refetch();
      }, NOTIFICATIONS.DELAY.SHORT);
    } catch (err: unknown) {
      const errorMessage = handleApiError(err, "start analysis");
      toast.error(errorMessage, {
        duration: NOTIFICATIONS.TOAST_DURATION.NORMAL,
      });
    } finally {
      setActionLoading({ ...actionLoading, analyze: false });
    }
  }, [analysis, actionLoading, refetch]);

  const handleStopAnalysis = useCallback(async () => {
    if (!analysis) return;
    try {
      setActionLoading({ ...actionLoading, stop: true });
      await urlsApi.stopAnalysis(analysis.id);
      toast.success("Analysis stopped successfully", {
        duration: NOTIFICATIONS.TOAST_DURATION.NORMAL,
      });
      setTimeout(() => {
        refetch();
      }, NOTIFICATIONS.DELAY.SHORT);
    } catch (err: unknown) {
      const errorMessage = handleApiError(err, "stop analysis");
      toast.error(errorMessage, {
        duration: NOTIFICATIONS.TOAST_DURATION.NORMAL,
      });
    } finally {
      setActionLoading({ ...actionLoading, stop: false });
    }
  }, [analysis, actionLoading, refetch]);

  const handleDeleteUrl = async () => {
    if (!analysis) return;

    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = useCallback(async () => {
    if (!analysis) return;
    setShowDeleteDialog(false);
    try {
      setActionLoading({ ...actionLoading, delete: true });
      await urlsApi.deleteUrl(analysis.id);
      toast.success("URL deleted successfully", {
        duration: NOTIFICATIONS.TOAST_DURATION.NORMAL,
      });
      navigate("/urls");
    } catch (err: unknown) {
      const errorMessage = handleApiError(err, "delete URL");
      toast.error(errorMessage, {
        duration: NOTIFICATIONS.TOAST_DURATION.NORMAL,
      });
      setActionLoading({ ...actionLoading, delete: false });
    }
  }, [analysis, actionLoading, navigate]);

  function hasErrorProp(obj: unknown): obj is { error: string } {
    return (
      typeof obj === "object" &&
      obj !== null &&
      "error" in obj &&
      typeof (obj as any).error === "string"
    );
  }

  // Show loading/processing/queued state during initial load or while processing
  if (pollingLoading || urlInfoLoading || isProcessing || isQueued) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="bg-white border border-gray-200/50 rounded-2xl shadow-sm p-4 md:p-8 max-w-md w-full text-center">
          <div className="mb-4 md:mb-6">
            <div className="mx-auto w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-3 md:mb-4">
              {isQueued ? (
                <div className="bg-yellow-50 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 md:w-8 md:h-8 text-yellow-500" />
                </div>
              ) : isProcessing ? (
                <div className="bg-blue-50 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                </div>
              ) : (
                <div className="bg-gray-50 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border-4 border-gray-600 border-t-transparent animate-spin" />
                </div>
              )}
            </div>
            <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-1 md:mb-2">
              {isQueued
                ? "URL Analysis Queued"
                : isProcessing
                ? "Processing Analysis"
                : "Loading Analysis"}
            </h2>
            <p
              className={`text-sm md:text-base ${
                isQueued
                  ? "text-yellow-600"
                  : isProcessing
                  ? "text-blue-600"
                  : "text-gray-600"
              }`}
            >
              {isQueued
                ? "Your URL is still in queue please start the analysis..."
                : isProcessing
                ? "Please wait while we analyze your URL..."
                : "Please wait while we load your analysis..."}
            </p>
          </div>
          <div className="flex items-center justify-center space-x-2 md:space-x-3">
            <Button
              onClick={() => navigate("/urls")}
              variant="outline"
              className="h-9 md:h-10 text-sm md:text-base px-4 md:px-6 min-w-[100px] md:min-w-[140px]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show error state when analysis status is error or we have a network error without a processing analysis
  if (isErrorStatus || (!analysis && !isProcessing && error)) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="bg-white border border-gray-200/50 rounded-2xl shadow-sm p-4 md:p-8 max-w-md w-full text-center">
          <div className="mb-4 md:mb-6">
            <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-red-50 rounded-full flex items-center justify-center mb-3 md:mb-4">
              <XCircle className="w-6 h-6 md:w-8 md:h-8 text-red-500" />
            </div>
            <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-1 md:mb-2">
              {isErrorStatus ? "Analysis Failed" : "Error Loading Analysis"}
            </h2>
            <p className="text-sm md:text-base text-gray-600">
              {hasErrorProp(analysis)
                ? analysis.error ||
                  error ||
                  "Failed to retrieve analysis results"
                : error || "Failed to retrieve analysis results"}
            </p>
          </div>
          <div className="flex items-center justify-center space-x-2 md:space-x-3">
            <Button
              onClick={() => navigate("/urls")}
              variant="outline"
              className="h-9 md:h-10 text-sm md:text-base px-4 md:px-6 min-w-[100px] md:min-w-[140px]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={() => refetch()}
              className="h-9 md:h-10 text-sm md:text-base px-4 md:px-6 min-w-[100px] md:min-w-[140px] bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show not found state if no analysis and not loading/error/processing
  if (!analysis && !isProcessing) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="bg-white border border-gray-200/50 rounded-2xl shadow-sm p-4 md:p-8 max-w-md w-full text-center">
          <div className="mb-4 md:mb-6">
            <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-yellow-50 rounded-full flex items-center justify-center mb-3 md:mb-4">
              <AlertTriangle className="w-6 h-6 md:w-8 md:h-8 text-yellow-500" />
            </div>
            <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-1 md:mb-2">
              Analysis Not Found
            </h2>
            <p className="text-sm md:text-base text-gray-600">
              The requested analysis could not be found
            </p>
          </div>
          <div className="flex items-center justify-center space-x-2 md:space-x-3">
            <Button
              onClick={() => navigate("/urls")}
              variant="outline"
              className="h-9 md:h-10 text-sm md:text-base px-4 md:px-6 min-w-[100px] md:min-w-[140px]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const canStartAnalysis =
    analysis?.status === "pending" || analysis?.status === "error";
  const canStopAnalysis = analysis?.status === "processing";
  // isProcessing already declared earlier in the component

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Details Page Navigation with rounded corners */}
      <div className="bg-white border border-gray-200/50 rounded-2xl shadow-sm">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 sm:py-6 gap-3 md:gap-0">
            {/* Responsive Nav/Title: md and below = single row, lg+ = row */}
            <div className="w-full flex flex-row items-center justify-between lg:block">
              {/* Small/medium screens: title left, icons right */}
              <div className="flex flex-row items-center justify-between w-full lg:hidden">
                <div className="flex items-center pl-3">
                  <h1 className="text-lg font-bold text-gray-900">
                    URL Analysis Details
                  </h1>
                  {isProcessing && (
                    <ProcessingIndicator url={analysis?.url} className="ml-2" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/urls")}
                    className="text-gray-600 hover:text-gray-900"
                    aria-label="Back to URL Management"
                    title="Back to URL Management"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(analysis?.url, "_blank")}
                    aria-label="Visit Site"
                    title="Visit Site"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleDeleteUrl}
                    disabled={actionLoading.delete || isProcessing}
                    className="text-red-600 hover:text-red-700"
                    aria-label="Delete"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              {/* Large screens: keep previous layout */}
              <div className="hidden lg:flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/urls")}
                  className="text-gray-600 hover:text-gray-900 w-fit"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span className="text-base">Back to URL Management</span>
                </Button>
                <div className="h-6 border-l border-gray-300"></div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    URL Analysis Details
                  </h1>
                  {isProcessing && (
                    <ProcessingIndicator url={analysis?.url} className="mt-1" />
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons: icon row for md and below, full buttons for lg+ */}
            {/* Icon row is already rendered above for md and below */}
            <div className="hidden lg:flex items-center space-x-2 mt-2 lg:mt-0">
              {canStartAnalysis && (
                <Button
                  onClick={handleStartAnalysis}
                  disabled={actionLoading.analyze}
                  size="sm"
                >
                  {actionLoading.analyze ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  Start Analysis
                </Button>
              )}
              {canStopAnalysis && (
                <Button
                  onClick={handleStopAnalysis}
                  disabled={actionLoading.stop}
                  variant="outline"
                  size="sm"
                >
                  {actionLoading.stop ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Square className="w-4 h-4 mr-2" />
                  )}
                  Stop Analysis
                </Button>
              )}
              <Button
                onClick={() => window.open(analysis?.url, "_blank")}
                variant="outline"
                size="sm"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Visit Site
              </Button>
              <Button
                onClick={handleDeleteUrl}
                disabled={actionLoading.delete || isProcessing}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                {actionLoading.delete ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <ErrorBoundary>
        <div className="space-y-4 sm:space-y-6">
          {analysis && (
            <>
              <div className="overflow-x-auto">
                <AnalysisOverview analysis={analysis} />
              </div>
              <div className="overflow-x-auto">
                <LinksChart analysis={analysis} />
              </div>
              {/* Use dummyAnalysis for BrokenLinksTable for UI testing */}
              <div className="overflow-x-auto">
                <BrokenLinksTable analysis={analysis} />
              </div>
            </>
          )}
        </div>
      </ErrorBoundary>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete URL</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this URL? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
