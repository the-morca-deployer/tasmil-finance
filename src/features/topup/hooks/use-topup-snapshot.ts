"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/use-auth";
import { fetchTopup, type TopupSnapshot } from "../lib/fetch-topup";

export function topupSnapshotQueryKey(topupId: string) {
  return ["topup", topupId] as const;
}

export function useTopupSnapshot(topupId: string | null) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isExpired = useAuthStore((s) => s.isTokenExpired());
  return useQuery<TopupSnapshot>({
    queryKey: topupSnapshotQueryKey(topupId ?? "none"),
    queryFn: () => {
      if (!topupId) throw new Error("topupId is required");
      return fetchTopup(topupId);
    },
    enabled: !!topupId && !!accessToken && !isExpired,
    refetchInterval: (q) => {
      const data = q.state.data;
      if (!data) return 5_000;
      if (data.status === "PENDING") return 5_000;
      return false; // stop polling on terminal status
    },
    staleTime: 0,
  });
}
