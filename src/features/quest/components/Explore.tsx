"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { CampaignCard, type CampaignCardData } from "@/features/quest/components/CampaignCard";
import { Rise } from "@/features/quest/components/Rise";
import { mapApiCampaignsResponse } from "@/features/quest/lib/campaign-mapper";
import { $ } from "@/features/quest/lib/kubb-config";
import { toCampaignCardData } from "@/features/quest/types";
import { useCampaignsControllerFindAll } from "@/gen-quest/hooks";

export default function Explore() {
  const { data, isLoading } = useCampaignsControllerFindAll({ isFeatured: true }, $);

  const items: CampaignCardData[] = useMemo(() => {
    if (!data) return [];
    const campaigns = mapApiCampaignsResponse(data);
    return campaigns.slice(0, 6).map(toCampaignCardData);
  }, [data]);

  return (
    <div className="space-y-0">
      {/* HERO */}
      <Rise>
        <section className="x-hero">
          <div className="x-hero-img" aria-hidden="true" />
          <div className="x-hero-grad" aria-hidden="true" />
          <div className="x-hero-inner">
            <div className="eyebrow">June 2026 Season</div>
            <h1>
              Embark on your{" "}
              <span className="grad-text">Tasmil journey</span>
            </h1>
            <p>
              Complete tasks across the Stellar ecosystem, earn points and climb the monthly
              leaderboard for real USDC rewards.
            </p>
            <div className="cta">
              <Link href="/quest/campaigns" className="btn btn-primary btn-lg">
                Start Questing
                <span className="arr">
                  <ArrowRight size={17} strokeWidth={2.4} />
                </span>
              </Link>
            </div>
          </div>
          <div className="x-stats">
            <div className="x-stat">
              <div className="v accent">12,400+</div>
              <div className="k">Questers</div>
            </div>
            <div className="x-stat">
              <div className="v">24</div>
              <div className="k">Campaigns</div>
            </div>
            <div className="x-stat">
              <div className="v accent">
                1.2M
                <svg className="pcoin" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: 28, height: 28, verticalAlign: -5 }}>
                  <linearGradient id="ptsCoinExpl" x1="0.15" y1="0.1" x2="0.85" y2="0.9"><stop stopColor="#A5F3FC"/><stop offset="1" stopColor="#0EA5E9"/></linearGradient>
                  <circle cx="12" cy="12" r="9" fill="url(#ptsCoinExpl)"/>
                  <path d="M12.7 6.4l-4.3 6.05h2.9l-.9 4.45 4.4-6.2h-3z" fill="#04141A"/>
                </svg>
              </div>
              <div className="k">Points Given</div>
            </div>
          </div>
        </section>
      </Rise>

      {/* WHY QUEST */}
      <Rise delay={0.05}>
        <section className="why">
          <div className="why-card">
            <div className="why-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3"/><path d="M12 14v3M9 21h6M10 21l.5-4h3l.5 4"/>
              </svg>
            </div>
            <h3>Earn rewards</h3>
            <p>Complete quests to earn <b>points redeemable for USDC</b> at the end of every monthly season.</p>
          </div>
          <div className="why-card">
            <div className="why-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>
              </svg>
            </div>
            <h3>Climb ranks</h3>
            <p>Every quest pushes you higher on the <b>monthly leaderboard</b> where the top 10 split the prize pool.</p>
          </div>
          <div className="why-card">
            <div className="why-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 4 5.8 4 9s-1.5 6.4-4 9c-2.5-2.6-4-5.8-4-9s1.5-6.4 4-9Z"/>
              </svg>
            </div>
            <h3>Join the community</h3>
            <p>Compete globally with thousands of questers and <b>make your mark on Stellar</b>.</p>
          </div>
        </section>
      </Rise>

      {/* FEATURED CAMPAIGNS */}
      <Rise delay={0.1}>
        <section>
          <div className="sec-head">
            <h2 className="sec-title">Featured campaigns</h2>
            <Link href="/quest/campaigns" className="sec-link">
              View all
              <span className="arr" aria-hidden="true">
                <ArrowRight size={15} strokeWidth={2.4} />
              </span>
            </Link>
          </div>
          <div className="camp-grid">
            {isLoading ? (
              <>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="skel">
                    <div className="s-img" />
                    <div className="s-body">
                      <div className="s-line" style={{ width: "60%" }} />
                      <div className="s-line" style={{ width: "80%" }} />
                      <div className="s-line" style={{ width: "40%" }} />
                    </div>
                  </div>
                ))}
              </>
            ) : items.length === 0 ? (
              <div className="empty" style={{ gridColumn: "1/-1" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Z"/><path d="M12 8v4M12 16h.01"/>
                </svg>
                <div className="et">No featured campaigns this season.</div>
                <div className="es">Check back soon or browse all campaigns.</div>
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
