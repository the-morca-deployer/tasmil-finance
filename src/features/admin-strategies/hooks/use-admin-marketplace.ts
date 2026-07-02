"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAdminAuthStore } from "@/store/use-admin-auth";
import type {
  AdminPublisher,
  AdminStrategy,
  LeaderboardEntry,
  MarketplaceOverview,
  StrategyParticipant,
} from "../types";

/** Authorized fetch against admin endpoints (mirrors features/admin/lib/admin-fetch). */
async function marketplaceAdminFetch<T>(path: string, method = "GET"): Promise<T> {
  const token = useAdminAuthStore.getState().token;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(path, { method, headers });
  const json = (await res.json().catch(() => null)) as { data?: T; message?: string } | null;
  if (res.status === 401) {
    useAdminAuthStore.getState().clearAuth();
    if (typeof window !== "undefined") window.location.assign("/admin/login");
    throw new Error(json?.message ?? "Session expired");
  }
  if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
  return (json?.data ?? json) as T;
}

/** Public marketplace endpoints return { success, data } — unwrap without auth. */
async function marketplacePublicFetch<T>(path: string): Promise<T> {
  const res = await fetch(path);
  const json = (await res.json().catch(() => null)) as { data?: T; message?: string } | null;
  if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
  return (json?.data ?? json) as T;
}

export function useAdminStrategies(status?: string) {
  return useQuery({
    queryKey: ["admin-marketplace-strategies", status ?? "ALL"],
    queryFn: () =>
      marketplaceAdminFetch<AdminStrategy[]>(
        `/api/admin/marketplace/strategies${status ? `?status=${status}` : ""}`
      ),
    refetchInterval: 30_000,
  });
}

export function useMarketplaceOverview() {
  return useQuery({
    queryKey: ["admin-marketplace-overview"],
    queryFn: () => marketplaceAdminFetch<MarketplaceOverview>("/api/admin/marketplace/overview"),
    refetchInterval: 30_000,
  });
}

export function useAdminPublishers() {
  return useQuery({
    queryKey: ["admin-marketplace-publishers"],
    queryFn: () => marketplaceAdminFetch<AdminPublisher[]>("/api/admin/marketplace/publishers"),
  });
}

function useStrategyAction(action: "approve" | "reject") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (strategyId: string) =>
      marketplaceAdminFetch<{ id: string; name: string; status: string }>(
        `/api/admin/marketplace/strategies/${strategyId}/${action}`,
        "POST"
      ),
    onSuccess: (data) => {
      toast.success(`${data.name} ${action}d`);
      qc.invalidateQueries({ queryKey: ["admin-marketplace-strategies"] });
      qc.invalidateQueries({ queryKey: ["admin-marketplace-overview"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useApproveStrategy() {
  return useStrategyAction("approve");
}

export function useRejectStrategy() {
  return useStrategyAction("reject");
}

export function useStrategyParticipants(strategyId: string | null) {
  return useQuery({
    queryKey: ["admin-marketplace-participants", strategyId],
    enabled: strategyId !== null,
    queryFn: async () => {
      const data = await marketplacePublicFetch<{ participants: StrategyParticipant[] }>(
        `/api/marketplace/strategies/${strategyId}/participants`
      );
      return data.participants;
    },
  });
}

export function useMarketplaceLeaderboard() {
  return useQuery({
    queryKey: ["admin-marketplace-leaderboard"],
    queryFn: async () => {
      const data = await marketplacePublicFetch<{ entries: LeaderboardEntry[] }>(
        "/api/marketplace/leaderboard?sort=tvl_desc&limit=100"
      );
      return data.entries;
    },
  });
}
