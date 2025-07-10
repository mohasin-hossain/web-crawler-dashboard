import { Filter, RotateCcw, Search } from "lucide-react";
import type { UrlStatus, UrlTableFilters } from "../../types/url";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface FilterBarProps {
  filters: UrlTableFilters;
  onFiltersChange: (filters: Partial<UrlTableFilters>) => void;
  onResetFilters: () => void;
  totalUrls: number;
  loading?: boolean;
}

export function FilterBar({
  filters,
  onFiltersChange,
  onResetFilters,
  totalUrls,
  loading = false,
}: FilterBarProps) {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ search: value, page: 1 });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      status: value === "all" ? "all" : (value as UrlStatus),
      page: 1,
    });
  };

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "completed", label: "Completed" },
    { value: "error", label: "Error" },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      {/* Left side - Filters */}
      <div className="flex flex-col sm:flex-row gap-2 flex-1">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search URLs..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
            disabled={loading}
          />
        </div>

        {/* Status Filter */}
        <Select
          value={filters.status}
          onValueChange={handleStatusChange}
          disabled={loading}
        >
          <SelectTrigger className="w-[140px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Reset Filters Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onResetFilters}
          disabled={loading}
          className="whitespace-nowrap"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>

      {/* Right side - Stats */}
      <div className="flex items-center gap-4">
        {/* Total Count */}
        <span className="text-sm text-gray-500 whitespace-nowrap">
          {totalUrls} URLs total
        </span>
      </div>
    </div>
  );
}
