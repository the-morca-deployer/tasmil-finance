"use client";

import { BarChart3, Coins, Shield, Vault } from "lucide-react";
import { cn } from "@/lib/utils";
import { cleanVaultName, fmt, trunc } from "../../lib/formatting";
import type { CardMode } from "../../schemas/common.schema";
import type { DefindexVaultDetailProps } from "../../schemas/defindex.schema";
import { CardHeader, MetricBox } from "../base/indicators";
import { ProtocolCard } from "../base/protocol-card";

interface Props {
  vault: DefindexVaultDetailProps;
  mode?: CardMode;
}

export function DefindexVaultDetailCard({ vault, mode = "playground" }: Props) {
  const totalFee = (vault.feesBps?.vaultFee ?? 0) + (vault.feesBps?.defindexFee ?? 0);

  return (
    <ProtocolCard
      data-testid="card-defindex-vault-detail"
      mode={mode}
      title={mode === "chat" ? vault.name : undefined}
      icon={mode === "chat" ? Vault : undefined}
    >
      {mode === "playground" && (
        <CardHeader
          icon={<Vault className="h-3.5 w-3.5" />}
          title={cleanVaultName(vault.name)}
          right={<StatusBadge status={vault.status} />}
        />
      )}

      {/* Vault contract. The drill-down view is where the on-chain identity
          belongs, and it was previously not shown anywhere at all. */}
      {vault.address && (
        <p className="break-all px-4 pt-2 font-mono text-[10px] text-muted-foreground/50">
          {vault.address}
        </p>
      )}

      {/* Metrics row */}
      <div className="px-4 py-3">
        <div className="grid grid-cols-3 gap-2">
          <MetricBox label="APY" value={vault.apy != null ? `${vault.apy.toFixed(2)}%` : "-"} />
          <MetricBox label="Symbol" value={vault.symbol ?? "-"} />
          <MetricBox label="Total Fee" value={`${(totalFee / 100).toFixed(2)}%`} />
        </div>
      </div>

      {/* Assets & Strategies */}
      {vault.assets && vault.assets.length > 0 && (
        <div className="space-y-2 px-4 pb-3">
          <SectionLabel icon={<Coins className="h-3 w-3" />} title="Assets & Strategies" />
          {vault.assets.map((asset) => (
            <div key={asset.address} className="space-y-1.5 rounded-lg bg-secondary/50 p-2.5">
              <div className="space-y-0.5">
                <span className="font-medium text-foreground text-xs">{asset.symbol}</span>
                {asset.address && (
                  <span className="block break-all font-mono text-[10px] text-muted-foreground/50">
                    {asset.address}
                  </span>
                )}
              </div>
              {asset.strategies.map((s) => (
                <div key={s.address} className="flex items-start gap-2 pl-2">
                  <div
                    className={cn(
                      "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
                      s.paused ? "bg-amber-400" : "bg-emerald-400"
                    )}
                  />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {s.name}
                    </span>
                    {s.address && (
                      <span className="block break-all font-mono text-[10px] text-muted-foreground/50">
                        {s.address}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Fund Breakdown */}
      {vault.totalManagedFunds && vault.totalManagedFunds.length > 0 && (
        <div className="space-y-2 px-4 pb-3">
          <SectionLabel icon={<BarChart3 className="h-3 w-3" />} title="Fund Breakdown" />
          {vault.totalManagedFunds.map((fund) => {
            const total = Number(fund.total_amount) / 1e7;
            const idle = Number(fund.idle_amount) / 1e7;
            const invested = Number(fund.invested_amount) / 1e7;
            const idlePct = total > 0 ? (idle / total) * 100 : 0;

            return (
              <div key={fund.asset} className="space-y-1.5 rounded-lg bg-secondary/50 p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0 break-all font-mono text-[10px] text-muted-foreground/50">
                    {fund.asset}
                  </span>
                  <span className="shrink-0 font-medium text-foreground text-xs tabular-nums">
                    {fmt(total)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <MiniStat label="Idle" value={fmt(idle)} sub={`${idlePct.toFixed(1)}%`} />
                  <MiniStat
                    label="Invested"
                    value={fmt(invested)}
                    sub={`${(100 - idlePct).toFixed(1)}%`}
                  />
                </div>
                {/* Allocation bar */}
                <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-border">
                  <div className="h-full bg-muted-foreground/30" style={{ width: `${idlePct}%` }} />
                  <div
                    className="h-full bg-emerald-400/60"
                    style={{ width: `${100 - idlePct}%` }}
                  />
                </div>
                {fund.strategy_allocations.length > 0 && (
                  <div className="space-y-0.5 pt-1">
                    {fund.strategy_allocations.map((sa) => (
                      <div key={sa.strategy_address} className="flex items-start gap-2 text-[10px]">
                        <div
                          className={cn(
                            "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
                            sa.paused ? "bg-amber-400" : "bg-emerald-400"
                          )}
                        />
                        <span className="min-w-0 flex-1 break-all font-mono text-muted-foreground/60">
                          {sa.strategy_address}
                        </span>
                        <span className="shrink-0 text-muted-foreground tabular-nums">
                          {fmt(Number(sa.amount) / 1e7)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Roles */}
      {vault.roles && (
        <div className="space-y-2 px-4 pb-3">
          <SectionLabel icon={<Shield className="h-3 w-3" />} title="Roles" />
          <div className="space-y-1 rounded-lg bg-secondary/50 p-2.5">
            <RoleRow label="Manager" address={vault.roles.manager} />
            <RoleRow label="Emergency" address={vault.roles.emergencyManager} />
            <RoleRow label="Rebalance" address={vault.roles.rebalanceManager} />
            <RoleRow label="Fee Receiver" address={vault.roles.feeReceiver} />
          </div>
        </div>
      )}

      {/* Fees */}
      {vault.feesBps && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-muted-foreground">
              Vault Fee:{" "}
              <span className="font-medium text-foreground">
                {(vault.feesBps.vaultFee / 100).toFixed(2)}%
              </span>
            </span>
            <span className="text-muted-foreground/30">|</span>
            <span className="text-muted-foreground">
              DeFindex Fee:{" "}
              <span className="font-medium text-foreground">
                {(vault.feesBps.defindexFee / 100).toFixed(2)}%
              </span>
            </span>
          </div>
        </div>
      )}
    </ProtocolCard>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isOk = status === "ok";
  return (
    <span
      className={cn(
        "rounded-md px-1.5 py-px font-medium text-[10px]",
        isOk ? "bg-emerald-400/10 text-emerald-400" : "bg-amber-400/10 text-amber-400"
      )}
    >
      {isOk ? "Active" : "Unavailable"}
    </span>
  );
}

function SectionLabel({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground/60">{icon}</span>
      <span className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
        {title}
      </span>
    </div>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-[9px] text-muted-foreground/50 uppercase">{label}</p>
      <p className="text-foreground text-xs tabular-nums">
        {value}
        {sub && <span className="ml-1 text-muted-foreground/60">({sub})</span>}
      </p>
    </div>
  );
}

function RoleRow({ label, address }: { label: string; address: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className="font-mono text-[10px] text-muted-foreground/70">{trunc(address, 8, 6)}</span>
    </div>
  );
}
