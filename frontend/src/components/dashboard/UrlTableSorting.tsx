import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { Url } from "../../types/url";

export type SortField =
  | "url"
  | "title"
  | "status"
  | "created_at"
  | "internal_links"
  | "external_links"
  | "broken_links"
  | "html_version";

export type SortDirection = "asc" | "desc";

export interface SortingState {
  sortField: SortField;
  sortDirection: SortDirection;
}

export const getSortIcon = (
  field: SortField,
  currentField: SortField,
  direction: SortDirection
) => {
  if (currentField !== field) {
    return <ArrowUpDown className="h-4 w-4" />;
  }
  return direction === "asc" ? (
    <ArrowUp className="h-4 w-4" />
  ) : (
    <ArrowDown className="h-4 w-4" />
  );
};

export const sortUrls = (
  urls: Url[],
  sortField: SortField,
  sortDirection: SortDirection
): Url[] => {
  return [...urls].sort((a, b) => {
    type Sortable = string | number | null | undefined;
    let aValue: Sortable = a[sortField];
    let bValue: Sortable = b[sortField];

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
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
