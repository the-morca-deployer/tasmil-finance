"use client";

/**
 * Where the money actually sits, per strategy leg.
 *
 * Lifted from heron's dashboard allocation card (donut + legend + venue rows),
 * minus the donut: with one or two legs a ring is decoration, and the rows carry
 * the same information with the numbers legible. The share bar per row does the
 * proportion job.
 *
 * `apy` on each leg is a decimal fraction from the position endpoint. It goes
 * through `formatApy` like everything else.
 */

import { cn } from "@/lib/utils";
import type { ConsolePositionLeg } from "../types";
import { formatApy, formatPercentPoints, formatUsd, titleCase } from "../utils/format";
import { EmptyNote, Eyebrow, Num, Panel, RowSkeletons } from "./console-ui";

export interface AllocationPanelProps {
  legs: ConsolePositionLeg[] | undefined;
  totalValueUsd: number | undefined;
  /** Keeper balance not yet deployed into a strategy. `null` when unknown. */
  idleUsd: number | null;
  isLoading: boolean;
  /** True when the backend flagged the on-chain balance read as stale. */
  balanceStale?: boolean;
  className?: string;
}

export function AllocationPanel({
  legs,
  totalValueUsd,
  idleUsd,
  isLoading,
  balanceStale,
  className,
}: AllocationPanelProps) {
  const rows = legs ?? [];

  return (
    <Panel className={className} data-testid="farming3-allocation">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Eyebrow>Allocation</Eyebrow>
        {balanceStale && (
          <span className="text-[11.5px] text-amber-400">
            On-chain balance read is stale — figures may lag
          </span>
        )}
      </div>

      {isLoading ? (
        <RowSkeletons className="mt-4" rows={2} />
      ) : rows.length === 0 ? (
        <EmptyNote>
          Nothing deployed into a strategy yet. The allocation engine runs every ten minutes and
          moves funds once the gain clears the cost.
        </EmptyNote>
      ) : (
        <ul className="mt-3 flex flex-col gap-2.5">
          {rows.map((leg) => {
            const share =
              typeof totalValueUsd === "number" && totalValueUsd > 0
                ? Math.min(100, (leg.valueUsd / totalValueUsd) * 100)
                : leg.allocationPercent;
            return (
              <li
                key={`${leg.protocol}-${leg.poolName}-${leg.poolType}`}
                data-alloc-pool={leg.poolName}
                data-alloc-apy={leg.apy}
                className="rounded-xl border border-border bg-card/40 p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <div className="font-medium text-[14px] text-foreground">
                      {titleCase(leg.protocol)} · {leg.poolName}
                    </div>
                    <div className="mt-0.5 text-[12px] text-muted-foreground">
                      {titleCase(leg.poolType)}
                      {leg.q4wExpiresAt ? " · queued withdrawal pending" : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <Num className="font-semibold text-[15px] text-foreground">
                      {formatUsd(leg.valueUsd)}
                    </Num>
                    <div className="mt-0.5">
                      <Num className="font-medium text-[12.5px] text-emerald-400">
                        {formatApy(leg.apy)} APY
                      </Num>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted/60">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(2, share)}%` }}
                    />
                  </div>
                  <Num className="shrink-0 text-[11.5px] text-muted-foreground/80">
                    {formatPercentPoints(share, 1)} of vault
                  </Num>
                </div>
              </li>
            );
          })}

          {/* Idle only claims a number when one is known. `null` says so. */}
          <li className="flex items-baseline justify-between gap-3 rounded-xl border border-border/60 border-dashed px-4 py-3">
            <span className="text-[12.5px] text-muted-foreground">Idle in keeper wallet</span>
            <span className="text-[13px]">
              {idleUsd === null ? (
                <span className={cn("text-muted-foreground/60")}>not readable</span>
              ) : (
                <Num className="text-foreground">{formatUsd(idleUsd)}</Num>
              )}
            </span>
          </li>
        </ul>
      )}
    </Panel>
  );
}
