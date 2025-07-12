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
import { useEffect, useState } from "react";
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

  const handleStartAnalysis = async () => {
    if (!analysis) return;

    try {
      setActionLoading({ ...actionLoading, analyze: true });
      await urlsApi.startAnalysis(analysis.id);
      toast.success("Analysis started successfully");

      // Force refresh polling
      setTimeout(() => {
        refetch();
      }, 1000);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to start analysis";
      toast.error(errorMessage);
    } finally {
      setActionLoading({ ...actionLoading, analyze: false });
    }
  };

  const handleStopAnalysis = async () => {
    if (!analysis) return;

    try {
      setActionLoading({ ...actionLoading, stop: true });
      await urlsApi.stopAnalysis(analysis.id);
      toast.success("Analysis stopped successfully");

      // Force refresh polling
      setTimeout(() => {
        refetch();
      }, 1000);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to stop analysis";
      toast.error(errorMessage);
    } finally {
      setActionLoading({ ...actionLoading, stop: false });
    }
  };

  const handleDeleteUrl = async () => {
    if (!analysis) return;

    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!analysis) return;

    setShowDeleteDialog(false);

    try {
      setActionLoading({ ...actionLoading, delete: true });
      await urlsApi.deleteUrl(analysis.id);
      toast.success("URL deleted successfully");
      navigate("/urls");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete URL";
      toast.error(errorMessage);
      setActionLoading({ ...actionLoading, delete: false });
    }
  };

  // Show loading/processing/queued state during initial load or while processing
  if (pollingLoading || urlInfoLoading || isProcessing || isQueued) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="bg-white border border-gray-200/50 rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4">
              {isQueued ? (
                <div className="bg-yellow-50 w-16 h-16 rounded-full flex items-center justify-center">
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              ) : isProcessing ? (
                <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                </div>
              ) : (
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-4 border-gray-600 border-t-transparent animate-spin" />
                </div>
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isQueued
                ? "URL Analysis Queued"
                : isProcessing
                ? "Processing Analysis"
                : "Loading Analysis"}
            </h2>
            <p
              className={`${
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
          <div className="flex items-center justify-center space-x-3">
            <Button
              onClick={() => navigate("/urls")}
              variant="outline"
              className="min-w-[140px]"
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
        <div className="bg-white border border-gray-200/50 rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isErrorStatus ? "Analysis Failed" : "Error Loading Analysis"}
            </h2>
            <p className="text-gray-600">
              {analysis?.error ||
                error ||
                "Failed to retrieve analysis results"}
            </p>
          </div>
          <div className="flex items-center justify-center space-x-3">
            <Button
              onClick={() => navigate("/urls")}
              variant="outline"
              className="min-w-[140px]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={() => refetch()}
              className="min-w-[140px] bg-blue-600 hover:bg-blue-700"
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
        <div className="bg-white border border-gray-200/50 rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Analysis Not Found
            </h2>
            <p className="text-gray-600">
              The requested analysis could not be found
            </p>
          </div>
          <div className="flex items-center justify-center space-x-3">
            <Button
              onClick={() => navigate("/urls")}
              variant="outline"
              className="min-w-[140px]"
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
    <div className="space-y-6">
      {/* Details Page Navigation with rounded corners */}
      <div className="bg-white border border-gray-200/50 rounded-2xl shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/urls")}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to URL Management
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

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
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
        <div className="space-y-6">
          {analysis && (
            <>
              <AnalysisOverview analysis={analysis} />
              <LinksChart analysis={analysis} />
              <BrokenLinksTable analysis={analysis} />
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
