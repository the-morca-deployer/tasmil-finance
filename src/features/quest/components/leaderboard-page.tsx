"use client";

import { Trophy } from "lucide-react";
import { useMemo } from "react";
import { useSeasonsControllerCurrent, useSeasonsControllerLeaderboard } from "@/gen-quest";
import { Skeleton } from "@/shared/ui/skeleton";
import { qAvatar } from "../lib/avatar";
import { $ } from "../lib/kubb-config";
import {
  type CurrentSeason,
  type SeasonLeaderboardEntry,
  type SeasonRankReward,
  unwrapEnvelope,
} from "../lib/season-types";
import { PtsCoin } from "./icons";
import { PrizePoolBanner } from "./prize-pool-banner";
import { SeasonPodium } from "./season-podium";

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);

const shorten = (addr: string) =>
  addr.length > 12 ? `${addr.slice(0, 4)}…${addr.slice(-4)}` : addr;

/** Sum the points across all rank-reward bands for the prize-pool figure. */
function pointsPool(rewards: SeasonRankReward[]): number {
  return rewards.reduce((acc, r) => {
    const seats = Math.max(0, r.rankTo - r.rankFrom + 1);
    return acc + r.points * seats;
  }, 0);
}

function SeasonStandings({ entries }: { entries: SeasonLeaderboardEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid grid-cols-[60px_1fr_120px] gap-4 px-6 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
        <span>Rank</span>
        <span>Player</span>
        <span className="text-right">Points</span>
      </div>
      <div className="divide-y divide-border">
        {entries.map((entry) => (
          <div
            key={entry.userId}
            data-testid={`leaderboard-row-${entry.rank}`}
            className="grid grid-cols-[60px_1fr_120px] items-center gap-4 px-6 py-3.5"
          >
            <span className="font-bold text-foreground">#{entry.rank}</span>
            <span className="flex min-w-0 items-center gap-3">
              <span
                className="block h-8 w-8 flex-none rounded-full"
                style={{ background: qAvatar(entry.walletAddress) }}
              />
              <span className="min-w-0">
                <span className="block truncate font-medium text-foreground text-sm">
                  {entry.username}
                </span>
                <span className="block truncate font-mono text-muted-foreground text-xs">
                  {shorten(entry.walletAddress)}
                </span>
              </span>
            </span>
            <span className="flex items-center justify-end gap-1 font-semibold text-foreground">
              {fmt(entry.seasonPoints)}
              <PtsCoin style={{ width: 16, height: 16 }} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LeaderboardPage() {
  const { data: currentRaw, isLoading: seasonLoading } = useSeasonsControllerCurrent($);
  const { data: boardRaw, isLoading: boardLoading } = useSeasonsControllerLeaderboard($);

  const season = useMemo(() => unwrapEnvelope<CurrentSeason>(currentRaw), [currentRaw]);
  const entries = useMemo(
    () => unwrapEnvelope<SeasonLeaderboardEntry[]>(boardRaw) ?? [],
    [boardRaw]
  );

  const isLoading = seasonLoading || boardLoading;
  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <header className="flex items-center gap-3">
        <Trophy className="h-7 w-7 text-primary" />
        <div>
          {season ? (
            <p className="font-semibold text-primary text-xs uppercase tracking-wider">
              {season.name}
            </p>
          ) : null}
          <h1 className="font-bold text-2xl text-foreground">Tasmil Quest Leaderboard</h1>
          <p className="text-muted-foreground text-sm">
            Climb the Tasmil ecosystem. Top players split the season prize pool.
          </p>
        </div>
      </header>

      {isLoading && (
        <div className="flex flex-col gap-4">
          <div className="flex gap-3">
            {[2, 1, 3].map((r) => (
              <Skeleton key={r} className="h-44 flex-1 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      )}

      {!isLoading && !season && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card py-16 text-center">
          <Trophy className="h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium text-foreground">No active season</p>
          <p className="max-w-sm text-muted-foreground text-sm">
            The next season hasn&rsquo;t started yet. Check back soon to compete for the prize pool.
          </p>
        </div>
      )}

      {!isLoading && season && (
        <>
          {podium.length > 0 && <SeasonPodium entries={podium} />}
          <PrizePoolBanner
            prizePoolUsdc={season.prizePoolUsdc}
            totalPointsPool={pointsPool(season.rankRewards)}
            endAt={season.endAt}
            playersCount={entries.length}
          />
          <SeasonStandings entries={rest} />
        </>
      )}
    </div>
  );
}
