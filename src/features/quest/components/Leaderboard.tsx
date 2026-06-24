"use client";

import { Clock } from "lucide-react";
import { useMemo, useState } from "react";
import { LeaderboardRow } from "@/features/quest/components/LeaderboardRow";
import { Podium } from "@/features/quest/components/Podium";
import { Rise } from "@/features/quest/components/Rise";
import { useSeasonCountdown } from "@/features/quest/hooks/use-season-countdown";
import { $ } from "@/features/quest/lib/kubb-config";
import { type CurrentSeason, type SeasonMeResult, unwrapEnvelope } from "@/features/quest/lib/season-types";
import {
  useAnalyticsControllerGlobalLeaderboard,
  useAnalyticsControllerStreakLeaderboard,
  useSeasonsControllerCurrent,
  useSeasonsControllerMyResult,
} from "@/gen-quest/hooks";

const PtsCoin = ({ w = 15, h = 15 }: { w?: number; h?: number }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ display: "inline-block", verticalAlign: -3 }}>
    <linearGradient id="ptsGrad" x1="0.15" y1="0.1" x2="0.85" y2="0.9"><stop stopColor="#A5F3FC"/><stop offset="1" stopColor="#0EA5E9"/></linearGradient>
    <circle cx="12" cy="12" r="9" fill="url(#ptsGrad)"/><path d="M12.7 6.4l-4.3 6.05h2.9l-.9 4.45 4.4-6.2h-3z" fill="#04141A"/>
  </svg>
);

interface AnalyticsUser { username?: string; walletAddress?: string; totalPoints?: number; loginStreak?: number; }
interface AnalyticsEnvelope { data?: AnalyticsUser[]; }

function shortAddr(a?: string) {
  if (!a) return "";
  return a.length <= 10 ? a : `${a.slice(0, 4)}...${a.slice(-4)}`;
}

export default function Leaderboard() {
  const [metric, setMetric] = useState<"points" | "streak">("points");

  const { data: globalRaw } = useAnalyticsControllerGlobalLeaderboard({ ...$, query: { ...$.query, enabled: metric === "points" } });
  const { data: streakRaw } = useAnalyticsControllerStreakLeaderboard({ ...$, query: { ...$.query, enabled: metric === "streak" } });
  const { data: seasonRaw } = useSeasonsControllerCurrent($);
  const { data: myResultRaw } = useSeasonsControllerMyResult($);

  const season = useMemo(() => unwrapEnvelope<CurrentSeason>(seasonRaw), [seasonRaw]);
  const myResult = useMemo(() => unwrapEnvelope<SeasonMeResult>(myResultRaw), [myResultRaw]);
  const cd = useSeasonCountdown(season?.endAt ?? new Date().toISOString());

  const currentRaw = metric === "points" ? globalRaw : streakRaw;
  const rows = useMemo(() => {
    const arr = (currentRaw as AnalyticsEnvelope | undefined)?.data ?? [];
    return (Array.isArray(arr) ? arr : []).map((u: AnalyticsUser, i: number) => ({
      rank: i + 1, name: u.username || shortAddr(u.walletAddress), address: u.walletAddress ?? "",
      score: metric === "points" ? (u.totalPoints ?? 0) : (u.loginStreak ?? 0), rankMove: 0,
    }));
  }, [currentRaw, metric]);
  const podiumRows = rows.slice(0, 3).map((r) => ({ rank: r.rank, name: r.name, address: r.address, score: r.score }));
  const ptsPool = (season?.rankRewards ?? []).reduce((s: number, r: { points: number }) => s + r.points, 0);

  return (
    <div>
      <Rise>
        <header className="page-head">
          <div className="page-eyebrow">June 2026</div>
          <h1 className="page-title"><span>Leaderboard</span></h1>
          <p className="page-sub">Climb the Tasmil ecosystem. Top 10 split the monthly prize pool.</p>
        </header>
      </Rise>

      {/* PODIUM */}
      <div className="podium-wrap">
        <div className="spotlight-stage" aria-hidden="true" />
        <Podium rows={podiumRows} metric={metric} />
      </div>

      {/* BANNER */}
      <Rise delay={0.05}>
        <section className="banner">
          <div className="banner-grid">
            <div className="bn-seg bn-prize">
              <div className="bn-prize-head">
                <div className="bn-trophy">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="25" height="25">
                    <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3"/><path d="M12 14v3M9 21h6M10 21l.5-4h3l.5 4"/>
                  </svg>
                </div>
                <div>
                  <div className="bn-lab">This month's prize pool</div>
                  <div className="bn-note"><b>{rows.length}</b> players competing</div>
                </div>
              </div>
              <div className="bn-figures">
                <div className="bn-fig usdc">
                  <span className="v">80 <img src="/token/usdc.png" alt="" className="usdc-coin" /></span>
                  <span className="k">USDC</span>
                </div>
                <div className="bn-fig pts">
                  <span className="v">+{ptsPool.toLocaleString()} <PtsCoin w={28} h={28} /></span>
                  <span className="k">Points</span>
                </div>
              </div>
            </div>
            <div className="bn-seg bn-time">
              <div className="bn-count-lab"><Clock size={14} />Resets in</div>
              <div className="countdown" style={{ justifyContent: "center", marginTop: 0, gap: 10 }}>
                <div className="cd-unit"><span className="cd-num">{String(cd.d).padStart(2, "0")}</span><span className="cd-lbl">Days</span></div>
                <div className="cd-unit"><span className="cd-num">{String(cd.h).padStart(2, "0")}</span><span className="cd-lbl">Hrs</span></div>
                <div className="cd-unit"><span className="cd-num">{String(cd.m).padStart(2, "0")}</span><span className="cd-lbl">Min</span></div>
                <div className="cd-unit"><span className="cd-num">{String(cd.s).padStart(2, "0")}</span><span className="cd-lbl">Sec</span></div>
              </div>
            </div>
            <div className="bn-seg bn-action">
              <div className="bn-status-eye">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                  <path d="M12 21s-7-4.5-7-10a7 7 0 0 1 14 0c0 5.5-7 10-7 10Z"/><circle cx="12" cy="11" r="2.5"/>
                </svg>
                Your Position
              </div>
              <div className="bn-action-big" style={{ marginTop: 12 }}>
                <b>{myResult ? `#${myResult.finalRank}` : "--"}</b>
                <span>current rank</span>
              </div>
              <div className="bn-action-sub" style={{ marginTop: 8 }}>
                <b>{myResult?.finalPoints?.toLocaleString() ?? "0"}</b> points earned this season
              </div>
              <a className="btn btn-primary bn-cta" href="/quest/campaigns">
                Earn Points now <span className="arr"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h13M13 6l6 6-6 6"/></svg></span>
              </a>
            </div>
          </div>
        </section>
      </Rise>

      {/* BOARD GRID */}
      <Rise delay={0.18}>
        <div className="board-grid">
          <div className="panel">
            <div className="panel-head">
              <div className="ttl">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></svg>
                <span>{metric === "points" ? "Points" : "Streak"} Leaderboard</span>
              </div>
              <div className="segmented">
                <button type="button" className={metric === "points" ? "active" : ""} onClick={() => setMetric("points")}>Points</button>
                <button type="button" className={metric === "streak" ? "active" : ""} onClick={() => setMetric("streak")}>Streak</button>
              </div>
            </div>
            <div className="rows">
              {rows.slice(3).map((r) => (
                <LeaderboardRow key={r.address || r.rank} rank={r.rank} name={r.name} address={r.address} score={r.score} rankMove={r.rankMove} metric={metric} top10={r.rank <= 10} />
              ))}
            </div>
          </div>

          <aside className="side">
            <div className="side-card">
              <div className="side-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3"/><path d="M12 14v3M9 21h6M10 21l.5-4h3l.5 4"/></svg>
                Top 3 Prize Pool
              </div>
              <div className="side-sub">USDC + Points, paid out at month end</div>
              <div className="prize-card p1">
                <span className="prize-medal"><img src="/ranks/golden.png" alt="" /></span>
                <span className="prize-rank">1st Place</span>
                <span className="prize-badges">
                  <span className="mini-badge usdc">50<img src="/token/usdc.png" alt="" className="usdc-coin" /></span>
                  <span className="mini-badge pts">+5,000<PtsCoin w={12} h={12} /></span>
                </span>
              </div>
              <div className="prize-card p2">
                <span className="prize-medal"><img src="/ranks/silver.png" alt="" /></span>
                <span className="prize-rank">2nd Place</span>
                <span className="prize-badges">
                  <span className="mini-badge usdc">20<img src="/token/usdc.png" alt="" className="usdc-coin" /></span>
                  <span className="mini-badge pts">+3,000<PtsCoin w={12} h={12} /></span>
                </span>
              </div>
              <div className="prize-card p3">
                <span className="prize-medal"><img src="/ranks/bronze.png" alt="" /></span>
                <span className="prize-rank">3rd Place</span>
                <span className="prize-badges">
                  <span className="mini-badge usdc">10<img src="/token/usdc.png" alt="" className="usdc-coin" /></span>
                  <span className="mini-badge pts">+2,000<PtsCoin w={12} h={12} /></span>
                </span>
              </div>
            </div>

            <div className="side-card">
              <div className="side-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></svg>
                Points Rewards
              </div>
              <div className="side-sub">Rank 4 → 10</div>
              {[4, 5, 6, 7, 8, 9, 10].map((r) => {
                const ptsMap: Record<number, number> = { 4: 1500, 5: 1200, 6: 1000, 7: 800, 8: 600, 9: 400, 10: 200 };
                return (
                  <div key={r} className="pts-row">
                    <span className="rk">{r}th</span>
                    <span className="dots" />
                    <span className="amt">+{(ptsMap[r] ?? 0).toLocaleString()} <PtsCoin w={15} h={15} /></span>
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
