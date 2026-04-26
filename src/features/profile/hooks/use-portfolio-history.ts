"use client";

import { useQuery } from "@tanstack/react-query";

export interface HistoryPoint {
  timestamp: number;
  totalValueUsd: number;
  walletUsd: number;
  defiUsd: number;
}

async function fetchHistory(address: string, days: number): Promise<HistoryPoint[]> {
  const res = await fetch(
    `/api/portfolio/history/${encodeURIComponent(address)}?days=${days}`,
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map(
    (p: { timestamp: string; totalValueUsd: number; walletUsd: number; defiUsd: number }) => ({
      timestamp: new Date(p.timestamp).getTime(),
      totalValueUsd: Number(p.totalValueUsd),
      walletUsd: Number(p.walletUsd),
      defiUsd: Number(p.defiUsd),
    }),
  );
}

export function usePortfolioHistory(
  address: string | null | undefined,
  days: number,
) {
  return useQuery<HistoryPoint[]>({
    queryKey: ["profile", "portfolio-history", address, days],
    queryFn: () => fetchHistory(address!, days),
    enabled: !!address,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
