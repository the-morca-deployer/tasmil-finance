"use client";

import { useState } from "react";
import { BarChart3, Info } from "lucide-react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  usePortfolioHistory,
  type PortfolioHistoryRange,
} from "../hooks/use-portfolio-history";

const RANGES: PortfolioHistoryRange[] = [7, 30, 90];

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

interface PerformanceChartProps {
  address: string;
  liveTotalUsd: number;
  isLoadingTokens: boolean;
}

export function PerformanceChart({
  address,
  liveTotalUsd,
  isLoadingTokens,
}: PerformanceChartProps) {
  const [days, setDays] = useState<PortfolioHistoryRange>(30);
  const { data, isLoading, isError } = usePortfolioHistory(address, days);

  const snapshots = data?.snapshots ?? [];
  const latest = data?.latestTotalUsd ?? (liveTotalUsd > 0 ? liveTotalUsd : null);
  const deltaUsd = data?.deltaUsd ?? 0;
  const deltaPercent = data?.deltaPercent ?? 0;
  const deltaPositive = deltaUsd > 0;
  const deltaZero = deltaUsd === 0;

  const chartData = snapshots.map((s) => ({
    takenAt: s.takenAt,
    totalUsd: s.totalUsd,
  }));

  const renderBody = () => {
    if (isLoadingTokens || isLoading) {
      return <Skeleton className="h-[200px] w-full rounded-lg" />;
    }
    if (isError) {
      return (
        <div className="flex h-[200px] flex-col items-center justify-center gap-2 rounded-lg bg-muted/5">
          <Info className="h-6 w-6 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Couldn't load history. Try again shortly.
          </p>
        </div>
      );
    }
    if (snapshots.length === 0) {
      return (
        <div className="flex h-[200px] flex-col items-center justify-center gap-3 rounded-lg bg-muted/5">
          <BarChart3 className="h-8 w-8 text-muted-foreground/30" />
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">
              We're building your history
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground/60">
              Snapshots run every 8 hours; check back shortly.
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="portfolio-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(203, 100%, 73%)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(203, 100%, 73%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="takenAt"
              tickFormatter={formatDate}
              tick={{ fill: "hsl(215.4, 16.3%, 46.9%)", fontSize: 11 }}
              minTickGap={32}
            />
            <YAxis
              tickFormatter={(v) => formatUsd(Number(v))}
              tick={{ fill: "hsl(215.4, 16.3%, 46.9%)", fontSize: 11 }}
              width={70}
            />
            <Tooltip
              labelFormatter={(v) => formatDate(String(v))}
              formatter={(v) => [formatUsd(Number(v)), "Total"]}
              contentStyle={{
                background: "hsl(222.2, 84%, 4.9%)",
                border: "1px solid hsl(214.3, 31.8%, 21.4%)",
                borderRadius: 8,
              }}
            />
            <Area
              type="monotone"
              dataKey="totalUsd"
              stroke="hsl(203, 100%, 73%)"
              strokeWidth={2}
              fill="url(#portfolio-area)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <motion.div
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:p-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Portfolio Value</h2>
          {isLoadingTokens || isLoading ? (
            <Skeleton className="mt-2 h-10 w-40 rounded-lg" />
          ) : (
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-[32px] font-bold tracking-tight text-foreground">
                {latest !== null ? formatUsd(latest) : formatUsd(liveTotalUsd)}
              </span>
              {snapshots.length > 1 && (
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-xs font-semibold",
                    deltaZero && "bg-muted/30 text-muted-foreground",
                    deltaPositive && !deltaZero && "bg-emerald-500/15 text-emerald-400",
                    !deltaPositive && !deltaZero && "bg-destructive/15 text-destructive",
                  )}
                >
                  {deltaPositive ? "+" : ""}
                  {deltaPercent.toFixed(2)}% ({formatUsd(deltaUsd)})
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-1 rounded-lg bg-muted/10 p-1">
          {RANGES.map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => setDays(r)}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                days === r
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r}D
            </button>
          ))}
        </div>
      </div>

      {renderBody()}

      <p className="text-xs text-muted-foreground/70">
        Chart reflects your wallet + Tasmil vault. Blend and Aquarius positions shown
        below aren't yet included in history.
      </p>
    </motion.div>
  );
}
