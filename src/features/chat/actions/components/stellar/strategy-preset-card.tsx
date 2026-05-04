"use client";

import { Flame, Shield, TrendingUp, Wallet } from "lucide-react";
import { memo } from "react";
import { useResultData } from "../../hooks/use-result-data";
import { BaseInfoCard } from "../base/info-card";
import { APYDisplay, RiskBadge } from "../base/indicators";

interface TasmilPreset {
  name: string;
  estimatedApy: number;
  poolCount: number;
  poolTypes: string[];
  risks: string[];
  topPools: Array<{ name: string; apy: number; weightPercent: number }>;
  description?: string;
}

interface StrategyPresetCardProps {
  type?: string;
  toolName?: string;
  args?: Record<string, any>;
  result: any;
  toolCallId?: string;
  status?: string;
}

const PRESET_ICONS: Record<string, typeof Shield> = {
  SAFE: Shield,
  BALANCED: TrendingUp,
  AGGRESSIVE: Flame,
};

const PRESET_COLORS: Record<string, string> = {
  SAFE: "text-blue-500",
  BALANCED: "text-amber-500",
  AGGRESSIVE: "text-red-500",
};

const PRESET_BG: Record<string, string> = {
  SAFE: "bg-blue-500/10",
  BALANCED: "bg-amber-500/10",
  AGGRESSIVE: "bg-red-500/10",
};

const PRESET_RISK: Record<string, "low" | "medium" | "high"> = {
  SAFE: "low",
  BALANCED: "medium",
  AGGRESSIVE: "high",
};

function StrategyPresetCardComponent({
  result,
  status,
}: StrategyPresetCardProps) {
  const { data, isLoading, hasError, errorMessage } = useResultData<{
    presets: TasmilPreset[];
  }>(result, status);

  const presets = data?.presets ?? [];

  return (
    <BaseInfoCard
      data-testid="card-strategy-preset"
      title="Tasmil Strategy Presets"
      subtitle="Auto-rebalancing managed strategies"
      icon={Wallet}
      iconColor="text-violet-500"
      iconBg="bg-violet-500/10"
      isLoading={isLoading}
      error={hasError ? errorMessage : null}
    >
      {presets.length > 0 && (
        <div className="flex flex-col gap-2">
          {presets.map((preset) => {
            const Icon = PRESET_ICONS[preset.name] ?? Shield;
            const iconColor = PRESET_COLORS[preset.name] ?? "text-primary";
            const iconBg = PRESET_BG[preset.name] ?? "bg-primary/10";
            const risk = PRESET_RISK[preset.name] ?? "medium";

            return (
              <div
                key={preset.name}
                className="rounded-lg border bg-card/30 p-3 transition-colors hover:border-primary/30"
              >
                {/* Header */}
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${iconBg}`}
                    >
                      <Icon className={`h-4 w-4 ${iconColor}`} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{preset.name}</div>
                      <div className="text-muted-foreground text-xs">
                        {preset.poolCount} pools · {preset.poolTypes.join(", ")}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-green-500">
                      <APYDisplay value={preset.estimatedApy} />
                    </div>
                    <RiskBadge risk={risk} />
                  </div>
                </div>

                {/* Description */}
                {preset.description && (
                  <p className="mb-2 text-muted-foreground text-xs">
                    {preset.description}
                  </p>
                )}

                {/* Top pools */}
                {preset.topPools && preset.topPools.length > 0 && (
                  <div className="space-y-1 border-t pt-2">
                    <div className="text-muted-foreground text-[10px] uppercase tracking-wide">
                      Top Allocations
                    </div>
                    {preset.topPools.map((pool, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="truncate">{pool.name}</span>
                        <div className="flex items-center gap-2">
                          {/* Mini allocation bar */}
                          <div className="h-1 w-12 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary/60"
                              style={{ width: `${pool.weightPercent}%` }}
                            />
                          </div>
                          <span className="w-10 text-right tabular-nums text-muted-foreground">
                            {pool.weightPercent}%
                          </span>
                          <span className="w-12 text-right tabular-nums text-green-500 font-medium">
                            ~{pool.apy.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && !hasError && presets.length === 0 && (
        <div className="text-muted-foreground text-sm">
          No strategy presets available. Try specifying an asset (USDC or XLM).
        </div>
      )}
    </BaseInfoCard>
  );
}

export const StrategyPresetCard = memo(StrategyPresetCardComponent);
