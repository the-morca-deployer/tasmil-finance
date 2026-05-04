"use client";

import { useQuery } from "@tanstack/react-query";

export interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  volumeUsd: number;
}

export interface CurrentUserRank {
  rank: number;
  volumeUsd: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  total: number;
  currentUserRank: CurrentUserRank | null;
  page: number;
  limit: number;
}

interface BackendEnvelope<T> {
  success: boolean;
  data: T;
}

async function fetchLeaderboard(
  page: number,
  limit: number,
  me: string | undefined,
): Promise<LeaderboardResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (me) params.set("me", me);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
  const res = await fetch(`${apiUrl}/api/leaderboard?${params.toString()}`);
  if (!res.ok) throw new Error(`Leaderboard fetch failed: ${res.status}`);
  const env = (await res.json()) as BackendEnvelope<LeaderboardResponse>;
  if (!env.success) throw new Error("Leaderboard backend reported failure");
  return env.data;
}

export function useLeaderboard(page: number, limit: number, me: string | undefined) {
  return useQuery<LeaderboardResponse, Error>({
    queryKey: ["quest", "leaderboard", { page, limit, me }],
    queryFn: () => fetchLeaderboard(page, limit, me),
    staleTime: 30_000,
  });
}
