import { Play, Square, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { BulkAction } from "../../types/url";
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
  onBulkDelete: () => Promise<void>;
  onBulkAnalyze: () => Promise<void>;
  onBulkStop: () => Promise<void>;
  onClearSelection: () => void;
  loading?: boolean;
}

export function BulkActions({
  selectedCount,
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
              disabled={loading || pendingAction !== null}
              className="text-green-700 border-green-300 hover:bg-green-50"
            >
              {isActionLoading("analyze") ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Analysis
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction("stop")}
              disabled={loading || pendingAction !== null}
              className="text-orange-700 border-orange-300 hover:bg-orange-50"
            >
              {isActionLoading("stop") ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
                  Stopping...
                </>
              ) : (
                <>
                  <Square className="mr-2 h-4 w-4" />
                  Stop Analysis
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteClick}
              disabled={loading || pendingAction !== null}
              className="text-red-700 border-red-300 hover:bg-red-50"
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
          disabled={loading || pendingAction !== null}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected URLs</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCount} selected URL
              {selectedCount !== 1 ? "s" : ""}? This action cannot be undone and
              will remove all analysis data for these URLs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete {selectedCount} URL{selectedCount !== 1 ? "s" : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
