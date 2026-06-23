"use client";

import { useState } from "react";

import { ArrowUpRight, BarChart3, ChevronLeft, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { cn } from "@/lib/utils";
import type {
  AllocationEntry,
  MarketplaceStrategy,
  PerformancePoint,
} from "@/features/marketplace/types";
import { AllocationPieChart } from "@/features/marketplace/components/allocation-pie-chart";
import { ApyLineChart } from "@/features/marketplace/components/apy-line-chart";

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(value);
}

interface StrategyDetailProps {
  strategy: MarketplaceStrategy;
  performance: PerformancePoint[];
  allocations?: AllocationEntry[];
  loading: boolean;
  onActivate: () => void;
  onBack: () => void;
}

export function StrategyDetail({ strategy, performance, allocations, onActivate, onBack }: StrategyDetailProps) {
  const [tab, setTab] = useState("overview");

  const isPositive = strategy.currentApy >= 0;
  const templateLabel = strategy.template === "swap" ? "Auto Swap" : "DCA";

  return (
    <div className="mx-auto max-w-3xl">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-1.5 text-xs text-white/40 transition-colors hover:text-white/60"
      >
        <ChevronLeft className="h-4 w-4" /> Back to marketplace
      </button>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">{strategy.name}</h1>
            <Badge variant="outline" className="border-white/10 text-[10px] text-white/50">
              {templateLabel}
            </Badge>
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs text-white/40">
            <span>Publisher: {strategy.publisherId?.slice(0, 8)}...</span>
            <span>Fee: {strategy.perfFeeBps / 100}%</span>
          </div>
        </div>
        <div className={cn("text-right", isPositive ? "text-emerald-400" : "text-red-400")}>
          <div className="text-2xl font-bold">
            {isPositive ? "+" : ""}{strategy.currentApy.toFixed(1)}%
          </div>
          <div className="text-xs text-white/30">7d APY</div>
        </div>
      </div>

      {/* Performance chart */}
      {performance.length > 1 && (
        <Card className="mt-6 border-white/5 bg-white/3 p-4">
          <div className="flex items-center gap-2 text-xs text-white/40">
            <BarChart3 className="h-4 w-4" />
            NAV History
          </div>
          <div className="mt-2">
            <ApyLineChart data={performance} height={200} />
          </div>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList className="w-full">
          <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
          <TabsTrigger value="performance" className="flex-1">Performance</TabsTrigger>
          <TabsTrigger value="about" className="flex-1">About</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-white/5 bg-white/3 p-4">
              <div className="flex items-center gap-2 text-xs text-white/40">
                <TrendingUp className="h-4 w-4" /> Total Value Locked
              </div>
              <div className="mt-1.5 text-lg font-semibold text-white">
                {formatUsd(strategy.tvlUsd)}
              </div>
            </Card>
            <Card className="border-white/5 bg-white/3 p-4">
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Users className="h-4 w-4" /> Active Users
              </div>
              <div className="mt-1.5 text-lg font-semibold text-white">
                {strategy.activatedCount}
              </div>
            </Card>
          </div>
          {allocations && allocations.length > 0 && (
            <Card className="border-white/5 bg-white/3 p-4">
              <div className="flex items-center gap-2 text-xs text-white/40">
                <BarChart3 className="h-4 w-4" /> Allocation
              </div>
              <div className="mt-2">
                <AllocationPieChart allocations={allocations} />
              </div>
            </Card>
          )}
          <Button className="w-full gap-2" onClick={onActivate} disabled={strategy.paused}>
            {strategy.paused ? "Strategy Paused" : "Activate Strategy"}
            {!strategy.paused && <ArrowUpRight className="h-4 w-4" />}
          </Button>
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          {performance.length === 0 ? (
            <p className="py-12 text-center text-xs text-white/30">
              No performance data yet. Data appears after first harvest.
            </p>
          ) : (
            <div className="space-y-2">
              {performance.slice(-30).reverse().map((p, i) => (
                <div key={i} className="flex items-center justify-between rounded-md border border-white/5 px-4 py-2 text-xs">
                  <span className="text-white/40">{new Date(p.timestamp).toLocaleDateString()}</span>
                  <span className="text-white">${p.nav.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="about" className="mt-4">
          <Card className="border-white/5 bg-white/3 p-4">
            <div className="space-y-3 text-xs text-white/50">
              <div className="flex justify-between">
                <span>Contract</span>
                <span className="font-mono text-white/30">{strategy.contractAddress.slice(0, 20)}...</span>
              </div>
              <div className="flex justify-between">
                <span>Token In</span>
                <span className="text-white">{strategy.tokenIn}</span>
              </div>
              <div className="flex justify-between">
                <span>Token Out</span>
                <span className="text-white">{strategy.tokenOut}</span>
              </div>
              <div className="flex justify-between">
                <span>Swap Amount</span>
                <span className="text-white">{strategy.swapPercentBps / 100}% of balance</span>
              </div>
              <div className="flex justify-between">
                <span>Threshold Price</span>
                <span className="text-white">
                  {strategy.thresholdPrice ? `$${(strategy.thresholdPrice / 10_000_000).toFixed(4)}` : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Template</span>
                <span className="text-white">{templateLabel}</span>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
