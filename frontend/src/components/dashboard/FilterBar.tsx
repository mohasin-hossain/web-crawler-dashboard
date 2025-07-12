import { Filter, RotateCcw, Search } from "lucide-react";
import React, {
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
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
  focusSearchRef?: React.Ref<{ focus: () => void }>;
}

export const FilterBar = memo(function FilterBar({
  filters,
  onFiltersChange,
  onResetFilters,
  totalUrls,
  loading = false,
  focusSearchRef,
}: FilterBarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchValue, setSearchValue] = useState(filters.search);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // Update local search value when filters change externally
  useEffect(() => {
    setSearchValue(filters.search);
  }, [filters.search]);

  const focusSearch = useCallback(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  useImperativeHandle(
    focusSearchRef,
    () => ({
      focus: focusSearch,
    }),
    [focusSearch]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);

      // Clear existing timeout
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }

      // Set new timeout for debounced search
      const timeout = setTimeout(() => {
        onFiltersChange({ search: value, page: 1 });
      }, 500); // 500ms debounce

      setDebounceTimeout(timeout);
    },
    [onFiltersChange, debounceTimeout]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [debounceTimeout]);

  const handleStatusChange = useCallback(
    (value: string) => {
      onFiltersChange({
        status: value === "all" ? "all" : (value as UrlStatus),
        page: 1,
      });
    },
    [onFiltersChange]
  );

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "completed", label: "Completed" },
    { value: "error", label: "Error" },
  ];

  return (
    <div className="space-y-4 lg:space-y-0">
      {/* Mobile & Tablet Layout (stacked) */}
      <div className="block lg:hidden space-y-3">
        {/* Search Input - Full Width */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            ref={searchInputRef}
            placeholder="Search URLs..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8 h-8 text-sm border border-gray-200 rounded-md bg-gray-50 focus:bg-white focus:border-blue-400 transition-all shadow-none"
            disabled={loading}
          />
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-2">
          <Select
            value={filters.status}
            onValueChange={handleStatusChange}
            disabled={loading}
          >
            <SelectTrigger className="flex-1 h-8 text-sm border border-gray-200 rounded-md bg-gray-50 focus:bg-white focus:border-blue-400 transition-all shadow-none">
              <Filter className="h-4 w-4 mr-1 text-gray-400" />
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

          <Button
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            disabled={loading}
            className="h-8 px-3 text-sm border border-gray-200 rounded-md bg-gray-50 hover:bg-gray-100 shadow-none flex items-center gap-1 font-normal"
          >
            <RotateCcw className="h-4 w-4 mr-1 text-gray-400" />
            Reset
          </Button>
        </div>

        {/* Stats */}
        <div className="text-center">
          <span className="text-xs text-gray-400 font-normal">
            {totalUrls} URLs total
          </span>
        </div>
      </div>

      {/* Desktop Layout (horizontal) */}
      <div className="hidden lg:flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Left side - Filters */}
        <div className="flex flex-col lg:flex-row gap-2 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              ref={searchInputRef}
              placeholder="Search URLs..."
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8 h-9 text-base border border-gray-200 rounded-md bg-gray-50 focus:bg-white focus:border-blue-400 transition-all shadow-none pr-14"
              disabled={loading}
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-gray-100 border px-1 text-xs text-gray-500 font-mono pointer-events-none">
              /
            </kbd>
          </div>

          {/* Status Filter */}
          <Select
            value={filters.status}
            onValueChange={handleStatusChange}
            disabled={loading}
          >
            <SelectTrigger className="w-[160px] h-9 text-base border border-gray-200 rounded-md bg-gray-50 focus:bg-white focus:border-blue-400 transition-all shadow-none">
              <Filter className="h-4 w-4 mr-1 text-gray-400" />
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
            className="h-9 px-4 text-base border border-gray-200 rounded-md bg-gray-50 hover:bg-gray-100 shadow-none flex items-center gap-1 font-normal"
          >
            <RotateCcw className="h-4 w-4 mr-1 text-gray-400" />
            Reset
          </Button>
        </div>

        {/* Right side - Stats */}
        <div className="flex items-center gap-4">
          {/* Total Count */}
          <span className="text-xs text-gray-400 font-normal">
            {totalUrls} URLs total
          </span>
        </div>
      </div>
    </div>
  );
});
