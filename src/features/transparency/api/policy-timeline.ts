"use client";

import { useMemo } from "react";
import type { ActivityPage } from "./adapters";
import { useActivityFeed } from "./use-activity-feed";

type VdlItem = ActivityPage["items"][number];

/** How a policy decision ended, from the user's point of view. */
export type PolicyOutcome =
  | "declined"
  | "refused"
  | "rejected"
  | "executed"
  | "proposed"
  | "no_action"
  | "pending";

/**
 * One agent decision, shaped for a timeline row. Kept framework-free so the
 * Farming activity tab can merge it with account events by `createdAt`.
 */
export interface PolicyTimelineItem {
  id: string;
  createdAt: string;
  outcome: PolicyOutcome;
  title: string;
  reason: string | null;
  txUrl: string | null;
  replayHref: string | null;
}

function field(item: VdlItem, key: string): string | null {
  const payload = item.payload;
  if (!payload || typeof payload !== "object") return null;
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

// Codes emitted by backend PriceIntegrityService (guards/price-integrity.service.ts).
const PRICE_REASONS: Record<string, string> = {
  PRICE_DISAGREEMENT: "Price sources disagreed beyond the allowed band",
  PRICE_QUORUM_FAILED: "Not enough fresh, independent price sources",
  EVIDENCE_UNAVAILABLE: "Price data was unavailable or too old to trust",
  GUARD_DISABLED: "Price guard is not configured, so the agent did not act",
};

function priceReason(code: string | null): string {
  if (!code) return "Price evidence could not be trusted";
  return PRICE_REASONS[code] ?? `Price evidence refused (${code})`;
}

export function toPolicyTimelineItem(item: VdlItem): PolicyTimelineItem {
  const base = {
    id: item.id,
    createdAt: item.createdAt,
    txUrl: item.explorerUrl,
    replayHref: item.decisionId ? `/activity/${encodeURIComponent(item.decisionId)}` : null,
  };
  const gate = field(item, "gate");

  if (item.txStatus === "CONFIRMED" || item.entryType === "EXECUTION") {
    return { ...base, outcome: "executed", title: "Agent action executed", reason: null };
  }
  switch (item.entryType) {
    case "DECLINE":
      return {
        ...base,
        outcome: "declined",
        title: "Agent declined a move",
        reason: field(item, "plainLanguage") ?? "Expected gain was below the total cost",
      };
    case "REFUSAL":
      return {
        ...base,
        outcome: "refused",
        title: "Agent refused to act",
        reason:
          gate === "PRICE"
            ? priceReason(field(item, "code"))
            : (field(item, "reason") ?? field(item, "code") ?? "Safety check failed"),
      };
    case "FAILED":
      return {
        ...base,
        outcome: "rejected",
        title: "Rejected on-chain by Policy Guard",
        reason: field(item, "reason") ?? "The transaction broke a vault rule and was reverted",
      };
    case "DECISION":
      return {
        ...base,
        outcome: "proposed",
        title: "Agent proposed a move",
        reason: "Passed Net-Edge and price checks",
      };
    case "NO_ACTION":
      return { ...base, outcome: "no_action", title: "No action needed", reason: null };
    default:
      return {
        ...base,
        outcome: "pending",
        title: "Submission status unknown",
        reason: "Waiting for the ledger to confirm the outcome",
      };
  }
}

/** First page of the vault's policy decisions, mapped for the Farming timeline. */
export function usePolicyTimeline() {
  const feed = useActivityFeed();
  const items = useMemo(
    () => (feed.data?.items ?? []).map(toPolicyTimelineItem),
    [feed.data?.items]
  );
  return { items, isLoading: feed.isLoading, error: feed.error };
}
