"use client";

interface Props {
  /** Value-weighted average APY across all open positions (decimal fraction,
   *  e.g. 0.08 = 8%). Not a "net" figure - no fees are subtracted and no
   *  rewards are added on top; per-pool reward APY (e.g. AQUA) is already
   *  folded into each pool's own APY upstream. */
  blendedApy: number;
  /** APY of the position holding the most value (decimal fraction). */
  currentPositionApr: number;
  currentMarketName: string;
  activatedAt: string;
  totalDepositsUsd: number;
}

function formatApyPercent(apyDecimal: number): string {
  return `${(apyDecimal * 100).toFixed(2)}%`;
}

const fmtUsd = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} · ${time}`;
};

export function AprSummaryCard({
  blendedApy,
  currentPositionApr,
  currentMarketName,
  activatedAt,
  totalDepositsUsd,
}: Props) {
  const hasPosition = currentMarketName !== "-";

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col gap-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Portfolio APY</p>
          <p className="mt-1 font-mono text-foreground tabular-nums">
            {formatApyPercent(blendedApy)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Current Position APR</p>
          <p className="mt-1 font-mono text-foreground tabular-nums">
            {hasPosition ? `${currentMarketName} ${formatApyPercent(currentPositionApr)}` : "-"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Activation Date</p>
          <p className="mt-1 text-foreground">{fmtDate(activatedAt)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total Deposits</p>
          <p className="mt-1 font-mono text-foreground tabular-nums">
            {fmtUsd(totalDepositsUsd)} USDC
          </p>
        </div>
      </div>
    </div>
  );
}
