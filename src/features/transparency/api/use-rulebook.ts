"use client";

import {
  useMarketplaceControllerGetMyStrategies,
  usePolicyControllerGetRulebook,
} from "@/gen-backend/hooks";
import { useWalletStore } from "@/store/use-wallet";
import { adaptRulebook, type Rulebook } from "./adapters";

interface VaultSummary {
  accountId: string;
  purpose: string;
  keeperWalletAddress: string | null;
  baseAsset: string;
  status: string;
}

function unwrapData(value: unknown): unknown {
  if (value && typeof value === "object" && "data" in value) {
    return (value as { data: unknown }).data;
  }
  return value;
}

function adaptVaults(value: unknown): VaultSummary[] {
  const unwrapped = unwrapData(value);
  const vaults =
    unwrapped && typeof unwrapped === "object" && "vaults" in unwrapped
      ? (unwrapped as { vaults: unknown }).vaults
      : [];
  if (!Array.isArray(vaults)) return [];
  return vaults.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    if (
      typeof row.accountId !== "string" ||
      typeof row.purpose !== "string" ||
      typeof row.baseAsset !== "string" ||
      typeof row.status !== "string" ||
      (row.keeperWalletAddress !== null && typeof row.keeperWalletAddress !== "string")
    ) {
      return [];
    }
    return [row as unknown as VaultSummary];
  });
}

export interface RulebookQueryState {
  walletConnected: boolean;
  accountId: string | null;
  data: Rulebook | undefined;
  isLoading: boolean;
  isStale: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useRulebook(): RulebookQueryState {
  const wallet = useWalletStore((state) => state.account);
  const walletConnected = wallet !== null;
  const vaults = useMarketplaceControllerGetMyStrategies({
    query: {
      enabled: walletConnected,
      staleTime: 60_000,
      select: adaptVaults,
    },
  });
  const accountId = vaults.data?.find((vault) => vault.purpose === "VAULT")?.accountId ?? null;
  const rulebook = usePolicyControllerGetRulebook(accountId ?? undefined, {
    query: {
      enabled: walletConnected && accountId !== null,
      staleTime: 30_000,
      refetchInterval: 60_000,
      select: (value: unknown) => adaptRulebook(unwrapData(value)),
    },
  });

  return {
    walletConnected,
    accountId,
    data: rulebook.data,
    isLoading: walletConnected && (vaults.isLoading || (accountId !== null && rulebook.isLoading)),
    isStale: rulebook.isStale && rulebook.data !== undefined,
    error: (vaults.error ?? rulebook.error) as Error | null,
    refetch: () => {
      void vaults.refetch();
      if (accountId !== null) void rulebook.refetch();
    },
  };
}
