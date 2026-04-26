"use client";

import { useQuery } from "@tanstack/react-query";
import type { ProtocolPositionGroup } from "./use-defi-positions";

async function fetchAquariusPositions(user: string): Promise<ProtocolPositionGroup[]> {
  const res = await fetch(`/api/positions/aquarius?user=${encodeURIComponent(user)}`);
  if (!res.ok) throw new Error(`Aquarius positions failed: ${res.status}`);
  const data = await res.json();
  return data.groups ?? [];
}

export function useAquariusPositions(address: string | null | undefined) {
  return useQuery<ProtocolPositionGroup[]>({
    queryKey: ["profile", "aquarius-positions", address],
    queryFn: () => fetchAquariusPositions(address!),
    enabled: !!address,
    staleTime: 8_000,
    refetchInterval: 10_000,
    retry: 1,
  });
}
