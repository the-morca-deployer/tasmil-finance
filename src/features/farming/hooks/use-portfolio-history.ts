"use client";

import { useQuery } from "@tanstack/react-query";
import backendAxios from "@/lib/kubb-backend";

export type HistoryRange = "7d" | "30d" | "90d" | "all";

export interface HistoryPoint {
  ts: number; // unix ms
  valueUsd: number;
  walletUsd?: number;
  defiUsd?: number;
  valueAsset?: number;
  walletAsset?: number;
  defiAsset?: number;
  assetSymbol?: string;
  assetPriceUsd?: number;
}

export interface PortfolioHistory {
  data: HistoryPoint[];
  range: HistoryRange;
  isLoading: boolean;
  isPlaceholder: boolean;
  error: Error | null;
}

const RANGE_DAYS: Record<HistoryRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  // Portfolio snapshots are retained for 90 days, so All means the complete
  // retained series rather than an unbounded request the API cannot serve.
  all: 90,
};

interface PortfolioHistoryResponsePoint {
  timestamp: string;
  totalValueUsd: number;
  walletUsd: number;
  defiUsd: number;
  totalValueAsset?: number;
  walletAsset?: number;
  defiAsset?: number;
  assetSymbol?: string;
  assetPriceUsd?: number;
}

type PortfolioHistoryPayload =
  | PortfolioHistoryResponsePoint[]
  | { success?: boolean; data?: PortfolioHistoryResponsePoint[] };

/** The Next route returns an unwrapped array; direct backend calls return an envelope. */
export function normalizePortfolioHistoryPayload(payload: unknown): HistoryPoint[] {
  const snapshots = Array.isArray(payload)
    ? (payload as PortfolioHistoryResponsePoint[])
    : payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown }).data)
      ? ((payload as { data: PortfolioHistoryResponsePoint[] }).data ?? [])
      : [];

  return snapshots
    .map((snapshot) => ({
      ts: Date.parse(snapshot.timestamp),
      valueUsd: Number(snapshot.totalValueUsd),
      walletUsd: Number(snapshot.walletUsd),
      defiUsd: Number(snapshot.defiUsd),
      ...(Number.isFinite(Number(snapshot.totalValueAsset)) && snapshot.assetSymbol
        ? {
            valueAsset: Number(snapshot.totalValueAsset),
            walletAsset: Number(snapshot.walletAsset),
            defiAsset: Number(snapshot.defiAsset),
            assetSymbol: snapshot.assetSymbol.toUpperCase(),
            assetPriceUsd: Number(snapshot.assetPriceUsd),
          }
        : {}),
    }))
    .filter(
      (snapshot) =>
        Number.isFinite(snapshot.ts) &&
        Number.isFinite(snapshot.valueUsd) &&
        Number.isFinite(snapshot.walletUsd) &&
        Number.isFinite(snapshot.defiUsd)
    )
    .sort((left, right) => left.ts - right.ts);
}

export function usePortfolioHistory(
  keeperWalletAddress: string | undefined,
  range: HistoryRange,
  displayAsset?: string
): PortfolioHistory {
  const query = useQuery({
    queryKey: ["portfolio-history", keeperWalletAddress, range] as const,
    enabled: !!keeperWalletAddress,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<HistoryPoint[]> => {
      const { data } = await backendAxios.get<PortfolioHistoryPayload>(
        `/api/portfolio/history/${keeperWalletAddress}?days=${RANGE_DAYS[range]}`
      );
      const normalizedAsset = displayAsset?.toUpperCase();
      return normalizePortfolioHistoryPayload(data).filter(
        (snapshot) =>
          snapshot.valueAsset !== undefined &&
          (!normalizedAsset || snapshot.assetSymbol === normalizedAsset)
      );
    },
  });

  const data = query.data ?? [];
  return {
    data,
    range,
    isLoading: query.isPending,
    isPlaceholder: !query.isPending && data.length === 0,
    error: query.error instanceof Error ? query.error : null,
  };
}
