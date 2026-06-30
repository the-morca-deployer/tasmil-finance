"use client";

import { $ } from "@/features/quest/lib/kubb-config";
import { RANK_STYLES, rankFromPoints } from "@/features/quest/lib/tier";
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
  const style = RANK_STYLES[tier];
  const seasonParts: string[] = [
    result?.finalRank != null ? `#${result.finalRank}` : null,
    result?.percentile != null ? `top ${result.percentile}%` : null,
  ].filter((p): p is string => p !== null);

  return (
    <div
      data-testid="wallet-rank-info"
      className="flex items-center gap-2 border-b border-border px-3 py-2 text-muted-foreground text-xs"
    >
      <img
        src={style.asset}
        alt={style.label}
        width={18}
        height={18}
        className="flex-none object-contain [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.4))]"
      />
      <span>
        {seasonParts.length > 0 ? `${seasonParts.join(" · ")} · ` : ""}
        {style.label} · {(profile.totalPoints ?? 0).toLocaleString()} pts
      </span>
    </div>
  );
}
