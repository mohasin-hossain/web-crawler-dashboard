import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  Eye,
  Globe,
  Play,
  Square,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { urlsApi } from "../../services/api/urls";
import type { Url, UrlTableFilters } from "../../types/url";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
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
  onStartAnalysis: (id: number) => void;
  onStopAnalysis: (id: number) => void;
  onDeleteUrl: (id: number) => void;
  onViewDetails: (url: Url) => void;
  loadingStates: {
    analyze: boolean;
    stop: boolean;
    delete: boolean;
  };
}

type SortField =
  | "url"
  | "title"
  | "status"
  | "created_at"
  | "internal_links"
  | "external_links"
  | "broken_links";
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
  onStartAnalysis,
  onStopAnalysis,
  onDeleteUrl,
  onViewDetails,
  loadingStates,
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

  const canStartAnalysis = (url: Url) => {
    return url.status === "pending" || url.status === "error";
  };

  const canStopAnalysis = (url: Url) => {
    return url.status === "processing";
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

  if (safeUrls.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Globe className="w-8 h-8 text-gray-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              No URLs found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Add your first URL to get started with web crawling and analysis.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all URLs"
                  {...(isPartiallySelected && {
                    "data-state": "indeterminate",
                  })}
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

              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {sortedUrls.map((url) => (
              <TableRow key={url.id} className="hover:bg-gray-50">
                <TableCell>
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
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className="text-left hover:text-blue-600 max-w-[300px] truncate block"
                          onClick={() => onViewDetails(url)}
                        >
                          {formatUrl(url.url)}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{url.url}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>

                <TableCell>
                  <span
                    className="max-w-[200px] truncate block"
                    title={url.title || "No title"}
                  >
                    {url.title || "No title"}
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

                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-1">
                    {/* View Details Button */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewDetails(url)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View Details</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/* Start Analysis Button - always visible */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onStartAnalysis(url.id)}
                            disabled={
                              loadingStates.analyze ||
                              !canStartAnalysis(url) ||
                              url.status === "processing"
                            }
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {canStartAnalysis(url)
                            ? "Start Analysis"
                            : url.status === "processing"
                            ? "Analysis in progress"
                            : url.status === "completed"
                            ? "Analysis completed"
                            : "Start Analysis"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/* Stop Analysis Button - always visible */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onStopAnalysis(url.id)}
                            disabled={
                              loadingStates.stop || !canStopAnalysis(url)
                            }
                          >
                            <Square className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {canStopAnalysis(url)
                            ? "Stop Analysis"
                            : "No analysis running"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/* Open URL Button */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(url.url, "_blank")}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Open URL</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/* Delete Button */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDeleteUrl(url.id)}
                            disabled={
                              loadingStates.delete ||
                              url.status === "processing"
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {url.status === "processing"
                            ? "Cannot delete while processing"
                            : "Delete URL"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
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
