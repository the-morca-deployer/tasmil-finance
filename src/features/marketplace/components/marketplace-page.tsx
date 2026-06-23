"use client";

import { useState } from "react";

import { Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { useMarketplace, useLeaderboard } from "@/features/marketplace/hooks/use-marketplace-api";
import { useMarketplaceStore } from "@/features/marketplace/state/marketplace-store";
import { StrategyGrid } from "@/features/marketplace/components/strategy-grid";
import { LeaderboardTable } from "@/features/marketplace/components/leaderboard-table";

type PageTab = "browse" | "leaderboard";

export function MarketplacePage() {
  const [tab, setTab] = useState<PageTab>("browse");
  const { template, setTemplate } = useMarketplaceStore();
  const { strategies, loading, error, refetch } = useMarketplace();
  const { data: leaderboard, isLoading: lbLoading } = useLeaderboard();

  const handleActivate = (id: string) => {
    window.location.href = `/marketplace/${id}`;
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Agent Marketplace</h1>
          <p className="mt-1 text-sm text-white/40">
            Discover and activate automated trading strategies
          </p>
        </div>
        <Button className="gap-2" onClick={() => (window.location.href = "/marketplace/create")}>
          <Sparkles className="h-4 w-4" />
          Create Strategy
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as PageTab)} className="mt-6">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="browse" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Browse
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Leaderboard
          </TabsTrigger>
        </TabsList>

        {/* Browse tab */}
        {tab === "browse" && (
          <div className="mt-6">
            {strategies.length > 0 && (
              <div className="mb-4 flex items-center gap-2">
                {["all", "swap", "dca"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTemplate(t)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      template === t
                        ? "border-white/20 bg-white/10 text-white"
                        : "border-white/5 text-white/40 hover:text-white/60"
                    }`}
                  >
                    {t === "all" ? "All" : t === "swap" ? "Auto Swap" : "DCA"}
                  </button>
                ))}
              </div>
            )}
            <StrategyGrid
              strategies={strategies}
              loading={loading}
              error={error}
              onActivate={handleActivate}
              onRetry={refetch}
            />
          </div>
        )}

        {/* Leaderboard tab */}
        {tab === "leaderboard" && (
          <div className="mt-6">
            <LeaderboardTable entries={leaderboard ?? []} loading={lbLoading} />
          </div>
        )}
      </Tabs>
    </div>
  );
}
