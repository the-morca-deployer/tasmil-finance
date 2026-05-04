"use client";

import { ChevronDown, Clock } from "lucide-react";
import { useState } from "react";
import type { ActivityItem, PerPoolReward } from "@/features/account/types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";
import { useAccountActivityInfinite } from "../hooks/use-account-activity-infinite";
import { ActivityRow } from "./activity-row";
import { RewardSummaryCard } from "./reward-summary-card";

export interface RewardHistoryViewProps {
  walletAddress: string;
}

export function RewardHistoryView({ walletAddress }: RewardHistoryViewProps) {
  const { activities, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, error } =
    useAccountActivityInfinite(walletAddress, "reward");

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm">
        Could not load rewards: {error.message}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <RewardSummaryCard activities={activities} />

      {activities.length === 0 ? (
        <EmptyRewards />
      ) : (
        <div className="flex flex-col gap-2">
          {activities.map((a) => (
            <HarvestRow key={a.id} activity={a} />
          ))}
        </div>
      )}

      {hasNextPage && (
        <button
          type="button"
          onClick={fetchNextPage}
          disabled={isFetchingNextPage}
          className="self-center rounded-full border border-border bg-card px-4 py-1.5 font-medium text-muted-foreground text-xs hover:bg-muted/30 disabled:opacity-50"
        >
          {isFetchingNextPage ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}

function HarvestRow({ activity }: { activity: ActivityItem }) {
  const [open, setOpen] = useState(false);
  const perPool = activity.metadata?.perPool ?? [];
  const hasBreakdown = perPool.length > 0;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <ActivityRow activity={activity} />
      {hasBreakdown && (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Harvest details"
            aria-expanded={open}
            className="flex w-full items-center justify-center gap-1 border-border border-t px-3 py-1.5 text-muted-foreground text-xs hover:bg-muted/30"
          >
            <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
            {open
              ? "Hide breakdown"
              : `Show ${perPool.length} pool${perPool.length === 1 ? "" : "s"}`}
          </button>
          {open && <PerPoolTable rows={perPool} />}
        </>
      )}
    </div>
  );
}

function PerPoolTable({ rows }: { rows: PerPoolReward[] }) {
  return (
    <div className="border-border border-t">
      {rows.map((r, i) => (
        <div
          key={`${r.poolId}-${i}`}
          className="flex items-center justify-between px-5 py-2 text-muted-foreground text-xs"
        >
          <span className="capitalize">{r.protocol}</span>
          <span className="text-emerald-400">
            +{r.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {r.token}
            {r.amountUsd != null && (
              <span className="ml-2 text-muted-foreground">
                ($
                {r.amountUsd.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
                )
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

function EmptyRewards() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-12 text-muted-foreground">
      <Clock className="h-8 w-8 opacity-40" />
      <p className="text-sm">No rewards harvested yet — auto-harvest runs every 4 h.</p>
    </div>
  );
}
