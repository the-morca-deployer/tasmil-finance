"use client";

import { useEffect, useRef } from "react";
import { Icon } from "./icons";

type Tier = "gold" | "silver" | "bronze" | "aqua";

const fmt = (n: number) => n.toLocaleString("en-US");

const CROWN: Record<Tier, string> = {
  gold: "/ranks/golden.png",
  silver: "/ranks/silver.png",
  bronze: "/ranks/bronze.png",
  aqua: "/ranks/aqua-crown.png",
};

const HEADLINE: Record<Tier, string> = {
  gold: "champion",
  silver: "podium",
  bronze: "podium",
  aqua: "top 10",
};

function tierFor(badge: string | undefined, rank: number): Tier {
  const b = (badge ?? "").toLowerCase();
  if (b === "gold" || b === "silver" || b === "bronze" || b === "aqua") return b;
  if (rank === 1) return "gold";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
  return "aqua";
}

export interface RankRevealProps {
  rank: number;
  usdcReward: string;
  pointsReward: number;
  badge?: string;
  seasonName: string;
  onClaim: () => void;
  onClose?: () => void;
}

/** Animated season rank/reward reveal overlay, driven entirely by props. */
export function RankReveal({
  rank,
  usdcReward,
  pointsReward,
  badge,
  seasonName,
  onClaim,
  onClose,
}: RankRevealProps) {
  const tier = tierFor(badge, rank);
  const hasUsdc = Number(usdcReward) > 0;
  const cardRef = useRef<HTMLDivElement>(null);

  // Card entrance (no-op under jsdom; just a class toggle).
  useEffect(() => {
    const t = setTimeout(() => cardRef.current?.classList.add("in"), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="rank-reveal">
      <div className="stage">
        <div className={`card t-${tier}`} ref={cardRef}>
          {onClose && (
            <button type="button" className="card-close" onClick={onClose} aria-label="Close">
              <Icon.close width={17} height={17} />
            </button>
          )}

          <div className={`reveal t-${tier}`}>
            <div className="reveal-glow" />
            <div className="reveal-crown">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={CROWN[tier]} alt="" />
            </div>
            <div className="plinth">
              <span className="plinth-num">#{rank}</span>
            </div>
          </div>

          <div className="reveal-out in">
            <div className="eyebrow">{seasonName} Season</div>
            <h2 className="title">
              You finished <span className="grad">{HEADLINE[tier]}</span>
            </h2>
            <p className="sub">Here is everything you have earned this season.</p>
          </div>

          <div className="divider" />

          <div className="checklist">
            {hasUsdc && (
              <div className="ci in">
                <span className="tick">
                  <Icon.check width={15} height={15} />
                </span>
                <span>
                  <b>{usdcReward} USDC</b> sent to your wallet
                </span>
              </div>
            )}
            <div className="ci in">
              <span className="tick">
                <Icon.check width={15} height={15} />
              </span>
              <span>
                <b>+{fmt(pointsReward)} PTS</b> added to your balance
              </span>
            </div>
            <div className="ci in">
              <span className="tick">
                <Icon.check width={15} height={15} />
              </span>
              <span>Season badge unlocked</span>
            </div>
          </div>

          <button type="button" className="btn in" onClick={onClaim}>
            <span>{hasUsdc ? "Claim my reward" : "Claim my points"}</span>
            <span className="arr">
              <Icon.arrow width={18} height={18} />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
