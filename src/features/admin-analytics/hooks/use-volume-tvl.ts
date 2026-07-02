"use client";

import { useQuery } from "@tanstack/react-query";
import { useAdminAuthStore } from "@/store/use-admin-auth";
import type { Granularity, VolumeTvlPoint } from "../types";

async function fetchVolumeTvl(
  token: string,
  from: string | undefined,
  to: string | undefined,
  granularity: Granularity
): Promise<VolumeTvlPoint[]> {
  const params = new URLSearchParams({ granularity });
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const response = await fetch(`/api/admin/analytics/volume-tvl?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch volume/TVL series");
  const json = await response.json();
  return json.data ?? json;
}

export function useVolumeTvl(from: string | undefined, to: string | undefined, granularity: Granularity) {
  const token = useAdminAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["admin-analytics", "volume-tvl", from, to, granularity],
    queryFn: () => fetchVolumeTvl(token!, from, to, granularity),
    enabled: !!token,
  });
}
