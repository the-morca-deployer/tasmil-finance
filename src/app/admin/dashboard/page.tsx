"use client";

import { useAdminDashboard } from "@/features/admin-whitelist/hooks/use-admin-dashboard";
import { Typography } from "@/shared/ui/typography";
import { Card, CardContent } from "@/shared/ui/card";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/shared/ui/button-v2";

function StatCard({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6">
        <Typography variant="p" className="text-muted-foreground text-sm mb-1">
          {title}
        </Typography>
        <Typography variant="h2" className="font-bold text-3xl">
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="p" className="text-muted-foreground text-xs mt-1">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h1" className="font-bold text-3xl">
            Whitelist Dashboard
          </Typography>
          <Typography variant="p" className="text-muted-foreground mt-1">
            Overview of registrations and campaign performance
          </Typography>
        </div>
        <Button variant="gradient" asChild>
          <Link href="/admin/campaigns">Send Campaign</Link>
        </Button>
      </div>

      {/* Waitlist Stats */}
      <section>
        <Typography variant="h3" className="font-semibold text-lg mb-4">
          Waitlist Registrations
        </Typography>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Last 24 Hours" value={stats?.waitlist.last24h ?? 0} />
          <StatCard title="Last 7 Days" value={stats?.waitlist.last7d ?? 0} />
          <StatCard title="All Time" value={stats?.waitlist.allTime ?? 0} />
        </div>
      </section>

      {/* Email Stats */}
      <section>
        <Typography variant="h3" className="font-semibold text-lg mb-4">
          Email Deliveries
        </Typography>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Confirmations Sent"
            value={stats?.emailDispatches.confirmationSent ?? 0}
            subtitle="Waitlist confirmation emails"
          />
          <StatCard
            title="Confirmations Failed"
            value={stats?.emailDispatches.confirmationFailed ?? 0}
          />
          <StatCard
            title="Access Emails Sent"
            value={stats?.emailDispatches.accessSent ?? 0}
            subtitle="Campaign access releases"
          />
          <StatCard
            title="Access Emails Failed"
            value={stats?.emailDispatches.accessFailed ?? 0}
          />
        </div>
      </section>

      {/* Access Codes Stats */}
      <section>
        <Typography variant="h3" className="font-semibold text-lg mb-4">
          Access Codes
        </Typography>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Total Issued" value={stats?.accessCodes.total ?? 0} />
          <StatCard title="Active" value={stats?.accessCodes.active ?? 0} subtitle="Available for use" />
          <StatCard title="Exhausted" value={stats?.accessCodes.exhausted ?? 0} subtitle="Fully redeemed" />
        </div>
      </section>

      {/* Campaign Stats */}
      <section>
        <Typography variant="h3" className="font-semibold text-lg mb-4">
          Campaigns
        </Typography>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Total Campaigns" value={stats?.campaigns.total ?? 0} />
          <StatCard title="Completed" value={stats?.campaigns.completed ?? 0} />
          <StatCard title="Failed" value={stats?.campaigns.failed ?? 0} />
        </div>
      </section>
    </div>
  );
}