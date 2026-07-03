"use client";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { useQuestVolume } from "../hooks/use-quest-volume";
import { fmtDate, fmtUsd } from "../lib/format";

export function QuestVolumeList() {
  const { data, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useQuestVolume();
  const items = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-1">
        <h2 className="font-semibold text-lg">Quest volume — recent transactions</h2>
        <span className="text-muted-foreground text-xs">
          On-chain activity counted toward quests
        </span>
      </div>

      {isError && items.length === 0 ? (
        <p className="rounded border border-border bg-card px-4 py-6 text-center text-muted-foreground text-sm">
          Quest volume is temporarily unavailable.
        </p>
      ) : isLoading ? (
        <div className="flex flex-col gap-2" data-testid="qv-loading">
          {["a", "b", "c", "d", "e"].map((k) => (
            <Skeleton key={k} className="h-10 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="rounded border border-border bg-card px-4 py-6 text-center text-muted-foreground text-sm">
          No quest volume yet.
        </p>
      ) : (
        <>
          <div className="rounded border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Protocol</TableHead>
                  <TableHead>Operation</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {tx.protocol}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{tx.operationKind}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtUsd(tx.amountUsd)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{tx.walletMasked}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-xs">
                      {fmtDate(tx.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {hasNextPage && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
