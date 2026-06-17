"use client";

import { Loader2, RefreshCw, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAdminDashboard } from "@/features/admin-whitelist/hooks/use-admin-dashboard";
import { type QuestStats, useQuestStats } from "@/features/admin-whitelist/hooks/use-quest-stats";
import { useRegistrationStats } from "@/features/admin-whitelist/hooks/use-registration-stats";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button-v2";
import { Card, CardContent } from "@/shared/ui/card";
import { Typography } from "@/shared/ui/typography";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtUsd(n: number): string {
  if (n === 0) return "0";
  if (n < 1) return n.toFixed(2);
  if (n < 1000) return n.toFixed(0);
  return (n / 1000).toFixed(1) + "k";
}

// ── Primitives ────────────────────────────────────────────────────────────────

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-4 w-1 rounded-full bg-blue-500" />
      <div>
        <h2 className="font-bold text-sm uppercase tracking-widest text-foreground">{title}</h2>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

function KpiBadge({ label, variant }: { label: string; variant: "green" | "blue" | "amber" }) {
  const cls = {
    green: "bg-green-500/10 text-green-400",
    blue: "bg-blue-500/10 text-blue-400",
    amber: "bg-amber-500/10 text-amber-400",
  }[variant];
  return (
    <span
      className={cn(
        "mt-1 inline-flex items-center rounded px-1.5 py-0.5 font-semibold text-[10px]",
        cls
      )}
    >
      {label}
    </span>
  );
}

function KpiCard({
  label,
  value,
  sub,
  badge,
}: {
  label: string;
  value: string | number;
  sub: string;
  badge?: { label: string; variant: "green" | "blue" | "amber" };
}) {
  return (
    <Card className="border-border border-t-2 border-t-blue-500/60 bg-card">
      <CardContent className="p-4">
        <p className="mb-1 text-[10px] text-muted-foreground uppercase tracking-widest">{label}</p>
        <p className="font-bold text-2xl leading-none">{value}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>
        {badge && <KpiBadge label={badge.label} variant={badge.variant} />}
      </CardContent>
    </Card>
  );
}

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

// ── WAITLIST SECTION ──────────────────────────────────────────────────────────

function WaitlistKpis({
  walletStats,
  emailDispatches,
}: {
  walletStats: {
    totalWalletEntries: number;
    contactableEntries: number;
    last24h: number;
    last7d: number;
    totalSuccessfulReferrals: number;
  };
  emailDispatches: { accessSent: number };
}) {
  const { totalWalletEntries, contactableEntries, last24h, last7d, totalSuccessfulReferrals } =
    walletStats;
  const emailPct =
    totalWalletEntries > 0 ? Math.round((contactableEntries / totalWalletEntries) * 100) : 0;
  const viralRate =
    totalWalletEntries > 0 ? Math.round((totalSuccessfulReferrals / totalWalletEntries) * 100) : 0;
  const accessPct =
    totalWalletEntries > 0
      ? Math.round((emailDispatches.accessSent / totalWalletEntries) * 100)
      : 0;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      <KpiCard
        label="Total Wallets"
        value={totalWalletEntries.toLocaleString()}
        sub="All-time registrations"
        badge={{ label: `+${last24h} today`, variant: "green" }}
      />
      <KpiCard
        label="New (24h)"
        value={last24h}
        sub={`Last 7 days: ${last7d}`}
        badge={{ label: "Registrations", variant: "blue" }}
      />
      <KpiCard
        label="Email Conversion"
        value={`${emailPct}%`}
        sub={`${contactableEntries} / ${totalWalletEntries} have email`}
        badge={
          emailPct < 70
            ? { label: "Below 70% target", variant: "amber" }
            : { label: "On target", variant: "green" }
        }
      />
      <KpiCard
        label="Total Referrals"
        value={totalSuccessfulReferrals.toLocaleString()}
        sub="Successful referrals"
        badge={{ label: `${viralRate}% viral rate`, variant: "blue" }}
      />
      <KpiCard
        label="Access Sent"
        value={emailDispatches.accessSent.toLocaleString()}
        sub="Access emails delivered"
        badge={{ label: `${accessPct}% of total`, variant: "blue" }}
      />
    </div>
  );
}

function GrowthChart({ data }: { data: Array<{ date: string; count: number }> }) {
  const formatTick = (dateStr: string, index: number) => {
    if (index % 7 !== 0) return "";
    const d = new Date(`${dateStr}T00:00:00Z`);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6">
        <div className="mb-4">
          <Typography variant="h3" className="font-semibold text-base">
            Signups Over Time
          </Typography>
          <Typography variant="p" className="text-muted-foreground text-xs">
            Daily wallet registrations — last 30 days
          </Typography>
        </div>
        <ResponsiveContainer width="100%" height={160}>
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

function ConversionFunnel({
  totalWalletEntries,
  contactableEntries,
  accessSent,
}: {
  totalWalletEntries: number;
  contactableEntries: number;
  accessSent: number;
}) {
  const emailPct =
    totalWalletEntries > 0 ? Math.round((contactableEntries / totalWalletEntries) * 100) : 0;
  const accessPct =
    totalWalletEntries > 0 ? Math.round((accessSent / totalWalletEntries) * 100) : 0;
  const steps = [
    {
      label: "Wallets",
      count: totalWalletEntries,
      pct: 100,
      from: "from-blue-500",
      to: "to-indigo-500",
    },
    {
      label: "Have Email",
      count: contactableEntries,
      pct: emailPct,
      from: "from-indigo-500",
      to: "to-violet-500",
    },
    {
      label: "Access Sent",
      count: accessSent,
      pct: accessPct,
      from: "from-violet-500",
      to: "to-purple-500",
    },
  ];
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6">
        <div className="mb-4">
          <Typography variant="h3" className="font-semibold text-base">
            Conversion Funnel
          </Typography>
          <Typography variant="p" className="text-muted-foreground text-xs">
            Wallet → Email → Access progression
          </Typography>
        </div>
        <div className="space-y-1">
          {steps.map((step, i) => (
            <div key={step.label}>
              <div className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-right text-[11px] text-muted-foreground">
                  {step.label}
                </span>
                <div className="h-7 flex-1 overflow-hidden rounded bg-background">
                  <div
                    className={cn(
                      "flex h-full items-center rounded bg-gradient-to-r pl-3",
                      step.from,
                      step.to
                    )}
                    style={{ width: `${Math.max(step.pct, 4)}%` }}
                  >
                    <span className="font-semibold text-[11px] text-white">
                      {step.count.toLocaleString()}
                    </span>
                  </div>
                </div>
                <span className="w-8 text-right text-[11px] text-muted-foreground">
                  {step.pct}%
                </span>
              </div>
              {i < steps.length - 1 && (
                <p className="py-0.5 pl-20 text-center text-[10px] text-muted-foreground/40">
                  ▼ {i === 0 ? 100 - emailPct : emailPct - accessPct}% drop-off
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <MiniStat
            label="Missing Email"
            value={(totalWalletEntries - contactableEntries).toLocaleString()}
            sub="Wallets without email"
          />
          <MiniStat
            label="Eligible for Access"
            value={Math.max(contactableEntries - accessSent, 0).toLocaleString()}
            sub="Have email, not yet sent"
            valueColor="text-green-400"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function EmailDelivery({
  emailDispatches,
}: {
  emailDispatches: {
    confirmationSent: number;
    confirmationFailed: number;
    accessSent: number;
    accessFailed: number;
  };
}) {
  const { confirmationSent, confirmationFailed, accessSent, accessFailed } = emailDispatches;
  const chartData = [
    { name: "Confirmation", sent: confirmationSent, failed: confirmationFailed },
    { name: "Access", sent: accessSent, failed: accessFailed },
  ];
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6">
        <div className="mb-4">
          <Typography variant="h3" className="font-semibold text-base">
            Email Delivery
          </Typography>
          <Typography variant="p" className="text-muted-foreground text-xs">
            Confirmation &amp; access email status
          </Typography>
        </div>
        <ResponsiveContainer width="100%" height={140}>
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
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="sent" name="Sent" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <MiniStat
            label="Confirmation Sent"
            value={confirmationSent.toLocaleString()}
            sub={confirmationFailed > 0 ? `${confirmationFailed} failed` : "No failures"}
          />
          <MiniStat
            label="Access Sent"
            value={accessSent.toLocaleString()}
            sub={accessFailed > 0 ? `${accessFailed} failed` : "No failures"}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ReferralPerformance({
  walletStats,
}: {
  walletStats: {
    totalWalletEntries: number;
    totalSuccessfulReferrals: number;
    usersWithReferrals: number;
    topReferrers: { walletAddress: string; referralCount: number }[];
  };
}) {
  const { totalWalletEntries, totalSuccessfulReferrals, usersWithReferrals, topReferrers } =
    walletStats;
  const avgPerReferrer =
    usersWithReferrals > 0 ? (totalSuccessfulReferrals / usersWithReferrals).toFixed(1) : "0";
  const viralCoeff =
    totalWalletEntries > 0 ? (totalSuccessfulReferrals / totalWalletEntries).toFixed(2) : "0.00";
  const preview = topReferrers.slice(0, 3);
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6">
        <div className="mb-4">
          <Typography variant="h3" className="font-semibold text-base">
            Referral Performance
          </Typography>
          <Typography variant="p" className="text-muted-foreground text-xs">
            Viral growth metrics
          </Typography>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-2">
          <MiniStat
            label="Total Referrals"
            value={totalSuccessfulReferrals.toLocaleString()}
            sub="Successful conversions"
          />
          <MiniStat
            label="Referrers"
            value={usersWithReferrals.toLocaleString()}
            sub={`${totalWalletEntries > 0 ? Math.round((usersWithReferrals / totalWalletEntries) * 100) : 0}% of wallets`}
          />
          <MiniStat label="Avg / Referrer" value={avgPerReferrer} />
          <MiniStat
            label="Viral Coefficient"
            value={viralCoeff}
            sub={`${totalSuccessfulReferrals} / ${totalWalletEntries}`}
            valueColor={Number(viralCoeff) >= 0.2 ? "text-green-400" : undefined}
          />
        </div>
        {preview.length > 0 && (
          <div className="space-y-2 border-border border-t pt-3">
            <p className="mb-2 text-[10px] text-muted-foreground uppercase tracking-wide">
              Top Referrers Preview
            </p>
            {preview.map((r, i) => (
              <div key={r.walletAddress} className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-[10px] text-primary">
                  {i + 1}
                </span>
                <span className="flex-1 font-mono text-[11px] text-muted-foreground">
                  {r.walletAddress.slice(0, 4)}...{r.walletAddress.slice(-4)}
                </span>
                <span className="font-semibold text-primary text-xs">{r.referralCount}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TopReferrers({
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
            Top 10 by successful referral count
          </Typography>
        </div>
        {referrers.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground text-sm">No referrals yet</p>
        ) : (
          <div className="divide-y divide-border">
            {referrers.map((r, i) => {
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
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {r.walletAddress.slice(0, 4)}...{r.walletAddress.slice(-4)}
                  </span>
                  <div className="h-1 flex-1 overflow-hidden rounded bg-border">
                    <div
                      className="h-full rounded bg-blue-500"
                      style={{ width: `${(r.referralCount / maxCount) * 100}%` }}
                    />
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-primary" />
                    <span className="font-semibold text-primary text-xs">{r.referralCount}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CampaignsSection({
  campaigns,
  recentCampaign,
}: {
  campaigns: { total: number; completed: number; failed: number };
  recentCampaign: {
    name: string;
    status: string;
    targetedCount: number;
    sentCount: number;
    failedCount: number;
    completedAt: string | null;
  } | null;
}) {
  const statusColor: Record<string, string> = {
    COMPLETED: "bg-green-500/10 text-green-400",
    RUNNING: "bg-blue-500/10 text-blue-400",
    FAILED: "bg-red-500/10 text-red-400",
    CANCELLED: "bg-slate-500/10 text-slate-400",
    PENDING: "bg-amber-500/10 text-amber-400",
  };
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6">
        <div className="mb-4">
          <Typography variant="h3" className="font-semibold text-base">
            Campaigns
          </Typography>
          <Typography variant="p" className="text-muted-foreground text-xs">
            Access email campaign runs
          </Typography>
        </div>
        <div className="mb-4 grid grid-cols-3 gap-3">
          <MiniStat label="Total Runs" value={campaigns.total} />
          <MiniStat label="Completed" value={campaigns.completed} valueColor="text-green-400" />
          <MiniStat label="Failed" value={campaigns.failed} valueColor="text-red-400" />
        </div>
        {recentCampaign && (
          <div className="rounded-lg border border-border bg-background p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold text-[11px]">{recentCampaign.name}</span>
              <span
                className={cn(
                  "rounded px-2 py-0.5 font-semibold text-[10px]",
                  statusColor[recentCampaign.status] ?? "bg-muted text-muted-foreground"
                )}
              >
                {recentCampaign.status}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="font-bold text-base">{recentCampaign.targetedCount}</p>
                <p className="text-[9px] text-muted-foreground">Targeted</p>
              </div>
              <div>
                <p className="font-bold text-base text-green-400">{recentCampaign.sentCount}</p>
                <p className="text-[9px] text-muted-foreground">Sent</p>
              </div>
              <div>
                <p className="font-bold text-base text-red-400">{recentCampaign.failedCount}</p>
                <p className="text-[9px] text-muted-foreground">Failed</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── QUEST SECTION ─────────────────────────────────────────────────────────────

function QuestKpis({ data }: { data: QuestStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <KpiCard
        label="Quest Wallets"
        value={data.questWallets.toLocaleString()}
        sub="Connected to quest app"
      />
      <KpiCard
        label="Main App Wallets"
        value={data.mainAppWallets.toLocaleString()}
        sub="Connected to tasmil-finance"
      />
      <KpiCard
        label="Onchain Completers"
        value={data.onchainCompleters.toLocaleString()}
        sub="≥1 onchain task verified"
      />
      <KpiCard
        label="Full Completers"
        value={data.fullOnchainCompleters.toLocaleString()}
        sub="All 4 protocols interacted"
        badge={
          data.onchainCompleters > 0
            ? {
                label: `${Math.round((data.fullOnchainCompleters / data.onchainCompleters) * 100)}%`,
                variant: "green" as const,
              }
            : undefined
        }
      />
    </div>
  );
}

function QuestVolumeKpis({ vol }: { vol: QuestStats["volumeByProtocol"] }) {
  const total = vol.defindex + vol.blend + vol.soroswap + vol.aquarius;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      <MiniStat
        label="Total Volume"
        value={`$${fmtUsd(total)}`}
        valueColor="text-indigo-400"
        sub="All protocols combined"
      />
      <MiniStat label="Vault (DeFindex)" value={`$${fmtUsd(vol.defindex)}`} />
      <MiniStat label="Blend" value={`$${fmtUsd(vol.blend)}`} />
      <MiniStat label="SoroSwap" value={`$${fmtUsd(vol.soroswap)}`} />
      <MiniStat label="Aquarius" value={`$${fmtUsd(vol.aquarius)}`} />
    </div>
  );
}

function VolumeChart({ vol }: { vol: QuestStats["volumeByProtocol"] }) {
  const total = vol.defindex + vol.blend + vol.soroswap + vol.aquarius;
  const chartData = [
    { name: "DeFindex", value: vol.defindex },
    { name: "Blend", value: vol.blend },
    { name: "SoroSwap", value: vol.soroswap },
    { name: "Aquarius", value: vol.aquarius },
  ];
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <Typography variant="h3" className="font-semibold text-base">
              Volume by Protocol
            </Typography>
            <Typography variant="p" className="text-muted-foreground text-xs">
              Total deposits by protocol (USD)
            </Typography>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</p>
            <p className="font-bold text-lg text-indigo-400">${fmtUsd(total)}</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
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
              formatter={(v) => [`$${fmtUsd(v as number)}`, "Volume"]}
            />
            <Bar dataKey="value" name="Volume" fill="#6366f1" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function TopDepositors({ topDepositors }: { topDepositors: QuestStats["topDepositors"] }) {
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
        {topDepositors.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground text-sm">No data</p>
        ) : (
          <div className="divide-y divide-border">
            {topDepositors.map((d, i) => (
              <div key={d.walletAddress} className="flex items-center gap-3 py-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 font-bold text-[10px] text-indigo-400">
                  {i + 1}
                </span>
                <span className="flex-1 font-mono text-[11px] text-muted-foreground">
                  {d.walletAddress.slice(0, 6)}…{d.walletAddress.slice(-4)}
                </span>
                <span className="font-semibold text-indigo-400 text-xs">
                  ${d.totalUsd.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Error / Loading ───────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <Typography variant="h3" className="text-destructive">
        Failed to load dashboard
      </Typography>
      <Button variant="outline" onClick={onRetry} className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4" /> Retry
      </Button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { data: stats, isLoading, isFetching, isError, refetch } = useAdminDashboard();
  const { data: registrationStats } = useRegistrationStats(30);
  const { data: questStats, isLoading: questLoading } = useQuestStats();

  if (isLoading || isFetching || questLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !stats) return <ErrorState onRetry={refetch} />;

  return (
    <div className="space-y-10 p-8">
      <div>
        <Typography variant="h1" className="font-bold text-3xl">
          Overview
        </Typography>
        <Typography variant="p" className="mt-1 text-muted-foreground">
          Platform metrics — waitlist, email delivery, quest performance
        </Typography>
      </div>

      {/* ── WAITLIST ── */}
      <section className="space-y-4">
        <SectionHeader title="Waitlist" sub="Registrations, email conversion, referrals" />
        <WaitlistKpis walletStats={stats.walletStats} emailDispatches={stats.emailDispatches} />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <GrowthChart data={registrationStats ?? []} />
          <ConversionFunnel
            totalWalletEntries={stats.walletStats.totalWalletEntries}
            contactableEntries={stats.walletStats.contactableEntries}
            accessSent={stats.emailDispatches.accessSent}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <EmailDelivery emailDispatches={stats.emailDispatches} />
          <ReferralPerformance walletStats={stats.walletStats} />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TopReferrers referrers={stats.walletStats.topReferrers} />
          <CampaignsSection campaigns={stats.campaigns} recentCampaign={stats.recentCampaign} />
        </div>
      </section>

      {/* ── QUEST PERFORMANCE ── */}
      {questStats && (
        <section className="space-y-4">
          <SectionHeader
            title="Quest Performance"
            sub="On-chain completions, protocol volume, top depositors"
          />
          <QuestKpis data={questStats} />
          <QuestVolumeKpis vol={questStats.volumeByProtocol} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <VolumeChart vol={questStats.volumeByProtocol} />
            <TopDepositors topDepositors={questStats.topDepositors} />
          </div>
        </section>
      )}
    </div>
  );
}
