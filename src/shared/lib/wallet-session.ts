"use client";

// Canonical, app-wide wallet connect/disconnect. Both the shared WalletProvider
// (landing / chat / dashboard) and the quest WalletProvider delegate to these so
// the connect/disconnect code path is identical everywhere:
//   - one wallet connection (the shared `useWalletStore`, key "wallet-storage")
//   - disconnect from ANY surface clears BOTH backend sessions (main + quest)
// Authentication itself stays per-backend (the two backends can't share a token);
// each provider calls its own authenticate step after `connectWallet()`.

import { DEV_DISCONNECTED_KEY } from "@/lib/dev-bypass";
import { getBrowserBackendBaseUrl } from "@/lib/runtime-urls";
import { getKitSdk } from "@/shared/lib/stellar-kit";
import { useAuthStore } from "@/store/use-auth";
import { useWalletStore } from "@/store/use-wallet";

/**
 * Open the wallet selector and record the connection in the global store.
 * Returns the connected address (or null if none was picked). Does NOT
 * authenticate — each surface authenticates its own backend afterwards.
 */
export async function connectWallet(): Promise<string | null> {
  const { StellarWalletsKit } = await getKitSdk();
  const { address } = await StellarWalletsKit.authModal();
  if (!address) return null;
  // An explicit connect lifts a previous dev-bypass disconnect.
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(DEV_DISCONNECTED_KEY);
    } catch {
      /* ignore */
    }
  }
  useWalletStore.getState().setWalletState({ connected: true, account: address });
  return address;
}

/**
 * Global sign-out. Disconnects the wallet and clears BOTH backend sessions so a
 * Disconnect on any surface logs the user out everywhere. All network calls are
 * best-effort; failures never block local clearing. Redirects home at the end.
 */
export async function disconnectAll(): Promise<void> {
  try {
    const { StellarWalletsKit } = await getKitSdk();
    await StellarWalletsKit.disconnect();
  } catch {
    // ignore kit disconnect errors
  }

  // Main backend session (httpOnly cookie) — best-effort.
  void fetch(`${getBrowserBackendBaseUrl()}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  }).catch(() => {});
  useAuthStore.getState().logout();

  // Quest backend session (separate service). Dynamic import keeps shared code
  // from eagerly depending on the quest feature.
  try {
    const { useQuestAuthStore } = await import("@/features/quest/store/use-quest-auth");
    useQuestAuthStore.getState().logout();
  } catch {
    // quest store unavailable — ignore
  }

  // Shared wallet connection (single source of truth).
  useWalletStore.getState().reset();

  // Make the disconnect stick under dev-bypass: flag it (survives the redirect
  // reload) and drop the injected mock wallet so nothing re-connects.
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(DEV_DISCONNECTED_KEY, "1");
    } catch {
      /* ignore */
    }
    delete (window as { __TASMIL_E2E_WALLET__?: unknown }).__TASMIL_E2E_WALLET__;
  }

  if (typeof window !== "undefined" && window.location.pathname !== "/") {
    window.location.replace("/");
  }
}
