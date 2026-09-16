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

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConsolePool } from "../types";
import { formatApy, formatTimestamp, formatTvl, titleCase } from "../utils/format";
import { EmptyNote, Eyebrow, Num, Panel, Pill, RowSkeletons } from "./console-ui";

const COLS = "minmax(0,2.2fr) minmax(0,1fr) minmax(0,1fr) minmax(0,0.9fr)";

/**
 * The staleness marker for one row.
 *
 * `pool.stale` is computed server-side against a 40-minute budget (2x the
 * pool-discovery cron). It is optional on purpose: `undefined` means this build
 * of the backend did not say, and silence must not render as a fresh tick — so
 * only the affirmative `true` draws anything.
 */
function StaleMark({ pool }: { pool: ConsolePool }) {
  if (pool.stale !== true) return null;
  return (
    <Pill tone="warn" className="whitespace-nowrap">
      <Clock className="h-3 w-3" />
      Stale
    </Pill>
  );
}

/** How many rows carry an affirmative stale flag. */
function staleCount(pools: ConsolePool[]): number {
  return pools.filter((pool) => pool.stale === true).length;
}

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

/** `"lending"` → `"Lending"`, `"lp"` → `"LP"` (an initialism, not a word). */
function poolTypeLabel(poolType: string): string {
  return poolType.toLowerCase() === "lp" ? "LP" : titleCase(poolType);
}

function PoolIdentity({ pool }: { pool: ConsolePool }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <AssetGlyph symbol={pool.assetSymbol} />
      <div className="min-w-0">
        <div className="font-medium text-[14.5px] text-foreground">{pool.assetSymbol}</div>
        <div className="mt-0.5 truncate text-[12px] text-muted-foreground/80">
          {titleCase(pool.protocol)} · {poolTypeLabel(pool.poolType)}
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
  /** Optional filter on `assetSymbol`, case-insensitive. Leave unset for a list
   *  the SERVER already filtered — re-filtering it here would silently drop LP
   *  pools whose base asset sits on the paired side. */
  assetFilter?: string;
  title?: string;
  /** Replaces the default "rates are read, not quoted" caption. */
  note?: string;
  /** Sentence shown instead of the generic one when the list is empty. */
  emptyNote?: string;
  className?: string;
}

export function MarketTable({
  pools,
  isLoading,
  error,
  assetFilter,
  title = "Live markets",
  note,
  emptyNote,
  className,
}: MarketTableProps) {
  const rows = (pools ?? []).filter(
    (pool) =>
      pool.enabled && (!assetFilter || pool.assetSymbol.toUpperCase() === assetFilter.toUpperCase())
  );
  const stale = staleCount(rows);

  return (
    <Panel className={cn("p-4 sm:p-5", className)} data-testid="farming3-markets">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
        <Eyebrow>{title}</Eyebrow>
        <span className="text-[11.5px] text-muted-foreground/70">
          {note ?? "Rates read from the pool registry, not quoted"}
        </span>
      </div>

      {/* Staleness is a property of the read, so it is stated once for the list
          as well as marked per row. Only ever shown when the server said so. */}
      {stale > 0 && (
        <p
          className="mt-2.5 rounded-lg border border-amber-500/30 bg-amber-500/[0.07] px-3 py-2 text-[11.5px] text-amber-300/90"
          data-testid="farming3-stale-banner"
        >
          {stale === 1
            ? "1 market below was last measured over 40 minutes ago. Its APY and TVL are real numbers, just not current ones"
            : `${stale} markets below were last measured over 40 minutes ago. Their APY and TVL are real numbers, just not current ones`}
          {" — pool discovery runs every 20 minutes and has not landed."}
        </p>
      )}

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
          {emptyNote ??
            (assetFilter
              ? `No enabled ${assetFilter.toUpperCase()} markets in the registry right now.`
              : "No enabled markets in the registry right now.")}
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
                  data-market-stale={pool.stale === true ? "true" : undefined}
                  className="grid items-center gap-4 rounded-xl px-4 py-3.5 transition-colors hover:bg-muted/25"
                  style={{ gridTemplateColumns: COLS }}
                  title={`Last measured ${formatTimestamp(pool.lastUpdated)}`}
                >
                  <PoolIdentity pool={pool} />
                  <Num
                    className={cn(
                      "text-right text-[14px]",
                      pool.stale === true ? "text-muted-foreground" : "text-foreground"
                    )}
                  >
                    {formatTvl(pool.tvlUsd)}
                  </Num>
                  <Num
                    className={cn(
                      "text-right font-medium text-[14px]",
                      // A stale rate is dimmed, never hidden and never replaced
                      // by a dash: it WAS measured, just not recently.
                      pool.stale === true ? "text-emerald-400/50" : "text-emerald-400"
                    )}
                  >
                    {formatApy(pool.currentApy)}
                  </Num>
                  <div className="flex justify-end gap-1.5">
                    <StaleMark pool={pool} />
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
                data-market-stale={pool.stale === true ? "true" : undefined}
              >
                <div className="flex items-center justify-between gap-3">
                  <PoolIdentity pool={pool} />
                  <Pill tone={riskTone(pool.riskScore)}>{riskLabel(pool.riskScore)}</Pill>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-border/60 border-t pt-3 text-[12.5px] text-muted-foreground">
                  <Num>{formatTvl(pool.tvlUsd)} TVL</Num>
                  <Num className={pool.stale === true ? "text-emerald-400/50" : "text-emerald-400"}>
                    {formatApy(pool.currentApy)} APY
                  </Num>
                  <StaleMark pool={pool} />
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
 * The best rate in a list, or `null` when nothing can be read.
 *
 * Takes the list AS GIVEN and does not filter by asset: its callers are the
 * preset candidate sets, which the server already filtered, and re-filtering on
 * `assetSymbol` here would drop LP pools that hold the deposit asset on the
 * paired side.
 *
 * `null` is deliberate — a caller must not print "0.00%" for markets that have
 * not loaded. Still a decimal fraction; the ×100 happens in `formatApy`.
 */
export function maxApyFraction(pools: ConsolePool[] | undefined): number | null {
  const rates = (pools ?? [])
    .filter((pool) => pool.enabled && Number.isFinite(pool.currentApy))
    .map((pool) => pool.currentApy);
  return rates.length === 0 ? null : Math.max(...rates);
}
