"use client";

import { Loader2 } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAdminDashboard } from "@/features/admin-whitelist/hooks/use-admin-dashboard";
import { type QuestStats, useQuestStats } from "@/features/admin-whitelist/hooks/use-quest-stats";
import { useRegistrationStats } from "@/features/admin-whitelist/hooks/use-registration-stats";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/shared/ui/card";
import { Typography } from "@/shared/ui/typography";

// ────── KPI Card ──────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub: string;
}) {
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

// ────── Mini Stat ──────────────────────────────────────────────────────────

function MiniStat({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: string | number;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={cn("mt-0.5 font-bold text-xl leading-tight", valueColor ?? "text-foreground")}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ────── KPI Row ──────────────────────────────────────────────────────────

function KpiRow({
  dashboard,
  questStats,
}: {
  dashboard: {
    walletStats: {
      totalWalletEntries: number;
      last24h: number;
      totalSuccessfulReferrals: number;
    };
    campaigns: { total: number };
    emailDispatches: { accessSent: number };
  };
  questStats?: QuestStats;
}) {
  const totalVolume = questStats
    ? (
        questStats.volumeByProtocol.defindex +
        questStats.volumeByProtocol.blend +
        questStats.volumeByProtocol.soroswap +
        questStats.volumeByProtocol.aquarius
      ).toFixed(0)
    : "0";

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      <KpiCard
        label="Total Wallets"
        value={dashboard.walletStats.totalWalletEntries.toLocaleString()}
        sub="Registered"
      />
      <KpiCard
        label="Active Campaigns"
        value={dashboard.campaigns.total}
        sub="Total email campaigns"
      />
      <KpiCard
        label="Quest Wallets"
        value={questStats?.questWallets.toLocaleString() ?? "—"}
        sub="Connected to quest"
      />
      <KpiCard
        label="Tasks Completed"
        value={questStats?.onchainCompleters.toLocaleString() ?? "—"}
        sub="≥1 onchain task"
      />
      <KpiCard label="Volume (USD)" value={`$${totalVolume}`} sub="All protocols" />
    </div>
  );
}

// ────── Registration Growth Chart ──────────────────────────────────────────

function GrowthChart({ data }: { data: Array<{ date: string; count: number }> }) {
  const formatTick = (dateStr: string, index: number) => {
    if (index % 7 !== 0) return "";
    const d = new Date(`${dateStr}T00:00:00Z`);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <Card className="border-border bg-card lg:col-span-2">
      <CardContent className="p-6">
        <div className="mb-4">
          <Typography variant="h3" className="font-semibold text-base">
            Registration Growth
          </Typography>
          <Typography variant="p" className="text-muted-foreground text-xs">
            Daily wallet registrations — last 30 days
          </Typography>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatTick}
              tick={{ fontSize: 10, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: 6,
                fontSize: 12,
              }}
              labelFormatter={(label) => {
                const d = new Date(`${label}T00:00:00Z`);
                return d.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#blueGrad)"
              dot={false}
              activeDot={{ r: 4, fill: "#3b82f6" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ────── Protocol Volume Chart ──────────────────────────────────────────────

function VolumeChart({ questStats }: { questStats?: QuestStats }) {
  if (!questStats) {
    return (
      <Card className="border-border bg-card lg:col-span-2">
        <CardContent className="p-6">
          <Typography variant="p" className="text-muted-foreground text-xs">
            No quest volume data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const chartData = [
    { name: "DeFindex", value: questStats.volumeByProtocol.defindex },
    { name: "Blend", value: questStats.volumeByProtocol.blend },
    { name: "SoroSwap", value: questStats.volumeByProtocol.soroswap },
    { name: "Aquarius", value: questStats.volumeByProtocol.aquarius },
  ];

  return (
    <Card className="border-border bg-card lg:col-span-2">
      <CardContent className="p-6">
        <div className="mb-4">
          <Typography variant="h3" className="font-semibold text-base">
            Volume by Protocol
          </Typography>
          <Typography variant="p" className="text-muted-foreground text-xs">
            Total deposits by protocol
          </Typography>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: 6,
                fontSize: 12,
              }}
              formatter={(value) => `$${(value as number).toFixed(0)}`}
            />
            <Bar dataKey="value" name="Volume" fill="#3b82f6" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ────── Top Wallets by Volume ──────────────────────────────────────────────

function TopWalletsByVolume({ topDepositors }: { topDepositors?: Array<{ walletAddress: string; totalUsd: number }> }) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6">
        <div className="mb-4">
          <Typography variant="h3" className="font-semibold text-base">
            Top Wallets by Volume
          </Typography>
          <Typography variant="p" className="text-muted-foreground text-xs">
            Highest depositors on quest
          </Typography>
        </div>
        {!topDepositors || topDepositors.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground text-sm">No data</p>
        ) : (
          <div className="divide-y divide-border">
            {topDepositors.slice(0, 5).map((w, i) => (
              <div key={w.walletAddress} className="flex items-center gap-3 py-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-[10px] text-primary">
                  {i + 1}
                </span>
                <span className="flex-1 font-mono text-[11px] text-muted-foreground">
                  {w.walletAddress.slice(0, 4)}...{w.walletAddress.slice(-4)}
                </span>
                <span className="font-semibold text-primary text-xs">${w.totalUsd.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ────── Top Referrers ──────────────────────────────────────────────────────

function TopReferrersTable({
  referrers,
}: {
  referrers: { walletAddress: string; referralCount: number }[];
}) {
  const maxCount = referrers[0]?.referralCount ?? 1;
  const rankStyle = [
    { bg: "bg-amber-500/15", text: "text-amber-400" },
    { bg: "bg-slate-500/15", text: "text-slate-400" },
    { bg: "bg-orange-500/15", text: "text-orange-400" },
  ];

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6">
        <div className="mb-4">
          <Typography variant="h3" className="font-semibold text-base">
            Top Referrers
          </Typography>
          <Typography variant="p" className="text-muted-foreground text-xs">
            Top 5 by successful referral count
          </Typography>
        </div>
        {referrers.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground text-sm">No referrals yet</p>
        ) : (
          <div className="divide-y divide-border">
            {referrers.slice(0, 5).map((r, i) => {
              const style = rankStyle[i] ?? { bg: "bg-primary/10", text: "text-primary" };
              return (
                <div key={r.walletAddress} className="flex items-center gap-3 py-2.5">
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-bold text-[10px]",
                      style.bg,
                      style.text
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 font-mono text-[11px] text-muted-foreground">
                    {r.walletAddress.slice(0, 4)}...{r.walletAddress.slice(-4)}
                  </span>
                  <div className="h-1 w-24 overflow-hidden rounded bg-border">
                    <div
                      className="h-full rounded bg-blue-500"
                      style={{ width: `${(r.referralCount / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-10 text-right font-semibold text-primary text-xs">
                    {r.referralCount}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ────── Summary Stats ──────────────────────────────────────────────────────

function SummaryStats({
  dashboard,
  questStats,
}: {
  dashboard: {
    walletStats: { totalSuccessfulReferrals: number };
    emailDispatches: { confirmationSent: number; confirmationFailed: number };
  };
  questStats?: QuestStats;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <MiniStat
        label="Total Referrals"
        value={dashboard.walletStats.totalSuccessfulReferrals.toLocaleString()}
        sub="Successful conversions"
      />
      <MiniStat
        label="Confirmation Sent"
        value={dashboard.emailDispatches.confirmationSent.toLocaleString()}
        valueColor={
          dashboard.emailDispatches.confirmationFailed > 0 ? "text-amber-400" : "text-green-400"
        }
      />
      <MiniStat
        label="Email Failures"
        value={dashboard.emailDispatches.confirmationFailed}
        valueColor={dashboard.emailDispatches.confirmationFailed > 0 ? "text-red-400" : "text-green-400"}
      />
      <MiniStat
        label="Full Completers"
        value={questStats?.fullOnchainCompleters.toLocaleString() ?? "—"}
        sub="All 4 protocols"
      />
    </div>
  );
}

// ────── Page ──────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { data: dashboard, isLoading: dashboardLoading } = useAdminDashboard();
  const { data: registrationStats } = useRegistrationStats(30);
  const { data: questStats, isLoading: questLoading } = useQuestStats();

  const isLoading = dashboardLoading || questLoading;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Typography variant="p" className="text-muted-foreground">
          Failed to load analytics data
        </Typography>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <Typography variant="h1" className="font-bold text-3xl">
          Analytics
        </Typography>
        <Typography variant="p" className="mt-1 text-muted-foreground">
          Platform metrics, growth, and performance overview
        </Typography>
      </div>

      {/* KPI Row */}
      <KpiRow dashboard={dashboard} questStats={questStats} />

      {/* Summary Stats */}
      <SummaryStats dashboard={dashboard} questStats={questStats} />

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GrowthChart data={registrationStats ?? []} />
        <VolumeChart questStats={questStats} />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TopWalletsByVolume topDepositors={questStats?.topDepositors} />
        <TopReferrersTable referrers={dashboard.walletStats.topReferrers} />
      </div>
    </div>
  );
}
