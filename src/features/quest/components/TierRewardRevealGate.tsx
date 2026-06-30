"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { withAuth } from "@/features/quest/lib/kubb-config";
import { RANK_ORDER } from "@/features/quest/lib/tier";
import { useQuestAuthStore } from "@/features/quest/store/use-quest-auth";
import {
  tierRewardsControllerListQueryKey,
  usersControllerGetMeQueryKey,
  useTierRewardsControllerClaim,
  useTierRewardsControllerList,
} from "@/gen-quest/hooks";
import { TierRewardReveal } from "./TierRewardReveal";

interface TierRewardItem {
  tier: string;
  points: number;
  reached: boolean;
  claimed: boolean;
  claimable: boolean;
}

export function TierRewardRevealGate() {
  const isAuthenticated = useQuestAuthStore((s) => s.isAuthenticated);
  const [dismissed, setDismissed] = useState(false);
  const queryClient = useQueryClient();

  const { data } = useTierRewardsControllerList({
    ...withAuth,
    query: { enabled: isAuthenticated },
  });
  const rewards: TierRewardItem[] = Array.isArray(data)
    ? (data as TierRewardItem[])
    : ((data as { data?: TierRewardItem[] } | undefined)?.data ?? []);

  const queue = rewards
    .filter((r) => r.claimable)
    .sort((a, b) => RANK_ORDER.indexOf(a.tier as never) - RANK_ORDER.indexOf(b.tier as never));

  const claim = useTierRewardsControllerClaim({
    ...withAuth,
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: usersControllerGetMeQueryKey() });
        await queryClient.invalidateQueries({ queryKey: tierRewardsControllerListQueryKey() });
      },
    },
  });

  if (!isAuthenticated || dismissed || queue.length === 0) return null;
  const current = queue[0]!;

  return (
    <TierRewardReveal
      open
      tier={current.tier}
      points={current.points}
      claiming={claim.isPending}
      onClaim={() => claim.mutate({ tier: current.tier })}
      onClose={() => setDismissed(true)}
    />
  );
}
