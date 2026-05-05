"use client";

import { Flame, Shield, TrendingUp, Wallet } from "lucide-react";
import { memo } from "react";
import { useResultData } from "../../hooks/use-result-data";
import { ProtocolCard, EmptyState } from "@/features/protocols/cards/base/protocol-card";
import { Bar } from "@/features/protocols/cards/base/indicators";
import { ScrollableList } from "../base/indicators";

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

function StrategyPresetCardComponent({
  result,
  status,
}: StrategyPresetCardProps) {
  const { data, isLoading, hasError, errorMessage } = useResultData<{
    presets: TasmilPreset[];
  }>(result, status);

  const presets = data?.presets ?? [];

  return (
    <ProtocolCard
      data-testid="card-strategy-preset"
      mode="chat"
      title="Tasmil Strategy Presets"
      subtitle="Auto-rebalancing managed strategies"
      icon={Wallet}
      iconColor="text-primary"
      iconBg="bg-primary/10"
      isLoading={isLoading}
      error={hasError ? errorMessage : undefined}
    >
      {presets.length > 0 ? (
        <div className="flex flex-col gap-2">
          {presets.map((preset) => {
            const Icon = PRESET_ICONS[preset.name] ?? Shield;

            return (
              <div
                key={preset.name}
                className="rounded-lg border border-border p-3 transition-colors hover:bg-muted/20"
              >
                {/* Header */}
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                      <Icon className="h-4 w-4 text-foreground" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{preset.name}</div>
                      <div className="text-muted-foreground text-[10px]">
                        {preset.poolCount} pools {"\u00B7"} {preset.poolTypes.join(", ")}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-foreground tabular-nums">
                      {preset.estimatedApy.toFixed(2)}%
                    </div>
                    <span className="rounded-md bg-muted px-1.5 py-px text-[10px] font-medium text-muted-foreground">
                      {preset.risks?.[0] ?? "moderate"}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {preset.description && (
                  <p className="mb-2 text-muted-foreground text-[10px]">{preset.description}</p>
                )}

                {/* Top pools with bars */}
                {preset.topPools && preset.topPools.length > 0 && (
                  <div className="space-y-1.5 border-t border-border pt-2">
                    <div className="text-muted-foreground text-[9px] uppercase tracking-wider font-medium">
                      Top Allocations
                    </div>
                    {preset.topPools.map((pool, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="truncate flex-1 mr-2">{pool.name}</span>
                          <span className="tabular-nums text-muted-foreground text-[10px] mr-2">
                            {pool.weightPercent}%
                          </span>
                          <span className="tabular-nums text-foreground font-medium text-[10px] w-12 text-right">
                            ~{pool.apy.toFixed(1)}%
                          </span>
                        </div>
                        <Bar value={pool.weightPercent / 100} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={Wallet} text="No strategy presets available \u2014 try specifying an asset" />
      )}
    </ProtocolCard>
  );
}

export const StrategyPresetCard = memo(StrategyPresetCardComponent);
