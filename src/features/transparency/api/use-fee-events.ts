"use client";

import { useState } from "react";
import { useFeeControllerList } from "@/gen-backend/hooks/use-fee-controller-list";
import type { FeeControllerListQueryParams } from "@/gen-backend/types/fee-controller-list";
import { adaptFeePage } from "./adapters";
import { unwrapBackendData } from "./transport";

const configuredNetwork =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet" ? "mainnet" : "testnet";

export function useFeeEvents() {
  const [cursor, setCursor] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const params = {
    network: configuredNetwork,
    cursor: cursor ?? undefined,
    startLedger: undefined,
    limit: "50",
  } as unknown as FeeControllerListQueryParams;
  const query = useFeeControllerList(params, {
    query: {
      staleTime: 30_000,
      select: (value: unknown) => adaptFeePage(unwrapBackendData(value)),
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error as Error | null,
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
    refetch: () => void query.refetch(),
  };
}
