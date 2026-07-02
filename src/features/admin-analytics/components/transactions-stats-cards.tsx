"use client";

import { Card, CardContent } from "@/shared/ui/card";
import type { TransactionsStats } from "../types";

export function TransactionsStatsCards({
  stats,
  isLoading,
}: {
  stats: TransactionsStats | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <div className="p-6 text-muted-foreground text-xs">Loading…</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      <Card className="border-border border-t-2 border-t-blue-500/60 bg-card">
        <CardContent className="p-4">
          <p className="mb-1 text-[10px] text-muted-foreground uppercase tracking-widest">
            Total Transactions
          </p>
          <p className="font-bold text-2xl leading-none">{stats?.totalCount ?? 0}</p>
        </CardContent>
      </Card>
      {(stats?.byType ?? []).map((entry) => (
        <Card key={entry.type} className="border-border bg-card">
          <CardContent className="p-4">
            <p className="mb-1 text-[10px] text-muted-foreground uppercase tracking-widest">
              {entry.type}
            </p>
            <p className="font-bold text-2xl leading-none">{entry.count}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
