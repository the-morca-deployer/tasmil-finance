"use client";

import { create } from "zustand";

type SortOption = "apy" | "tvl" | "newest";

interface MarketplaceState {
  template: string;
  sort: SortOption;
  setTemplate: (t: string) => void;
  setSort: (s: SortOption) => void;
}

export const useMarketplaceStore = create<MarketplaceState>((set) => ({
  template: "all",
  sort: "apy",
  setTemplate: (template) => set({ template }),
  setSort: (sort) => set({ sort }),
}));
