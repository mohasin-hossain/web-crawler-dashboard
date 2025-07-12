import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Globe,
} from "lucide-react";
import { useState } from "react";
import { urlsApi } from "../../services/api/urls";
import type { Url, UrlTableFilters } from "../../types/url";
import { ProcessingIndicator, TableSkeleton } from "../common";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { StatusBadge } from "./StatusBadge";

interface UrlTableProps {
  urls: Url[];
  filters: UrlTableFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  selectedUrls: Set<number>;
  loading?: boolean;
  onUrlSelect: (id: number) => void;
  onUrlDeselect: (id: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onPageChange: (page: number) => void;
  onViewDetails: (url: Url) => void;
}

type SortField =
  | "url"
  | "title"
  | "status"
  | "created_at"
  | "internal_links"
  | "external_links"
  | "broken_links"
  | "html_version";
type SortDirection = "asc" | "desc";

export function UrlTable({
  urls,
  pagination,
  selectedUrls,
  loading = false,
  onUrlSelect,
  onUrlDeselect,
  onSelectAll,
  onDeselectAll,
  onPageChange,
  onViewDetails,
}: UrlTableProps) {
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Ensure urls is always an array to prevent null/undefined errors
  const safeUrls = urls || [];

  const isAllSelected =
    safeUrls.length > 0 && safeUrls.every((url) => selectedUrls.has(url.id));
  const isPartiallySelected =
    safeUrls.some((url) => selectedUrls.has(url.id)) && !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onDeselectAll();
    } else {
      onSelectAll();
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  const sortedUrls = [...safeUrls].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    // Handle null/undefined values
    if (aValue === null || aValue === undefined) aValue = "";
    if (bValue === null || bValue === undefined) bValue = "";

    // Convert to strings for comparison if needed
    if (typeof aValue === "string") aValue = aValue.toLowerCase();
    if (typeof bValue === "string") bValue = bValue.toLowerCase();

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatUrl = (url: string) => {
    return urlsApi.formatUrlForDisplay(url);
  };

  const handleRowClick = (url: Url, event: React.MouseEvent) => {
    // Don't trigger row click if clicking on checkbox
    if ((event.target as HTMLElement).closest('input[type="checkbox"]')) {
      return;
    }
    onViewDetails(url);
  };

  const renderPagination = () => {
    if (!pagination) {
      return null;
    }

    const { page, totalPages } = pagination;

    return (
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing {safeUrls.length} of {pagination.total || 0} URLs
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={page === 1 || loading}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-sm">
            Page {page} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages || loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages || loading}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // Show skeleton loader when loading and no URLs
  if (loading && safeUrls.length === 0) {
    return <TableSkeleton rows={pagination?.limit || 10} />;
  }

  // Show empty state
  if (!loading && safeUrls.length === 0) {
    return (
      <div className="text-center py-8">
        <Globe className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No URLs found
        </h3>
        <p className="text-gray-500">
          Start by adding a URL for analysis using the "Add URL" button above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Show loading overlay when refreshing existing data */}
      {loading && safeUrls.length > 0 && (
        <div className="relative">
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
            <ProcessingIndicator url="Refreshing URLs..." />
          </div>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) {
                      const checkbox = el.querySelector(
                        'input[type="checkbox"]'
                      ) as HTMLInputElement;
                      if (checkbox)
                        checkbox.indeterminate = isPartiallySelected;
                    }
                  }}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all URLs"
                />
              </TableHead>

              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("url")}
                  className="h-auto p-0 font-semibold"
                >
                  URL {getSortIcon("url")}
                </Button>
              </TableHead>

              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("title")}
                  className="h-auto p-0 font-semibold"
                >
                  Title {getSortIcon("title")}
                </Button>
              </TableHead>

              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("html_version")}
                  className="h-auto p-0 font-semibold"
                >
                  HTML Version {getSortIcon("html_version")}
                </Button>
              </TableHead>

              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("status")}
                  className="h-auto p-0 font-semibold"
                >
                  Status {getSortIcon("status")}
                </Button>
              </TableHead>

              <TableHead className="text-center">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("internal_links")}
                  className="h-auto p-0 font-semibold"
                >
                  Internal {getSortIcon("internal_links")}
                </Button>
              </TableHead>

              <TableHead className="text-center">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("external_links")}
                  className="h-auto p-0 font-semibold"
                >
                  External {getSortIcon("external_links")}
                </Button>
              </TableHead>

              <TableHead className="text-center">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("broken_links")}
                  className="h-auto p-0 font-semibold"
                >
                  Broken {getSortIcon("broken_links")}
                </Button>
              </TableHead>

              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("created_at")}
                  className="h-auto p-0 font-semibold"
                >
                  Created {getSortIcon("created_at")}
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {sortedUrls.map((url) => (
              <TableRow
                key={url.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={(e) => handleRowClick(url, e)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedUrls.has(url.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onUrlSelect(url.id);
                      } else {
                        onUrlDeselect(url.id);
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
                  <span className="text-sm text-gray-600">
                    {url.html_version || "—"}
                  </span>
                </TableCell>

                <TableCell>
                  <StatusBadge status={url.status} />
                </TableCell>

                <TableCell className="text-center">
                  {url.internal_links}
                </TableCell>
                <TableCell className="text-center">
                  {url.external_links}
                </TableCell>
                <TableCell className="text-center">
                  <span
                    className={
                      url.broken_links > 0 ? "text-red-600 font-medium" : ""
                    }
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
            ))}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.totalPages > 1 && renderPagination()}
    </div>
  );
}
