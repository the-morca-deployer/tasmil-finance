"use client";

import { useSeasonsControllerMyResult, useUsersControllerGetMe } from "@/gen-quest/hooks";

type QuestProfile = {
  tier?: string;
  totalPoints?: number;
};

type SeasonResult = {
  finalRank?: number;
  percentile?: number;
};

const TIER_LABEL: Record<string, string> = {
  COHORT_4: "Bronze",
  COHORT_3: "Silver",
  COHORT_2: "Gold",
  COHORT_1: "Diamond",
  UNRANKED: "Unranked",
};

export function WalletRankInfo() {
  const me = useUsersControllerGetMe();
  const profile = (me.data?.data as QuestProfile | undefined) ?? null;
  const myResult = useSeasonsControllerMyResult();
  const result = myResult.data?.data as SeasonResult | undefined;

  if (!profile) return null;

  const tier = TIER_LABEL[profile.tier ?? "UNRANKED"] ?? "Unranked";
  const parts: string[] = [
    result?.finalRank != null ? `#${result.finalRank}` : null,
    result?.percentile != null ? `top ${result.percentile}%` : null,
    tier,
    `${(profile.totalPoints ?? 0).toLocaleString()} pts`,
  ].filter((p): p is string => p !== null);

  return (
    <div data-testid="wallet-rank-info" className="px-3 py-2 text-muted-foreground text-xs">
      {parts.join(" · ")}
    </div>
  );
}
