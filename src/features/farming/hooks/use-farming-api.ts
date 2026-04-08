"use client";

import { useQuery } from "@tanstack/react-query";
import type { RebalanceStatus, DiscoveredPool } from "../types";

const API_BASE = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:6756/api";

export function useRebalanceStatus() {
  return useQuery<RebalanceStatus>({
    queryKey: ["rebalance", "status"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/rebalance/status`);
      if (!res.ok) return { ready: false, halted: false, haltReason: null };
      const json = await res.json();
      return json.data ?? json;
    },
    refetchInterval: 15_000,
  });
}

export function usePools() {
  return useQuery<DiscoveredPool[]>({
    queryKey: ["pools"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/pools`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data ?? json;
    },
    refetchInterval: 60_000,
  });
}
