"use client";

interface LedgerRowProps {
  occurredAt: string; // ISO
  source: string; // e.g. "Stellar follow quest"
  delta: number; // positive or negative
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function LedgerRow({ occurredAt, source, delta }: LedgerRowProps) {
  return (
    <div className="ledger-row">
      <div className="ledger-time">{relativeTime(occurredAt)}</div>
      <div className="ledger-source">{source}</div>
      <div className={`ledger-delta ${delta >= 0 ? "pos" : "neg"}`}>
        {delta >= 0 ? "+" : ""}
        {delta}
      </div>
    </div>
  );
}
