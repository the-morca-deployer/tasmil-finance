"use client";

import { Clock } from "lucide-react";
import { useMemo, useState } from "react";
import FomoBanner from "@/features/quest/components/FomoBanner";
import { LeaderboardRow } from "@/features/quest/components/LeaderboardRow";
import { Podium } from "@/features/quest/components/Podium";
import { Rise } from "@/features/quest/components/Rise";
import { buttonClasses } from "@/features/quest/components/ui/button";
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
import { cn } from "@/lib/utils";
import CountUp from "@/shared/ui/count-up";

const PtsCoin = ({
  className = "inline-block flex-none w-[15px] h-[15px]",
}: {
  className?: string;
}) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
    <linearGradient id="ptsGrad" x1="0.15" y1="0.1" x2="0.85" y2="0.9">
      <stop stopColor="#A5F3FC" />
      <stop offset="1" stopColor="#0EA5E9" />
    </linearGradient>
    <circle cx="12" cy="12" r="9" fill="url(#ptsGrad)" />
    <path d="M12.7 6.4l-4.3 6.05h2.9l-.9 4.45 4.4-6.2h-3z" fill="#04141A" />
  </svg>
);

interface AnalyticsUser {
  username?: string;
  walletAddress?: string;
  totalPoints?: number;
  loginStreak?: number;
}

function shortAddr(a?: string) {
  if (!a) return "";
  return a.length <= 10 ? a : `${a.slice(0, 4)}...${a.slice(-4)}`;
}

export default function Leaderboard() {
  const [metric, setMetric] = useState<"points" | "streak">("points");

  const { data: globalRaw } = useAnalyticsControllerGlobalLeaderboard({
    ...$,
    query: { ...$.query, enabled: metric === "points" },
  });
  const { data: streakRaw } = useAnalyticsControllerStreakLeaderboard({
    ...$,
    query: { ...$.query, enabled: metric === "streak" },
  });
  const { data: seasonRaw } = useSeasonsControllerCurrent($);
  const { data: myResultRaw } = useSeasonsControllerMyResult($);

  const season = useMemo(() => unwrapEnvelope<CurrentSeason>(seasonRaw), [seasonRaw]);
  const myResult = useMemo(() => unwrapEnvelope<SeasonMeResult>(myResultRaw), [myResultRaw]);
  const cd = useSeasonCountdown(season?.endAt ?? new Date().toISOString());

  const currentRaw = metric === "points" ? globalRaw : streakRaw;
  const rows = useMemo(() => {
    // The client interceptor unwraps `{ success, data }`, so the real backend
    // arrives as the bare array; mocks arrive as `{ data: [...] }`. Handle both.
    const arr = unwrapEnvelope<AnalyticsUser[]>(currentRaw) ?? [];
    return (Array.isArray(arr) ? arr : []).map((u: AnalyticsUser, i: number) => ({
      rank: i + 1,
      name: u.username || shortAddr(u.walletAddress),
      address: u.walletAddress ?? "",
      score: metric === "points" ? (u.totalPoints ?? 0) : (u.loginStreak ?? 0),
      rankMove: 0,
    }));
  }, [currentRaw, metric]);
  const podiumRows = rows
    .slice(0, 3)
    .map((r) => ({ rank: r.rank, name: r.name, address: r.address, score: r.score }));
  const ptsPool = (season?.rankRewards ?? []).reduce(
    (s: number, r: { points: number }) => s + r.points,
    0
  );

  return (
    <div>
      <FomoBanner />
      <Rise>
        {/* page-head */}
        <header className="text-center mb-[40px]">
          {/* page-eyebrow */}
          <div className="text-[12px] font-semibold tracking-[0.24em] uppercase text-quest-accent inline-flex items-center gap-[10px] mb-[14px]">
            June 2026
          </div>
          {/* page-title */}
          <h1 className="text-[clamp(38px,5.5vw,64px)] font-extrabold tracking-[-0.04em] leading-none">
            <span
              style={{
                background: "var(--grad)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Leaderboard
            </span>
          </h1>
          {/* page-sub */}
          <p className="mt-[14px] text-[16px] text-quest-muted">
            Climb the Tasmil ecosystem. Top 10 split the monthly prize pool.
          </p>
        </header>
      </Rise>

      {/* PODIUM */}
      {/* podium-wrap outer — the Podium component renders its own podium-wrap */}
      <div className="relative">
        <div
          className="absolute top-[-330px] left-1/2 -translate-x-1/2 w-screen h-[1020px] pointer-events-none z-0 overflow-visible"
          aria-hidden="true"
        />
        <Podium rows={podiumRows} metric={metric} />
      </div>

      {/* BANNER */}
      <Rise delay={0.05}>
        {/* banner */}
        <section className="relative overflow-hidden border border-quest-line rounded-quest-card [background:linear-gradient(160deg,rgba(32,32,36,0.4),rgba(16,16,18,0.4))] mb-[50px] [box-shadow:0_30px_80px_-48px_#000]">
          {/* banner-grid */}
          <div className="grid [grid-template-columns:1.12fr_0.66fr_1.28fr]">
            {/* bn-seg bn-prize */}
            <div className="px-[26px] py-[24px] flex flex-col justify-center items-center text-center">
              {/* bn-prize-head */}
              <div className="flex items-center gap-[13px] mb-[20px]">
                {/* bn-trophy */}
                <div className="w-[50px] h-[50px] rounded-[15px] flex-none grid place-items-center [background:linear-gradient(160deg,var(--color-quest-gold-soft),transparent)] border border-[rgba(251,197,74,0.28)] text-quest-gold [box-shadow:0_0_26px_-8px_rgba(251,197,74,0.4)]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    width="25"
                    height="25"
                  >
                    <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
                    <path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" />
                    <path d="M12 14v3M9 21h6M10 21l.5-4h3l.5 4" />
                  </svg>
                </div>
                <div>
                  {/* bn-lab */}
                  <div className="text-[12.5px] font-bold tracking-[0.16em] uppercase text-quest-dim">
                    This month's prize pool
                  </div>
                  {/* bn-note */}
                  <div className="text-[14px] text-quest-muted mt-[5px]">
                    <b className="text-quest-text font-bold">{rows.length}</b> players competing
                  </div>
                </div>
              </div>
              {/* bn-figures */}
              <div className="flex items-stretch justify-center gap-[12px] max-[440px]:flex-col">
                {/* bn-fig usdc */}
                <div className="flex items-center gap-[13px] py-[13px] px-[18px] rounded-[16px] bg-quest-accent-soft border border-quest-accent-line min-w-[150px] text-left">
                  <img
                    src="/token/usdc.png"
                    alt=""
                    className="w-[40px] h-[40px] rounded-full flex-none"
                  />
                  <span className="flex flex-col">
                    <span className="text-[clamp(24px,2.4vw,32px)] font-extrabold tracking-[-0.03em] leading-none text-quest-accent">
                      <CountUp value={Number(season?.prizePoolUsdc ?? 80)} duration={1.6} />
                    </span>
                    <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-quest-dim mt-[3px]">
                      USDC
                    </span>
                  </span>
                </div>
                {/* bn-fig pts */}
                <div className="flex items-center gap-[13px] py-[13px] px-[18px] rounded-[16px] bg-quest-accent-soft border border-quest-accent-line min-w-[150px] text-left">
                  <PtsCoin className="w-[40px] h-[40px] flex-none" />
                  <span className="flex flex-col">
                    <span className="text-[clamp(24px,2.4vw,32px)] font-extrabold tracking-[-0.03em] leading-none text-quest-accent">
                      <CountUp value={ptsPool} duration={1.6} />
                    </span>
                    <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-quest-dim mt-[3px]">
                      Points
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* bn-seg bn-time */}
            <div className="px-[26px] py-[24px] flex flex-col justify-center items-center text-center border-l border-quest-line">
              {/* bn-count-lab */}
              <div className="text-[10.5px] font-bold tracking-[0.16em] uppercase text-quest-dim inline-flex items-center gap-[7px] mb-[14px]">
                <Clock size={14} />
                Resets in
              </div>
              {/* countdown */}
              <div className="flex gap-[10px] justify-center">
                <div className="flex flex-col items-center gap-[5px]">
                  <span className="font-mono text-[26px] font-bold text-quest-accent bg-[rgba(255,255,255,0.06)] border border-quest-accent-line rounded-[10px] py-[6px] px-[10px] min-w-[50px] text-center tracking-[-0.02em]">
                    {String(cd.d).padStart(2, "0")}
                  </span>
                  <span className="text-[9.5px] font-semibold tracking-[0.14em] uppercase text-quest-dim">
                    Days
                  </span>
                </div>
                <div className="flex flex-col items-center gap-[5px]">
                  <span className="font-mono text-[26px] font-bold text-quest-accent bg-[rgba(255,255,255,0.06)] border border-quest-accent-line rounded-[10px] py-[6px] px-[10px] min-w-[50px] text-center tracking-[-0.02em]">
                    {String(cd.h).padStart(2, "0")}
                  </span>
                  <span className="text-[9.5px] font-semibold tracking-[0.14em] uppercase text-quest-dim">
                    Hrs
                  </span>
                </div>
                <div className="flex flex-col items-center gap-[5px]">
                  <span className="font-mono text-[26px] font-bold text-quest-accent bg-[rgba(255,255,255,0.06)] border border-quest-accent-line rounded-[10px] py-[6px] px-[10px] min-w-[50px] text-center tracking-[-0.02em]">
                    {String(cd.m).padStart(2, "0")}
                  </span>
                  <span className="text-[9.5px] font-semibold tracking-[0.14em] uppercase text-quest-dim">
                    Min
                  </span>
                </div>
                <div className="flex flex-col items-center gap-[5px]">
                  <span className="font-mono text-[26px] font-bold text-quest-accent bg-[rgba(255,255,255,0.06)] border border-quest-accent-line rounded-[10px] py-[6px] px-[10px] min-w-[50px] text-center tracking-[-0.02em]">
                    {String(cd.s).padStart(2, "0")}
                  </span>
                  <span className="text-[9.5px] font-semibold tracking-[0.14em] uppercase text-quest-dim">
                    Sec
                  </span>
                </div>
              </div>
            </div>

            {/* bn-seg bn-action */}
            <div className="px-[26px] py-[24px] flex flex-col justify-center gap-[10px] border-l border-quest-line [background:linear-gradient(160deg,var(--color-quest-accent-soft),transparent_88%)]">
              {/* bn-status-eye */}
              <div className="inline-flex items-center gap-[8px] text-[11px] font-bold tracking-[0.13em] uppercase text-quest-accent">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  width="15"
                  height="15"
                >
                  <path d="M12 21s-7-4.5-7-10a7 7 0 0 1 14 0c0 5.5-7 10-7 10Z" />
                  <circle cx="12" cy="11" r="2.5" />
                </svg>
                Your Position
              </div>
              {/* bn-action-big */}
              <div className="flex items-baseline gap-[9px] flex-wrap mt-[12px]">
                <b className="text-[28px] font-extrabold tracking-[-0.03em] text-quest-accent leading-none whitespace-nowrap">
                  {myResult ? `#${myResult.finalRank}` : "--"}
                </b>
                <span className="text-[13px] text-quest-muted whitespace-nowrap">current rank</span>
              </div>
              {/* bn-action-sub */}
              <div className="text-[13px] text-quest-muted leading-[1.5] mt-[8px]">
                <b className="text-quest-text font-bold">
                  {myResult?.finalPoints?.toLocaleString() ?? "0"}
                </b>{" "}
                points earned this season
              </div>
              <a
                className={buttonClasses({
                  variant: "primary",
                  block: true,
                  className: "justify-center mt-[6px]",
                })}
                href="/quest/campaigns"
              >
                Earn Points now{" "}
                <span
                  className="inline-flex transition-transform duration-[350ms] ease-quest group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h13M13 6l6 6-6 6" />
                  </svg>
                </span>
              </a>
            </div>
          </div>
        </section>
      </Rise>

      {/* BOARD GRID */}
      <Rise delay={0.18}>
        {/* board-grid */}
        <div className="grid [grid-template-columns:8fr_4fr] gap-[22px] items-start max-[860px]:[grid-template-columns:1fr]">
          {/* panel */}
          <div className="border border-quest-line rounded-quest-card [background:linear-gradient(160deg,rgba(32,32,36,0.4),rgba(16,16,18,0.4))] overflow-hidden">
            {/* panel-head */}
            <div className="flex items-center justify-between px-[24px] py-[20px] border-b border-quest-line">
              {/* ttl */}
              <div className="flex items-center gap-[9px] text-[14px] font-bold tracking-[-0.01em] [&_svg]:w-[17px] [&_svg]:h-[17px] [&_svg]:text-quest-accent">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
                </svg>
                <span>{metric === "points" ? "Points" : "Streak"} Leaderboard</span>
              </div>
              <div className="inline-flex bg-quest-surface border border-quest-line-2 rounded-quest-pill p-1 gap-0.5">
                <button
                  type="button"
                  className={cn(
                    "cursor-pointer rounded-quest-pill border-none bg-transparent px-[18px] py-2 text-[13.5px] font-semibold text-quest-muted transition-[color,background] duration-[250ms] hover:text-quest-text",
                    metric === "points" && "text-[var(--accent-ink)] [background:var(--quest-grad)]"
                  )}
                  onClick={() => setMetric("points")}
                >
                  Points
                </button>
                <button
                  type="button"
                  className={cn(
                    "cursor-pointer rounded-quest-pill border-none bg-transparent px-[18px] py-2 text-[13.5px] font-semibold text-quest-muted transition-[color,background] duration-[250ms] hover:text-quest-text",
                    metric === "streak" && "text-[var(--accent-ink)] [background:var(--quest-grad)]"
                  )}
                  onClick={() => setMetric("streak")}
                >
                  Streak
                </button>
              </div>
            </div>
            {/* rows */}
            <div className="py-[6px]">
              {rows.slice(3).map((r) => (
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
              ))}
            </div>
          </div>

          {/* side */}
          <aside className="flex flex-col gap-[18px] sticky top-[84px]">
            {/* side-card */}
            <div className="border border-quest-line rounded-quest-card [background:linear-gradient(160deg,rgba(32,32,36,0.45),rgba(16,16,18,0.45))] p-[22px]">
              {/* side-title */}
              <div className="flex items-center gap-[9px] text-[14px] font-bold tracking-[-0.01em] mb-[4px] [&_svg]:w-[16px] [&_svg]:h-[16px] [&_svg]:text-quest-accent">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
                  <path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" />
                  <path d="M12 14v3M9 21h6M10 21l.5-4h3l.5 4" />
                </svg>
                Top 3 Prize Pool
              </div>
              {/* side-sub */}
              <div className="text-[12px] text-quest-dim mb-[16px]">
                USDC + Points, paid out at month end
              </div>
              {/* prize-card p1 */}
              <div className="flex items-center gap-[14px] py-[18px] px-[16px] rounded-quest-sm border border-[rgba(251,197,74,0.3)] [background:linear-gradient(120deg,var(--color-quest-gold-soft),transparent)] mb-[10px]">
                <span className="w-[36px] h-[36px] flex-none grid place-items-center">
                  <img
                    src="/ranks/golden.png"
                    alt=""
                    className="w-full h-full object-contain block"
                  />
                </span>
                <span className="text-[13px] font-bold tracking-[-0.01em] flex-1">1st Place</span>
                <span className="flex gap-[7px]">
                  <span className="text-[13px] font-bold font-mono py-[5px] px-[10px] rounded-[9px] whitespace-nowrap bg-quest-accent-soft border border-quest-accent-line text-quest-accent">
                    50
                    <img
                      src="/token/usdc.png"
                      alt=""
                      className="inline-block flex-none w-[15px] h-[15px] rounded-full"
                      style={{ verticalAlign: -3, marginLeft: 4 }}
                    />
                  </span>
                  <span className="text-[13px] font-bold font-mono py-[5px] px-[10px] rounded-[9px] whitespace-nowrap bg-quest-accent-soft border border-quest-accent-line text-quest-accent">
                    +5,000
                    <PtsCoin />
                  </span>
                </span>
              </div>
              {/* prize-card p2 */}
              <div className="flex items-center gap-[14px] py-[14px] px-[16px] rounded-quest-sm border border-[rgba(201,212,224,0.22)] bg-quest-surface mb-[10px]">
                <span className="w-[36px] h-[36px] flex-none grid place-items-center">
                  <img
                    src="/ranks/silver.png"
                    alt=""
                    className="w-full h-full object-contain block"
                  />
                </span>
                <span className="text-[13px] font-bold tracking-[-0.01em] flex-1">2nd Place</span>
                <span className="flex gap-[7px]">
                  <span className="text-[13px] font-bold font-mono py-[5px] px-[10px] rounded-[9px] whitespace-nowrap bg-quest-accent-soft border border-quest-accent-line text-quest-accent">
                    20
                    <img
                      src="/token/usdc.png"
                      alt=""
                      className="inline-block flex-none w-[15px] h-[15px] rounded-full"
                      style={{ verticalAlign: -3, marginLeft: 4 }}
                    />
                  </span>
                  <span className="text-[13px] font-bold font-mono py-[5px] px-[10px] rounded-[9px] whitespace-nowrap bg-quest-accent-soft border border-quest-accent-line text-quest-accent">
                    +3,000
                    <PtsCoin />
                  </span>
                </span>
              </div>
              {/* prize-card p3 */}
              <div className="flex items-center gap-[14px] py-[14px] px-[16px] rounded-quest-sm border border-[rgba(224,145,90,0.22)] bg-quest-surface mb-[10px]">
                <span className="w-[36px] h-[36px] flex-none grid place-items-center">
                  <img
                    src="/ranks/bronze.png"
                    alt=""
                    className="w-full h-full object-contain block"
                  />
                </span>
                <span className="text-[13px] font-bold tracking-[-0.01em] flex-1">3rd Place</span>
                <span className="flex gap-[7px]">
                  <span className="text-[13px] font-bold font-mono py-[5px] px-[10px] rounded-[9px] whitespace-nowrap bg-quest-accent-soft border border-quest-accent-line text-quest-accent">
                    10
                    <img
                      src="/token/usdc.png"
                      alt=""
                      className="inline-block flex-none w-[15px] h-[15px] rounded-full"
                      style={{ verticalAlign: -3, marginLeft: 4 }}
                    />
                  </span>
                  <span className="text-[13px] font-bold font-mono py-[5px] px-[10px] rounded-[9px] whitespace-nowrap bg-quest-accent-soft border border-quest-accent-line text-quest-accent">
                    +2,000
                    <PtsCoin />
                  </span>
                </span>
              </div>
            </div>

            {/* side-card */}
            <div className="border border-quest-line rounded-quest-card [background:linear-gradient(160deg,rgba(32,32,36,0.45),rgba(16,16,18,0.45))] p-[22px]">
              {/* side-title */}
              <div className="flex items-center gap-[9px] text-[14px] font-bold tracking-[-0.01em] mb-[4px] [&_svg]:w-[16px] [&_svg]:h-[16px] [&_svg]:text-quest-accent">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
                </svg>
                Points Rewards
              </div>
              {/* side-sub */}
              <div className="text-[12px] text-quest-dim mb-[16px]">Rank 4 → 10</div>
              {[4, 5, 6, 7, 8, 9, 10].map((r) => {
                const ptsMap: Record<number, number> = {
                  4: 1500,
                  5: 1200,
                  6: 1000,
                  7: 800,
                  8: 600,
                  9: 400,
                  10: 200,
                };
                return (
                  <div key={r} className="flex items-center gap-[10px] py-[9px] text-[13px]">
                    <span className="font-mono text-quest-muted font-semibold min-w-[32px]">
                      {r}th
                    </span>
                    <span className="flex-1 border-b border-quest-line -translate-y-[3px]" />
                    <span className="font-mono font-bold text-quest-accent">
                      +{(ptsMap[r] ?? 0).toLocaleString()} <PtsCoin />
                    </span>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      </Rise>
    </div>
  );
}
