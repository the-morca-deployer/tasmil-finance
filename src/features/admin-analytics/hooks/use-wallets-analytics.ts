"use client";

import { useQuery } from "@tanstack/react-query";
import { useAdminAuthStore } from "@/store/use-admin-auth";
import type { SortOrder, WalletSortKey, WalletsAnalyticsResponse } from "../types";

export interface WalletsAnalyticsParams {
  from?: string;
  to?: string;
  sort: WalletSortKey;
  order: SortOrder;
  search?: string;
  page: number;
  pageSize: number;
}

async function fetchWalletsAnalytics(
  token: string,
  params: WalletsAnalyticsParams
): Promise<WalletsAnalyticsResponse> {
  const search = new URLSearchParams({
    sort: params.sort,
    order: params.order,
    page: String(params.page),
    pageSize: String(params.pageSize),
  });
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  if (params.search) search.set("search", params.search);

  const response = await fetch(`/api/admin/analytics/wallets?${search.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch wallets analytics");
  const json = await response.json();
  return json.data ?? json;
}

export function useWalletsAnalytics(params: WalletsAnalyticsParams) {
  const token = useAdminAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["admin-analytics", "wallets", params],
    queryFn: () => fetchWalletsAnalytics(token!, params),
    enabled: !!token,
  });
}
