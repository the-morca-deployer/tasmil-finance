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
import { activeNetwork } from "@/features/quest/lib/stellar";
import { type AuthUser, useQuestAuthStore } from "@/features/quest/store/use-quest-auth";
import { useQuestWalletStore } from "@/features/quest/store/use-quest-wallet";
import { useAuthControllerLogout, useUsersControllerGetMe } from "@/gen-quest/hooks";
import { connectWallet, disconnectAll } from "@/shared/lib/wallet-session";

// ─── Types ───────────────────────────────────────────────────────────────────

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
}

// ─── Context ─────────────────────────────────────────────────────────────────

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

  // Keep local connection state in sync with the shared wallet store so connect
  // / disconnect on any surface (landing, chat, dev-bypass) reflects in quest.
  useEffect(() => {
    const unsubscribe = useQuestWalletStore.subscribe((s) => {
      setAddress(s.account);
      setIsConnected(s.connected);
    });
    return unsubscribe;
  }, []);

  // Under dev-bypass, acquire a real quest JWT from the backend so authenticated
  // quest screens load seeded data instead of being blocked by auth guards.
  useEffect(() => {
    void ensureQuestDevSession();
  }, []);

  // ─── Init StellarWalletsKit (browser-only) ───────────────────────────────

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
            // Kit fires state updates before a wallet is selected — ignore
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

  // ─── Sync user data from API ─────────────────────────────────────────────

  const queryEnabled = isAuthenticated && !!user;
  const { data: userDataFromApi } = useUsersControllerGetMe({
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
  });

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

    const { updateUser, user: currentUser } = useQuestAuthStore.getState();
    if (
      !currentUser ||
      currentUser.id !== String(raw.id ?? "") ||
      currentUser.totalPoints !== Number(raw.totalPoints ?? 0)
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

  // ─── Logout mutation ─────────────────────────────────────────────────────

  const logoutMutation = useAuthControllerLogout({
    ...withAuth,
    mutation: {
      onError: (error) => console.error("Logout API call failed:", error),
    },
  });

  // ─── Core auth flow ───────────────────────────────────────────────────────

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
        // 1. Get challenge from backend (baseURL is /api)
        const challengeRes = await apiClient.post<{
          data: { nonce: string; message: string };
        }>("/auth/challenge", { walletAddress: publicKey });
        const { message } = challengeRes.data.data;

        // 2. Network check (Freighter only — gracefully skip others)
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
            // Keep authAttemptedRef set — don't clear it or the effect will loop
            return;
          }
        } catch {
          // non-Freighter wallet — skip
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

        // 4. Verify with backend (cookie-based auth — no tokens returned)
        setSigning(false);
        const verifyRes = await apiClient.post<{
          data: { user: AuthUser };
        }>("/auth/verify", { walletAddress: publicKey, signedMessage });

        const { user: userData } = verifyRes.data.data;
        setAuthUser(userData);
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
          // User cancelled signing — allow them to retry
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
    [isAuthenticated, user, setAuthUser, setLoading]
  );

  // ─── Auto-auth when address becomes known ────────────────────────────────

  const authenticateWithWalletRef = useRef(authenticateWithWallet);
  useEffect(() => {
    authenticateWithWalletRef.current = authenticateWithWallet;
  }, [authenticateWithWallet]);

  useEffect(() => {
    if (
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
  }, [kitReady, isConnected, address, isAuthenticated, user, signing, isAuthenticating]);

  // ─── Connect ─────────────────────────────────────────────────────────────

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

  // ─── Disconnect ──────────────────────────────────────────────────────────

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

  // ─── Derived ─────────────────────────────────────────────────────────────

  const displayAddress = useMemo(() => {
    if (!address) return null;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }, [address]);

  const points = user?.totalPoints ?? 0;

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        isAuthenticated,
        isAuthenticating: isAuthenticating || signing,
        address,
        displayAddress,
        points,
        user,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within a WalletProvider");
  return context;
};
