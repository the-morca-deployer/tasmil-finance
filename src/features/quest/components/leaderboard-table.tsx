"use client";

import { cn } from "@/lib/utils";
import { TIER_STYLES, tierFromVolume } from "../lib/tier";
import type { CurrentUserRank, LeaderboardEntry } from "../hooks/use-leaderboard";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserWallet?: string;
  currentUserRank?: CurrentUserRank | null;
}

function shorten(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function LeaderboardTable({
  entries,
  currentUserWallet,
  currentUserRank,
}: LeaderboardTableProps) {
  const hasUserOnPage = currentUserWallet
    ? entries.some((e) => e.walletAddress === currentUserWallet)
    : false;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid grid-cols-[60px_1fr_1fr_120px] gap-4 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <span>Rank</span>
        <span>Wallet</span>
        <span>Volume</span>
        <span>Tier</span>
      </div>
      <div className="divide-y divide-border">
        {entries.map((entry) => {
          const isCurrentUser = entry.walletAddress === currentUserWallet;
          const tier = tierFromVolume(entry.volumeUsd);
          const tierStyle = TIER_STYLES[tier];
          return (
            <div
              key={entry.walletAddress}
              data-testid={`leaderboard-row-${entry.rank}`}
              data-current-user={isCurrentUser ? "true" : "false"}
              className={cn(
                "grid grid-cols-[60px_1fr_1fr_120px] items-center gap-4 px-6 py-3.5",
                isCurrentUser && "bg-primary/5 ring-1 ring-inset ring-primary/30",
              )}
            >
              <span className="font-bold text-foreground">#{entry.rank}</span>
              <span className="truncate font-mono text-sm text-foreground" title={entry.walletAddress}>
                {shorten(entry.walletAddress)}
              </span>
              <span className="font-semibold text-foreground">{formatUsd(entry.volumeUsd)}</span>
              <span
                className={cn(
                  "inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-semibold",
                  tierStyle.bg,
                  tierStyle.text,
                )}
              >
                {tierStyle.label}
              </span>
            </div>
          );
        })}

        {currentUserRank && currentUserWallet && !hasUserOnPage && (
          <div
            className="grid grid-cols-[60px_1fr_1fr_120px] items-center gap-4 border-t-2 border-dashed border-primary/30 bg-primary/5 px-6 py-3.5"
            data-testid="leaderboard-tail-row"
          >
            <span className="font-bold text-foreground">#{currentUserRank.rank}</span>
            <span className="truncate font-mono text-sm text-foreground">
              {shorten(currentUserWallet)}{" "}
              <span className="text-xs text-muted-foreground">(you)</span>
            </span>
            <span className="font-semibold text-foreground">
              {formatUsd(currentUserRank.volumeUsd)}
            </span>
            <span className="text-xs text-muted-foreground">—</span>
          </div>
        )}
      </div>
    </div>
  );
}
