"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DateRangePicker, type DateRangeValue } from "@/features/admin-analytics/components/date-range-picker";
import { TransactionsLogTable } from "@/features/admin-analytics/components/transactions-log-table";
import { TransactionsStatsCards } from "@/features/admin-analytics/components/transactions-stats-cards";
import { VolumeTvlChart } from "@/features/admin-analytics/components/volume-tvl-chart";
import { WalletsTable } from "@/features/admin-analytics/components/wallets-table";
import { useTransactionsLog } from "@/features/admin-analytics/hooks/use-transactions-log";
import { useTransactionsStats } from "@/features/admin-analytics/hooks/use-transactions-stats";
import { useVolumeTvl } from "@/features/admin-analytics/hooks/use-volume-tvl";
import { useWalletsAnalytics } from "@/features/admin-analytics/hooks/use-wallets-analytics";
import { downloadCsvExport } from "@/features/admin-analytics/lib/download-csv";
import type { SortOrder, WalletSortKey } from "@/features/admin-analytics/types";
import { useAdminAuthStore } from "@/store/use-admin-auth";

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

const WALLETS_PAGE_SIZE = 20;
const TX_PAGE_SIZE = 20;

export default function AnalyticsPage() {
  const token = useAdminAuthStore((s) => s.token);
  const [range, setRange] = useState<DateRangeValue>({ from: isoDaysAgo(30), to: isoDaysAgo(0) });
  const [walletSort, setWalletSort] = useState<WalletSortKey>("volume");
  const [walletOrder, setWalletOrder] = useState<SortOrder>("desc");
  const [walletSearch, setWalletSearch] = useState("");
  const [walletPage, setWalletPage] = useState(1);
  const [txPage, setTxPage] = useState(1);

  const volumeTvl = useVolumeTvl(range.from, range.to, "day");
  const wallets = useWalletsAnalytics({
    from: range.from,
    to: range.to,
    sort: walletSort,
    order: walletOrder,
    search: walletSearch || undefined,
    page: walletPage,
    pageSize: WALLETS_PAGE_SIZE,
  });
  const transactions = useTransactionsLog({
    from: range.from,
    to: range.to,
    page: txPage,
    pageSize: TX_PAGE_SIZE,
  });
  const transactionsStats = useTransactionsStats(range.from, range.to);

  async function exportCsv(path: string, filename: string) {
    if (!token) return;
    try {
      await downloadCsvExport(path, token, filename);
    } catch {
      toast.error("Export failed");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl">Analytics</h1>
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      <VolumeTvlChart
        data={volumeTvl.data}
        isLoading={volumeTvl.isLoading}
        isError={volumeTvl.isError}
      />

      <TransactionsStatsCards
        stats={transactionsStats.data}
        isLoading={transactionsStats.isLoading}
        isError={transactionsStats.isError}
      />

      <WalletsTable
        rows={wallets.data?.rows ?? []}
        total={wallets.data?.total ?? 0}
        sort={walletSort}
        order={walletOrder}
        onSortChange={(sort, order) => {
          setWalletSort(sort);
          setWalletOrder(order);
          setWalletPage(1);
        }}
        search={walletSearch}
        onSearchChange={(search) => {
          setWalletSearch(search);
          setWalletPage(1);
        }}
        page={walletPage}
        pageSize={WALLETS_PAGE_SIZE}
        onPageChange={setWalletPage}
        isLoading={wallets.isLoading}
        isError={wallets.isError}
        onExport={() =>
          exportCsv(
            `/api/admin/analytics/wallets?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}&sort=${encodeURIComponent(walletSort)}&order=${encodeURIComponent(walletOrder)}${walletSearch ? `&search=${encodeURIComponent(walletSearch)}` : ""}&format=csv`,
            "wallets.csv"
          )
        }
      />

      <TransactionsLogTable
        rows={transactions.data?.rows ?? []}
        total={transactions.data?.total ?? 0}
        page={txPage}
        pageSize={TX_PAGE_SIZE}
        onPageChange={setTxPage}
        isLoading={transactions.isLoading}
        isError={transactions.isError}
        onExport={() =>
          exportCsv(
            `/api/admin/analytics/transactions?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}&format=csv`,
            "transactions.csv"
          )
        }
      />
    </div>
  );
}
