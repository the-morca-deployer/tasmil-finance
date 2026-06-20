"use client";

import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useCampaignsControllerFindAll } from "@/gen-quest";
import { mapApiCampaignsResponse } from "@/features/quest/lib/campaign-mapper";
import { withAuth } from "@/features/quest/lib/kubb-config";
import { CampaignCard } from "./CampaignCard";
import TFLoader from "./TFLoader";

type Filter = "all" | "ongoing" | "closed";

const Campaigns: React.FC = () => {
  const [filter, setFilter] = useState<Filter>("all");

  // Build query params based on filter
  const queryParams = useMemo(() => {
    if (filter === "all") {
      return undefined; // Fetch all campaigns
    }
    return {
      active: filter === "ongoing", // true for ongoing, false for closed
    };
  }, [filter]);

  // Fetch campaigns with caching
  const { data, isLoading, error } = useCampaignsControllerFindAll(queryParams, {
    ...withAuth,
    query: {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Use cached data if available
      refetchOnReconnect: false,
    },
  });

  // Map API response to Campaign interface
  const campaigns = useMemo(() => {
    if (!data) return [];
    return mapApiCampaignsResponse(data);
  }, [data]);

  // Filter campaigns client-side (for status filtering)
  const filteredCampaigns = useMemo(() => {
    if (filter === "all") return campaigns;
    return campaigns.filter((c) => c.status === filter);
  }, [campaigns, filter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pt-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Campaigns</h1>
          <p className="text-muted">Discover the latest quests and earn rewards.</p>
        </div>

        <div className="flex items-center bg-card border border-border rounded-full p-1">
          {(["all", "ongoing", "closed"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                filter === f
                  ? "bg-brand-gradient text-background shadow-lg"
                  : "text-muted hover:text-primary"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-20 flex justify-center" data-testid="quest-loader">
          <TFLoader size={120} />
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="py-20 text-center text-muted">
          <Search size={48} className="mx-auto mb-4 opacity-20" />
          <p>Failed to load campaigns. Please try again later.</p>
        </div>
      )}

      {/* Grid */}
      {!isLoading && !error && (
        <div className="quest-scope grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}

      {!isLoading && !error && filteredCampaigns.length === 0 && (
        <div className="py-20 text-center text-muted">
          <Search size={48} className="mx-auto mb-4 opacity-20" />
          <p>No campaigns found.</p>
        </div>
      )}
    </div>
  );
};

export default Campaigns;
