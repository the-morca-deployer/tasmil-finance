"use client";

import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "../lib/admin-fetch";
import { useAdminAuthStore } from "@/store/use-admin-auth";


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
  const params = new URLSearchParams({ limit: String(limit) });

  const raw = await adminFetch<RawEntry[]>(`/api/admin/quest-wallets?${params.toString()}`);
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
  const token = useAdminAuthStore((s) => s.token);
  return useQuery<LeaderboardResponse, Error>({
    queryKey: ["admin", "quest-wallets", { limit, search }],
    queryFn: () => fetchQuestWallets(limit, search),
    enabled: !!token,
    staleTime: 30_000,
  });
}
