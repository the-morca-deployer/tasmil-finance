"use client";

import { ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button-v2";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

import { DEFAULT_VAULT_STATS, VAULT_CONFIG } from "../constants";

interface VaultDemoProps {
  className?: string;
}

export function VaultDemo({ className }: VaultDemoProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Hero Section */}
      <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl">
            Welcome to {VAULT_CONFIG.name}
          </CardTitle>
          <p className="text-muted-foreground">
            Apple-level simplicity meets DeFi sophistication
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats Preview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="bg-gradient-to-r from-[#B5EAFF] to-[#00BFFF] bg-clip-text font-bold text-4xl text-transparent">
                {DEFAULT_VAULT_STATS.apy}%
              </div>
              <div className="text-muted-foreground text-sm">Current APY</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-4xl">
                ${(DEFAULT_VAULT_STATS.tvl / 1000000).toFixed(1)}M
              </div>
              <div className="text-muted-foreground text-sm">Total Value Locked</div>
            </div>
          </div>

          {/* CTA Button */}
          <Link href="/vault" className="block">
            <Button variant="gradient" size="lg" className="h-14 w-full text-lg">
              Start Earning 14.7% APY
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Feature Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <FeatureCard
          icon={<TrendingUp className="h-6 w-6" />}
          title="AI-Powered"
          description="Automated rebalancing for maximum yield"
          href="/vault/strategies"
        />
        <FeatureCard
          icon={<Sparkles className="h-6 w-6" />}
          title="1-Click Deposits"
          description="Coinbase-level simplicity"
          href="/vault"
        />
        <FeatureCard
          icon={<ArrowRight className="h-6 w-6" />}
          title="Instant Withdrawals"
          description="Your money, your control"
          href="/vault/portfolio"
        />
      </div>

      {/* Navigation Links */}
      <Card>
        <CardHeader>
          <CardTitle>Explore Vault Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <NavLink href="/vault" title="Vault Landing" description="Main deposit interface" />
            <NavLink href="/vault/portfolio" title="Your Position" description="Track your earnings" />
            <NavLink href="/vault/strategies" title="AI Strategies" description="How it works" />
            <NavLink href="/vault/activity" title="Activity History" description="Full transparency" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}

function FeatureCard({ icon, title, description, href }: FeatureCardProps) {
  return (
    <Link href={href}>
      <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1">
        <CardContent className="flex flex-col items-center p-6 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            {icon}
          </div>
          <h3 className="mb-2 font-semibold">{title}</h3>
          <p className="text-muted-foreground text-sm">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

interface NavLinkProps {
  href: string;
  title: string;
  description: string;
}

function NavLink({ href, title, description }: NavLinkProps) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-3 transition-colors hover:bg-muted/50"
    >
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-muted-foreground text-sm">{description}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}