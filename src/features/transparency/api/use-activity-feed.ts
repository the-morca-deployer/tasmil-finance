"use client";

import { useState } from "react";
import { useActivityControllerFeed } from "@/gen-backend/hooks";
import type { ActivityControllerFeedQueryParams } from "@/gen-backend/types/activity-controller-feed";
import { adaptActivityPage } from "./adapters";
import { unwrapBackendData } from "./transport";
import { useVaultAccount } from "./use-vault-account";

export function useActivityFeed() {
  const vault = useVaultAccount();
  const [cursor, setCursor] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const params = {
    accountId: vault.accountId ?? undefined,
    cursor: cursor ?? undefined,
    limit: "50",
  } as unknown as ActivityControllerFeedQueryParams;
  const query = useActivityControllerFeed(params, {
    query: {
      enabled: vault.accountId !== null,
      staleTime: 15_000,
      select: (value: unknown) => adaptActivityPage(unwrapBackendData(value)),
    },
  });

  return {
    walletConnected: vault.walletConnected,
    accountId: vault.accountId,
    data: query.data,
    isLoading: vault.isLoading || (vault.accountId !== null && query.isLoading),
    error: vault.error ?? (query.error as Error | null),
    hasPrevious: history.length > 0,
    nextPage: (next: string) => {
      setHistory((items) => [...items, cursor ?? ""]);
      setCursor(next);
    },
    previousPage: () => {
      setHistory((items) => {
        const previous = items.at(-1) ?? "";
        setCursor(previous || null);
        return items.slice(0, -1);
      });
    },
    refetch: () => {
      void vault.refetch();
      void query.refetch();
    },
  };
}
