"use client";

import { useQuery } from "@tanstack/react-query";
import { useAdminAuthStore } from "@/store/use-admin-auth";

interface VolumeByProtocol {
  defindex: number;
  blend: number;
  soroswap: number;
  aquarius: number;
}

interface TopDepositor {
  walletAddress: string;
  totalUsd: number;
}

export interface QuestStats {
  questWallets: number;
  mainAppWallets: number;
  onchainCompleters: number;
  fullOnchainCompleters: number;
  volumeByProtocol: VolumeByProtocol;
  topDepositors: TopDepositor[];
}

async function fetchQuestStats(token: string): Promise<QuestStats> {
  const res = await fetch("/api/admin/quest-stats", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch quest stats");
  const json = await res.json();
  return (json.data ?? json) as QuestStats;
}

export function useQuestStats() {
  const token = useAdminAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["admin-quest-stats"],
    queryFn: () => fetchQuestStats(token!),
    enabled: !!token,
    refetchInterval: 60_000,
  });
}
