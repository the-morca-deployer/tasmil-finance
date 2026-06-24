"use client";

import { Clock, Trophy, Users, Zap } from "lucide-react";
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

interface AnalyticsUser {
  username?: string; walletAddress?: string; totalPoints?: number; loginStreak?: number;
}
interface AnalyticsEnvelope { data?: AnalyticsUser[]; }

function shortAddr(a?: string) {
  if (!a) return "";
  return a.length <= 10 ? a : `${a.slice(0, 4)}...${a.slice(-4)}`;
}

// ── Prize Banner ──

function Banner({ season, myResult, cd }: {
  season: CurrentSeason; myResult: SeasonMeResult | null; cd: ReturnType<typeof useSeasonCountdown>;
}) {
  const ptsPool = (season.rankRewards ?? []).reduce((s: number, r: { points: number }) => s + r.points, 0);
  return (
    <Rise delay={0.05}>
      <div className="banner" style={{ marginBottom: 20 }}>
        <div className="banner-grid">
          <div className="bn-seg bn-prize">
            <div className="bn-prize-head">
              <div className="bn-trophy"><Trophy size={25} /></div>
              <div><div className="bn-lab">Prize Pool</div><div className="bn-note">Top <b>10</b> split the pool</div></div>
            </div>
            <div className="bn-figures">
              <div className="bn-fig usdc"><span className="v">{season.prizePoolUsdc}</span><span className="k">USDC</span></div>
              <div className="bn-fig pts"><span className="v">{ptsPool.toLocaleString()}</span><span className="k">PTS</span></div>
            </div>
            {myResult ? <div className="bn-note" style={{ marginTop: 14 }}>Your position <b>#{myResult.finalRank}</b></div> : null}
          </div>
          <div className="bn-seg bn-time">
            <div className="bn-count-lab"><Clock size={14} />Resets in</div>
            <div className="countdown" style={{ justifyContent: "center", marginTop: 0 }}>
              <div className="cd-unit"><span className="cd-num">{cd.d}</span><span className="cd-lbl">Days</span></div>
              <div className="cd-unit"><span className="cd-num">{cd.h}</span><span className="cd-lbl">Hrs</span></div>
              <div className="cd-unit"><span className="cd-num">{cd.m}</span><span className="cd-lbl">Min</span></div>
              <div className="cd-unit"><span className="cd-num">{cd.s}</span><span className="cd-lbl">Sec</span></div>
            </div>
          </div>
          <div className="bn-seg bn-action">
            <div className="bn-status-eye">
              <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 10px var(--green)", animation: "quest-pulse 2s infinite", marginRight: 8 }} />
              Live
            </div>
            <div className="bn-action-big" style={{ marginTop: 12 }}><b>{season.name}</b><span>in progress</span></div>
            <div className="bn-action-sub" style={{ marginTop: 8 }}><b>{myResult?.finalPoints?.toLocaleString() ?? "0"}</b> points earned</div>
          </div>
        </div>
      </div>
    </Rise>
  );
}

// ── Main ──

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
      rank: i + 1,
      name: u.username || shortAddr(u.walletAddress),
      address: u.walletAddress ?? "",
      score: metric === "points" ? (u.totalPoints ?? 0) : (u.loginStreak ?? 0),
      rankMove: 0,
    }));
  }, [currentRaw, metric]);

  const podiumRows = rows.slice(0, 3).map((r) => ({ rank: r.rank, name: r.name, address: r.address, score: r.score }));

  const prizeRanks = useMemo(() => {
    const rewards = season?.rankRewards ?? [];
    return [4, 5, 6, 7, 8, 9, 10].map((rank) => {
      const rw = rewards.find((r) => r.rankFrom <= rank && r.rankTo >= rank);
      return { rank, usdc: rw?.usdc ?? "0", points: rw?.points ?? 0 };
    });
  }, [season]);

  return (
    <div>
      <Rise>
        <header className="page-head">
          <div className="eyebrow">{season?.name ?? "June 2026 Season"}</div>
          <h1 className="page-title"><span>Leaderboard</span></h1>
          <p className="page-sub">Climb the Tasmil ecosystem. Top 10 split the monthly prize pool.</p>
        </header>
      </Rise>

      {season && <Banner season={season} myResult={myResult} cd={cd} />}

      <Rise delay={0.12}>
        <div className="board-grid">
          <div>
            <div className="panel">
              <div className="panel-head">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Users size={16} style={{ color: "var(--muted)" }} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{metric === "points" ? "Points" : "Streak"} Leaderboard</span>
                </div>
                <div className="segmented">
                  <button type="button" className={metric === "points" ? "active" : ""} onClick={() => setMetric("points")}>Points</button>
                  <button type="button" className={metric === "streak" ? "active" : ""} onClick={() => setMetric("streak")}>Streak</button>
                </div>
              </div>

              {rows.length === 0 ? (
                <div style={{ padding: 48, textAlign: "center", color: "var(--muted)", fontSize: 14 }}>Loading...</div>
              ) : (
                <>
                  <div className="podium-wrap">
                    <Podium rows={podiumRows} metric={metric} />
                  </div>
                  <div style={{ borderTop: "1px solid var(--line)" }}>
                    {rows.slice(3).map((r) => (
                      <LeaderboardRow key={r.address || r.rank} rank={r.rank} name={r.name} address={r.address} score={r.score} rankMove={r.rankMove} metric={metric} top10={r.rank <= 10} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="side">
            <div className="side-card">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <Clock size={15} style={{ color: "var(--accent)" }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>Season ends in</span>
              </div>
              <div className="countdown" style={{ justifyContent: "flex-start", marginTop: 0 }}>
                <div className="cd-unit"><span className="cd-num">{cd.d}</span><span className="cd-lbl">D</span></div>
                <div className="cd-unit"><span className="cd-num">{cd.h}</span><span className="cd-lbl">H</span></div>
                <div className="cd-unit"><span className="cd-num">{cd.m}</span><span className="cd-lbl">M</span></div>
                <div className="cd-unit"><span className="cd-num">{cd.s}</span><span className="cd-lbl">S</span></div>
              </div>
            </div>
            <div className="side-card">
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: "var(--muted)" }}>
                <Zap size={14} style={{ display: "inline", verticalAlign: -3, marginRight: 6, color: "var(--accent)" }} />
                Prize Breakdown
              </div>
              {prizeRanks.map((p) => (
                <div key={p.rank} className={`prize-card${p.rank === 4 ? " p1" : ""}`}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 700, color: "var(--accent)", minWidth: 28 }}>#{p.rank}</span>
                  <span style={{ flex: 1, fontSize: 13, color: "var(--muted)" }}>
                    {p.usdc !== "0" ? `${p.usdc} USDC` : ""}{p.usdc !== "0" && p.points > 0 ? " + " : ""}{p.points > 0 ? `${p.points.toLocaleString()} PTS` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Rise>
    </div>
  );
}
