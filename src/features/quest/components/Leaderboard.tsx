"use client";

import { useMemo, useState } from "react";
import { LeaderboardRow } from "@/features/quest/components/LeaderboardRow";
import { Podium } from "@/features/quest/components/Podium";
import { Rise } from "@/features/quest/components/Rise";
import { Tabs, TabsList, TabsTrigger } from "@/features/quest/components/ui/tabs";
import { useSeasonCountdown } from "@/features/quest/hooks/use-season-countdown";
import { $ } from "@/features/quest/lib/kubb-config";
import {
  type CurrentSeason,
  type SeasonMeResult,
  unwrapEnvelope,
} from "@/features/quest/lib/season-types";
import {
  useAnalyticsControllerGlobalLeaderboard,
  useAnalyticsControllerStreakLeaderboard,
  useSeasonsControllerCurrent,
  useSeasonsControllerMyResult,
} from "@/gen-quest/hooks";

// ── narrow interfaces for the analytics endpoints (typed as `any` in gen-quest) ──

interface AnalyticsUser {
  username?: string;
  walletAddress?: string;
  totalPoints?: number;
  loginStreak?: number;
}

interface AnalyticsEnvelope {
  data?: AnalyticsUser[];
}

// ─────────────────────────────────────────────────────────────────────────────

function shortAddr(a?: string) {
  if (!a) return "";
  return a.length <= 10 ? a : `${a.slice(0, 4)}...${a.slice(-4)}`;
}

// ── Season panel sub-component ────────────────────────────────────────────────

interface SeasonPanelProps {
  season: CurrentSeason;
  myResult: SeasonMeResult | null;
}

function SeasonPanel({ season, myResult }: SeasonPanelProps) {
  const cd = useSeasonCountdown(season.endAt);
  return (
    <Rise delay={0.05}>
      <div className="season-panel">
        <div className="sp-prize">
          <div className="sp-prize-label">Prize Pool</div>
          <div className="sp-prize-value">
            <span className="sp-usdc">{season.prizePoolUsdc}</span>
            <span className="sp-usdc-label">USDC</span>
          </div>
          {myResult ? <div className="sp-pos">Your position #{myResult.finalRank}</div> : null}
        </div>
        <div className="sp-countdown">
          <div className="sp-cd-label">Resets in</div>
          <div className="sp-cd-units">
            <div className="sp-cd-unit">
              <span className="sp-cd-num">{cd.d}</span>
              <span className="sp-cd-lbl">Days</span>
            </div>
            <div className="sp-cd-unit">
              <span className="sp-cd-num">{cd.h}</span>
              <span className="sp-cd-lbl">Hrs</span>
            </div>
            <div className="sp-cd-unit">
              <span className="sp-cd-num">{cd.m}</span>
              <span className="sp-cd-lbl">Min</span>
            </div>
            <div className="sp-cd-unit">
              <span className="sp-cd-num">{cd.s}</span>
              <span className="sp-cd-lbl">Sec</span>
            </div>
          </div>
        </div>
      </div>
    </Rise>
  );
}

// ── Main Leaderboard ──────────────────────────────────────────────────────────

export default function Leaderboard() {
  const [metric, setMetric] = useState<"points" | "streak">("points");

  const { data: globalRaw, isLoading: isLoadingGlobal } = useAnalyticsControllerGlobalLeaderboard({
    ...$,
    query: {
      ...$.query,
      enabled: metric === "points",
    },
  });

  const { data: streakRaw, isLoading: isLoadingStreak } = useAnalyticsControllerStreakLeaderboard({
    ...$,
    query: {
      ...$.query,
      enabled: metric === "streak",
    },
  });

  const { data: seasonRaw } = useSeasonsControllerCurrent($);
  const { data: myResultRaw } = useSeasonsControllerMyResult($);

  const season = useMemo(() => unwrapEnvelope<CurrentSeason>(seasonRaw), [seasonRaw]);
  const myResult = useMemo(() => unwrapEnvelope<SeasonMeResult>(myResultRaw), [myResultRaw]);

  const isLoading = metric === "points" ? isLoadingGlobal : isLoadingStreak;
  const currentRaw = metric === "points" ? globalRaw : streakRaw;

  const rows = useMemo(() => {
    const envelope = currentRaw as AnalyticsEnvelope | undefined;
    const arr: AnalyticsUser[] = Array.isArray(envelope?.data)
      ? (envelope.data as AnalyticsUser[])
      : [];
    return arr.map((u, i) => ({
      rank: i + 1,
      name: u.username || shortAddr(u.walletAddress),
      address: u.walletAddress ?? "",
      score: metric === "points" ? (u.totalPoints ?? 0) : (u.loginStreak ?? 0),
      rankMove: 0,
    }));
  }, [currentRaw, metric]);

  const podiumRows = useMemo(
    () =>
      rows.slice(0, 3).map((r) => ({
        rank: r.rank,
        name: r.name,
        address: r.address,
        score: r.score,
      })),
    [rows]
  );

  return (
    <div>
      <Rise>
        <header className="page-head">
          <div className="eyebrow">{season?.name ?? "June 2026"}</div>
          <h1 className="page-title">Leaderboard</h1>
          <p className="page-sub">
            Climb the Tasmil ecosystem. Top 10 split the monthly prize pool.
          </p>
        </header>
      </Rise>

      {season && <SeasonPanel season={season} myResult={myResult} />}

      <Rise delay={0.1}>
        <Tabs
          value={metric}
          onValueChange={(v) => setMetric(v as "points" | "streak")}
          className="mt-8"
        >
          <TabsList>
            <TabsTrigger value="points">Points</TabsTrigger>
            <TabsTrigger value="streak">Streak</TabsTrigger>
          </TabsList>
        </Tabs>
      </Rise>

      {isLoading ? (
        <Rise delay={0.15}>
          <div
            className="mt-10 flex justify-center items-center py-24 text-sm"
            style={{ color: "var(--muted)" }}
          >
            Loading...
          </div>
        </Rise>
      ) : (
        <>
          {podiumRows.length >= 3 && (
            <Rise delay={0.15}>
              <div className="podium-wrap mt-10">
                <Podium rows={podiumRows} metric={metric} />
              </div>
            </Rise>
          )}

          <Rise delay={0.2}>
            <div className="rows mt-10">
              {rows.length === 0 ? (
                <p className="text-sm py-12 text-center" style={{ color: "var(--muted)" }}>
                  No leaderboard data available
                </p>
              ) : (
                rows.map((r) => (
                  <LeaderboardRow
                    key={r.address || r.rank}
                    rank={r.rank}
                    name={r.name}
                    address={r.address}
                    score={r.score}
                    rankMove={r.rankMove}
                    metric={metric}
                    top10={r.rank <= 10}
                  />
                ))
              )}
            </div>
          </Rise>
        </>
      )}
    </div>
  );
}
