"use client";

import { $ } from "@/features/quest/lib/kubb-config";
import { rankFromPoints } from "@/features/quest/lib/tier";
import { useSeasonsControllerMyResult, useUsersControllerGetMe } from "@/gen-quest/hooks";

type QuestProfile = {
  tier?: string;
  totalPoints?: number;
};

type SeasonResult = {
  finalRank?: number;
  percentile?: number;
};

export function WalletRankInfo() {
  // `$` already unwraps the `{ success, data }` envelope → `me.data` is the profile.
  const me = useUsersControllerGetMe($);
  const profile = (me.data as QuestProfile | undefined) ?? null;
  const myResult = useSeasonsControllerMyResult();
  const result = myResult.data?.data as SeasonResult | undefined;

  if (!profile) return null;

  const tier = rankFromPoints(profile.totalPoints ?? 0).rank;
  const parts: string[] = [
    result?.finalRank != null ? `#${result.finalRank}` : null,
    result?.percentile != null ? `top ${result.percentile}%` : null,
    tier,
    `${(profile.totalPoints ?? 0).toLocaleString()} pts`,
  ].filter((p): p is string => p !== null);

  return (
    <div
      data-testid="wallet-rank-info"
      className="border-b border-border px-3 py-2 text-muted-foreground text-xs"
    >
      {parts.join(" · ")}
    </div>
  );
}
