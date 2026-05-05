"use client";

import { BarChart3 } from "lucide-react";
import { memo } from "react";
import { useResultData } from "../../hooks/use-result-data";
import { ProtocolCard, EmptyState } from "@/features/protocols/cards/base/protocol-card";
import { MetricBox, Bar } from "@/features/protocols/cards/base/indicators";
import { APYDisplay, RiskBadge, ProtocolBadge } from "../base/indicators";

interface AccountPosition {
  poolName?: string;
  pool_name?: string;
  protocol: string;
  valueUsd?: number;
  value_usd?: number;
  apy: number;
  allocationPercent?: number;
  allocation_percent?: number;
}

interface AccountStrategyData {
  has_account?: boolean;
  hasAccount?: boolean;
  status?: string;
  preset?: string;
  baseAsset?: string;
  base_asset?: string;
  activeAssets?: string[];
  active_assets?: string[];
  totalValueUsd?: number;
  total_value_usd?: number;
  totalDepositedUsd?: number;
  total_deposited_usd?: number;
  currentApy?: number;
  current_apy?: number;
  profitUsd?: number;
  profit_usd?: number;
  profitPercent?: number;
  profit_percent?: number;
  positions?: AccountPosition[];
  next_step?: string;
  nextStep?: string;
  position_count?: number;
  positionCount?: number;
  message?: string;
  error?: string;
}

interface AccountStrategyCardProps {
  type?: string;
  toolName?: string;
  args?: Record<string, any>;
  result: any;
  toolCallId?: string;
  status?: string;
}

const PRESET_RISK: Record<string, "low" | "medium" | "high"> = {
  SAFE: "low",
  BALANCED: "medium",
  AGGRESSIVE: "high",
};

function AccountStrategyCardComponent({
  result,
  status,
}: AccountStrategyCardProps) {
  const { data, isLoading, hasError, errorMessage } =
    useResultData<AccountStrategyData>(result, status);

  const hasAccount = data?.has_account ?? data?.hasAccount ?? false;
  const preset = (data?.preset ?? "BALANCED").toUpperCase();
  const totalValue = data?.totalValueUsd ?? data?.total_value_usd;
  const currentApy = data?.currentApy ?? data?.current_apy;
  const profitUsd = data?.profitUsd ?? data?.profit_usd;
  const profitPercent = data?.profitPercent ?? data?.profit_percent;
  const positions = data?.positions ?? [];

  if (!hasAccount) {
    return (
      <ProtocolCard
        data-testid="card-account-strategy"
        mode="chat"
        title="No Smart Account Found"
        subtitle="Create one to start earning yield"
        icon={BarChart3}
        iconColor="text-muted-foreground"
        iconBg="bg-muted/30"
        isLoading={isLoading}
        error={hasError ? errorMessage : undefined}
      >
        <EmptyState icon={BarChart3} text="Deploy a smart account to access auto-rebalancing strategies" />
      </ProtocolCard>
    );
  }

  return (
    <ProtocolCard
      data-testid="card-account-strategy"
      mode="chat"
      title="Your Smart Account"
      subtitle={`${preset} \u00B7 ${data?.status ?? "ACTIVE"}`}
      icon={BarChart3}
      iconColor="text-violet-500"
      iconBg="bg-violet-500/10"
      isLoading={isLoading}
      error={hasError ? errorMessage : undefined}
    >
      {/* Overview metrics */}
      <div className="mb-3 grid grid-cols-2 gap-1.5">
        {totalValue != null && (
          <MetricBox label="Total Value" value={`$${totalValue.toLocaleString()}`} />
        )}
        {currentApy != null && (
          <div className="rounded-lg bg-secondary px-2.5 py-2">
            <p className="text-[10px] text-muted-foreground mb-0.5">Current APY</p>
            <p className="text-sm font-semibold">
              <APYDisplay value={currentApy} />
            </p>
          </div>
        )}
        {profitUsd != null && (
          <div className="rounded-lg bg-secondary px-2.5 py-2">
            <p className="text-[10px] text-muted-foreground mb-0.5">P&L</p>
            <p className={`text-sm font-semibold ${profitUsd >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {profitUsd >= 0 ? "+" : ""}${profitUsd.toLocaleString()}
              {profitPercent != null && ` (${profitPercent.toFixed(1)}%)`}
            </p>
          </div>
        )}
        <div className="rounded-lg bg-secondary px-2.5 py-2">
          <p className="text-[10px] text-muted-foreground mb-0.5">Preset</p>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold">{preset}</span>
            <RiskBadge risk={PRESET_RISK[preset] ?? "medium"} />
          </div>
        </div>
      </div>

      {/* Positions */}
      {positions.length > 0 && (
        <div className="border-t border-border pt-2">
          <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 px-0.5">
            Positions ({positions.length})
          </p>
          <div className="space-y-1">
            {positions.map((pos, idx) => {
              const poolName = pos.poolName ?? pos.pool_name ?? "Unknown Pool";
              const valueUsd = pos.valueUsd ?? pos.value_usd ?? 0;
              const allocation = pos.allocationPercent ?? pos.allocation_percent ?? 0;

              return (
                <div
                  key={idx}
                  className="rounded-lg border border-border p-2.5 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <ProtocolBadge name={pos.protocol} />
                      <span className="text-xs font-medium truncate">{poolName}</span>
                    </div>
                    <div className="text-right ml-2">
                      <div className="text-xs font-semibold tabular-nums">${valueUsd.toLocaleString()}</div>
                      <div className="text-[10px]">
                        <APYDisplay value={pos.apy} />
                      </div>
                    </div>
                  </div>
                  {allocation > 0 && (
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[9px] text-muted-foreground">
                        <span>Allocation</span>
                        <span className="tabular-nums">{allocation}%</span>
                      </div>
                      <Bar value={allocation / 100} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data?.message && (
        <div className="rounded-lg bg-secondary p-2.5 text-muted-foreground text-[10px] mt-2">
          {data.message}
        </div>
      )}
    </ProtocolCard>
  );
}

export const AccountStrategyCard = memo(AccountStrategyCardComponent);
