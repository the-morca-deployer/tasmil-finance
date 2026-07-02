import { Card, CardContent } from "@/shared/ui/card";
import { Typography } from "@/shared/ui/typography";
import { fmtInt } from "../lib/format";
import type { TxTypeCount } from "../types";

export function TxBreakdown({
  items,
  isLoading,
}: {
  items: TxTypeCount[] | undefined;
  isLoading: boolean;
}) {
  const rows = items ?? [];
  const max = rows.reduce((m, r) => Math.max(m, r.count), 0);

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6">
        <div className="mb-4">
          <Typography variant="h3" className="font-semibold text-base">
            Transactions by type
          </Typography>
          <Typography variant="p" className="text-muted-foreground text-xs">
            All-time on-chain activity breakdown
          </Typography>
        </div>
        {isLoading ? (
          <div className="flex h-24 items-center justify-center text-muted-foreground text-xs">
            Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-muted-foreground text-xs">
            No transactions yet
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {rows.map((row) => (
              <div key={row.type} className="flex items-center gap-3">
                <span className="w-32 text-[11px] text-muted-foreground uppercase tracking-wide">
                  {row.type}
                </span>
                <div className="h-2 flex-1 rounded bg-background">
                  <div
                    className="h-2 rounded bg-blue-500/70"
                    style={{ width: `${max ? (row.count / max) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-16 text-right font-semibold text-xs">{fmtInt(row.count)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
