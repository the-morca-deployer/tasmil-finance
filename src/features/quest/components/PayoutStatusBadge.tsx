"use client";

import type { PayoutStatus } from "../lib/season-types";

interface PayoutStatusBadgeProps {
  status: PayoutStatus;
  paidTxHash?: string;
}

const truncate = (hash: string) =>
  hash.length > 12 ? `${hash.slice(0, 6)}...${hash.slice(-4)}` : hash;

/** Small Pending/Paid pill for a season USDC payout. */
export function PayoutStatusBadge({ status, paidTxHash }: PayoutStatusBadgeProps) {
  const isPaid = status === "PAID";
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold text-xs ${
          isPaid ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
        }`}
      >
        {isPaid ? "Paid" : "Pending"}
      </span>
      {isPaid && paidTxHash ? (
        <span className="font-mono text-muted-foreground text-xs" title={paidTxHash}>
          {truncate(paidTxHash)}
        </span>
      ) : null}
    </span>
  );
}
