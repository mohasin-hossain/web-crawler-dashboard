import { Play, Square, Trash2, X } from "lucide-react";
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
  onBulkDelete: () => Promise<void>;
  onBulkAnalyze: () => Promise<void>;
  onBulkStop: () => Promise<void>;
  onClearSelection: () => void;
  loading?: boolean;
}

export function BulkActions({
  selectedCount,
  selectedUrls,
  onBulkDelete,
  onBulkAnalyze,
  onBulkStop,
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

  // Determine button states
  const canStartAnalysis = canAnalyzeCount > 0;
  const canStopAnalysis = processingCount > 0;

  const handleBulkAction = async (action: BulkAction) => {
    setPendingAction(action);
    try {
      switch (action) {
        case "delete":
          await onBulkDelete();
          break;
        case "analyze":
          await onBulkAnalyze();
          break;
        case "stop":
          await onBulkStop();
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
    await handleBulkAction("delete");
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

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-blue-900">
            {selectedCount} URL{selectedCount !== 1 ? "s" : ""} selected
          </span>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction("analyze")}
              disabled={loading || pendingAction !== null || !canStartAnalysis}
              className={`${
                canStartAnalysis
                  ? "text-green-700 border-green-300 hover:bg-green-50"
                  : "text-gray-400 border-gray-200 cursor-not-allowed"
              }`}
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

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction("stop")}
              disabled={loading || pendingAction !== null || !canStopAnalysis}
              className={`${
                canStopAnalysis
                  ? "text-orange-700 border-orange-300 hover:bg-orange-50"
                  : "text-gray-400 border-gray-200 cursor-not-allowed opacity-50"
              }`}
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

            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteClick}
              disabled={
                loading || pendingAction !== null || processingCount > 0
              }
              className={`${
                processingCount > 0
                  ? "text-gray-400 border-gray-200 cursor-not-allowed"
                  : "text-red-700 border-red-300 hover:bg-red-50"
              }`}
            >
              {isActionLoading("delete") ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </Button>
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
