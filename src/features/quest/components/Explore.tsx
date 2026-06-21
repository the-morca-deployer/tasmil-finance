"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useMemo } from "react";
import { Button } from "@/features/quest/components/ui/button";
import { mapApiCampaignsResponse } from "@/features/quest/lib/campaign-mapper";
import { withAuth } from "@/features/quest/lib/kubb-config";
import { toCampaignCardData } from "@/features/quest/types";
import { useCampaignsControllerFindAll } from "@/gen-quest";
import { CampaignCard } from "./CampaignCard";
import { TFLoader } from "./TFLoader";

const Explore: React.FC = () => {
  const router = useRouter();

  // Fetch featured campaigns (active/ongoing, limit to 6)
  const { data, isLoading } = useCampaignsControllerFindAll(
    { active: true },
    {
      ...withAuth,
      query: {
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: false, // Use cached data if available
        refetchOnReconnect: false,
      },
    }
  );

  // Map API response to Campaign interface and limit to 6 featured campaigns
  const featuredCampaigns = useMemo(() => {
    if (!data) return [];
    const campaigns = mapApiCampaignsResponse(data);
    // Show only ongoing campaigns and limit to 6
    return campaigns.filter((c) => c.status === "ongoing").slice(0, 6);
  }, [data]);

  return (
    <div className="space-y-16 animate-in fade-in duration-700 pt-8">
      {/* Hero Section */}
      <section className="relative w-full h-[400px] md:h-[500px] rounded-[32px] overflow-hidden group border border-white/25">
        <img
          src="/banner2.png"
          alt="Hero Background"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        />
        {/* left fade — covers 40% width */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 25%, transparent 40%)",
          }}
        ></div>
        {/* bottom fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

        <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 max-w-2xl space-y-6">
          <div className="flex items-center gap-2">
            <span className="text-brand-mid font-semibold tracking-wide text-sm uppercase">
              Tasmil Finance Quest
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold leading-tight text-white">
            Embark On Your <br />
            Tasmil Journey
          </h1>

          <p className="text-muted text-lg md:text-xl max-w-lg">
            Complete tasks, Earn Rewards, And Climb The Leaderboards In The Tasmil Ecosystem.
          </p>

          <div className="pt-4">
            <Button
              variant="gradient"
              size="lg"
              className="rounded-full px-8"
              onClick={() =>
                document.getElementById("campaigns")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Start Questing
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Campaigns Section */}
      <section id="campaigns" className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Featured Campaigns</h2>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full"
              onClick={() => router.push("/quest/campaigns")}
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center" data-testid="quest-loader">
            <TFLoader size={120} />
          </div>
        ) : (
          <div className="quest-scope grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={toCampaignCardData(campaign)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Explore;
