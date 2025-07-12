import type { UrlStatus } from "../../types/url";
import { Badge } from "../ui/badge";

interface StatusBadgeProps {
  status: UrlStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusConfig = (status: UrlStatus) => {
    const normalizedStatus = status?.toLowerCase();

    switch (normalizedStatus) {
      case "queued":
        return {
          variant: "secondary" as const,
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          text: "Queued",
        };
      case "pending":
        return {
          variant: "secondary" as const,
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          text: "Pending",
        };
      case "processing":
        return {
          variant: "default" as const,
          color: "bg-blue-100 text-blue-800 border-blue-200",
          text: "Processing",
        };
      case "completed":
        return {
          variant: "default" as const,
          color: "bg-green-100 text-green-800 border-green-200",
          text: "Completed",
        };
      case "error":
        return {
          variant: "destructive" as const,
          color: "bg-red-100 text-red-800 border-red-200",
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
