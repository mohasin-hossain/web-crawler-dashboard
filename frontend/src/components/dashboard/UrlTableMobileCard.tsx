import { Eye } from "lucide-react";
import { urlsApi } from "../../services/api/urls";
import type { Url } from "../../types/url";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { StatusBadge } from "./StatusBadge";
import { formatDate } from "./UrlTableSorting";

interface UrlTableMobileCardProps {
  url: Url;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onDeselect: (id: number) => void;
  onViewDetails: (url: Url) => void;
}

export function UrlTableMobileCard({
  url,
  isSelected,
  onSelect,
  onDeselect,
  onViewDetails,
}: UrlTableMobileCardProps) {
  const formatUrl = (urlString: string) => {
    return urlsApi.formatUrlForDisplay(urlString);
  };

  const handleRowClick = (event: React.MouseEvent) => {
    // Don't trigger row click if clicking on checkbox
    if ((event.target as HTMLElement).closest('input[type="checkbox"]')) {
      return;
    }
    onViewDetails(url);
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 shadow-sm flex flex-col gap-2 transition hover:shadow-md cursor-pointer"
      onClick={handleRowClick}
    >
      {/* Header: Status, Date, Checkbox, Eye, HTML Version */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => {
              if (checked) {
                onSelect(url.id);
              } else {
                onDeselect(url.id);
              }
            }}
            aria-label={`Select ${url.url}`}
            className="h-4 w-4 mr-1"
            onClick={(e) => e.stopPropagation()}
          />
          <StatusBadge
            status={url.status}
            className="text-xs px-2 py-0.5 rounded-full"
          />
          <span className="text-xs text-gray-400 ml-1 truncate">
            {formatDate(url.created_at)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {url.html_version && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-900 text-gray-500 font-mono border border-gray-200 dark:border-gray-700 mr-1">
              {url.html_version}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(url);
            }}
            className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* URL & Title */}
      <div className="flex flex-col min-w-0">
        <span
          className="font-semibold text-blue-700 dark:text-blue-400 text-sm truncate"
          title={url.url}
        >
          {formatUrl(url.url)}
        </span>
        {url.title && (
          <span
            className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5"
            title={url.title}
          >
            {url.title}
          </span>
        )}
      </div>

      {/* Stats Row */}
      <div className="flex justify-between items-center text-center mt-1 mb-1 divide-x divide-gray-200 dark:divide-gray-700 bg-gray-50 dark:bg-gray-900 rounded-md">
        <div className="flex-1 px-1">
          <div className="text-base font-semibold text-gray-900 dark:text-white">
            {url.internal_links}
          </div>
          <div className="text-[11px] text-gray-400">Internal</div>
        </div>
        <div className="flex-1 px-1">
          <div className="text-base font-semibold text-gray-900 dark:text-white">
            {url.external_links}
          </div>
          <div className="text-[11px] text-gray-400">External</div>
        </div>
        <div className="flex-1 px-1">
          <div
            className={`text-base font-semibold ${
              url.broken_links > 0
                ? "text-red-600"
                : "text-gray-900 dark:text-white"
            }`}
          >
            {url.broken_links}
          </div>
          <div className="text-[11px] text-gray-400">Broken</div>
        </div>
      </div>
    </div>
  );
}
