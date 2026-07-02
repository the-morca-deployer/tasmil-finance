"use client";

import { useQuery } from "@tanstack/react-query";
import { useAdminAuthStore } from "@/store/use-admin-auth";
import type { TransactionsStats } from "../types";

async function fetchTransactionsStats(
  token: string,
  from: string | undefined,
  to: string | undefined
): Promise<TransactionsStats> {
  const search = new URLSearchParams();
  if (from) search.set("from", from);
  if (to) search.set("to", to);

  const response = await fetch(`/api/admin/analytics/transactions/stats?${search.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch transactions stats");
  const json = await response.json();
  return json.data ?? json;
}

export function useTransactionsStats(from: string | undefined, to: string | undefined) {
  const token = useAdminAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["admin-analytics", "transactions-stats", from, to],
    queryFn: () => fetchTransactionsStats(token!, from, to),
    enabled: !!token,
  });
}
