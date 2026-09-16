import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WalletState {
  connected: boolean;
  account: string | null;
  signing: boolean;
  setSigning: (signing: boolean) => void;
  setWalletState: (state: { connected: boolean; account: string | null }) => void;
  reset: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      connected: false,
      account: null,
      signing: false,
      setSigning: (signing) => set({ signing }),
      setWalletState: (state) => set(state),
      reset: () => set({ connected: false, account: null, signing: false }),
    }),
    {
      name: "wallet-storage",
      partialize: (state) => ({
        connected: state.connected,
        account: state.account,
      }),
    }
  )
);

/**
 * True once the persisted wallet has actually been read back from storage.
 *
 * Needed because "we have not read the wallet yet" and "there is no wallet"
 * are the same `account === null` to a selector, and code that routes on that
 * value (guards, redirects) must not act on the first, unread one. Note that
 * this is deliberately NOT the same question as `account === null`: React
 * renders the store's SERVER snapshot during hydration, so a connected wallet
 * still reads `null` for that one pass even after the store itself has
 * rehydrated - callers that must know the live value should also consult
 * `useWalletStore.getState()` inside an effect.
 */
export function useWalletHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (useWalletStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useWalletStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);
  return hydrated;
}
