"use client";

import { BarChart3 } from "lucide-react";
import { memo } from "react";
import { useResultData } from "../../hooks/use-result-data";
import { BaseInfoCard } from "../base/info-card";
import { APYDisplay, ProtocolBadge, RiskBadge } from "../base/indicators";

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
      <BaseInfoCard
        data-testid="card-account-strategy"
        title="No Smart Account Found"
        subtitle="Create one to start earning yield"
        icon={BarChart3}
        iconColor="text-muted-foreground"
        iconBg="bg-muted/30"
        isLoading={isLoading}
        error={hasError ? errorMessage : null}
      >
        <p className="text-muted-foreground text-sm">
          You don't have a Tasmil smart account yet. Deploy one to access
          auto-rebalancing strategies across top Stellar DeFi protocols.
        </p>
      </BaseInfoCard>
    );
  }

  return (
    <BaseInfoCard
      data-testid="card-account-strategy"
      title="Your Smart Account"
      subtitle={`${preset} · ${data?.status ?? "ACTIVE"}`}
      icon={BarChart3}
      iconColor="text-violet-500"
      iconBg="bg-violet-500/10"
      isLoading={isLoading}
      error={hasError ? errorMessage : null}
    >
      {/* Overview stats */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        {totalValue != null && (
          <div className="rounded bg-muted/30 p-2">
            <div className="text-muted-foreground text-[10px]">Total Value</div>
            <div className="font-semibold text-sm">
              ${totalValue.toLocaleString()}
            </div>
          </div>
        )}
        {currentApy != null && (
          <div className="rounded bg-muted/30 p-2">
            <div className="text-muted-foreground text-[10px]">Current APY</div>
            <div className="font-semibold text-green-500 text-sm">
              <APYDisplay value={currentApy} />
            </div>
          </div>
        )}
        {profitUsd != null && (
          <div className="rounded bg-muted/30 p-2">
            <div className="text-muted-foreground text-[10px]">P&amp;L</div>
            <div
              className={`font-semibold text-sm ${
                profitUsd >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {profitUsd >= 0 ? "+" : ""}${profitUsd.toLocaleString()}
              {profitPercent != null && ` (${profitPercent.toFixed(1)}%)`}
            </div>
          </div>
        )}
        <div className="rounded bg-muted/30 p-2">
          <div className="text-muted-foreground text-[10px]">Preset</div>
          <div className="flex items-center gap-1 font-semibold text-sm">
            {preset}
            <RiskBadge risk={PRESET_RISK[preset] ?? "medium"} />
          </div>
        </div>
      </div>

      {/* Positions list */}
      {positions.length > 0 && (
        <div className="border-t pt-2">
          <div className="mb-2 text-muted-foreground text-[10px] uppercase tracking-wide">
            Positions ({positions.length})
          </div>
          <div className="space-y-2">
            {positions.map((pos, idx) => {
              const poolName = pos.poolName ?? pos.pool_name ?? "Unknown Pool";
              const valueUsd = pos.valueUsd ?? pos.value_usd ?? 0;
              const allocation = pos.allocationPercent ?? pos.allocation_percent ?? 0;
              const apy = pos.apy ?? 0;

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded border bg-card/20 p-2 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{poolName}</div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <ProtocolBadge name={pos.protocol} />
                      {allocation > 0 && (
                        <span>{allocation}% allocation</span>
                      )}
                    </div>
                  </div>
                  <div className="ml-2 text-right">
                    <div className="font-medium">${valueUsd.toLocaleString()}</div>
                    <div className="text-green-500">
                      <APYDisplay value={apy} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data?.message && (
        <div className="mt-2 rounded bg-muted/30 p-2 text-muted-foreground text-xs">
          {data.message}
        </div>
      )}
    </BaseInfoCard>
  );
}

export const AccountStrategyCard = memo(AccountStrategyCardComponent);
