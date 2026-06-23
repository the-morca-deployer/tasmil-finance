"use client";

import { motion } from "framer-motion";
import { Activity, ArrowUpRight, DollarSign, Users } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { cn } from "@/lib/utils";
import type { MarketplaceStrategy } from "@/features/marketplace/types";

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface StrategyCardProps {
  strategy: MarketplaceStrategy;
  onActivate: (id: string) => void;
}

export function StrategyCard({ strategy, onActivate }: StrategyCardProps) {
  const isPositive = strategy.currentApy >= 0;
  const templateLabel = strategy.template === "swap" ? "Auto Swap" : "DCA";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="group relative overflow-hidden border border-white/5 bg-white/3 p-5 backdrop-blur-sm transition-all hover:border-white/10 hover:bg-white/5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">{strategy.name}</h3>
              <Badge variant="outline" className="border-white/10 text-[10px] text-white/50">
                {templateLabel}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "border-white/10 text-[10px]",
                  strategy.publisherType === "tasmil"
                    ? "text-emerald-400"
                    : "text-blue-400",
                )}
              >
                {strategy.publisherType === "tasmil" ? "Official" : "Community"}
              </Badge>
            </div>
            <p className="mt-1.5 text-xs text-white/40">
              Fee: {strategy.perfFeeBps / 100}%
            </p>
          </div>
          <div className={cn("text-right", isPositive ? "text-emerald-400" : "text-red-400")}>
            <div className="flex items-center gap-1 text-lg font-semibold">
              {isPositive ? "↑" : "↓"}
              {Math.abs(strategy.currentApy).toFixed(1)}%
            </div>
            <p className="text-[10px] text-white/30">APY</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-white/40">
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5" />
            {formatUsd(strategy.tvlUsd)}
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {strategy.activatedCount}
          </div>
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            {strategy.tokenIn}/{strategy.tokenOut}
          </div>
        </div>

        <Button
          size="sm"
          className="mt-4 h-8 w-full gap-1.5 text-xs"
          onClick={() => onActivate(strategy.id)}
          disabled={strategy.paused}
        >
          {strategy.paused ? "Paused" : "Activate"}
          {!strategy.paused && <ArrowUpRight className="h-3.5 w-3.5" />}
        </Button>
      </Card>
    </motion.div>
  );
}
