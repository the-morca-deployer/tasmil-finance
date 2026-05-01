"use client";

import { TrendingUp, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { TokenImage } from "@/shared/components/token-image";
import type { CardMode } from "../../schemas/common.schema";
import { ProtocolCard, EmptyState } from "../base/protocol-card";
import { CardHeader } from "../base/indicators";
import { fmt, cleanVaultName } from "../../lib/formatting";

interface YieldOpportunity {
  protocol: string;
  protocolType?: string;
  type?: string;
  pool?: string;
  poolAddress?: string;
  name?: string;
  symbol?: string;
  poolName?: string;
  assets: string[];
  apy: number | { base?: number; reward?: number | null; total?: number } | null;
  tvl: number | string | null;
  risk?: string;
  riskLevel?: string;
  status?: string;
}

interface Props {
  opportunities: YieldOpportunity[];
  mode?: CardMode;
}

export function DefindexYieldCard({ opportunities, mode = "playground" }: Props) {
  if (!opportunities.length) {
    return (
      <ProtocolCard mode={mode} title="Yield Opportunities" icon={TrendingUp}>
        <EmptyState icon={Layers} text="No yield opportunities found" />
      </ProtocolCard>
    );
  }

  return (
    <ProtocolCard mode={mode} title={mode === "chat" ? "DeFindex Vaults" : undefined} icon={mode === "chat" ? TrendingUp : undefined}>
      {mode === "playground" && (
        <CardHeader
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          title="DeFindex Vaults"
          right={<span className="text-xs text-muted-foreground">{opportunities.length}</span>}
        />
      )}

      {/* Table header */}
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center px-4 py-2 border-b border-border text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
        <span>Vault</span>
        <span className="w-24 text-right">TVL</span>
        <span className="w-16 text-center">Exposure</span>
        <span className="w-16 text-right">APY</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/50">
        {opportunities.map((opp, i) => {
          const tvlNum = opp.tvl != null ? Number(opp.tvl) / 1e7 : null;
          const apyRaw = opp.apy;
          const apyNum = typeof apyRaw === "object" && apyRaw !== null ? (apyRaw.total ?? apyRaw.base ?? null) : apyRaw;
          const rawName = opp.name ?? opp.poolName ?? "Vault";
          const displayName = cleanVaultName(rawName);
          const symbol = opp.symbol || "";
          const asset = opp.assets[0] ?? "—";

          return (
            <div
              key={opp.poolAddress ?? opp.pool ?? i}
              className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center px-4 py-3 hover:bg-muted/20 transition-colors"
            >
              {/* Vault name + symbol */}
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-foreground truncate">{displayName}</p>
                {symbol && (
                  <p className="text-[10px] text-muted-foreground/60 uppercase">{symbol}</p>
                )}
              </div>

              {/* TVL */}
              <div className="w-24 text-right">
                <p className="text-xs font-medium text-foreground tabular-nums">
                  {tvlNum != null ? `${fmt(tvlNum)} ${asset}` : "—"}
                </p>
                <p className="text-[10px] text-muted-foreground/60">{asset}</p>
              </div>

              {/* Exposure */}
              <div className="w-16 flex items-center justify-center gap-1.5">
                <TokenImage src={null} alt={asset} className="h-4 w-4 rounded-full shrink-0" />
                <span className="text-[11px] text-muted-foreground">{asset}</span>
              </div>

              {/* APY */}
              <div className="w-16 text-right">
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    apyNum != null && apyNum > 0 ? "text-emerald-400" : "text-muted-foreground",
                  )}
                >
                  {apyNum != null ? `${apyNum.toFixed(2)}%` : "—"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </ProtocolCard>
  );
}
