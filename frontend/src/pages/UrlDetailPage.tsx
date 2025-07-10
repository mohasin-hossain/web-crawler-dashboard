import {
  ArrowLeft,
  ExternalLink,
  Play,
  RefreshCw,
  Square,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ProcessingIndicator, UrlDetailSkeleton } from "../components/common";
import { ErrorBoundary } from "../components/common/ErrorBoundary";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { AnalysisOverview } from "../components/details/AnalysisOverview";
import { BrokenLinksTable } from "../components/details/BrokenLinksTable";
import { LinksChart } from "../components/details/LinksChart";
import { Button } from "../components/ui/button";
import { useUrlResultPolling } from "../hooks/useUrlPolling";
import { urlsApi } from "../services/api/urls";
import type { AnalysisResult } from "../types/url";

export function UrlDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState({
    analyze: false,
    stop: false,
    delete: false,
  });

  const urlId = id ? Number(id) : 0;

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
      setError(pollingError.message);
    }
  }, [pollingError]);

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

    const confirmed = window.confirm(
      "Are you sure you want to delete this URL? This action cannot be undone."
    );

    if (!confirmed) return;

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

  // Show skeleton loader during initial load
  if (pollingLoading && !analysis) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-200/50 rounded-2xl shadow-sm p-6">
          <div className="flex items-center space-x-4 mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/urls")}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to URL Management
            </Button>
            <div className="h-6 border-l border-gray-300"></div>
            <h1 className="text-2xl font-bold text-gray-900">
              URL Analysis Details
            </h1>
          </div>
          <UrlDetailSkeleton />
        </div>
      </div>
    );
  }

  // Show error state
  if (error || (!pollingLoading && !analysis)) {
    return (
      <div className="min-h-96 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Error Loading Analysis
          </h2>
          <p className="text-gray-600 mb-6">{error || "Analysis not found"}</p>
          <div className="space-x-4">
            <Button onClick={() => navigate("/urls")} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to URL Management
            </Button>
            <Button onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const canStartAnalysis =
    analysis?.status === "pending" || analysis?.status === "error";
  const canStopAnalysis = analysis?.status === "processing";
  const isProcessing = analysis?.status === "processing";

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
    </div>
  );
}
