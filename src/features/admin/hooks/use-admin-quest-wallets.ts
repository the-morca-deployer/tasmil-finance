"use client";

import { useQuery } from "@tanstack/react-query";

export interface QuestWalletEntry {
  rank: number;
  walletAddress: string;
  username: string | null;
  totalPoints: number;
  tier: string | null;
}

interface RawEntry {
  id: string;
  username: string | null;
  totalPoints: number;
  tier: string | null;
  avatarUrl: string | null;
  walletAddress: string | null;
}

interface LeaderboardResponse {
  entries: QuestWalletEntry[];
  total: number;
}

async function fetchQuestWallets(limit: number, search: string): Promise<LeaderboardResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
  const params = new URLSearchParams({ limit: String(limit) });

  const res = await fetch(`${apiUrl}/api/leaderboard/global?${params.toString()}`);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

  const raw = (await res.json()) as RawEntry[];
  const all: QuestWalletEntry[] = raw.map((r, i) => ({
    rank: i + 1,
    walletAddress: r.walletAddress ?? r.id,
    username: r.username,
    totalPoints: r.totalPoints,
    tier: r.tier,
  }));

  const filtered = search
    ? all.filter(
        (e) =>
          e.walletAddress.toLowerCase().includes(search.toLowerCase()) ||
          (e.username ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : all;

  return { entries: filtered, total: filtered.length };
}

export function useAdminQuestWallets(limit: number, search: string) {
  return useQuery<LeaderboardResponse, Error>({
    queryKey: ["admin", "quest-wallets", { limit, search }],
    queryFn: () => fetchQuestWallets(limit, search),
    staleTime: 30_000,
  });
}
