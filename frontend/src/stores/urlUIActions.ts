import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { UrlTableFilters } from "../types/url";

interface UrlUIState {
  // UI state
  loading: boolean;
  loadingStates: {
    list: boolean;
    create: boolean;
    delete: boolean;
    analyze: boolean;
    stop: boolean;
    bulk: boolean;
  };

  // Pagination and filtering
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  filters: UrlTableFilters;
}

interface UrlUIActions {
  // UI actions
  setFilters: (filters: Partial<UrlTableFilters>) => void;
  applyFilters: (filters: Partial<UrlTableFilters>) => void;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  resetFilters: () => void;
  setLoading: (loading: boolean) => void;
  setLoadingState: (
    key: keyof UrlUIState["loadingStates"],
    loading: boolean
  ) => void;
  setPagination: (pagination: Partial<UrlUIState["pagination"]>) => void;
}

type UrlUIStore = UrlUIState & UrlUIActions;

const defaultFilters: UrlTableFilters = {
  search: "",
  status: "all",
  page: 1,
  limit: 10,
};

const defaultPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};

const defaultLoadingStates = {
  list: false,
  create: false,
  delete: false,
  analyze: false,
  stop: false,
  bulk: false,
};

export const useUrlUIStore = create<UrlUIStore>()(
  devtools(
    (set) => ({
      // Initial state
      loading: false,
      loadingStates: defaultLoadingStates,
      pagination: defaultPagination,
      filters: defaultFilters,

      // Set filters
      setFilters: (filters: Partial<UrlTableFilters>) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }));
      },

      // Apply filters
      applyFilters: (filters: Partial<UrlTableFilters>) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
          pagination: { ...state.pagination, page: 1 }, // Reset to first page
        }));
      },

      // Set page
      setPage: (page: number) => {
        set((state) => ({
          filters: { ...state.filters, page },
          pagination: { ...state.pagination, page },
        }));
      },

      // Set search
      setSearch: (search: string) => {
        set((state) => ({
          filters: { ...state.filters, search, page: 1 },
          pagination: { ...state.pagination, page: 1 },
        }));
      },

      // Reset filters
      resetFilters: () => {
        set({
          filters: defaultFilters,
          pagination: defaultPagination,
        });
      },

      // Set loading
      setLoading: (loading: boolean) => {
        set({ loading });
      },

      // Set loading state
      setLoadingState: (
        key: keyof UrlUIState["loadingStates"],
        loading: boolean
      ) => {
        set((state) => ({
          loadingStates: { ...state.loadingStates, [key]: loading },
        }));
      },

      // Set pagination
      setPagination: (pagination: Partial<UrlUIState["pagination"]>) => {
        set((state) => ({
          pagination: { ...state.pagination, ...pagination },
        }));
      },
    }),
    { name: "url-ui-store" }
  )
);
