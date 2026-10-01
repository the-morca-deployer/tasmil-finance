"use client";

import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";
import type { HistoryPoint, HistoryRange } from "../hooks/use-portfolio-history";

const RANGES: HistoryRange[] = ["7d", "30d", "90d", "all"];
const RANGE_LABEL: Record<HistoryRange, string> = {
  "7d": "7d",
  "30d": "30d",
  "90d": "90d",
  all: "All",
};

interface PerformanceChartProps {
  data: HistoryPoint[];
  assetSymbol: string;
  range: HistoryRange;
  isPlaceholder: boolean;
  isLoading: boolean;
  onRangeChange: (range: HistoryRange) => void;
}

export function PerformanceChart({
  data,
  assetSymbol,
  range,
  isPlaceholder,
  isLoading,
  onRangeChange,
}: PerformanceChartProps) {
  const latest = data.at(-1);
  const values = data.map((point) => point.valueAsset ?? 0);
  const minimum = values.length > 0 ? Math.min(...values) : 0;
  const maximum = values.length > 0 ? Math.max(...values) : 0;
  const padding = Math.max((maximum - minimum) * 0.12, maximum * 0.04, 0.01);
  const yDomain: [number, number] = [Math.max(0, minimum - padding), maximum + padding];
  const first = data[0];
  const shortTimeline =
    first !== undefined && latest !== undefined && latest.ts - first.ts < 48 * 60 * 60 * 1000;
  const formatAxisTime = (timestamp: number) =>
    new Intl.DateTimeFormat(
      "en-US",
      shortTimeline ? { hour: "2-digit", minute: "2-digit" } : { month: "short", day: "numeric" }
    ).format(timestamp);
  const formatUsd = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  const formatAsset = (value: number) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 7,
    }).format(value);
  const formatAssetAxis = (value: number) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(value);

  return (
    <motion.div
      className="flex flex-col gap-4 rounded-2xl border border-border/40 bg-card p-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-foreground text-xl">Portfolio Value</h2>
          {latest && (
            <div>
              <p className="mt-1 font-mono font-semibold text-2xl text-foreground tabular-nums">
                {formatAsset(latest.valueAsset ?? 0)} {assetSymbol}
              </p>
              <p className="mt-0.5 text-muted-foreground text-xs">≈ {formatUsd(latest.valueUsd)}</p>
            </div>
          )}
        </div>
        <div className="inline-flex items-center gap-1 rounded-lg border border-border/40 bg-muted/10 p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={r === range}
              onClick={() => onRangeChange(r)}
              className={cn(
                "rounded-md px-2.5 py-1 font-medium text-xs transition-colors",
                r === range
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {RANGE_LABEL[r]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Skeleton data-testid="chart-skeleton" className="h-48 w-full rounded-lg" />
      ) : isPlaceholder ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-lg border border-border/40 border-dashed bg-muted/5 text-center">
          <p className="font-medium text-muted-foreground text-sm">No history yet</p>
          <p className="max-w-sm text-muted-foreground/70 text-xs">
            Asset-native history appears after the current vault snapshot is recorded.
          </p>
        </div>
      ) : (
        <div data-testid="portfolio-value-chart" className="h-56 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="portfolioValueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#63d7ff" stopOpacity={0.34} />
                  <stop offset="100%" stopColor="#63d7ff" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.08} />
              <XAxis
                dataKey="ts"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tickFormatter={formatAxisTime}
                axisLine={false}
                tickLine={false}
                minTickGap={28}
                tick={{ fill: "#8b8d96", fontSize: 11 }}
              />
              <YAxis
                domain={yDomain}
                axisLine={false}
                tickLine={false}
                width={72}
                tickMargin={8}
                tickFormatter={formatAssetAxis}
                tick={{ fill: "#8b8d96", fontSize: 11 }}
              />
              <Tooltip
                cursor={{ stroke: "#63d7ff", strokeOpacity: 0.3 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const point = payload[0]?.payload as HistoryPoint;
                  return (
                    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
                      <p className="text-muted-foreground text-xs">
                        {new Intl.DateTimeFormat("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(point.ts)}
                      </p>
                      <p className="mt-1 font-medium text-foreground text-sm">
                        {formatAsset(point.valueAsset ?? 0)} {assetSymbol}
                      </p>
                      <p className="text-muted-foreground text-xs">≈ {formatUsd(point.valueUsd)}</p>
                      <p className="mt-1 text-muted-foreground text-xs">
                        Farming {formatAsset(point.defiAsset ?? 0)} · Wallet{" "}
                        {formatAsset(point.walletAsset ?? 0)} {assetSymbol}
                      </p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="valueAsset"
                stroke="#63d7ff"
                strokeWidth={2}
                fill="url(#portfolioValueFill)"
                dot={data.length === 1 ? { r: 3, fill: "#63d7ff" } : false}
                activeDot={{ r: 4, fill: "#63d7ff", stroke: "#0b0b0d", strokeWidth: 2 }}
                isAnimationActive={true}
                animationDuration={650}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
