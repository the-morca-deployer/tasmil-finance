"use client";

import { ArrowRight, Loader2, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useMemo } from "react";
import { mapApiCampaignsResponse } from "@/features/quest/lib/campaign-mapper";
import { withAuth } from "@/features/quest/lib/kubb-config";
import { useCampaignsControllerFindAll } from "@/gen-quest/hooks/campaigns-hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button-v2";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";

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
        />
        {/* bottom fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

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
              onClick={() => router.push("/campaigns")}
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-muted">
            <Loader2 size={48} className="mx-auto mb-4 opacity-20 animate-spin" />
            <p>Loading featured campaigns...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCampaigns.map((campaign) => (
              <Card
                key={campaign.id}
                onClick={() => router.push(`/campaign/${campaign.id}`)}
                className="flex flex-col h-full overflow-hidden border-border cursor-pointer hover:border-white/20 transition-all"
              >
                <div className="relative h-48 w-full border-b border-border">
                  <img
                    src={campaign.banner}
                    alt={campaign.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute top-4 left-4">
                    {campaign.status === "ongoing" && <Badge>Ongoing</Badge>}
                    {campaign.status === "closed" && <Badge variant="secondary">Closed</Badge>}
                  </div>
                </div>

                <CardHeader className="flex-grow pb-4">
                  <CardTitle className="text-lg line-clamp-1 mb-2">{campaign.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{campaign.description}</CardDescription>
                </CardHeader>

                <div className="px-6">
                  <Separator />
                </div>

                <CardFooter className="pt-4 justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2 items-center">
                      {(() => {
                        const campaignAvatars = campaign.avatars || [];
                        const maxAvatars = 5;
                        const avatarsToShow = campaignAvatars.slice(0, maxAvatars);
                        const remainingCount = campaign.participants - avatarsToShow.length;

                        return (
                          <>
                            {avatarsToShow.map((avatar, i) => (
                              <Avatar key={i} className="w-6 h-6 border-2 border-card">
                                <AvatarImage
                                  src={
                                    avatar ||
                                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${campaign.id}-${i}`
                                  }
                                />
                                <AvatarFallback>U</AvatarFallback>
                              </Avatar>
                            ))}
                            {avatarsToShow.length === 0 &&
                              campaign.participants > 0 &&
                              Array.from(
                                { length: Math.min(campaign.participants, 3) },
                                (_, i) => i + 1
                              ).map((i) => (
                                <Avatar key={i} className="w-6 h-6 border-2 border-card">
                                  <AvatarImage
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${campaign.id}-${i}`}
                                  />
                                  <AvatarFallback>U</AvatarFallback>
                                </Avatar>
                              ))}
                            {remainingCount > 0 && (
                              <div className="w-6 h-6 rounded-full border-2 border-card bg-muted/10 flex items-center justify-center text-[8px] font-bold text-muted">
                                {remainingCount >= 1000
                                  ? `+${(remainingCount / 1000).toFixed(0)}k`
                                  : `+${remainingCount}`}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-success font-medium">
                    <Trophy size={14} />
                    <span>{campaign.points} PTS</span>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Explore;
