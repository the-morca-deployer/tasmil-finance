"use client";

/**
 * The live market list, ported from heron's `pages/pools.tsx`.
 *
 * Two renderings of one dataset — a CSS-grid table on wide viewports and a card
 * stack below `md` — sharing one column track list so the headings and the rows
 * cannot drift apart. `minmax(0, …)` on every track is what lets `truncate`
 * inside a cell do anything; a bare `fr` takes its content as a minimum and the
 * longest row silently widens column one.
 *
 * Every rate here comes off `GET /api/pools` as a decimal fraction and goes
 * through `formatApy`, which is the only place the ×100 happens.
 */

import { cn } from "@/lib/utils";
import type { ConsolePool } from "../types";
import { formatApy, formatTvl, titleCase } from "../utils/format";
import { EmptyNote, Eyebrow, Num, Panel, Pill, RowSkeletons } from "./console-ui";

const COLS = "minmax(0,2.2fr) minmax(0,1fr) minmax(0,1fr) minmax(0,0.9fr)";

function riskTone(score: number): "positive" | "accent" | "warn" {
  if (score <= 1) return "positive";
  if (score <= 3) return "accent";
  return "warn";
}

function riskLabel(score: number): string {
  if (score <= 1) return "Low risk";
  if (score <= 3) return "Moderate risk";
  return "Elevated risk";
}

function AssetGlyph({ symbol }: { symbol: string }) {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted/60 font-semibold text-[12px] text-foreground tabular-nums">
      {symbol.slice(0, 3).toUpperCase()}
    </span>
  );
}

function PoolIdentity({ pool }: { pool: ConsolePool }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <AssetGlyph symbol={pool.assetSymbol} />
      <div className="min-w-0">
        <div className="font-medium text-[14.5px] text-foreground">{pool.assetSymbol}</div>
        <div className="mt-0.5 truncate text-[12px] text-muted-foreground/80">
          {titleCase(pool.protocol)} · {titleCase(pool.poolType)}
        </div>
      </div>
    </div>
  );
}

export interface MarketTableProps {
  pools: ConsolePool[] | undefined;
  isLoading: boolean;
  /** Truthy when the query errored — distinct from "loaded and empty". */
  error?: unknown;
  /** Optional filter on `assetSymbol`, case-insensitive. */
  assetFilter?: string;
  title?: string;
  className?: string;
}

export function MarketTable({
  pools,
  isLoading,
  error,
  assetFilter,
  title = "Live markets",
  className,
}: MarketTableProps) {
  const rows = (pools ?? []).filter(
    (pool) =>
      pool.enabled && (!assetFilter || pool.assetSymbol.toUpperCase() === assetFilter.toUpperCase())
  );

  return (
    <Panel className={cn("p-4 sm:p-5", className)} data-testid="farming3-markets">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
        <Eyebrow>{title}</Eyebrow>
        <span className="text-[11.5px] text-muted-foreground/70">
          Rates read from the pool registry, not quoted
        </span>
      </div>

      {/* Three states, three renderings. `isLoading` is asked first so a slow
          first fetch never shows "no markets". */}
      {isLoading ? (
        <RowSkeletons className="mt-4" rows={3} />
      ) : error ? (
        <EmptyNote>
          Could not read the market registry. Rates are unavailable — this is not the same as there
          being no markets.
        </EmptyNote>
      ) : rows.length === 0 ? (
        <EmptyNote>
          {assetFilter
            ? `No enabled ${assetFilter.toUpperCase()} markets in the registry right now.`
            : "No enabled markets in the registry right now."}
        </EmptyNote>
      ) : (
        <>
          {/* wide */}
          <div className="mt-3 hidden md:block">
            <div
              className="grid items-center gap-4 px-4 pb-2.5 text-[11px] text-muted-foreground/70 uppercase tracking-[0.05em]"
              style={{ gridTemplateColumns: COLS }}
            >
              <div>Market</div>
              <div className="text-right">TVL</div>
              <div className="text-right">APY</div>
              <div className="text-right">Risk</div>
            </div>
            <div data-testid="farming3-market-rows">
              {rows.map((pool) => (
                <div
                  key={pool.id}
                  data-market-asset={pool.assetSymbol}
                  data-market-apy={pool.currentApy}
                  className="grid items-center gap-4 rounded-xl px-4 py-3.5 transition-colors hover:bg-muted/25"
                  style={{ gridTemplateColumns: COLS }}
                >
                  <PoolIdentity pool={pool} />
                  <Num className="text-right text-[14px] text-foreground">
                    {formatTvl(pool.tvlUsd)}
                  </Num>
                  <Num className="text-right font-medium text-[14px] text-emerald-400">
                    {formatApy(pool.currentApy)}
                  </Num>
                  <div className="flex justify-end">
                    <Pill tone={riskTone(pool.riskScore)}>{riskLabel(pool.riskScore)}</Pill>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* narrow */}
          <div className="mt-3 grid gap-2.5 md:hidden">
            {rows.map((pool) => (
              <div
                key={pool.id}
                className="rounded-xl border border-border bg-card/40 p-4"
                data-market-asset={pool.assetSymbol}
              >
                <div className="flex items-center justify-between gap-3">
                  <PoolIdentity pool={pool} />
                  <Pill tone={riskTone(pool.riskScore)}>{riskLabel(pool.riskScore)}</Pill>
                </div>
                <div className="mt-3 flex items-center gap-4 border-border/60 border-t pt-3 text-[12.5px] text-muted-foreground">
                  <Num>{formatTvl(pool.tvlUsd)} TVL</Num>
                  <Num className="text-emerald-400">{formatApy(pool.currentApy)} APY</Num>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}

/**
 * The best enabled rate for an asset, or `null` when nothing can be read.
 *
 * `null` is deliberate: a caller must not print "0.00%" for an asset whose
 * markets have not loaded. Still a decimal fraction — the ×100 happens later.
 */
export function bestApyFraction(
  pools: ConsolePool[] | undefined,
  assetSymbol: string
): number | null {
  const candidates = (pools ?? []).filter(
    (pool) =>
      pool.enabled &&
      pool.assetSymbol.toUpperCase() === assetSymbol.toUpperCase() &&
      Number.isFinite(pool.currentApy)
  );
  if (candidates.length === 0) return null;
  return Math.max(...candidates.map((pool) => pool.currentApy));
}
