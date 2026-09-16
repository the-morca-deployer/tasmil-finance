"use client";

import { useMarketplaceControllerGetMyStrategies } from "@/gen-backend/hooks/use-marketplace-controller-get-my-strategies";
import { useWalletStore } from "@/store/use-wallet";
import { unwrapBackendData } from "./transport";

interface VaultSummary {
  accountId: string;
  purpose: string;
  keeperWalletAddress: string | null;
  baseAsset: string;
  status: string;
}

function adaptVaults(value: unknown): VaultSummary[] {
  const unwrapped = unwrapBackendData(value);
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

export function useVaultAccount() {
  const walletConnected = useWalletStore((state) => state.account !== null);
  const query = useMarketplaceControllerGetMyStrategies({
    query: {
      enabled: walletConnected,
      staleTime: 60_000,
      select: adaptVaults,
    },
  });
  return {
    walletConnected,
    accountId: query.data?.find((vault) => vault.purpose === "VAULT")?.accountId ?? null,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}
