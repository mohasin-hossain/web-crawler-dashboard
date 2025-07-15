import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface UrlSelectionState {
  // Selection state for bulk operations
  selectedUrls: Set<number>;
}

interface UrlSelectionActions {
  // Selection actions
  selectUrl: (id: number) => void;
  deselectUrl: (id: number) => void;
  selectAllUrls: (urlIds: number[]) => void;
  deselectAllUrls: () => void;
  isUrlSelected: (id: number) => boolean;
  getSelectedCount: () => number;
  clearSelection: () => void;
}

type UrlSelectionStore = UrlSelectionState & UrlSelectionActions;

export const useUrlSelectionStore = create<UrlSelectionStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      selectedUrls: new Set(),

      // Select URL
      selectUrl: (id: number) => {
        set((state) => ({
          selectedUrls: new Set([...state.selectedUrls, id]),
        }));
      },

      // Deselect URL
      deselectUrl: (id: number) => {
        set((state) => {
          const newSelected = new Set(state.selectedUrls);
          newSelected.delete(id);
          return { selectedUrls: newSelected };
        });
      },

      // Select all URLs
      selectAllUrls: (urlIds: number[]) => {
        set({ selectedUrls: new Set(urlIds) });
      },

      // Deselect all URLs
      deselectAllUrls: () => {
        set({ selectedUrls: new Set() });
      },

      // Check if URL is selected
      isUrlSelected: (id: number) => {
        return get().selectedUrls.has(id);
      },

      // Get selected count
      getSelectedCount: () => {
        return get().selectedUrls.size;
      },

      // Clear selection
      clearSelection: () => {
        set({ selectedUrls: new Set() });
      },
    }),
    { name: "url-selection-store" }
  )
);
