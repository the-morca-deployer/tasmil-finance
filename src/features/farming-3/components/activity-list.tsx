"use client";

/**
 * Activity, ported from heron's `ActivityPage` rows.
 *
 * The rule this file exists to keep: a row prints what the backend sent, or an
 * explicit neutral placeholder. It never invents copy for a missing field, never
 * substitutes `new Date()` for a missing timestamp, and never renders an absent
 * amount as `$0.00`. The three list states — loading, unreadable, genuinely
 * empty — get three different renderings.
 */

import { ArrowDownLeft, ArrowUpRight, RefreshCw, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { activeNetwork } from "@/shared/config/stellar";
import type { ConsoleActivityItem } from "../types";
import { formatSignedUsd, formatTimestamp, NO_DATA, shortHash, titleCase } from "../utils/format";
import { EmptyNote, Eyebrow, Num, Panel, RowSkeletons } from "./console-ui";

/** Money in, money out, or the agent acting. Anything else gets the neutral
 *  glyph rather than being forced into one of the three. */
function kindOf(type: string): "in" | "out" | "agent" | "other" {
  const t = type.toUpperCase();
  if (t === "FUND" || t === "DEPOSIT") return "in";
  if (t === "WITHDRAW") return "out";
  if (t === "REBALANCE" || t === "HARVEST" || t === "DEPLOY" || t === "SETUP") return "agent";
  return "other";
}

function RowGlyph({ type }: { type: string }) {
  const kind = kindOf(type);
  const Icon =
    kind === "in"
      ? ArrowDownLeft
      : kind === "out"
        ? ArrowUpRight
        : kind === "agent"
          ? Shield
          : RefreshCw;
  const tone =
    kind === "in"
      ? "bg-emerald-500/12 text-emerald-400"
      : kind === "out"
        ? "bg-muted/60 text-muted-foreground"
        : "bg-primary/12 text-primary";
  return (
    <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full", tone)}>
      <Icon className="h-4 w-4" strokeWidth={2} />
    </span>
  );
}

/** Signed amount for the row, or `null` when none was reported. */
function signedAmountUsd(item: ConsoleActivityItem): number | null {
  if (typeof item.amountUsd !== "number" || !Number.isFinite(item.amountUsd)) return null;
  return kindOf(item.type) === "out" ? -item.amountUsd : item.amountUsd;
}

export function ActivityRow({ item }: { item: ConsoleActivityItem }) {
  const amount = signedAmountUsd(item);
  const explorerUrl = item.txHash ? `${activeNetwork.explorerUrl}/tx/${item.txHash}` : null;

  return (
    <li className="flex items-start gap-3 border-border/60 border-t py-3.5 first:border-t-0">
      <RowGlyph type={item.type} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="font-medium text-[13.5px] text-foreground">{titleCase(item.type)}</span>
          {/* An absent amount is a dash, not a zero. */}
          <span className="text-[13px]">
            {amount === null ? (
              <span className="text-muted-foreground/50">{NO_DATA}</span>
            ) : (
              <Num className={amount < 0 ? "text-muted-foreground" : "text-emerald-400"}>
                {formatSignedUsd(amount)}
              </Num>
            )}
          </span>
        </div>
        {/* Only the backend's own words. No fabricated summary line. */}
        <p className="mt-0.5 text-[12px] text-muted-foreground leading-relaxed">
          {item.detail && item.detail.length > 0 ? (
            item.detail
          ) : (
            <span className="text-muted-foreground/60">No detail recorded</span>
          )}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11.5px]">
          <Num className="text-muted-foreground/70">{formatTimestamp(item.createdAt)}</Num>
          {explorerUrl && item.txHash ? (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-primary hover:underline"
            >
              {shortHash(item.txHash)} ↗
            </a>
          ) : (
            <span className="text-muted-foreground/50">no on-chain hash</span>
          )}
        </div>
      </div>
    </li>
  );
}

export interface ActivityListProps {
  items: ConsoleActivityItem[] | undefined;
  isLoading: boolean;
  error?: unknown;
  limit?: number;
  className?: string;
}

export function ActivityList({ items, isLoading, error, limit, className }: ActivityListProps) {
  const rows = limit ? (items ?? []).slice(0, limit) : (items ?? []);

  return (
    <Panel className={className} data-testid="farming3-activity">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Eyebrow>Activity</Eyebrow>
        <span className="text-[11.5px] text-muted-foreground/70">Newest first</span>
      </div>

      {isLoading ? (
        <RowSkeletons className="mt-4" rows={3} />
      ) : error ? (
        <EmptyNote>
          Could not read this account&apos;s activity. The history exists — this view of it does
          not.
        </EmptyNote>
      ) : rows.length === 0 ? (
        <EmptyNote>Nothing recorded yet. Funding and agent decisions will appear here.</EmptyNote>
      ) : (
        <ul className="mt-2">
          {rows.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </Panel>
  );
}
