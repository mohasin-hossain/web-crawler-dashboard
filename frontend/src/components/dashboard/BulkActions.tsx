import { Play, RefreshCw, Square, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { BulkAction, Url } from "../../types/url";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";

interface BulkActionsProps {
  selectedCount: number;
  selectedUrls: Url[];
  onBulkDelete: (urlsToDelete: Url[]) => Promise<void>;
  onBulkAnalyze: () => Promise<void>;
  onBulkStop: () => Promise<void>;
  onBulkRerun: () => Promise<void>;
  onClearSelection: () => void;
  loading?: boolean;
}

export function BulkActions({
  selectedCount,
  selectedUrls,
  onBulkDelete,
  onBulkAnalyze,
  onBulkStop,
  onBulkRerun,
  onClearSelection,
  loading = false,
}: BulkActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<BulkAction | null>(null);

  if (selectedCount === 0) {
    return null;
  }

  // Group URLs by status
  const urlsByStatus = selectedUrls.reduce((acc, url) => {
    const status = url.status?.toLowerCase() || "unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Count URLs by action type
  const canAnalyzeCount =
    (urlsByStatus["queued"] || 0) +
    (urlsByStatus["pending"] || 0) +
    (urlsByStatus["error"] || 0) +
    (urlsByStatus["unknown"] || 0);

  const processingCount = urlsByStatus["processing"] || 0;
  const completedCount = urlsByStatus["completed"] || 0;
  const errorCount = urlsByStatus["error"] || 0;

  // Determine deletable URLs (not processing)
  const deletableUrls = selectedUrls.filter(
    (url) => url.status !== "processing"
  );
  const deletableCount = deletableUrls.length;

  // Determine button states
  const canStartAnalysis = canAnalyzeCount > 0;
  const canStopAnalysis = processingCount > 0;
  const canRerunAnalysis = completedCount > 0 || errorCount > 0;

  const handleBulkAction = async (action: BulkAction) => {
    setPendingAction(action);
    try {
      switch (action) {
        case "delete":
          await onBulkDelete(deletableUrls);
          break;
        case "analyze":
          await onBulkAnalyze();
          break;
        case "stop":
          await onBulkStop();
          break;
        case "rerun":
          await onBulkRerun();
          break;
      }
    } finally {
      setPendingAction(null);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteDialog(false);
    // Only delete deletable URLs (not processing)
    if (deletableUrls.length > 0) {
      await onBulkDelete(deletableUrls);
    }
  };

  const isActionLoading = (action: BulkAction) => {
    return loading || pendingAction === action;
  };

  // Get detailed button text
  const getAnalysisButtonText = () => {
    if (!canStartAnalysis) return "No URLs to analyze";

    const parts = [];
    if (urlsByStatus["queued"]) parts.push(`${urlsByStatus["queued"]} queued`);
    if (urlsByStatus["pending"])
      parts.push(`${urlsByStatus["pending"]} pending`);
    if (urlsByStatus["error"]) parts.push(`${urlsByStatus["error"]} failed`);
    if (urlsByStatus["unknown"])
      parts.push(`${urlsByStatus["unknown"]} unknown`);

    return `Start Analysis (${parts.join(", ")})`;
  };

  const getStopButtonText = () => {
    if (!canStopAnalysis) return "No URLs processing";
    return `Stop Analysis (${processingCount} processing)`;
  };

  const getRerunButtonText = () => {
    if (!canRerunAnalysis) return "No URLs to re-run";

    const parts = [];
    if (urlsByStatus["completed"])
      parts.push(`${urlsByStatus["completed"]} completed`);
    if (urlsByStatus["error"]) parts.push(`${urlsByStatus["error"]} failed`);

    return `Re-run Analysis (${parts.join(", ")})`;
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        {/* All content in a single row on large screens, allow wrap on all except lg */}
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 md:gap-2 w-full min-w-0">
          {/* Header and Selection Info */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium text-blue-900 truncate">
              {selectedCount} URL{selectedCount !== 1 ? "s" : ""} selected
            </span>
            {/* Mobile clear button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="text-gray-500 hover:text-gray-700 sm:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto min-w-0">
            {canStartAnalysis && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction("analyze")}
                disabled={loading || pendingAction !== null}
                className="text-green-700 border-green-300 hover:bg-green-50 truncate min-w-0"
                style={{ maxWidth: "100%" }}
              >
                {isActionLoading("analyze") ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    {getAnalysisButtonText()}
                  </>
                )}
              </Button>
            )}

            {canStopAnalysis && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction("stop")}
                disabled={loading || pendingAction !== null}
                className="text-orange-700 border-orange-300 hover:bg-orange-50 truncate min-w-0"
                style={{ maxWidth: "100%" }}
              >
                {isActionLoading("stop") ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
                    Stopping...
                  </>
                ) : (
                  <>
                    <Square className="mr-2 h-4 w-4" />
                    {getStopButtonText()}
                  </>
                )}
              </Button>
            )}

            {canRerunAnalysis && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction("rerun")}
                disabled={loading || pendingAction !== null}
                className="text-purple-700 border-purple-300 hover:bg-purple-50 truncate min-w-0"
                style={{ maxWidth: "100%" }}
              >
                {isActionLoading("rerun") ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
                    Re-running...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {getRerunButtonText()}
                  </>
                )}
              </Button>
            )}

            {/* Show Delete if at least one deletable URL is selected */}
            {deletableCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteClick}
                disabled={loading || pendingAction !== null}
                className="text-red-700 border-red-300 hover:bg-red-50 truncate min-w-0"
                style={{ maxWidth: "100%" }}
                title={
                  processingCount > 0
                    ? `Processing URLs cannot be deleted. Only ${deletableCount} can be deleted.`
                    : undefined
                }
              >
                {isActionLoading("delete") ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete{" "}
                    {deletableCount === 1
                      ? `(${
                          deletableUrls[0].status
                        })`
                      : `(${deletableCount} deletable)`}
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Desktop Clear Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-gray-500 hover:text-gray-700 hidden sm:flex"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected URLs</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCount} selected URL
              {selectedCount !== 1 ? "s" : ""}? This action cannot be undone.
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
    </>
  );
}
