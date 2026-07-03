export function fmtUsdCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

export function fmtInt(n: number): string {
  return n.toLocaleString("en-US");
}

export function fmtPercent(n: number): string {
  return `${n.toFixed(2)}%`;
}

export function fmtUsd(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
