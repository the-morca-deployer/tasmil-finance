"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { Zap } from "lucide-react";
import { useMemo } from "react";
import type { ActivityItem } from "@/features/account/types";

export interface RewardSummaryCardProps {
  activities: ActivityItem[];
}

export function RewardSummaryCard({ activities }: RewardSummaryCardProps) {
  const summary = useMemo(() => {
    let lifetimeUsd = 0;
    const byToken = new Map<string, number>();
    let lastHarvestAt: Date | null = null;
    for (const a of activities) {
      if (a.amountUsd) lifetimeUsd += a.amountUsd;
      const ts = new Date(a.createdAt);
      if (!lastHarvestAt || ts > lastHarvestAt) lastHarvestAt = ts;
      const perPool = a.metadata?.perPool ?? [];
      for (const p of perPool) {
        byToken.set(p.token, (byToken.get(p.token) ?? 0) + p.amount);
      }
    }
    return { lifetimeUsd, byToken, lastHarvestAt };
  }, [activities]);

  const tokenChips = Array.from(summary.byToken.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
          <Zap className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Lifetime rewards (loaded)</p>
          <p className="font-semibold text-2xl text-foreground">
            $
            {summary.lifetimeUsd.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>
      {tokenChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tokenChips.map(([token, amount]) => (
            <span
              key={token}
              className="rounded-full bg-emerald-500/10 px-3 py-1 font-medium text-emerald-300 text-xs"
            >
              {amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {token}
            </span>
          ))}
        </div>
      )}
      {summary.lastHarvestAt && (
        <p className="text-muted-foreground text-xs">
          Last harvest: {formatDistanceToNowStrict(summary.lastHarvestAt)} ago
        </p>
      )}
    </div>
  );
}
