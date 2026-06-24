"use client";

import { AlertCircle, Loader2, RefreshCw, Trophy } from "lucide-react";
import Link from "next/link";
import { useLeaderboard } from "@/features/marketplace/hooks/use-marketplace-api";
import type { LeaderboardEntry } from "@/features/marketplace/types";
import { Button } from "@/shared/ui/button";

function getRiskTier(entry: LeaderboardEntry): { label: string; color: string } {
  if (entry.perfFeeBps <= 100) return { label: "Conservative", color: "badge-green" };
  if (entry.perfFeeBps <= 250) return { label: "Balanced", color: "badge-amber" };
  return { label: "Aggressive", color: "badge-red" };
}

function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatCount(value: number): string {
  if (value >= 1_000) return value.toLocaleString();
  return String(value);
}

export default function LeaderboardPage() {
  const { data, isLoading, error, refetch } = useLeaderboard();

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-[1100px] items-center justify-center px-[clamp(20px,5vw,72px)] py-24">
        <Loader2 className="h-8 w-8 animate-spin text-white/30" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex max-w-[1100px] flex-col items-center justify-center px-[clamp(20px,5vw,72px)] py-24">
        <AlertCircle className="h-8 w-8 text-red-400" />
        <p className="mt-4 text-sm text-red-400">Failed to load leaderboard</p>
        <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  const entries = data ?? [];

  if (entries.length === 0) {
    return (
      <div className="mx-auto max-w-[1100px] px-[clamp(20px,5vw,72px)] py-24 text-center">
        <Trophy className="mx-auto h-12 w-12 text-white/20" />
        <h1 className="mt-4 text-2xl font-bold text-[#F4F7FB]">Strategy Leaderboard</h1>
        <p className="mt-2 text-sm text-[rgba(244,247,251,0.58)]">
          No strategies ranked yet. Check back soon.
        </p>
      </div>
    );
  }

  const sorted = [...entries].sort((a, b) => a.rank - b.rank);
  const podium = sorted.slice(0, 3);

  // Reorder podium: 2nd, 1st, 3rd for the visual layout
  const podiumOrdered = [podium[1], podium[0], podium[2]].filter(Boolean);

  return (
    <div className="mx-auto max-w-[1100px] px-[clamp(20px,5vw,72px)]">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-8 pt-11">
        <div>
          <span className="mb-2.5 inline-flex items-center gap-2.5 text-[12px] font-semibold uppercase tracking-[0.22em] text-[#67E8F9] before:block before:h-px before:w-[26px] before:bg-[#67E8F9]/60">
            Rankings
          </span>
          <h1 className="text-[clamp(28px,4vw,44px)] font-extrabold leading-[0.97] tracking-[-0.04em] text-[#F4F7FB]">
            Strategy{" "}
            <span className="bg-gradient-to-r from-white via-[#67E8F9] to-[#0EA5E9] bg-clip-text text-transparent">
              Leaderboard
            </span>
          </h1>
          <p className="mt-2 max-w-[480px] text-[15px] text-[rgba(244,247,251,0.58)]">
            Top-performing strategies ranked by APY. Updated every 30 minutes.
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-7 flex flex-wrap items-center gap-3 rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[rgba(20,28,40,0.30)] px-5 py-3.5">
        <span className="ml-auto whitespace-nowrap text-[13px] text-[rgba(244,247,251,0.34)]">
          Top{" "}
          <span className="font-semibold text-[#67E8F9]">{entries.length}</span> strategies
        </span>
      </div>

      {/* Podium */}
      {podiumOrdered.length === 3 && (
        <div className="mb-10 grid grid-cols-[1fr_1.2fr_1fr] items-end gap-4 max-md:grid-cols-1 max-md:gap-3">
          {podiumOrdered.map((entry) => {
            const isFirst = entry.rank === 1;
            return (
              <Link
                key={entry.id}
                href={`/strategies/${entry.id}`}
                className={`block rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[#0D111A] p-7 text-center transition-colors hover:bg-[#0D111A]/80 ${
                  isFirst ? "scale-[1.04] max-md:scale-100" : ""
                }`}
              >
                <span
                  className={`mx-auto mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full font-mono text-[13px] font-bold ${
                    entry.rank === 1
                      ? "bg-gradient-to-r from-white via-[#67E8F9] to-[#0EA5E9] text-[#04141A] shadow-[0_0_20px_-4px_rgba(103,232,249,0.5)]"
                      : "border border-[rgba(103,232,249,0.32)] bg-[rgba(103,232,249,0.14)] text-[#67E8F9]"
                  }`}
                >
                  {entry.rank}
                </span>
                <div className="text-[17px] font-bold tracking-[-0.02em] text-[#F4F7FB]">
                  {entry.name}
                </div>
                <div className="mb-3 text-[13px] text-[rgba(244,247,251,0.58)]">
                  {entry.publisher}
                </div>
                <div className="bg-gradient-to-r from-white via-[#67E8F9] to-[#0EA5E9] bg-clip-text text-[clamp(22px,2.5vw,32px)] font-extrabold tracking-[-0.03em] text-transparent">
                  {entry.currentApy.toFixed(1)}%
                </div>
                <div className="mt-0.5 text-[11px] uppercase tracking-[0.1em] text-[rgba(244,247,251,0.34)]">
                  APY
                </div>
                <div className="mt-3.5 flex justify-center gap-5 border-t border-[rgba(255,255,255,0.08)] pt-3.5">
                  <div className="text-center">
                    <div className="font-mono text-[14px] font-semibold text-[rgba(244,247,251,0.58)]">
                      {formatUsd(entry.tvlUsd)}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.06em] text-[rgba(244,247,251,0.34)]">
                      TVL
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-mono text-[14px] font-semibold text-[rgba(244,247,251,0.58)]">
                      {formatCount(entry.activatedCount)}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.06em] text-[rgba(244,247,251,0.34)]">
                      Users
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Desktop table */}
      <div className="mb-10 overflow-hidden rounded-[22px] border border-[rgba(255,255,255,0.08)]">
        <table className="w-full border-collapse">
          <thead className="bg-[#0D111A]">
            <tr>
              <th className="px-[18px] py-3.5 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgba(244,247,251,0.34)]">
                #
              </th>
              <th className="px-[18px] py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgba(244,247,251,0.34)]">
                Strategy
              </th>
              <th className="px-[18px] py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgba(244,247,251,0.34)]">
                Publisher
              </th>
              <th className="px-[18px] py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgba(244,247,251,0.34)]">
                APY
              </th>
              <th className="px-[18px] py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgba(244,247,251,0.34)]">
                TVL
              </th>
              <th className="px-[18px] py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgba(244,247,251,0.34)]">
                Users
              </th>
              <th className="px-[18px] py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgba(244,247,251,0.34)]">
                Risk
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry) => {
              const risk = getRiskTier(entry);
              const rankColor =
                entry.rank === 1
                  ? "text-[#67E8F9]"
                  : entry.rank === 2
                    ? "text-[#0EA5E9]"
                    : entry.rank === 3
                      ? "text-[#0369A1]"
                      : "";

              const badgeColor =
                risk.color === "badge-green"
                  ? "border-[rgba(110,231,183,0.5)] bg-[rgba(110,231,183,0.08)] text-[#6EE7B7]"
                  : risk.color === "badge-amber"
                    ? "border-[rgba(251,191,36,0.5)] bg-[rgba(251,191,36,0.08)] text-[#FBBF24]"
                    : "border-[rgba(248,113,113,0.5)] bg-[rgba(248,113,113,0.08)] text-[#F87171]";

              return (
                <tr
                  key={entry.id}
                  className="border-b border-[rgba(255,255,255,0.08)] transition-colors hover:bg-[rgba(103,232,249,0.14)] last:border-b-0"
                >
                  <td
                    className={`px-[18px] py-4 text-center font-mono text-[14px] font-bold ${rankColor}`}
                  >
                    {entry.rank}
                  </td>
                  <td className="px-[18px] py-4 text-[14px]">
                    <Link
                      href={`/strategies/${entry.id}`}
                      className="font-semibold text-[#F4F7FB] transition-colors hover:text-[#67E8F9]"
                    >
                      {entry.name}
                    </Link>
                  </td>
                  <td className="px-[18px] py-4 text-[13px] text-[rgba(244,247,251,0.58)]">
                    {entry.publisher}
                  </td>
                  <td className="px-[18px] py-4 font-mono text-[14px] font-semibold text-[#6EE7B7]">
                    {entry.currentApy.toFixed(1)}%
                  </td>
                  <td className="px-[18px] py-4 font-mono text-[14px] text-[#F4F7FB]">
                    {formatUsd(entry.tvlUsd)}
                  </td>
                  <td className="px-[18px] py-4 text-[14px] text-[rgba(244,247,251,0.58)]">
                    {formatCount(entry.activatedCount)}
                  </td>
                  <td className="px-[18px] py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-[100px] border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${badgeColor}`}
                    >
                      {risk.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mb-10 hidden flex-col gap-3 max-md:flex">
        {sorted.map((entry) => {
          const rankColor =
            entry.rank === 1
              ? "text-[#67E8F9]"
              : entry.rank === 2
                ? "text-[#0EA5E9]"
                : entry.rank === 3
                  ? "text-[#0369A1]"
                  : "text-[rgba(244,247,251,0.34)]";

          return (
            <Link
              key={entry.id}
              href={`/strategies/${entry.id}`}
              className="flex items-center gap-3.5 rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[#0D111A] p-4 transition-colors hover:bg-[#0D111A]/80"
            >
              <span className={`min-w-[32px] font-mono text-[15px] font-bold ${rankColor}`}>
                #{entry.rank}
              </span>
              <div className="flex-1">
                <div className="text-[14px] font-semibold text-[#F4F7FB]">{entry.name}</div>
                <div className="text-[12px] text-[rgba(244,247,251,0.58)]">{entry.publisher}</div>
                <div className="mt-0.5 text-[11px] text-[rgba(244,247,251,0.34)]">
                  {formatUsd(entry.tvlUsd)} TVL · {formatCount(entry.activatedCount)} users
                </div>
              </div>
              <div className="text-right font-mono text-[16px] font-semibold text-[#6EE7B7]">
                {entry.currentApy.toFixed(1)}%
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
