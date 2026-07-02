"use client";

import { Download } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import type { TransactionRow } from "../types";

export interface TransactionsLogTableProps {
  rows: TransactionRow[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  isError?: boolean;
  onExport: () => void;
}

export function TransactionsLogTable({
  rows,
  total,
  page,
  pageSize,
  onPageChange,
  isLoading,
  isError = false,
  onExport,
}: TransactionsLogTableProps) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onExport}>
          <Download size={14} />
          Export CSV
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-10 text-muted-foreground text-xs">Loading…</div>
      ) : isError ? (
        <div className="p-10 text-center text-muted-foreground text-xs">
          Failed to load — try again
        </div>
      ) : rows.length === 0 ? (
        <div className="p-10 text-center text-muted-foreground text-xs">
          No transactions in this period
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Wallet</TableHead>
              <TableHead>Amount (USD)</TableHead>
              <TableHead>Tx Hash</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                <TableCell>{row.type}</TableCell>
                <TableCell className="font-mono text-xs">{row.keeperWalletAddress}</TableCell>
                <TableCell>{row.amountUsd !== null ? `$${row.amountUsd.toLocaleString()}` : "—"}</TableCell>
                <TableCell>
                  {row.txHash ? (
                    <a
                      href={`https://stellar.expert/explorer/public/tx/${row.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-blue-400 text-xs"
                    >
                      {row.txHash.slice(0, 8)}…
                    </a>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <div className="flex items-center justify-between text-muted-foreground text-xs">
        <span>{total} total transactions</span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Prev
          </Button>
          <span>
            Page {page} / {lastPage}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= lastPage}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
