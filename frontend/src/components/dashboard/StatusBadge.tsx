import type { UrlStatus } from "../../types/url";
import { Badge } from "../ui/badge";

interface StatusBadgeProps {
  status: UrlStatus;
  className?: string;
}

const STATUS_COLORS = {
  queued: "bg-yellow-100 text-yellow-800 border-yellow-200",
  processing: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  success: "bg-green-100 text-green-800 border-green-200",
  error: "bg-red-100 text-red-800 border-red-200",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusConfig = (status: UrlStatus) => {
    const normalizedStatus = status?.toLowerCase();

    switch (normalizedStatus) {
      case "queued":
        return {
          variant: "secondary" as const,
          color: STATUS_COLORS.queued,
          text: "Queued",
        };
      case "pending":
        return {
          variant: "secondary" as const,
          color: STATUS_COLORS.queued,
          text: "Pending",
        };
      case "processing":
        return {
          variant: "default" as const,
          color: STATUS_COLORS.processing,
          text: "Processing",
        };
      case "completed":
        return {
          variant: "default" as const,
          color: STATUS_COLORS.completed,
          text: "Completed",
        };
      case "error":
        return {
          variant: "destructive" as const,
          color: STATUS_COLORS.error,
          text: "Error",
        };
      case "unknown":
        return {
          variant: "outline" as const,
          color: "bg-gray-100 text-gray-800 border-gray-200",
          text: "Unknown",
        };
      default:
        return {
          variant: "outline" as const,
          color: "bg-gray-100 text-gray-800 border-gray-200",
          text: "Unknown",
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant={config.variant} className={`${config.color} ${className}`}>
      {config.text}
    </Badge>
  );
}
