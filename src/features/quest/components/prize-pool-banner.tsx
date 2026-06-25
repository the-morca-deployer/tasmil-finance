"use client";

import { useSeasonCountdown } from "../hooks/use-season-countdown";
import { Icon, PtsCoin, Usdc } from "./icons";

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);

interface PrizePoolBannerProps {
  prizePoolUsdc: string;
  totalPointsPool: number;
  endAt: string;
  playersCount: number;
}

/** Season prize-pool banner with USDC + points figures and a live countdown. */
export function PrizePoolBanner({
  prizePoolUsdc,
  totalPointsPool,
  endAt,
  playersCount,
}: PrizePoolBannerProps) {
  const cd = useSeasonCountdown(endAt);

  return (
    <section className="banner">
      <div className="banner-grid">
        <div className="bn-seg bn-prize">
          <div className="bn-prize-head">
            <div className="bn-trophy">
              <Icon.trophy width={22} height={22} />
            </div>
            <div>
              <div className="bn-lab">This season&rsquo;s prize pool</div>
              <div className="bn-note">
                <b>{fmt(playersCount)}</b> players competing
              </div>
            </div>
          </div>
          <div className="bn-figures">
            <div className="bn-fig usdc">
              <span className="v">
                {prizePoolUsdc} <Usdc className="inline-block flex-none rounded-full" style={{ width: 23, height: 23, verticalAlign: -4, marginRight: 5 }} />
              </span>
              <span className="k">USDC</span>
            </div>
            <div className="bn-fig pts">
              <span className="v">
                +{fmt(totalPointsPool)} <PtsCoin className="inline-block flex-none" style={{ width: 28, height: 28, verticalAlign: -5, marginLeft: 5 }} />
              </span>
              <span className="k">Points</span>
            </div>
          </div>
        </div>
        <div className="bn-seg bn-time">
          <div className="bn-count-lab">
            <Icon.clock width={16} height={16} />
            Resets in
          </div>
          <div className="countdown">
            <div className="cd-unit">
              <span className="cd-num">{cd.d}</span>
              <span className="cd-lbl">Days</span>
            </div>
            <div className="cd-unit">
              <span className="cd-num">{cd.h}</span>
              <span className="cd-lbl">Hrs</span>
            </div>
            <div className="cd-unit">
              <span className="cd-num">{cd.m}</span>
              <span className="cd-lbl">Min</span>
            </div>
            <div className="cd-unit">
              <span className="cd-num">{cd.s}</span>
              <span className="cd-lbl">Sec</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
