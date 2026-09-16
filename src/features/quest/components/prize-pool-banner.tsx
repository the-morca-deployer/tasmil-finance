"use client";

import { cn } from "@/lib/utils";
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
    // .banner
    <section
      className={cn(
        "relative overflow-hidden",
        "border border-[var(--line)] rounded-quest-card",
        "bg-[linear-gradient(160deg,rgba(32,32,36,0.4),rgba(16,16,18,0.4))]",
        "mb-[50px] shadow-[0_30px_80px_-48px_#000]"
      )}
    >
      {/* .banner-grid: 3-col (1.12fr 0.66fr 1.28fr), collapses to 1 col at ≤920px */}
      <div className={cn("grid grid-cols-[1.12fr_0.66fr_1.28fr]", "max-[920px]:grid-cols-1")}>
        {/* .bn-seg.bn-prize - first segment, no left border */}
        <div
          className={cn("p-[24px_26px] flex flex-col justify-center", "items-center text-center")}
        >
          {/* .bn-prize-head */}
          <div className="flex items-center gap-[13px] mb-5">
            {/* .bn-trophy */}
            <div
              className={cn(
                "w-[50px] h-[50px] rounded-[15px] flex-none grid place-items-center",
                "bg-[linear-gradient(160deg,var(--gold-soft),transparent)]",
                "border border-[rgba(251,197,74,0.28)]",
                "text-quest-gold shadow-[0_0_26px_-8px_rgba(251,197,74,0.4)]"
              )}
            >
              <Icon.trophy width={22} height={22} />
            </div>
            <div>
              {/* .bn-lab */}
              <div
                className={cn(
                  "text-[12.5px] font-bold tracking-[0.16em] uppercase",
                  "text-[var(--dim)]"
                )}
              >
                This season&rsquo;s prize pool
              </div>
              {/* .bn-note */}
              <div className="text-[14px] text-[var(--muted)] mt-[5px]">
                <b className="text-[var(--text)] font-bold">{fmt(playersCount)}</b> players
                competing
              </div>
            </div>
          </div>

          {/* .bn-figures */}
          <div className="flex items-stretch justify-center gap-3">
            {/* .bn-fig.usdc */}
            <div
              className={cn(
                "flex flex-col items-center justify-center gap-[7px]",
                "p-[14px_20px] rounded-[16px] min-w-[128px]",
                "bg-quest-accent-soft border border-quest-accent-line"
              )}
            >
              <span
                className={cn(
                  "text-[clamp(26px,2.6vw,34px)] font-extrabold tracking-[-0.03em]",
                  "leading-none whitespace-nowrap inline-flex items-center",
                  "text-quest-accent"
                )}
              >
                {prizePoolUsdc}{" "}
                <Usdc
                  className="inline-block flex-none rounded-full"
                  style={{ width: 23, height: 23, verticalAlign: -4, marginRight: 5 }}
                />
              </span>
              <span
                className={cn(
                  "text-[10px] font-bold tracking-[0.16em] uppercase",
                  "text-[var(--dim)]"
                )}
              >
                USDC
              </span>
            </div>

            {/* .bn-fig.pts */}
            <div
              className={cn(
                "flex flex-col items-center justify-center gap-[7px]",
                "p-[14px_20px] rounded-[16px] min-w-[128px]",
                "bg-quest-accent-soft border border-quest-accent-line"
              )}
            >
              <span
                className={cn(
                  "text-[clamp(26px,2.6vw,34px)] font-extrabold tracking-[-0.03em]",
                  "leading-none whitespace-nowrap inline-flex items-center",
                  "text-quest-accent"
                )}
              >
                +{fmt(totalPointsPool)}{" "}
                <PtsCoin
                  className="inline-block flex-none"
                  style={{ width: 28, height: 28, verticalAlign: -5, marginLeft: 5 }}
                />
              </span>
              <span
                className={cn(
                  "text-[10px] font-bold tracking-[0.16em] uppercase",
                  "text-[var(--dim)]"
                )}
              >
                Points
              </span>
            </div>
          </div>
        </div>

        {/* .bn-seg.bn-time - second segment, border-left from .bn-seg+.bn-seg */}
        <div
          className={cn(
            "p-[24px_26px] flex flex-col justify-center",
            "border-l border-[var(--line)]",
            "items-center text-center",
            "max-[920px]:border-l-0 max-[920px]:border-t max-[920px]:border-[var(--line)]"
          )}
        >
          {/* .bn-count-lab */}
          <div
            className={cn(
              "text-[10.5px] font-bold tracking-[0.16em] uppercase",
              "text-[var(--dim)] inline-flex items-center gap-[7px] mb-[14px]"
            )}
          >
            <Icon.clock width={16} height={16} />
            Resets in
          </div>

          {/* .countdown */}
          <div className="flex gap-2 mt-[10px] justify-end">
            {[
              { val: cd.d, lbl: "Days" },
              { val: cd.h, lbl: "Hrs" },
              { val: cd.m, lbl: "Min" },
              { val: cd.s, lbl: "Sec" },
            ].map(({ val, lbl }) => (
              <div key={lbl} className="flex flex-col items-center gap-[5px]">
                {/* .cd-num */}
                <span
                  className={cn(
                    "font-mono text-[26px] font-bold text-quest-accent",
                    "bg-white/[0.06] border border-quest-accent-line rounded-[10px]",
                    "px-[10px] py-[6px] min-w-[50px] text-center tracking-[-0.02em]"
                  )}
                >
                  {val}
                </span>
                {/* .cd-lbl */}
                <span
                  className={cn(
                    "text-[9.5px] font-semibold tracking-[0.14em] uppercase",
                    "text-[var(--dim)]"
                  )}
                >
                  {lbl}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
