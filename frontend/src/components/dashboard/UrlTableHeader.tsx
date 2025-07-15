import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { TableHead, TableHeader, TableRow } from "../ui/table";
import type { SortDirection, SortField } from "./UrlTableSorting";
import { getSortIcon } from "./UrlTableSorting";

interface UrlTableHeaderProps {
  isAllSelected: boolean;
  isPartiallySelected: boolean;
  onSelectAll: () => void;
  onSort: (field: SortField) => void;
  sortField: SortField;
  sortDirection: SortDirection;
}

export function UrlTableHeader({
  isAllSelected,
  isPartiallySelected,
  onSelectAll,
  onSort,
  sortField,
  sortDirection,
}: UrlTableHeaderProps) {
  return (
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
                if (checkbox) checkbox.indeterminate = isPartiallySelected;
              }
            }}
            onCheckedChange={onSelectAll}
            aria-label="Select all URLs"
          />
        </TableHead>

        <TableHead>
          <Button
            variant="ghost"
            onClick={() => onSort("url")}
            className="h-auto p-0 font-semibold"
          >
            URL {getSortIcon("url", sortField, sortDirection)}
          </Button>
        </TableHead>

        <TableHead>
          <Button
            variant="ghost"
            onClick={() => onSort("title")}
            className="h-auto p-0 font-semibold"
          >
            Title {getSortIcon("title", sortField, sortDirection)}
          </Button>
        </TableHead>

        <TableHead>
          <Button
            variant="ghost"
            onClick={() => onSort("html_version")}
            className="h-auto p-0 font-semibold"
          >
            HTML Version {getSortIcon("html_version", sortField, sortDirection)}
          </Button>
        </TableHead>

        <TableHead>
          <Button
            variant="ghost"
            onClick={() => onSort("status")}
            className="h-auto p-0 font-semibold"
          >
            Status {getSortIcon("status", sortField, sortDirection)}
          </Button>
        </TableHead>

        <TableHead className="text-center">
          <Button
            variant="ghost"
            onClick={() => onSort("internal_links")}
            className="h-auto p-0 font-semibold"
          >
            Internal {getSortIcon("internal_links", sortField, sortDirection)}
          </Button>
        </TableHead>

        <TableHead className="text-center">
          <Button
            variant="ghost"
            onClick={() => onSort("external_links")}
            className="h-auto p-0 font-semibold"
          >
            External {getSortIcon("external_links", sortField, sortDirection)}
          </Button>
        </TableHead>

        <TableHead className="text-center">
          <Button
            variant="ghost"
            onClick={() => onSort("broken_links")}
            className="h-auto p-0 font-semibold"
          >
            Broken {getSortIcon("broken_links", sortField, sortDirection)}
          </Button>
        </TableHead>

        <TableHead>
          <Button
            variant="ghost"
            onClick={() => onSort("created_at")}
            className="h-auto p-0 font-semibold"
          >
            Created {getSortIcon("created_at", sortField, sortDirection)}
          </Button>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
