"use client";

import { usePolicyControllerGetRulebook } from "@/gen-backend/hooks";
import { adaptRulebook, type Rulebook } from "./adapters";
import { unwrapBackendData } from "./transport";
import { useVaultAccount } from "./use-vault-account";

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
  const vault = useVaultAccount();
  const { accountId, walletConnected } = vault;
  const rulebook = usePolicyControllerGetRulebook(accountId ?? undefined, {
    query: {
      enabled: walletConnected && accountId !== null,
      staleTime: 30_000,
      refetchInterval: 60_000,
      select: (value: unknown) => adaptRulebook(unwrapBackendData(value)),
    },
  });

  return {
    walletConnected,
    accountId,
    data: rulebook.data,
    isLoading: walletConnected && (vault.isLoading || (accountId !== null && rulebook.isLoading)),
    isStale: rulebook.isStale && rulebook.data !== undefined,
    error: vault.error ?? (rulebook.error as Error | null),
    refetch: () => {
      void vault.refetch();
      if (accountId !== null) void rulebook.refetch();
    },
  };
}
