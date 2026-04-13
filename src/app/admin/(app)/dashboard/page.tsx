"use client";

import { useAdminDashboard } from "@/features/admin-whitelist/hooks/use-admin-dashboard";
import { Typography } from "@/shared/ui/typography";
import { Card, CardContent } from "@/shared/ui/card";
import { Loader2, RefreshCw, TrendingUp } from "lucide-react";
import { Button } from "@/shared/ui/button-v2";

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6">
        <Typography variant="p" className="mb-1 text-sm text-muted-foreground">
          {title}
        </Typography>
        <Typography variant="h2" className="text-3xl font-bold">
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="p" className="mt-1 text-xs text-muted-foreground">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <Typography variant="h3" className="text-destructive">
        Failed to load dashboard
      </Typography>
      <Button variant="outline" onClick={onRetry} className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4" />
        Retry
      </Button>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading, isError, refetch } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  const walletStats = stats?.walletStats;

  return (
    <div className="space-y-8 p-8">
      <div>
        <Typography variant="h1" className="text-3xl font-bold">
          Whitelist Dashboard
        </Typography>
        <Typography variant="p" className="mt-1 text-muted-foreground">
          Overview of wallet registrations, contactable entries, and referral performance
        </Typography>
      </div>

      {/* Wallet Entry Stats */}
      <section>
        <Typography variant="h3" className="mb-4 font-semibold text-lg">
          Wallet Registrations
        </Typography>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard
            title="Total Wallets"
            value={walletStats?.totalWalletEntries ?? 0}
            subtitle="All-time wallet registrations"
          />
          <StatCard
            title="Contactable"
            value={walletStats?.contactableEntries ?? 0}
            subtitle="Wallets with email attached"
          />
          <StatCard title="Last 24 Hours" value={walletStats?.last24h ?? 0} />
          <StatCard title="Last 7 Days" value={walletStats?.last7d ?? 0} />
        </div>
      </section>

      {/* Top Referrers */}
      {walletStats && walletStats.topReferrers.length > 0 && (
        <section>
          <Typography variant="h3" className="mb-4 font-semibold text-lg">
            Top Referrers
          </Typography>
          <Card className="border-border bg-card">
            <CardContent className="divide-y divide-border p-0">
              {walletStats.topReferrers.map((referrer, index) => (
                <div
                  key={referrer.walletAddress}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {index + 1}
                    </span>
                    <Typography variant="p" className="font-mono text-sm">
                      {referrer.walletAddress.slice(0, 6)}...{referrer.walletAddress.slice(-4)}
                    </Typography>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <Typography variant="p" className="text-sm font-medium text-primary">
                      {referrer.referralCount} referral{referrer.referralCount !== 1 ? "s" : ""}
                    </Typography>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Legacy Access Codes — retained for migration reference */}
      <section>
        <Typography variant="h3" className="mb-4 font-semibold text-lg">
          Access Codes
        </Typography>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard title="Total Issued" value={stats?.accessCodes.total ?? 0} />
          <StatCard
            title="Active"
            value={stats?.accessCodes.active ?? 0}
            subtitle="Available for use"
          />
          <StatCard
            title="Exhausted"
            value={stats?.accessCodes.exhausted ?? 0}
            subtitle="Fully redeemed"
          />
        </div>
      </section>
    </div>
  );
}
