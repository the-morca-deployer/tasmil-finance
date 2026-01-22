"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

import { PERFORMANCE_BENCHMARK, VAULT_CONFIG } from "../constants";
import { useVault } from "../hooks";
import { AllocationDisplay, PerformanceComparison } from "./allocation-display";

interface VaultStrategiesPageProps {
  className?: string;
}

export function VaultStrategiesPage({ className }: VaultStrategiesPageProps) {
  const { allocations, lastRebalance } = useVault();

  return (
    <div className={cn("mx-auto max-w-4xl space-y-8 p-6", className)}>
      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-bold text-3xl">AI Allocation Breakdown</h1>
        <p className="text-muted-foreground">
          Understand how {VAULT_CONFIG.name} allocates your funds across DeFi protocols
        </p>
        <div className="h-px w-full bg-border" />
      </div>

      {/* Allocation Cards */}
      <AllocationDisplay allocations={allocations} />

      {/* Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <PerformanceComparison
            vaultReturn={PERFORMANCE_BENCHMARK.vaultReturn}
            benchmarkReturn={PERFORMANCE_BENCHMARK.buyAndHold}
          />
        </CardContent>
      </Card>

      {/* Last Rebalance Info */}
      <Card>
        <CardHeader>
          <CardTitle>Last Rebalance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{lastRebalance.timeAgo} ago</div>
              <div className="text-muted-foreground text-sm">
                Morpho APY increased by +3.2%
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium text-green-500">+{lastRebalance.apyBoost}%</div>
              <div className="text-muted-foreground text-sm">APY boost</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategy Explanation */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">AI-Powered Rebalancing</h4>
            <p className="text-muted-foreground text-sm">
              Our AI continuously monitors DeFi protocols for the best yield opportunities.
              When better rates are available, it automatically rebalances your position to
              maximize returns while managing risk.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Risk Management</h4>
            <p className="text-muted-foreground text-sm">
              Funds are diversified across multiple protocols to reduce single-point-of-failure
              risk. Each protocol is vetted for security and liquidity before inclusion.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Gas Optimization</h4>
            <p className="text-muted-foreground text-sm">
              Rebalancing is batched and timed to minimize gas costs. The AI only rebalances
              when the expected yield improvement exceeds transaction costs.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
