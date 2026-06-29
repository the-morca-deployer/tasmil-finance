"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useTierRewardsControllerList,
  useTierRewardsControllerClaim,
  tierRewardsControllerListQueryKey,
  usersControllerGetMeQueryKey,
} from "@/gen-quest/hooks";
import { withAuth } from "../lib/kubb-config";
import { RANK_ORDER, type QuestRank } from "../lib/tier";
import { useQuestAuthStore } from "../store/use-quest-auth";
import { TierRewardReveal } from "./TierRewardReveal";

interface TierRewardItem {
  tier: string;
  points: number;
  reached: boolean;
  claimed: boolean;
  claimable: boolean;
}

/**
 * Auto-shows a sequential tier-reward reveal dialog for every claimable tier
 * (Bronze → … → Master) as soon as an authenticated user lands on a /quest route.
 * One dialog is shown at a time; dismissing or claiming advances to the next.
 */
export function TierRewardRevealGate() {
  const isAuthenticated = useQuestAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();
  const [idx, setIdx] = useState(0);

  const { data: raw } = useTierRewardsControllerList({
    ...withAuth,
    query: { enabled: isAuthenticated },
  });

  const claim = useTierRewardsControllerClaim({
    ...withAuth,
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: usersControllerGetMeQueryKey() });
        await queryClient.invalidateQueries({ queryKey: tierRewardsControllerListQueryKey() });
        setIdx((i) => i + 1);
      },
    },
  });

  if (!isAuthenticated) return null;

  const all: TierRewardItem[] = Array.isArray(raw)
    ? (raw as TierRewardItem[])
    : ((raw as { data?: TierRewardItem[] } | undefined)?.data ?? []);

  // Filter claimable items and sort by rank order (lowest tier first)
  const claimable = all
    .filter((r) => r.claimable)
    .sort(
      (a, b) =>
        RANK_ORDER.indexOf(a.tier as QuestRank) - RANK_ORDER.indexOf(b.tier as QuestRank)
    );

  const current = claimable[idx];

  if (!current) return null;

  return (
    <TierRewardReveal
      open
      tier={current.tier as QuestRank}
      points={current.points}
      loading={claim.isPending}
      onClaim={() => claim.mutate({ tier: current.tier })}
      onClose={() => setIdx((i) => i + 1)}
    />
  );
}
