"use client";

import { BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/shared/ui/skeleton";
import type { WalletToken } from "../hooks/use-wallet-tokens";

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

interface PerformanceChartProps {
  tokens: WalletToken[];
  totalUsd: number;
  isLoadingTokens: boolean;
}

export function PerformanceChart({ totalUsd, isLoadingTokens }: PerformanceChartProps) {
  return (
    <motion.div
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:p-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
    >
      <h2 className="text-xl font-semibold text-foreground">Portfolio Value</h2>

      {isLoadingTokens ? (
        <Skeleton className="h-10 w-40 rounded-lg" />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <span className="text-[32px] font-bold tracking-tight text-foreground">
            {formatUsd(totalUsd)}
          </span>
        </motion.div>
      )}

      <div className="flex h-[150px] flex-col items-center justify-center gap-3 rounded-lg bg-muted/5 sm:h-[200px]">
        <BarChart3 className="h-8 w-8 text-muted-foreground/30" />
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Historical tracking coming soon
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground/60">
            Portfolio snapshots will enable P&L charts and performance history
          </p>
        </div>
      </div>
    </motion.div>
  );
}
