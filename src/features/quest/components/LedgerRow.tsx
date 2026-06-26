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
    // ledger-row: not in quest.css — flex row with border-b
    <div className="flex items-center justify-between gap-3 py-[10px] border-b border-[rgba(255,255,255,0.08)] text-[13px] text-[rgba(244,247,251,0.58)]">
      {/* ledger-time: timestamp label */}
      <div className="font-mono text-[11px] text-[rgba(244,247,251,0.34)] whitespace-nowrap">{relativeTime(occurredAt)}</div>
      {/* ledger-source: description */}
      <div className="flex-1 truncate">{source}</div>
      {/* ledger-delta pos/neg: colored delta */}
      <div
        className={`font-mono font-semibold whitespace-nowrap ${
          delta >= 0 ? "text-[var(--green)]" : "text-[#F87171]"
        }`}
      >
        {delta >= 0 ? "+" : ""}
        {delta}
      </div>
    </div>
  );
}
