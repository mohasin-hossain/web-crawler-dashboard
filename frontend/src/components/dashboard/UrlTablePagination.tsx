import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "../ui/button";

interface UrlTablePaginationProps {
  page: number;
  totalPages: number;
  total: number;
  urlsCount: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
}

export function UrlTablePagination({
  page,
  totalPages,
  total,
  urlsCount,
  loading = false,
  onPageChange,
}: UrlTablePaginationProps) {
  if (!totalPages || totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-sm text-gray-500 text-center sm:text-left">
        Showing {urlsCount} of {total || 0} URLs
      </div>

      <div className="flex items-center space-x-1 sm:space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={page === 1 || loading}
          className="hidden sm:flex"
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

        <span className="text-sm px-2">
          {page} / {totalPages}
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
          className="hidden sm:flex"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
