import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WatchedAsset {
  symbol: string;
  contractId?: string;
  issuer?: string;
  addedAt: number;
}

interface WatchListState {
  items: WatchedAsset[];
  addAsset: (a: Omit<WatchedAsset, "addedAt">) => void;
  removeAsset: (symbol: string) => void;
  isWatched: (symbol: string) => boolean;
}

export const useWatchList = create<WatchListState>()(
  persist(
    (set, get) => ({
      items: [],
      addAsset: (a) =>
        set((state) =>
          state.items.some((i) => i.symbol === a.symbol)
            ? state
            : { items: [...state.items, { ...a, addedAt: Date.now() }] }
        ),
      removeAsset: (symbol) =>
        set((state) => ({
          items: state.items.filter((i) => i.symbol !== symbol),
        })),
      isWatched: (symbol) => get().items.some((i) => i.symbol === symbol),
    }),
    {
      name: "tasmil.watchlist",
      version: 1,
      // Lock the schema contract early. Future changes that add fields to
      // WatchedAsset must bump this version and provide a real migration so
      // stale localStorage rows don't silently rehydrate without the new fields.
      migrate: (persistedState, _version) => persistedState as WatchListState,
    }
  )
);
