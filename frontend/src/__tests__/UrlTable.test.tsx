import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UrlTable } from "../components/dashboard/UrlTable";
import type { UrlStatus, UrlTableFilters } from "../types/url";

const urls = [
  {
    id: 1,
    url: "https://example.com",
    status: "completed" as UrlStatus,
    title: "Example",
    html_version: "HTML5",
    internal_links: 2,
    external_links: 1,
    broken_links: 0,
    has_login_form: false,
    headings: { h1: 1, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 },
    created_at: "",
    updated_at: "",
  },
  {
    id: 2,
    url: "https://test.com",
    status: "pending" as UrlStatus,
    title: "Test",
    html_version: "HTML5",
    internal_links: 1,
    external_links: 2,
    broken_links: 1,
    has_login_form: false,
    headings: { h1: 1, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 },
    created_at: "",
    updated_at: "",
  },
];

const pagination = { page: 1, limit: 10, total: 2, totalPages: 1 };
const selectedUrls = new Set<number>();
const filters: UrlTableFilters = {
  search: "",
  status: "all",
  page: 1,
  limit: 10,
};

// Happy-path: UrlTable renders URLs and pagination

describe("UrlTable", () => {
  it("renders a list of URLs and pagination", () => {
    render(
      <UrlTable
        urls={urls}
        filters={filters}
        pagination={pagination}
        selectedUrls={selectedUrls}
        loading={false}
        onUrlSelect={() => {}}
        onUrlDeselect={() => {}}
        onSelectAll={() => {}}
        onDeselectAll={() => {}}
        onPageChange={() => {}}
        onViewDetails={() => {}}
      />
    );
    // The component displays 'example.com/' and 'test.com/' in multiple places
    expect(screen.getAllByText(/example.com/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/test.com/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("table")).toBeTruthy();
  });
});
