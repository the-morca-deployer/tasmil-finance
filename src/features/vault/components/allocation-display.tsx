"use client";

import { cn } from "@/lib/utils";

import type { AllocationStrategy } from "../types";

interface AllocationDisplayProps {
  allocations: AllocationStrategy[];
  compact?: boolean;
  className?: string;
}

export function AllocationDisplay({ allocations, compact, className }: AllocationDisplayProps) {
  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        <span className="text-muted-foreground text-sm">AI Allocation:</span>
        <div className="flex flex-wrap gap-3">
          {allocations.map((alloc) => (
            <span key={alloc.name} className="text-sm">
              <span className="font-medium">{alloc.protocol}</span>{" "}
              <span className="text-muted-foreground">{alloc.allocation}%</span>
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <h3 className="font-semibold text-lg">AI Allocation Breakdown</h3>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {allocations.map((alloc) => (
          <AllocationCard key={alloc.name} allocation={alloc} />
        ))}
      </div>
    </div>
  );
}

interface AllocationCardProps {
  allocation: AllocationStrategy;
}

function AllocationCard({ allocation }: AllocationCardProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}k`;
    }
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="rounded-xl border border-border bg-card/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-semibold">{allocation.name}</span>
        <span className="text-muted-foreground">({allocation.allocation}%)</span>
      </div>

      {/* Progress Bar */}
      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-600"
          style={{ width: `${allocation.allocation}%` }}
        />
      </div>

      {/* Stats */}
      <div className="flex justify-between text-sm">
        <div>
          <span className="text-green-500 font-medium">{allocation.apy}%</span>
          <span className="text-muted-foreground ml-1">APY</span>
        </div>
        <div>
          <span className="font-medium">{formatCurrency(allocation.tvl)}</span>
          <span className="text-muted-foreground ml-1">TVL</span>
        </div>
      </div>
    </div>
  );
}

interface PerformanceComparisonProps {
  vaultReturn: number;
  benchmarkReturn: number;
  className?: string;
}

export function PerformanceComparison({
  vaultReturn,
  benchmarkReturn,
  className,
}: PerformanceComparisonProps) {
  const outperformance = vaultReturn - benchmarkReturn;

  return (
    <div className={cn("rounded-xl border border-border bg-card/50 p-4", className)}>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">Performance Since Launch:</span>
        <div className="flex items-center gap-4">
          <span className="text-green-500 font-medium">+{vaultReturn}%</span>
          <span className="text-muted-foreground text-sm">vs Buy & Hold</span>
          <span className="text-muted-foreground">+{benchmarkReturn}%</span>
        </div>
      </div>
      {outperformance > 0 && (
        <div className="mt-2 text-right">
          <span className="rounded-full bg-green-500/10 px-2 py-1 text-green-500 text-xs">
            +{outperformance.toFixed(1)}% outperformance
          </span>
        </div>
      )}
    </div>
  );
}
