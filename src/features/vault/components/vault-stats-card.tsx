"use client";

import { TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";

import type { VaultStats } from "../types";

interface VaultStatsCardProps {
  stats: VaultStats;
  className?: string;
}

export function VaultStatsCard({ stats, className }: VaultStatsCardProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  return (
    <div className={cn("flex items-center justify-between gap-8", className)}>
      {/* APY */}
      <div className="flex flex-col gap-2">
        <span className="bg-gradient-to-r from-[#B5EAFF] to-[#00BFFF] bg-clip-text font-bold text-5xl text-transparent md:text-6xl">
          {stats.apy}%
        </span>
        <div className="flex items-center gap-2">
          <div className="h-2 flex-1 max-w-32 rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-[#B5EAFF] to-[#00BFFF]"
              style={{ width: `${Math.min(stats.apy * 5, 100)}%` }}
            />
          </div>
          <span className="text-muted-foreground text-sm">APY</span>
        </div>
      </div>

      {/* TVL */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-4xl text-foreground md:text-5xl">
          {formatCurrency(stats.tvl)}
        </span>
        <div className="flex items-center gap-2">
          <div className="h-2 flex-1 max-w-32 rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary/60"
              style={{ width: "75%" }}
            />
          </div>
          <span className="text-muted-foreground text-sm">TVL</span>
        </div>
      </div>
    </div>
  );
}

interface VaultDailyChangeProps {
  dailyChange: number;
  tvlChange24h: number;
  className?: string;
}

export function VaultDailyChange({ dailyChange, tvlChange24h, className }: VaultDailyChangeProps) {
  return (
    <div className={cn("flex items-center justify-between text-sm", className)}>
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-green-500" />
        <span className="text-green-500">+{dailyChange}% today</span>
      </div>
      <span className="text-muted-foreground">
        24h Change: <span className="text-green-500">+${tvlChange24h.toLocaleString()}</span> TVL
      </span>
    </div>
  );
}
