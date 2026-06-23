"use client";

import { motion } from "framer-motion";
import { Crown, Loader2, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import type { LeaderboardEntry } from "@/features/marketplace/types";
import { cn } from "@/lib/utils";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  loading: boolean;
}

export function LeaderboardTable({ entries, loading }: LeaderboardTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-white/30" />
      </div>
    );
  }

  if (entries.length === 0) {
    return <div className="py-24 text-center text-sm text-white/30">No strategies ranked yet</div>;
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, i) => {
        const isPositive = entry.currentApy >= 0;
        return (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className={cn(
              "flex items-center gap-4 rounded-lg border px-5 py-3.5 text-sm transition-colors",
              i < 3
                ? "border-yellow-400/20 bg-yellow-400/5"
                : "border-white/5 bg-white/3 hover:border-white/10"
            )}
          >
            <div className="flex w-8 justify-center">
              {i === 0 ? (
                <Crown className="h-5 w-5 text-yellow-400" />
              ) : i === 1 ? (
                <Trophy className="h-5 w-5 text-gray-300" />
              ) : i === 2 ? (
                <Trophy className="h-5 w-5 text-amber-600" />
              ) : (
                <span className={cn("text-xs font-medium", i < 3 ? "text-white" : "text-white/30")}>
                  #{entry.rank}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium text-white">{entry.name}</span>
                <span className="rounded border border-white/5 px-1.5 py-0.5 text-[10px] text-white/30">
                  {entry.template === "swap" ? "Swap" : "DCA"}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-white/30">
                {entry.publisher.slice(0, 8)}...
              </p>
            </div>

            <div className="hidden items-center gap-6 sm:flex">
              <div className="text-right">
                <div className="text-xs text-white/30">TVL</div>
                <div className="text-xs text-white">${(entry.tvlUsd / 1000).toFixed(0)}K</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-white/30">Users</div>
                <div className="text-xs text-white">{entry.activatedCount}</div>
              </div>
            </div>

            <div className={cn("text-right", isPositive ? "text-emerald-400" : "text-red-400")}>
              <div className="flex items-center gap-1">
                {isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="text-sm font-semibold">
                  {isPositive ? "+" : ""}
                  {entry.currentApy.toFixed(1)}%
                </span>
              </div>
              <div className="text-[10px] text-white/30">APY</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
