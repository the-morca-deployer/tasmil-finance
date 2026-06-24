"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useMarketplaceStore } from "@/features/marketplace/state/marketplace-store";
import type { LeaderboardEntry, MarketplaceStrategy } from "@/features/marketplace/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:6756";

function unwrapData(json: any): any {
  if (json?.data?.data) return json.data.data;
  if (json?.data) return json.data;
  return json;
}

async function fetchStrategies(): Promise<MarketplaceStrategy[]> {
  const res = await fetch(`${BASE_URL}/api/marketplace/strategies`);
  if (!res.ok) throw new Error("Failed to fetch strategies");
  const json = await res.json();
  const data = unwrapData(json);
  return data.items ?? data ?? [];
}

async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const res = await fetch(`${BASE_URL}/api/marketplace/leaderboard`);
  if (!res.ok) throw new Error("Failed to fetch leaderboard");
  const json = await res.json();
  const data = unwrapData(json);
  return data.entries ?? data ?? [];
}

async function fetchStrategyDetail(id: string): Promise<MarketplaceStrategy> {
  const res = await fetch(`${BASE_URL}/api/marketplace/strategies/${id}`);
  if (!res.ok) throw new Error("Strategy not found");
  const json = await res.json();
  const data = unwrapData(json);
  return data ?? json;
}

async function fetchPerformance(
  id: string
): Promise<{ timestamp: string; nav: number; hwm: number }[]> {
  const res = await fetch(`${BASE_URL}/api/marketplace/strategies/${id}/performance`);
  if (!res.ok) return [];
  const json = await res.json();
  const data = unwrapData(json);
  return data ?? [];
}

export function useMarketplace() {
  const { template, sort } = useMarketplaceStore();

  const query = useQuery({
    queryKey: ["marketplace-strategies"],
    queryFn: fetchStrategies,
    refetchInterval: 30_000,
  });

  const strategies = useMemo(() => {
    if (!query.data) return [];
    let filtered = query.data;
    if (template && template !== "all") {
      filtered = filtered.filter((s) => s.template === template);
    }
    switch (sort) {
      case "apy":
        filtered.sort((a, b) => b.currentApy - a.currentApy);
        break;
      case "tvl":
        filtered.sort((a, b) => b.tvlUsd - a.tvlUsd);
        break;
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }
    return filtered;
  }, [query.data, template, sort]);

  return { strategies, loading: query.isLoading, error: query.error, refetch: query.refetch };
}

export function useStrategyDetail(id: string) {
  return useQuery({
    queryKey: ["marketplace-strategy", id],
    queryFn: () => fetchStrategyDetail(id),
    enabled: !!id,
  });
}

export function useStrategyPerformance(id: string) {
  return useQuery({
    queryKey: ["marketplace-performance", id],
    queryFn: () => fetchPerformance(id),
    enabled: !!id,
    refetchInterval: 60_000,
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ["marketplace-leaderboard"],
    queryFn: fetchLeaderboard,
    refetchInterval: 60_000,
  });
}

// ── My Agents ─────────────────────────────────────────────
export interface MyAgent {
  keeperWalletAddress: string;
  baseAsset: string;
  status: string;
  activeStrategy: {
    strategyId: string;
    name: string;
    publisherName: string;
    currentApy: number;
    totalDepositedUsd: number;
    activatedAt: string;
  } | null;
}

async function fetchMyAgents(): Promise<MyAgent[]> {
  const res = await fetch(`${BASE_URL}/api/marketplace/my-strategies`);
  if (!res.ok) throw new Error("Failed to fetch my agents");
  const json = await res.json();
  return (json.data?.vaults as MyAgent[]) ?? json ?? [];
}

export function useMyAgents() {
  return useQuery({
    queryKey: ["my-agents"],
    queryFn: fetchMyAgents,
    refetchInterval: 30_000,
  });
}

export function useDeactivateStrategy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (strategyId: string) =>
      fetch(`${BASE_URL}/api/marketplace/strategies/${strategyId}/deactivate`, {
        method: "POST",
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-agents"] }),
  });
}
