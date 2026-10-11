"use client";

import { useQuery } from "@tanstack/react-query";
import type { ProtocolPositionGroup } from "./use-defi-positions";

interface BlendPositionsResponse {
  groups: ProtocolPositionGroup[];
  incompletePools: string[];
}

async function fetchBlendPositions(user: string): Promise<BlendPositionsResponse> {
  const res = await fetch(`/api/positions/blend?user=${encodeURIComponent(user)}`);
  if (!res.ok) throw new Error(`Blend positions failed: ${res.status}`);
  const data = await res.json();
  return { groups: data.groups ?? [], incompletePools: data.incompletePools ?? [] };
}

export function useBlendPositions(address: string | null | undefined) {
  return useQuery<BlendPositionsResponse>({
    queryKey: ["profile", "blend-positions", address],
    queryFn: () => fetchBlendPositions(address!),
    enabled: !!address,
    staleTime: 30_000,
    refetchInterval: 30_000,
    retry: 3,
    retryDelay: (attempt) => Math.min(2000 * 2 ** attempt, 10000),
  });
}
