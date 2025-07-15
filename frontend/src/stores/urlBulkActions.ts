import { toast } from "sonner";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { NOTIFICATIONS } from "../lib/constants";
import { getSuccessMessage, handleApiError } from "../lib/errorHandling";
import { urlsApi } from "../services/api/urls";

interface UrlBulkActions {
  // Bulk actions
  bulkDelete: (urlIds: number[]) => Promise<void>;
  bulkAnalyze: (urlIds: number[]) => Promise<void>;
  bulkStop: (urlIds: number[]) => Promise<void>;
  bulkRerun: (urlIds: number[]) => Promise<void>;
}

export const useUrlBulkActions = create<UrlBulkActions>()(
  devtools(
    () => ({
      // Bulk delete
      bulkDelete: async (urlIds: number[]) => {
        try {
          const result = await urlsApi.bulkDelete(urlIds);
          toast.success(`Successfully deleted ${result.processed} URLs`);

          if (result.failed > 0) {
            toast.warning(`Failed to delete ${result.failed} URLs`);
          }
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to delete URLs";
          toast.error("Bulk delete failed: " + errorMessage);
        }
      },

      // Bulk analyze
      bulkAnalyze: async (urlIds: number[]) => {
        try {
          const result = await urlsApi.bulkAnalyze(urlIds);
          toast.success(`Started analysis for ${result.processed} URLs`);

          if (result.failed > 0) {
            toast.warning(`Failed to start analysis for ${result.failed} URLs`);
          }
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to start analysis";
          toast.error("Bulk analyze failed: " + errorMessage);
        }
      },

      // Bulk stop
      bulkStop: async (urlIds: number[]) => {
        try {
          const result = await urlsApi.bulkStop(urlIds);
          toast.success(`Stopped analysis for ${result.processed} URLs`);

          if (result.failed > 0) {
            toast.warning(`Failed to stop analysis for ${result.failed} URLs`);
          }
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to stop analysis";
          toast.error("Bulk stop failed: " + errorMessage);
        }
      },

      // Bulk rerun
      bulkRerun: async (urlIds: number[]) => {
        try {
          const result = await urlsApi.bulkRerun(urlIds);
          toast.success(getSuccessMessage("BULK", "RERUN"), {
            duration: NOTIFICATIONS.TOAST_DURATION.NORMAL,
          });
          if (result.failed > 0) {
            toast.warning(
              `Failed to rerun analysis for ${result.failed} URLs`,
              { duration: NOTIFICATIONS.TOAST_DURATION.NORMAL }
            );
          }
        } catch (error: unknown) {
          const errorMessage = handleApiError(error, "bulk rerun");
          toast.error(errorMessage, {
            duration: NOTIFICATIONS.TOAST_DURATION.NORMAL,
          });
        }
      },
    }),
    { name: "url-bulk-actions" }
  )
);
