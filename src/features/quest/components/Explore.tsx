"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { CampaignCard, type CampaignCardData } from "@/features/quest/components/CampaignCard";
import FomoBanner from "@/features/quest/components/FomoBanner";
import { Rise } from "@/features/quest/components/Rise";
import { buttonClasses } from "@/features/quest/components/ui/button";
import apiClient from "@/features/quest/lib/api-client";
import { mapApiCampaignsResponse } from "@/features/quest/lib/campaign-mapper";
import type { FomoActive } from "@/features/quest/lib/fomo-types";
import { $ } from "@/features/quest/lib/kubb-config";
import { unwrapEnvelope } from "@/features/quest/lib/season-types";
import { toCampaignCardData } from "@/features/quest/types";
import { useCampaignsControllerFindAll, useFomoControllerGetActive } from "@/gen-quest/hooks";

interface PlatformStats {
  questers?: number;
  campaigns?: number;
  pointsGiven?: number;
}

/** Compact number: 1234 -> "1.2k", 1_200_000 -> "1.2M". */
function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toLocaleString("en-US");
}

const WHY_CARD =
  "rounded-quest-card border border-quest-line [background:var(--quest-card-grad)] px-7 py-[26px] transition-[border-color,transform] duration-[400ms] ease-quest hover:-translate-y-[3px] hover:border-quest-accent-line";
const WHY_ICO =
  "mb-[18px] grid h-11 w-11 place-items-center rounded-[13px] border border-quest-accent-line bg-quest-accent-soft text-quest-accent";
const STAT_VALUE =
  "inline-flex items-center gap-2 font-mono text-[clamp(24px,3.2vw,34px)] font-extrabold leading-none tracking-[-0.03em]";
const STAT_LABEL = "mt-[9px] text-[10px] font-bold uppercase tracking-[0.2em] text-quest-muted";

export default function Explore() {
  const { data, isLoading } = useCampaignsControllerFindAll({ isFeatured: true }, $);
  const { data: fomoData } = useFomoControllerGetActive($);
  const fomo = unwrapEnvelope<FomoActive>(fomoData);
  // Public platform stats — `/quest/analytics/system` is admin-only (403 for
  // regular users), so use the public `/quest/stats` endpoint instead.
  const { data: statsRaw } = useQuery({
    queryKey: ["quest", "platform-stats"],
    queryFn: async () => (await apiClient.get("/api/quest/stats")).data,
    staleTime: 5 * 60 * 1000,
  });
  const stats = useMemo(() => unwrapEnvelope<PlatformStats>(statsRaw) ?? {}, [statsRaw]);

  const items: CampaignCardData[] = useMemo(() => {
    if (!data) return [];
    const campaigns = mapApiCampaignsResponse(data);
    return campaigns.slice(0, 6).map(toCampaignCardData);
  }, [data]);

  return (
    <div>
      <FomoBanner />
      {fomo ? (
        <div className="mb-4 flex items-center justify-between rounded-quest-card border border-quest-amber bg-quest-amber/10 px-5 py-3">
          <span className="text-[14px] font-semibold text-quest-amber">
            Leaderboard battle is live — see where you rank!
          </span>
          <Link
            href="/quest/leaderboard"
            className="inline-flex items-center gap-[6px] rounded-quest-pill bg-quest-amber px-4 py-1.5 text-[13px] font-bold text-black transition-opacity hover:opacity-80"
          >
            View leaderboard →
          </Link>
        </div>
      ) : null}
      {/* HERO */}
      <Rise>
        <section className="relative mb-[46px] overflow-hidden rounded-quest-card border border-quest-line shadow-[0_40px_100px_-50px_#000]">
          <div
            className="absolute inset-0 bg-[url(/banner2.png)] bg-cover bg-center bg-no-repeat"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 [background:radial-gradient(circle_at_20%_60%,rgba(0,0,0,0.9)_0%,rgba(0,0,0,0.4)_60%,transparent_100%),linear-gradient(0deg,rgba(0,0,0,0.85)_4%,rgba(0,0,0,0.25)_46%,transparent_78%)]"
            aria-hidden="true"
          />
          <div className="relative z-[1] px-[clamp(24px,5vw,64px)] pt-[clamp(40px,7vw,84px)]">
            <div className="text-[12px] font-semibold tracking-[0.24em] uppercase text-quest-accent inline-flex items-center gap-[10px]">
              June 2026 Season
            </div>
            <h1 className="mt-[18px] max-w-[14ch] text-[clamp(34px,5.4vw,62px)] font-extrabold leading-[1.02] tracking-[-0.04em]">
              Embark on your{" "}
              <span
                style={{
                  background: "var(--grad)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                Tasmil journey
              </span>
            </h1>
            <p className="mt-4 max-w-[48ch] text-[clamp(15px,1.6vw,18px)] leading-[1.55] text-quest-muted">
              Complete tasks across the Stellar ecosystem, earn points and climb the monthly
              leaderboard for real USDC rewards.
            </p>
            <div className="mt-[26px]">
              <Link
                href="/quest/campaigns"
                className={buttonClasses({ variant: "primary", size: "lg" })}
              >
                Start Questing
                <span
                  className="inline-flex transition-transform duration-[350ms] ease-quest group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  <ArrowRight size={17} strokeWidth={2.4} />
                </span>
              </Link>
            </div>
          </div>
          <div className="relative z-[1] mt-[clamp(40px,6vw,72px)] grid grid-cols-3 border-t border-quest-line-2 bg-black/40 backdrop-blur-[10px]">
            <div className="px-[clamp(20px,4vw,40px)] py-[22px]">
              <div className={`${STAT_VALUE} text-quest-accent`}>
                {compact(stats.questers ?? 0)}
              </div>
              <div className={STAT_LABEL}>Questers</div>
            </div>
            <div className="border-l border-quest-line px-[clamp(20px,4vw,40px)] py-[22px]">
              <div className={STAT_VALUE}>{compact(stats.campaigns ?? 0)}</div>
              <div className={STAT_LABEL}>Campaigns</div>
            </div>
            <div className="border-l border-quest-line px-[clamp(20px,4vw,40px)] py-[22px]">
              <div className={`${STAT_VALUE} text-quest-accent`}>
                {compact(stats.pointsGiven ?? 0)}
                <svg
                  className="inline-block flex-none"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  style={{ width: 28, height: 28, verticalAlign: -5 }}
                >
                  <linearGradient id="ptsCoinExpl" x1="0.15" y1="0.1" x2="0.85" y2="0.9">
                    <stop stopColor="#A5F3FC" />
                    <stop offset="1" stopColor="#0EA5E9" />
                  </linearGradient>
                  <circle cx="12" cy="12" r="9" fill="url(#ptsCoinExpl)" />
                  <path d="M12.7 6.4l-4.3 6.05h2.9l-.9 4.45 4.4-6.2h-3z" fill="#04141A" />
                </svg>
              </div>
              <div className={STAT_LABEL}>Points Given</div>
            </div>
          </div>
        </section>
      </Rise>

      {/* WHY QUEST */}
      <Rise delay={0.05}>
        <section className="mb-[60px] grid grid-cols-3 gap-5 max-[820px]:grid-cols-1">
          <div className={WHY_CARD}>
            <div className={WHY_ICO} aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-[22px] w-[22px]"
              >
                <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
                <path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" />
                <path d="M12 14v3M9 21h6M10 21l.5-4h3l.5 4" />
              </svg>
            </div>
            <h3 className="mb-[9px] text-[18px] font-bold tracking-[-0.02em]">Earn rewards</h3>
            <p className="text-[14px] leading-[1.6] text-quest-muted">
              Complete quests to earn{" "}
              <b className="font-bold text-quest-text">points redeemable for USDC</b> at the end of
              every monthly season.
            </p>
          </div>
          <div className={WHY_CARD}>
            <div className={WHY_ICO} aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-[22px] w-[22px]"
              >
                <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
              </svg>
            </div>
            <h3 className="mb-[9px] text-[18px] font-bold tracking-[-0.02em]">Climb ranks</h3>
            <p className="text-[14px] leading-[1.6] text-quest-muted">
              Every quest pushes you higher on the{" "}
              <b className="font-bold text-quest-text">monthly leaderboard</b> where the top 10
              split the prize pool.
            </p>
          </div>
          <div className={WHY_CARD}>
            <div className={WHY_ICO} aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-[22px] w-[22px]"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3c2.5 2.6 4 5.8 4 9s-1.5 6.4-4 9c-2.5-2.6-4-5.8-4-9s1.5-6.4 4-9Z" />
              </svg>
            </div>
            <h3 className="mb-[9px] text-[18px] font-bold tracking-[-0.02em]">
              Join the community
            </h3>
            <p className="text-[14px] leading-[1.6] text-quest-muted">
              Compete globally with thousands of questers and{" "}
              <b className="font-bold text-quest-text">make your mark on Stellar</b>.
            </p>
          </div>
        </section>
      </Rise>

      {/* FEATURED CAMPAIGNS */}
      <Rise delay={0.1}>
        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="text-[clamp(22px,3vw,30px)] font-extrabold tracking-[-0.03em]">
              Featured campaigns
            </h2>
            <Link
              href="/quest/campaigns"
              className="group inline-flex items-center gap-[7px] text-[14px] font-semibold text-quest-accent"
            >
              View all
              <span
                className="inline-flex transition-transform duration-300 ease-quest group-hover:translate-x-1"
                aria-hidden="true"
              >
                <ArrowRight size={15} strokeWidth={2.4} />
              </span>
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-[22px] max-[980px]:grid-cols-2 max-[640px]:grid-cols-1">
            {isLoading ? (
              <>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse overflow-hidden rounded-quest-card border border-quest-line [background:var(--quest-card-grad)]"
                  >
                    <div className="h-[184px] bg-white/5" />
                    <div className="flex flex-col gap-3 p-5">
                      <div className="h-[14px] rounded-md bg-white/5" style={{ width: "60%" }} />
                      <div className="h-[14px] rounded-md bg-white/5" style={{ width: "80%" }} />
                      <div className="h-[14px] rounded-md bg-white/5" style={{ width: "40%" }} />
                    </div>
                  </div>
                ))}
              </>
            ) : items.length === 0 ? (
              <div
                className="flex flex-col items-center gap-[14px] px-5 py-20 text-center"
                style={{ gridColumn: "1/-1" }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="h-14 w-14 text-quest-faint"
                >
                  <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Z" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                <div className="text-[18px] font-bold tracking-[-0.02em] text-quest-text">
                  No featured campaigns this season.
                </div>
                <div className="text-[14px] text-quest-muted">
                  Check back soon or browse all campaigns.
                </div>
              </div>
            ) : (
              items.map((c) => <CampaignCard key={c.id} campaign={c} />)
            )}
          </div>
        </section>
      </Rise>
    </div>
  );
}
