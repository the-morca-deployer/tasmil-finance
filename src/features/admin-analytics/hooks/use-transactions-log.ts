"use client";

import { useQuery } from "@tanstack/react-query";
import { useAdminAuthStore } from "@/store/use-admin-auth";
import type { TransactionsLogResponse } from "../types";

export interface TransactionsLogParams {
  from?: string;
  to?: string;
  type?: string[];
  page: number;
  pageSize: number;
}

async function fetchTransactionsLog(
  token: string,
  params: TransactionsLogParams
): Promise<TransactionsLogResponse> {
  const search = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  });
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  if (params.type && params.type.length > 0) search.set("type", params.type.join(","));

  const response = await fetch(`/api/admin/analytics/transactions?${search.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch transactions log");
  const json = await response.json();
  return json.data ?? json;
}

export function useTransactionsLog(params: TransactionsLogParams) {
  const token = useAdminAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["admin-analytics", "transactions", params],
    queryFn: () => fetchTransactionsLog(token!, params),
    enabled: !!token,
  });
}
