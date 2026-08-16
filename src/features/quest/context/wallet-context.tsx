"use client";

import * as freighterApi from "@stellar/freighter-api";
import { useQueryClient } from "@tanstack/react-query";
import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import apiClient from "@/features/quest/lib/api-client";
import { ensureQuestDevSession } from "@/features/quest/lib/dev-login-bridge";
import { withAuth } from "@/features/quest/lib/kubb-config";
import {
  buildVerifyPayload,
  clearPendingReferralCode,
  readPendingReferralCode,
} from "@/features/quest/lib/referral-link";
import { activeNetwork } from "@/features/quest/lib/stellar";
import { type AuthUser, useQuestAuthStore } from "@/features/quest/store/use-quest-auth";
import { useQuestWalletStore } from "@/features/quest/store/use-quest-wallet";
import { useAuthControllerLogout, useUsersControllerGetMe } from "@/gen-quest/hooks";
import { connectWallet, disconnectAll } from "@/shared/lib/wallet-session";

// --- Types -------------------------------------------------------------------

interface WalletContextType {
  isConnected: boolean;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  address: string | null;
  displayAddress: string | null;
  points: number;
  user: AuthUser | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  /**
   * Signs an arbitrary message with the currently-connected wallet and returns
   * the signed string.  Throws if no wallet is connected or the user rejects.
   * Used by the sign_message quest task to produce a verifiable proof.
   */
  signMessage: (message: string) => Promise<string>;
}

// --- Context -----------------------------------------------------------------

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Seed connection from the shared wallet store so a wallet connected on any
  // other surface (or via dev-bypass) is reflected here immediately on mount.
  const [address, setAddress] = useState<string | null>(
    () => useQuestWalletStore.getState().account
  );
  const [isConnected, setIsConnected] = useState(() => useQuestWalletStore.getState().connected);
  const [signing, setSigning] = useState(false);
  const [kitReady, setKitReady] = useState(false);

  // useQueryClient kept for future cache invalidation needs
  useQueryClient();
  const { setWalletState } = useQuestWalletStore();
  const {
    isAuthenticated,
    user,
    setUser: setAuthUser,
    setLoading,
    isLoading: isAuthenticating,
  } = useQuestAuthStore();

  const authAttemptedRef = useRef<string | null>(null);
  const authInProgressRef = useRef(false);
  const skipAutoAuthRef = useRef(false);
  const sessionCheckedRef = useRef(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Keep local connection state in sync with the shared wallet store so connect
  // / disconnect on any surface (landing, chat, dev-bypass) reflects in quest.
  useEffect(() => {
    const unsubscribe = useQuestWalletStore.subscribe((s) => {
      setAddress(s.account);
      setIsConnected(s.connected);
    });
    return unsubscribe;
  }, []);

  // Hydrate the quest auth store from the shared `tasmil_auth` cookie (set by
  // signing in on /chat or /quest - same backend). `/api/auth/me` returns
  // `{ user: { id, walletAddress, ... } }`; quest-specific fields are filled in
  // afterwards by the /users/me sync effect below. Returns true on a live session.
  const loadSessionUser = useCallback(async (): Promise<boolean> => {
    try {
      const res = await apiClient.get("/api/auth/me");
      // The client interceptor unwraps `{ success, data }`, but be defensive.
      const body = res.data as {
        user?: Partial<AuthUser>;
        data?: { user?: Partial<AuthUser> };
      };
      const su = body?.user ?? body?.data?.user;
      if (su?.walletAddress) {
        setAuthUser({
          id: su.id ?? "",
          walletAddress: su.walletAddress,
          username: su.username ?? "",
          avatarUrl: su.avatarUrl ?? null,
          tier: su.tier ?? "bronze",
          totalPoints: su.totalPoints ?? 0,
          loginStreak: su.loginStreak ?? 0,
          referralCode: su.referralCode ?? null,
          role: su.role ?? "user",
        });
        // Mark this wallet as already authenticated so the auto-auth effect
        // doesn't fire a redundant challenge for it.
        authAttemptedRef.current = su.walletAddress;
        return true;
      }
    } catch {
      // No valid session.
    }
    return false;
  }, [setAuthUser]);

  // Restore an existing cookie session first so the quest shares the /chat login
  // instead of re-challenging. Only fall back to the dev bypass when there is no
  // real session.
  useEffect(() => {
    if (sessionCheckedRef.current) return;
    sessionCheckedRef.current = true;
    (async () => {
      try {
        const ok = await loadSessionUser();
        if (!ok) await ensureQuestDevSession();
      } finally {
        setSessionChecked(true);
        // Clear the initial `isLoading: true` boot state. `setUser` already does
        // this when a session is found; this covers the logged-out path so the
        // Connect button doesn't stay stuck on "Connecting...".
        setLoading(false);
      }
    })();
  }, [loadSessionUser, setLoading]);

  // --- Init StellarWalletsKit (browser-only) -------------------------------

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
        const { defaultModules } = await import("@creit.tech/stellar-wallets-kit/modules/utils");
        const { Networks, KitEventType } = await import("@creit.tech/stellar-wallets-kit/types");

        const network = activeNetwork.networkPassphrase as (typeof Networks)[keyof typeof Networks];

        const darkTheme = {
          background: "#09090b",
          "background-secondary": "#18181b",
          "foreground-strong": "#fafafa",
          foreground: "#fafafa",
          "foreground-secondary": "#a1a1aa",
          primary: "hsl(203, 100%, 73%)",
          "primary-foreground": "#09090b",
          transparent: "rgba(0,0,0,0)",
          lighter: "#3f3f46",
          light: "#27272a",
          "light-gray": "#71717a",
          gray: "#a1a1aa",
          danger: "#ef4444",
          border: "#27272a",
          shadow: "0 10px 15px -3px rgba(0,0,0,0.5), 0 4px 6px -4px rgba(0,0,0,0.4)",
          "border-radius": "0.75rem",
          "font-family": "var(--font-geist-sans), sans-serif",
        };

        StellarWalletsKit.init({
          network,
          modules: defaultModules({
            filterBy: (mod: { productId: string }) => mod.productId !== "xbull",
          }),
          theme: darkTheme,
        });

        unsubscribe = StellarWalletsKit.on(KitEventType.STATE_UPDATED, async () => {
          try {
            const { address: addr } = await StellarWalletsKit.getAddress();
            if (addr) {
              setAddress(addr);
              setIsConnected(true);
              setWalletState({ connected: true, account: addr });
            }
          } catch {
            // Kit fires state updates before a wallet is selected - ignore
          }
        });

        // Try to restore previous session
        try {
          const { address: addr } = await StellarWalletsKit.getAddress();
          if (addr) {
            setAddress(addr);
            setIsConnected(true);
            setWalletState({ connected: true, account: addr });
          }
        } catch {
          // No prior session
        }

        setKitReady(true);
      } catch (err) {
        console.error("Failed to initialise StellarWalletsKit:", err);
      }
    })();

    return () => {
      unsubscribe?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setWalletState]);

  // --- Sync user data from API ---------------------------------------------

  const queryEnabled = isAuthenticated && !!user;
  const userMeOptions = useMemo(
    () => ({
      ...withAuth,
      query: {
        enabled: queryEnabled,
        staleTime: 5000,
        gcTime: 30000,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: false,
        retry: 1,
      },
    }),
    [queryEnabled]
  );
  const { data: userDataFromApi } = useUsersControllerGetMe(userMeOptions);

  // Ref-based guard: only apply updateUser when the API data fingerprint
  // actually changed - not just because TanStack Query returned a new JS ref.
  const lastSyncedFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userDataFromApi || !isAuthenticated) return;
    const response = userDataFromApi as Record<string, unknown>;
    const raw =
      "data" in response &&
      typeof response.data === "object" &&
      response.data !== null &&
      "id" in (response.data as object)
        ? (response.data as Record<string, unknown>)
        : "id" in response
          ? response
          : null;
    if (!raw) return;

    // Build a stable fingerprint so the effect doesn't re-fire on every render
    // when TanStack Query hands back a fresh JS reference for the same JSON.
    const fingerprint = JSON.stringify({
      id: raw.id,
      walletAddress: raw.walletAddress,
      username: raw.username,
      tier: raw.tier,
      totalPoints: raw.totalPoints,
      loginStreak: raw.loginStreak,
      referralCode: raw.referralCode,
      role: raw.role,
    });
    if (lastSyncedFingerprintRef.current === fingerprint) return;
    lastSyncedFingerprintRef.current = fingerprint;

    const { updateUser, user: currentUser } = useQuestAuthStore.getState();
    // Note: the session is first seeded from /auth/me (id + walletAddress only),
    // so also sync when the richer profile fields (username/tier/streak/etc.)
    // differ - otherwise a matching id + totalPoints would skip the update and
    // the username would stay blank.
    if (
      !currentUser ||
      currentUser.id !== String(raw.id ?? "") ||
      currentUser.totalPoints !== Number(raw.totalPoints ?? 0) ||
      currentUser.username !== String(raw.username ?? "") ||
      currentUser.tier !== String(raw.tier ?? "") ||
      currentUser.loginStreak !== Number(raw.loginStreak ?? 0) ||
      (currentUser.referralCode ?? null) !== (raw.referralCode ? String(raw.referralCode) : null)
    ) {
      updateUser({
        id: String(raw.id ?? ""),
        username: String(raw.username ?? ""),
        walletAddress: String(raw.walletAddress ?? ""),
        avatarUrl: raw.avatarUrl ? String(raw.avatarUrl) : null,
        tier: String(raw.tier ?? ""),
        totalPoints: Number(raw.totalPoints ?? 0),
        loginStreak: Number(raw.loginStreak ?? 0),
        referralCode: raw.referralCode ? String(raw.referralCode) : null,
        role: String(raw.role ?? ""),
      });
    }
  }, [userDataFromApi, isAuthenticated]);

  // --- Logout mutation -----------------------------------------------------

  const logoutMutation = useAuthControllerLogout({
    ...withAuth,
    mutation: {
      onError: (error) => console.error("Logout API call failed:", error),
    },
  });

  // --- Core auth flow -------------------------------------------------------

  const authenticateWithWallet = useCallback(
    async (publicKey: string) => {
      if (authAttemptedRef.current === publicKey) return;
      if (authInProgressRef.current) return;
      if (isAuthenticated && user?.walletAddress === publicKey) return;

      authAttemptedRef.current = publicKey;
      authInProgressRef.current = true;
      setLoading(true);
      setSigning(false);

      try {
        // 1. Get challenge from backend (baseURL is /api). The backend DTO
        // expects `publicKey` (not `walletAddress`).
        const challengeRes = await apiClient.post("/api/auth/challenge", { publicKey });
        const cbody = challengeRes.data as {
          message?: string;
          data?: { message?: string };
        };
        const message = cbody?.message ?? cbody?.data?.message ?? "";

        // 2. Network check (Freighter only - gracefully skip others)
        try {
          const networkInfo = await freighterApi.getNetwork();
          if (
            networkInfo &&
            "networkPassphrase" in networkInfo &&
            (networkInfo as Record<string, unknown>).networkPassphrase !==
              activeNetwork.networkPassphrase
          ) {
            const target =
              process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet"
                ? "Stellar Mainnet"
                : "Stellar Testnet";
            toast.error(`Wrong network in wallet. Please switch to ${target}.`);
            // Keep authAttemptedRef set - don't clear it or the effect will loop
            return;
          }
        } catch {
          // non-Freighter wallet - skip
        }

        // 3. Sign
        setSigning(true);
        const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
        try {
          StellarWalletsKit.setWallet(publicKey);
        } catch {
          /* ignore */
        }

        const signResult = await StellarWalletsKit.signMessage(message, {
          address: publicKey,
          networkPassphrase: activeNetwork.networkPassphrase,
        });
        const signedMessage: string =
          typeof signResult === "string"
            ? signResult
            : (((signResult as Record<string, unknown>).signedMessage as string | undefined) ??
              ((signResult as Record<string, unknown>).signature as string | undefined) ??
              String(signResult));

        // 4. Verify with backend (cookie-based auth - no tokens returned). The
        // backend DTO expects `publicKey`. The verify route sets the
        // `tasmil_auth` cookie; hydrate the full user from /auth/me afterwards.
        setSigning(false);
        const referredByCode = readPendingReferralCode();
        await apiClient.post(
          "/api/auth/verify",
          buildVerifyPayload(publicKey, signedMessage, referredByCode)
        );
        // Clear the pending code so a second wallet on the same browser cannot
        // re-send the first user's referral code. Also strip ?ref= from the URL.
        clearPendingReferralCode();
        if (typeof window !== "undefined") {
          try {
            const url = new URL(window.location.href);
            if (url.searchParams.has("ref")) {
              url.searchParams.delete("ref");
              window.history.replaceState({}, "", url.toString());
            }
          } catch {
            // ignore - e.g. invalid href in SSR/test environments
          }
        }
        await loadSessionUser();
        toast.success("Wallet verified successfully!");
      } catch (error: unknown) {
        const isAxiosError = error && typeof error === "object" && "response" in error;
        const status = isAxiosError
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;
        const serverMsg = isAxiosError
          ? (error as { response?: { data?: { error?: { message?: string } } } }).response?.data
              ?.error?.message
          : undefined;
        const msg = error instanceof Error ? error.message : "";

        if (msg.includes("User rejected") || msg.includes("user rejected")) {
          // User cancelled signing - allow them to retry
          authAttemptedRef.current = null;
        }

        if (!msg.includes("User rejected") && !msg.includes("user rejected")) {
          if (status === 429) {
            toast.error(serverMsg || "Too many requests. Please wait a moment and try again.");
          } else {
            toast.error(serverMsg || msg || "Authentication failed. Please try again.");
          }
        }
      } finally {
        authInProgressRef.current = false;
        setLoading(false);
        setSigning(false);
      }
    },
    [isAuthenticated, user, loadSessionUser, setLoading]
  );

  // --- Auto-auth when address becomes known --------------------------------

  const authenticateWithWalletRef = useRef(authenticateWithWallet);
  useEffect(() => {
    authenticateWithWalletRef.current = authenticateWithWallet;
  }, [authenticateWithWallet]);

  useEffect(() => {
    if (
      sessionChecked &&
      kitReady &&
      isConnected &&
      address &&
      !skipAutoAuthRef.current &&
      !authInProgressRef.current &&
      !signing &&
      !isAuthenticating &&
      authAttemptedRef.current !== address &&
      (!isAuthenticated || !user || user.walletAddress !== address)
    ) {
      authenticateWithWalletRef.current(address);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sessionChecked,
    kitReady,
    isConnected,
    address,
    isAuthenticated,
    user,
    signing,
    isAuthenticating,
  ]);

  // --- Connect -------------------------------------------------------------

  const connect = useCallback(async () => {
    skipAutoAuthRef.current = false;
    authAttemptedRef.current = null;

    try {
      // Canonical global connect (shared kit + shared wallet store).
      const publicKey = await connectWallet();
      if (!publicKey) return;
      setAddress(publicKey);
      setIsConnected(true);
      await authenticateWithWallet(publicKey);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "";
      if (!msg.includes("Modal closed") && !msg.includes("User rejected")) {
        toast.error("Failed to open wallet selector.");
      }
    }
  }, [authenticateWithWallet]);

  // --- Disconnect ----------------------------------------------------------

  const disconnect = useCallback(async () => {
    skipAutoAuthRef.current = true;
    authAttemptedRef.current = null;

    // Revoke the session server-side (best-effort, cookie-based auth).
    logoutMutation.mutate(undefined);

    setAddress(null);
    setIsConnected(false);

    // Canonical global sign-out: kit disconnect + clear BOTH backend sessions
    // (quest + main) + reset shared wallet store + redirect home.
    await disconnectAll();
  }, [logoutMutation]);

  // --- signMessage ---------------------------------------------------------

  const signMessage = useCallback(
    async (message: string): Promise<string> => {
      if (!address) throw new Error("No wallet connected");
      const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
      try {
        StellarWalletsKit.setWallet(address);
      } catch {
        /* ignore - some wallets don't need explicit selection */
      }
      const signResult = await StellarWalletsKit.signMessage(message, {
        address,
        networkPassphrase: activeNetwork.networkPassphrase,
      });
      return typeof signResult === "string"
        ? signResult
        : (((signResult as Record<string, unknown>).signedMessage as string | undefined) ??
            ((signResult as Record<string, unknown>).signature as string | undefined) ??
            String(signResult));
    },
    [address]
  );

  // --- Derived -------------------------------------------------------------

  const displayAddress = useMemo(() => {
    if (!address) return null;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }, [address]);

  const points = user?.totalPoints ?? 0;

  // Memoize the context value so consumers (useWallet) don't re-render on
  // every WalletProvider render - only when a consumed field actually changes.
  const ctx = useMemo<WalletContextType>(
    () => ({
      isConnected,
      isAuthenticated,
      isAuthenticating: isAuthenticating || signing,
      address,
      displayAddress,
      points,
      user,
      connect,
      disconnect,
      signMessage,
    }),
    [
      isConnected,
      isAuthenticated,
      isAuthenticating,
      signing,
      address,
      displayAddress,
      points,
      user,
      connect,
      disconnect,
      signMessage,
    ]
  );

  return <WalletContext.Provider value={ctx}>{children}</WalletContext.Provider>;
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within a WalletProvider");
  return context;
};
