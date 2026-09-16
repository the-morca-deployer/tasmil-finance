import { Card, CardContent } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { fmtInt, fmtPercent, fmtUsdCompact } from "../lib/format";
import type { TractionSummary } from "../types";

function KpiCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card className="border-border border-t-2 border-t-blue-500/60 bg-card">
      <CardContent className="p-4">
        <p className="mb-1 text-[10px] text-muted-foreground uppercase tracking-widest">{label}</p>
        <p className="font-bold text-2xl leading-none">{value}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

export function KpiCards({
  summary,
  isLoading,
}: {
  summary: TractionSummary | undefined;
  isLoading: boolean;
}) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {["tvl", "app", "quest", "tx", "apy"].map((key) => (
          <Card key={key} className="border-border bg-card">
            <CardContent className="p-4">
              <Skeleton className="h-14 w-full" data-testid="kpi-skeleton" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      <KpiCard
        label="Total Value Locked"
        value={fmtUsdCompact(summary.totalTvlUsd)}
        sub="Across all active vaults"
      />
      <KpiCard
        label="App Wallets"
        value={fmtInt(summary.appWallets ?? 0)}
        sub="Connected to tasmil-finance"
      />
      <KpiCard
        label="Quest Wallets"
        value={fmtInt(summary.questWallets ?? 0)}
        sub="Connected to quest app"
      />
      <KpiCard
        label="Transactions"
        value={fmtInt(summary.totalTransactions)}
        sub="All-time on-chain activities"
      />
      <KpiCard
        label="Avg APY (24h)"
        value={fmtPercent(summary.avgApyPercent)}
        sub="Across integrated pools"
      />
    </div>
  );
}
