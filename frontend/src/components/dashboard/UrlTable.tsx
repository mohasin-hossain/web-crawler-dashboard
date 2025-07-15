import { Globe } from "lucide-react";
import { useCallback, useState } from "react";
import type { Url, UrlTableFilters } from "../../types/url";
import { TableSkeleton } from "../common";
import { Table, TableBody } from "../ui/table";
import { UrlTableHeader } from "./UrlTableHeader";
import { UrlTableMobileCard } from "./UrlTableMobileCard";
import { UrlTablePagination } from "./UrlTablePagination";
import { UrlTableRow } from "./UrlTableRow";
import type { SortDirection, SortField } from "./UrlTableSorting";
import { sortUrls } from "./UrlTableSorting";

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

export function UrlTable({
  urls = [],
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

  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      onDeselectAll();
    } else {
      onSelectAll();
    }
  }, [isAllSelected, onSelectAll, onDeselectAll]);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      } else {
        setSortField(field);
        setSortDirection("asc");
      }
    },
    [sortField, sortDirection]
  );

  const sortedUrls = sortUrls(safeUrls, sortField, sortDirection);

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
      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-4">
        {sortedUrls.map((url: Url) => (
          <UrlTableMobileCard
            key={url.id}
            url={url}
            isSelected={selectedUrls.has(url.id)}
            onSelect={onUrlSelect}
            onDeselect={onUrlDeselect}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <UrlTableHeader
              isAllSelected={isAllSelected}
              isPartiallySelected={isPartiallySelected}
              onSelectAll={handleSelectAll}
              onSort={handleSort}
              sortField={sortField}
              sortDirection={sortDirection}
            />
            <TableBody>
              {sortedUrls.map((url: Url) => (
                <UrlTableRow
                  key={url.id}
                  url={url}
                  isSelected={selectedUrls.has(url.id)}
                  onSelect={onUrlSelect}
                  onDeselect={onUrlDeselect}
                  onViewDetails={onViewDetails}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <UrlTablePagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          urlsCount={safeUrls.length}
          loading={loading}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
