"use client";

import { qAvatar } from "../lib/avatar";
import type { SeasonLeaderboardEntry } from "../lib/season-types";
import { PtsCoin, Usdc } from "./icons";

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);

// Visual left-to-right order: 2nd, 1st (center), 3rd.
const DISPLAY_ORDER = [2, 1, 3] as const;
const POD_CLASS: Record<number, string> = { 1: "pod1", 2: "pod2", 3: "pod3" };

interface SeasonPodiumProps {
  entries: SeasonLeaderboardEntry[];
}

/** Top-3 season podium with crowns, points, and USDC/points prize badges. */
export function SeasonPodium({ entries }: SeasonPodiumProps) {
  const byRank = new Map<number, SeasonLeaderboardEntry>();
  for (const e of entries) byRank.set(e.rank, e);

  return (
    <div className="podium-wrap">
      <section className="podium">
        {DISPLAY_ORDER.map((rank) => {
          const u = byRank.get(rank);
          if (!u) return null;
          return (
            <div
              className={`pod ${POD_CLASS[rank]}`}
              key={rank}
              data-testid={`podium-rank-${rank}`}
            >
              <div className="pod-av-wrap">
                <span className="pod-av" style={{ background: qAvatar(u.walletAddress) }} />
              </div>
              <div className="pod-name">{u.username}</div>
              <div className="pod-score">
                {fmt(u.seasonPoints)} <PtsCoin className="pcoin" />
              </div>
              <div className="pod-prize">
                {u.usdcReward && Number(u.usdcReward) > 0 ? (
                  <span className="pp usdc">
                    {u.usdcReward} <Usdc className="usdc-coin" />
                  </span>
                ) : null}
                {u.pointsReward && u.pointsReward > 0 ? (
                  <span className="pp pts">
                    +{fmt(u.pointsReward)} <PtsCoin className="pcoin" />
                  </span>
                ) : null}
              </div>
              <div className="pod3d">
                <div className="p3-top" />
                <div className="p3-front">
                  <span className="pod-num">{rank}</span>
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
