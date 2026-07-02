"use client";

import { Download } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import type { SortOrder, WalletRow, WalletSortKey } from "../types";

const SORT_COLUMNS: { key: WalletSortKey; label: string }[] = [
  { key: "tvl", label: "TVL" },
  { key: "volume", label: "Volume" },
  { key: "txCount", label: "Tx Count" },
  { key: "joinedAt", label: "Joined" },
];

function formatUsd(value: number): string {
  return `$${Math.round(value).toLocaleString()}`;
}

export interface WalletsTableProps {
  rows: WalletRow[];
  total: number;
  sort: WalletSortKey;
  order: SortOrder;
  onSortChange: (sort: WalletSortKey, order: SortOrder) => void;
  search: string;
  onSearchChange: (search: string) => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  isError?: boolean;
  onExport: () => void;
}

export function WalletsTable({
  rows,
  total,
  sort,
  order,
  onSortChange,
  search,
  onSearchChange,
  page,
  pageSize,
  onPageChange,
  isLoading,
  isError = false,
  onExport,
}: WalletsTableProps) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));

  function handleSortClick(key: WalletSortKey) {
    onSortChange(key, sort === key && order === "desc" ? "asc" : "desc");
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <Input
          placeholder="Search by wallet address…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-xs"
        />
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
          No wallets in this period
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Keeper Wallet</TableHead>
              {SORT_COLUMNS.map((col) => (
                <TableHead key={col.key}>
                  <button type="button" onClick={() => handleSortClick(col.key)}>
                    {col.label}
                    {sort === col.key ? (order === "asc" ? " ↑" : " ↓") : ""}
                  </button>
                </TableHead>
              ))}
              <TableHead>Last Activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.keeperWalletAddress}>
                <TableCell className="font-mono text-xs">{row.keeperWalletAddress}</TableCell>
                <TableCell>{formatUsd(row.currentTvlUsd)}</TableCell>
                <TableCell>{formatUsd(row.volumeUsd)}</TableCell>
                <TableCell>{row.txCount}</TableCell>
                <TableCell>{new Date(row.joinedAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  {row.lastActivityAt ? new Date(row.lastActivityAt).toLocaleDateString() : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <div className="flex items-center justify-between text-muted-foreground text-xs">
        <span>{total} total wallets</span>
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
