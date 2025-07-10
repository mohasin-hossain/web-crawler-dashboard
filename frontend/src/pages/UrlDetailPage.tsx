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
import { ErrorBoundary } from "../components/common/ErrorBoundary";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { AnalysisOverview } from "../components/details/AnalysisOverview";
import { BrokenLinksTable } from "../components/details/BrokenLinksTable";
import { LinksChart } from "../components/details/LinksChart";
import { Button } from "../components/ui/button";
import { urlsApi } from "../services/api/urls";
import type { AnalysisResult } from "../types/url";

export function UrlDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState({
    analyze: false,
    stop: false,
    delete: false,
  });

  const fetchAnalysis = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const result = await urlsApi.getAnalysisResult(Number(id));
      setAnalysis(result);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load analysis results";
      setError(errorMessage);
      toast.error("Failed to load analysis results");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [id]);

  const handleStartAnalysis = async () => {
    if (!analysis) return;

    try {
      setActionLoading({ ...actionLoading, analyze: true });
      await urlsApi.startAnalysis(analysis.id);
      toast.success("Analysis started successfully");

      // Refresh the analysis after a short delay
      setTimeout(() => {
        fetchAnalysis();
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

      // Refresh the analysis
      setTimeout(() => {
        fetchAnalysis();
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
      navigate("/dashboard");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete URL";
      toast.error(errorMessage);
      setActionLoading({ ...actionLoading, delete: false });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading analysis results..." />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Error Loading Analysis
          </h2>
          <p className="text-gray-600 mb-6">{error || "Analysis not found"}</p>
          <div className="space-x-4">
            <Button onClick={() => navigate("/dashboard")} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <Button onClick={fetchAnalysis}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const canStartAnalysis =
    analysis.status === "pending" || analysis.status === "error";
  const canStopAnalysis = analysis.status === "processing";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/dashboard")}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="h-6 border-l border-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">
                URL Analysis Details
              </h1>
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
                onClick={() => window.open(analysis.url, "_blank")}
                variant="outline"
                size="sm"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open URL
              </Button>

              <Button
                onClick={handleDeleteUrl}
                disabled={
                  actionLoading.delete || analysis.status === "processing"
                }
                variant="destructive"
                size="sm"
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorBoundary>
          <div className="space-y-8">
            {/* Analysis Overview */}
            <AnalysisOverview analysis={analysis} />

            {/* Internal vs External Links Chart */}
            <LinksChart analysis={analysis} />

            {/* Broken Links */}
            <BrokenLinksTable analysis={analysis} />
          </div>
        </ErrorBoundary>
      </div>
    </div>
  );
}
