import { urlsApi } from "../../services/api/urls";
import type { Url } from "../../types/url";
import { Checkbox } from "../ui/checkbox";
import { TableCell, TableRow } from "../ui/table";
import { StatusBadge } from "./StatusBadge";
import { formatDate } from "./UrlTableSorting";

interface UrlTableRowProps {
  url: Url;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onDeselect: (id: number) => void;
  onViewDetails: (url: Url) => void;
}

export function UrlTableRow({
  url,
  isSelected,
  onSelect,
  onDeselect,
  onViewDetails,
}: UrlTableRowProps) {
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
    <TableRow
      className="hover:bg-gray-50 cursor-pointer"
      onClick={handleRowClick}
    >
      <TableCell onClick={(e) => e.stopPropagation()}>
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
        />
      </TableCell>

      <TableCell>
        <div className="flex items-center space-x-2">
          <div
            className="max-w-[200px] truncate text-blue-600 hover:text-blue-800"
            title={url.url}
          >
            {formatUrl(url.url)}
          </div>
        </div>
      </TableCell>

      <TableCell>
        <span
          className="max-w-[150px] truncate block"
          title={url.title || "No title"}
        >
          {url.title || "No title"}
        </span>
      </TableCell>

      <TableCell>
        <span className="text-sm text-gray-600">{url.html_version || "—"}</span>
      </TableCell>

      <TableCell>
        <StatusBadge status={url.status} />
      </TableCell>

      <TableCell className="text-center">{url.internal_links}</TableCell>
      <TableCell className="text-center">{url.external_links}</TableCell>
      <TableCell className="text-center">
        <span
          className={url.broken_links > 0 ? "text-red-600 font-medium" : ""}
        >
          {url.broken_links}
        </span>
      </TableCell>

      <TableCell>
        <span className="text-sm text-gray-500">
          {formatDate(url.created_at)}
        </span>
      </TableCell>
    </TableRow>
  );
}
