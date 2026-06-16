"use client";

import { useQuery } from "@tanstack/react-query";

export interface QuestWalletEntry {
  rank: number;
  walletAddress: string;
  volumeUsd: number;
}

interface BackendEnvelope<T> {
  success: boolean;
  data: T;
}

interface LeaderboardResponse {
  entries: QuestWalletEntry[];
  total: number;
  page: number;
  limit: number;
}

async function fetchQuestWallets(
  page: number,
  limit: number,
  search: string
): Promise<LeaderboardResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);

  const res = await fetch(`${apiUrl}/api/leaderboard?${params.toString()}`);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

  const env = (await res.json()) as BackendEnvelope<LeaderboardResponse>;
  if (!env.success) throw new Error("Backend reported failure");
  return env.data;
}

export function useAdminQuestWallets(page: number, limit: number, search: string) {
  return useQuery<LeaderboardResponse, Error>({
    queryKey: ["admin", "quest-wallets", { page, limit, search }],
    queryFn: () => fetchQuestWallets(page, limit, search),
    staleTime: 30_000,
  });
}
