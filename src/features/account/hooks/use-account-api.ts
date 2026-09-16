"use client";

import { useQuery } from "@tanstack/react-query";
import {
  useAccountControllerGetActivity,
  useAccountControllerGetPosition,
} from "@/gen-backend/hooks";
import backendAxios, { $b, $bLive } from "@/lib/kubb-backend";
import type { ActivityItem, PositionData, PresetCardData } from "../types";

// --- Query hooks (generated + config preset + select to unwrap NestJS envelope) ---
//
// The account WRITE hooks (deploy / setup / fund / withdraw / preset / submit /
// revoke / reactivate) used to live below these. They now live in
// `@/shared/hooks/use-account-mutations` — three features were importing them
// across a feature boundary to get at them, so they are shared code, not
// account-feature code. Import them from there, not from here.

export function usePresets(baseAsset?: string) {
  // Backend supports ?baseAsset=USDC|XLM - different pool universes per
  // deposit asset. Keep the query key distinct so switching the toggle
  // invalidates the cache cleanly.
  const normalized = (baseAsset ?? "USDC").toUpperCase();
  return useQuery({
    queryKey: ["/api/account/presets", normalized] as const,
    refetchInterval: 60_000,
    queryFn: async (): Promise<PresetCardData[]> => {
      const { data } = await backendAxios.get<{ data: PresetCardData[] }>(
        `/api/account/presets?baseAsset=${encodeURIComponent(normalized)}`
      );
      return data.data ?? [];
    },
  });
}

export function usePosition(publicKey: string | undefined) {
  return useAccountControllerGetPosition(publicKey!, {
    query: {
      ...$bLive.query,
      enabled: !!publicKey,
      staleTime: 30_000,
      select: (res: unknown): PositionData | null => (res as { data?: PositionData }).data ?? null,
    },
  });
}

export function useActivity(publicKey: string | undefined) {
  return useAccountControllerGetActivity(
    publicKey!,
    { limit: "50" },
    {
      query: {
        ...$b.query,
        enabled: !!publicKey,
        refetchInterval: 60_000,
        select: (res: unknown): ActivityItem[] =>
          (res as { data?: { items?: ActivityItem[] } }).data?.items ?? [],
      },
    }
  );
}
