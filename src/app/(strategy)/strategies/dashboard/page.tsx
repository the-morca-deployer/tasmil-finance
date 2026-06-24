"use client";

import { AlertCircle, DollarSign, ExternalLink, Loader2, Plus, RefreshCw, Shield } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import {
  type MyAgent,
  useClaimFeesRequest,
  useDeactivateStrategy,
  useMyAgents,
} from "@/features/marketplace/hooks/use-marketplace-api";
import { Button } from "@/shared/ui/button";

function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function computeStats(vaults: MyAgent[]) {
  const activeVaults = vaults.filter((v) => v.activeStrategy);
  const totalTvl = activeVaults.reduce(
    (sum, v) => sum + (v.activeStrategy?.totalDepositedUsd ?? 0),
    0
  );
  const strategyCount = activeVaults.length;
  const avgApy =
    strategyCount > 0
      ? activeVaults.reduce((sum, v) => sum + (v.activeStrategy?.currentApy ?? 0), 0) /
        strategyCount
      : 0;
  const estimatedEarnings = totalTvl * (avgApy / 100);
  const claimable = estimatedEarnings * 0.15;

  return { totalTvl, strategyCount, avgApy, estimatedEarnings, claimable, activeVaults };
}

export default function PublisherDashboardPage() {
  const { data, isLoading, error, refetch } = useMyAgents();
  const deactivate = useDeactivateStrategy();
  const claimFeesRequest = useClaimFeesRequest();

  const usdcTokenId =
    process.env.NEXT_PUBLIC_USDC_TOKEN_ID ??
    "CBIELTK6YBZ5G5QHJRJONBXMAAYJGMJBKYMKCZVOTEM4HLMMBNDNOAVE";

  const vaults = data ?? [];
  const stats = useMemo(() => computeStats(vaults), [vaults]);

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-[1280px] items-center justify-center px-[clamp(20px,5vw,72px)] py-24">
        <Loader2 className="h-8 w-8 animate-spin text-white/30" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-center px-[clamp(20px,5vw,72px)] py-24">
        <AlertCircle className="h-8 w-8 text-red-400" />
        <p className="mt-4 text-sm text-red-400">Failed to load dashboard</p>
        <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  const hasVaults = vaults.length > 0;

  return (
    <div className="mx-auto max-w-[1280px] px-[clamp(20px,5vw,72px)]">
      {/* Page header */}
      <div className="pb-8 pt-11">
        <span className="mb-2.5 inline-flex items-center gap-2.5 text-[12px] font-semibold uppercase tracking-[0.22em] text-[#67E8F9] before:block before:h-px before:w-[26px] before:bg-[#67E8F9]/60">
          Publisher Console
        </span>
        <h1 className="text-[clamp(28px,4vw,44px)] font-extrabold leading-[0.97] tracking-[-0.04em] text-[#F4F7FB]">
          Publisher{" "}
          <span className="bg-gradient-to-r from-white via-[#67E8F9] to-[#0EA5E9] bg-clip-text text-transparent">
            Dashboard
          </span>
        </h1>
      </div>

      {!hasVaults ? (
        <div className="rounded-[22px] border border-dashed border-[rgba(255,255,255,0.14)] py-20 text-center">
          <div className="mx-auto mb-5 flex h-[60px] w-[60px] items-center justify-center rounded-full border border-[rgba(103,232,249,0.32)] bg-[rgba(103,232,249,0.14)] text-2xl">
            ✦
          </div>
          <h3 className="text-[20px] font-bold text-[#F4F7FB]">No agents deployed</h3>
          <p className="mx-auto mt-2 max-w-[400px] text-[15px] text-[rgba(244,247,251,0.58)]">
            Browse the marketplace to find a strategy that matches your risk profile, then activate
            it from one click.
          </p>
          <Link
            href="/strategies"
            className="mt-6 inline-flex items-center gap-2 rounded-[100px] bg-gradient-to-r from-white via-[#67E8F9] to-[#0EA5E9] px-[26px] py-3.5 text-[15px] font-semibold text-[#04141A] transition-transform duration-[400ms] hover:translate-y-[-2px] hover:shadow-[0_10px_40px_-8px_rgba(103,232,249,0.5)]"
          >
            Browse Marketplace →
          </Link>
        </div>
      ) : (
        <>
          {/* Profile card */}
          <div className="mb-8 flex flex-wrap items-center gap-6 rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[#0D111A] p-7">
            <div className="flex h-[60px] w-[60px] flex-none items-center justify-center rounded-full bg-gradient-to-r from-white via-[#67E8F9] to-[#0EA5E9] text-[20px] font-bold text-[#04141A]">
              {vaults[0]?.baseAsset?.slice(0, 2) ?? "VA"}
            </div>
            <div className="flex-1">
              <div className="text-[20px] font-bold tracking-[-0.02em] text-[#F4F7FB]">
                My Vault Portfolio
              </div>
              <div className="max-w-[480px] text-[14px] text-[rgba(244,247,251,0.58)]">
                Automated DeFi yield strategies running on Stellar. Non-custodial.
              </div>
            </div>
            <div className="flex gap-6">
              <div className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[#07090F] px-5 py-2.5 text-center">
                <div className="font-mono text-[20px] font-bold tracking-[-0.02em] text-[#6EE7B7]">
                  {formatUsd(stats.totalTvl)}
                </div>
                <div className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-[rgba(244,247,251,0.34)]">
                  Total TVL
                </div>
              </div>
              <div className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[#07090F] px-5 py-2.5 text-center">
                <div className="font-mono text-[20px] font-bold tracking-[-0.02em] text-[#F4F7FB]">
                  {stats.strategyCount}
                </div>
                <div className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-[rgba(244,247,251,0.34)]">
                  Strategies
                </div>
              </div>
              <div className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[#07090F] px-5 py-2.5 text-center">
                <div className="font-mono text-[20px] font-bold tracking-[-0.02em] text-[#F4F7FB]">
                  {vaults.length}
                </div>
                <div className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-[rgba(244,247,251,0.34)]">
                  Vaults
                </div>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="mb-8 grid grid-cols-3 gap-4 max-md:grid-cols-2 max-sm:grid-cols-1">
            <div className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[#0D111A] p-5">
              <div className="text-[11px] uppercase tracking-[0.08em] text-[rgba(244,247,251,0.34)]">
                Total Earnings
              </div>
              <div className="font-mono text-[clamp(20px,2.5vw,30px)] font-bold tracking-[-0.03em] text-[#6EE7B7]">
                {formatUsd(stats.estimatedEarnings)}
              </div>
              <div className="mt-1 text-[12px] text-[rgba(244,247,251,0.58)]">
                Lifetime fee revenue (est.)
              </div>
            </div>
            <div className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[#0D111A] p-5">
              <div className="text-[11px] uppercase tracking-[0.08em] text-[rgba(244,247,251,0.34)]">
                Avg Strategy APY
              </div>
              <div className="text-[clamp(20px,2.5vw,30px)] font-bold tracking-[-0.03em] text-[#6EE7B7]">
                {stats.avgApy.toFixed(1)}%
              </div>
              <div className="mt-1 text-[12px] text-[rgba(244,247,251,0.58)]">
                Weighted across all strategies
              </div>
            </div>
            <div className="rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[#0D111A] p-5">
              <div className="flex items-center justify-between">
                <div className="text-[11px] uppercase tracking-[0.08em] text-[rgba(244,247,251,0.34)]">
                  Claimable
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-[100px] border border-[rgba(110,231,183,0.5)] bg-[rgba(110,231,183,0.08)] px-3 py-1 text-[11px] font-semibold text-[#6EE7B7] transition-all duration-[400ms] hover:translate-y-[-1px] hover:border-[#6EE7B7] hover:bg-[rgba(110,231,183,0.16)] disabled:opacity-50"
                  onClick={() => claimFeesRequest.mutate(usdcTokenId)}
                  disabled={claimFeesRequest.isPending}
                >
                  {claimFeesRequest.isPending ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" /> Claiming...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-3 w-3" /> Claim
                    </>
                  )}
                </button>
              </div>
              <div className="font-mono text-[clamp(20px,2.5vw,30px)] font-bold tracking-[-0.03em] text-[#6EE7B7]">
                {formatUsd(stats.claimable)}
              </div>
              <div className="mt-1 text-[12px] text-[rgba(244,247,251,0.58)]">
                Available to withdraw
              </div>
            </div>
          </div>

          {/* My Strategies table */}
          <div className="pb-8 pt-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[20px] font-bold tracking-[-0.025em] text-[#F4F7FB]">
                My <span className="text-[#67E8F9]">Vaults</span>
              </h2>
              <Link
                href="/strategies/create"
                className="inline-flex items-center gap-2 rounded-[100px] border border-[rgba(34,211,238,0.3)] bg-[rgba(103,232,249,0.14)] px-5 py-2.5 text-[14px] font-semibold text-[#67E8F9] transition-transform duration-[400ms] hover:translate-y-[-2px] hover:border-[#67E8F9]"
              >
                <Plus className="h-4 w-4" /> Publish Strategy
              </Link>
            </div>
            <div className="overflow-hidden rounded-[22px] border border-[rgba(255,255,255,0.08)]">
              <table className="w-full border-collapse">
                <thead className="bg-[#0D111A]">
                  <tr>
                    <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgba(244,247,251,0.34)]">
                      Vault
                    </th>
                    <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgba(244,247,251,0.34)]">
                      Strategy
                    </th>
                    <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgba(244,247,251,0.34)]">
                      APY
                    </th>
                    <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgba(244,247,251,0.34)]">
                      Deposited
                    </th>
                    <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgba(244,247,251,0.34)]">
                      Status
                    </th>
                    <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgba(244,247,251,0.34)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {vaults.map((vault) => {
                    const isActive = vault.status === "ACTIVE" && vault.activeStrategy;
                    return (
                      <tr
                        key={vault.keeperWalletAddress}
                        className="border-b border-[rgba(255,255,255,0.08)] transition-colors hover:bg-[rgba(103,232,249,0.14)] last:border-b-0"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-[#67E8F9]" />
                            <span className="text-[14px] font-semibold text-[#F4F7FB]">
                              {vault.baseAsset} Vault
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {vault.activeStrategy ? (
                            <div>
                              <div className="text-[14px] font-semibold text-[#F4F7FB]">
                                {vault.activeStrategy.name}
                              </div>
                              <div className="text-[13px] text-[rgba(244,247,251,0.58)]">
                                by {vault.activeStrategy.publisherName}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[13px] text-[rgba(244,247,251,0.34)]">
                              No active strategy
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {vault.activeStrategy ? (
                            <span className="font-mono text-[14px] font-semibold text-[#6EE7B7]">
                              {vault.activeStrategy.currentApy.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-[14px] text-[rgba(244,247,251,0.34)]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {vault.activeStrategy ? (
                            <span className="font-mono text-[14px] text-[#F4F7FB]">
                              {formatUsd(vault.activeStrategy.totalDepositedUsd)}
                            </span>
                          ) : (
                            <span className="text-[14px] text-[rgba(244,247,251,0.34)]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-[100px] border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${
                              isActive
                                ? "border-[rgba(110,231,183,0.5)] bg-[rgba(110,231,183,0.08)] text-[#6EE7B7]"
                                : "border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.04)] text-[rgba(244,247,251,0.34)]"
                            }`}
                          >
                            {vault.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            {vault.activeStrategy && (
                              <>
                                <Link
                                  href={`/strategies/${vault.activeStrategy.strategyId}`}
                                  className="inline-flex items-center gap-1.5 rounded-[100px] border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-[14px] font-semibold text-[#F4F7FB] transition-transform duration-[400ms] hover:translate-y-[-2px] hover:border-[#67E8F9]"
                                >
                                  View <ExternalLink className="h-3 w-3" />
                                </Link>
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1.5 rounded-[100px] border border-[rgba(248,113,113,0.5)] bg-[rgba(248,113,113,0.08)] px-4 py-2 text-[14px] font-semibold text-[#F87171] transition-transform duration-[400ms] hover:translate-y-[-2px] hover:border-[#F87171] hover:bg-[rgba(248,113,113,0.16)] disabled:opacity-50"
                                  onClick={() =>
                                    deactivate.mutate(vault.activeStrategy!.strategyId)
                                  }
                                  disabled={deactivate.isPending}
                                >
                                  Deactivate
                                </button>
                              </>
                            )}
                            {!vault.activeStrategy && (
                              <Link
                                href="/strategies"
                                className="inline-flex items-center gap-2 rounded-[100px] bg-gradient-to-r from-white via-[#67E8F9] to-[#0EA5E9] px-4 py-2 text-[14px] font-semibold text-[#04141A] transition-transform duration-[400ms] hover:translate-y-[-2px]"
                              >
                                Browse Strategies →
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Claim History */}
          <div className="pb-8 pt-8">
            <div className="mb-6">
              <h2 className="text-[20px] font-bold tracking-[-0.025em] text-[#F4F7FB]">
                Claim <span className="text-[#67E8F9]">History</span>
              </h2>
            </div>
            <div className="overflow-hidden rounded-[22px] border border-[rgba(255,255,255,0.08)]">
              <table className="w-full border-collapse">
                <thead className="bg-[#0D111A]">
                  <tr>
                    <th className="px-[18px] py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgba(244,247,251,0.34)]">
                      TX Hash
                    </th>
                    <th className="px-[18px] py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgba(244,247,251,0.34)]">
                      Amount
                    </th>
                    <th className="px-[18px] py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgba(244,247,251,0.34)]">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      colSpan={3}
                      className="px-[18px] py-12 text-center text-[14px] text-[rgba(244,247,251,0.34)]"
                    >
                      No claim history yet. Earnings accumulate as strategies generate yield.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
