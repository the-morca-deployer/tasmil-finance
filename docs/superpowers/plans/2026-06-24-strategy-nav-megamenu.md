# Strategy Navigation & Mega Menu - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Strategies" dropdown megamenu to the navbar and create a dedicated route group `(strategy)/` with its own `StrategyNav` header, following the Quest section pattern.

**Architecture:** Three new components (MegaMenu, StrategyNav, StrategyFooter) compose into a `(strategy)/layout.tsx` route group wrapping 5 pages under `/strategies/*`. The MegaMenu uses CSS-only Tailwind `group-hover` for the dropdown. Existing marketplace and my-agents pages migrate into the new route group. Old routes get redirects.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS, React, TypeScript

---

## File Structure

```
src/
  app/
    (strategy)/
      layout.tsx                        NEW
      strategies/
        page.tsx                        NEW (marketplace browse)
        [id]/page.tsx                   NEW (strategy detail)
        dashboard/page.tsx              NEW (publisher dashboard)
        leaderboard/page.tsx            NEW (leaderboard)
        create/page.tsx                 NEW (publish strategy)
  features/strategies/
    components/
      MegaMenu.tsx                      NEW
      StrategyNav.tsx                   NEW
      StrategyFooter.tsx                NEW
      PublisherDashboard.tsx            NEW (extracted from old my-agents page)
      strategy-list-page.tsx            existing (unchanged)
      strategy-detail-page.tsx          existing (unchanged)
      index.ts                          MODIFY (add new exports)
    index.ts                             MODIFY (barrel)
  shared/layout/
    sidebar-data.ts                     MODIFY (remove Marketplace/MyAgents, add Strategies)
    top-nav-bar.tsx                     MODIFY (add Strategies megamenu trigger)
  next.config.ts                        MODIFY (add redirects)

DELETED:
  app/(dashboard)/marketplace/
  app/(dashboard)/my-agents/
  app/(dashboard)/strategies/
```

---

### Task 1: Create MegaMenu component

**Files:**
- Create: `src/features/strategies/components/MegaMenu.tsx`

- [ ] **Step 1: Write the component**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface MegaMenuItem {
  label: string;
  description: string;
  href: string;
}

const ITEMS: MegaMenuItem[] = [
  {
    label: "Marketplace",
    description: "Browse all available strategies",
    href: "/strategies",
  },
  {
    label: "Publisher Dashboard",
    description: "Track your published strategies",
    href: "/strategies/dashboard",
  },
  {
    label: "Leaderboard",
    description: "Top performing strategies",
    href: "/strategies/leaderboard",
  },
  {
    label: "Publish Strategy",
    description: "Create and deploy your own strategy",
    href: "/strategies/create",
  },
];

export function MegaMenu({ className }: { className?: string }) {
  const pathname = usePathname() ?? "";

  return (
    <div
      className={cn(
        "absolute left-0 top-full z-50 mt-2 w-[280px] rounded-[22px] border p-2",
        "border-[rgba(255,255,255,0.08)] bg-[#0D111A] shadow-xl",
        "opacity-0 invisible group-hover:opacity-100 group-hover:visible",
        "translate-y-2 group-hover:translate-y-0 transition-all duration-200",
        className,
      )}
    >
      {ITEMS.map((item) => {
        const isActive =
          item.href === "/strategies"
            ? pathname === "/strategies"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block rounded-[14px] px-5 py-3 transition-colors",
              isActive
                ? "bg-[rgba(103,232,249,0.14)]"
                : "hover:bg-[rgba(255,255,255,0.05)]",
            )}
          >
            <div
              className={cn(
                "font-medium text-[14.5px]",
                isActive ? "text-[#67E8F9]" : "text-[#F4F7FB]",
              )}
            >
              {item.label}
            </div>
            <div className="mt-0.5 text-[12px] text-[rgba(244,247,251,0.34)]">
              {item.description}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd tasmil-finance && npx tsc --noEmit --pretty 2>&1 | grep -i "MegaMenu" | head -10`

Expected: No errors referencing MegaMenu.tsx.

- [ ] **Step 3: Commit**

```bash
git add src/features/strategies/components/MegaMenu.tsx
git commit -m "feat: add MegaMenu hover dropdown component for strategy nav"
```

---

### Task 2: Create StrategyNav component

**Files:**
- Create: `src/features/strategies/components/StrategyNav.tsx`

- [ ] **Step 1: Write the component**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MegaMenu } from "./MegaMenu";

const NAV_LINKS = [
  { href: "/strategies", label: "Strategies", hasMegaMenu: true },
  { href: "/chat/new", label: "Chat" },
  { href: "/missions", label: "Missions" },
  { href: "/farming", label: "Farming" },
  { href: "/aggregator", label: "Aggregator" },
  { href: "/portfolio", label: "Portfolio" },
];

export function StrategyNav() {
  const pathname = usePathname() ?? "";

  const isActive = (href: string) => {
    if (href === "/strategies") {
      return pathname.startsWith("/strategies");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav
      className={cn(
        "sticky top-0 z-[100] flex h-[68px] items-center justify-between",
        "border-b border-[rgba(255,255,255,0.08)]",
        "bg-[rgba(0,0,0,0.72)] backdrop-blur-[18px]",
        "px-[clamp(20px,5vw,72px)]",
      )}
    >
      {/* Brand */}
      <Link href="/strategies" className="flex items-center gap-3">
        <span className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-gradient-to-r from-white via-[#67E8F9] to-[#0EA5E9] font-extrabold text-[10px] text-[#04141A]">
          T
        </span>
        <span className="font-bold text-[17px] tracking-[-0.02em] text-[#F4F7FB]">
          Tasmil Finance
        </span>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-1">
        {NAV_LINKS.map((link) => {
          const active = isActive(link.href);
          const content = (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative inline-flex items-center gap-1 rounded-[100px] px-[18px] py-2",
                "text-[14.5px] font-medium transition-colors",
                active
                  ? "text-[#F4F7FB]"
                  : "text-[rgba(244,247,251,0.58)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#F4F7FB]",
              )}
            >
              {link.label}
              {link.hasMegaMenu && (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              )}
              {active && (
                <span className="absolute bottom-0 left-1/2 h-[2px] w-[60%] -translate-x-1/2 rounded-[2px] bg-[#67E8F9] shadow-[0_0_10px_rgba(103,232,249,0.5)]" />
              )}
            </Link>
          );

          if (link.hasMegaMenu) {
            return (
              <div key={link.href} className="relative group">
                {content}
                <MegaMenu />
              </div>
            );
          }

          return content;
        })}
        {/* Quest link - external */}
        <a
          href="https://quest.tasmil-finance.xyz"
          className={cn(
            "relative inline-flex items-center rounded-[100px] px-[18px] py-2",
            "text-[14.5px] font-medium",
            "text-[rgba(244,247,251,0.58)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#F4F7FB]",
            "transition-colors",
          )}
        >
          Quest
        </a>
      </div>

      {/* Right - wallet area placeholder */}
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-2.5 rounded-[100px] border border-[rgba(255,255,255,0.14)] bg-[#0D111A] py-1.5 pl-3.5 pr-1.5">
          <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-gradient-to-r from-white via-[#67E8F9] to-[#0EA5E9] text-[9px] font-bold text-[#04141A]">
            W
          </span>
          <span className="font-mono text-[13px] text-[#F4F7FB]">
            Connect Wallet
          </span>
        </span>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd tasmil-finance && npx tsc --noEmit --pretty 2>&1 | grep -i "StrategyNav" | head -10`

Expected: No errors from StrategyNav.tsx.

- [ ] **Step 3: Commit**

```bash
git add src/features/strategies/components/StrategyNav.tsx
git commit -m "feat: add StrategyNav dedicated navbar with megamenu"
```

---

### Task 3: Create StrategyFooter component

**Files:**
- Create: `src/features/strategies/components/StrategyFooter.tsx`

- [ ] **Step 1: Write the component**

```tsx
"use client";

import Link from "next/link";

const LINKS = {
  website: "https://tasmil-finance.xyz",
  docs: "https://tasmil-user-docs.vercel.app/docs",
  x: "https://x.com/tasmilfinance",
  telegram: "https://t.me/tasmilfinance",
};

export function StrategyFooter() {
  return (
    <footer className="border-t border-[rgba(255,255,255,0.08)] bg-black px-[clamp(20px,5vw,72px)] py-12">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-8 md:flex-row md:justify-between">
        {/* Brand */}
        <div>
          <Link href="/strategies" className="flex items-center gap-2.5">
            <span className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-gradient-to-r from-white via-[#67E8F9] to-[#0EA5E9] font-extrabold text-[10px] text-[#04141A]">
              T
            </span>
            <span className="font-bold text-[17px] tracking-[-0.02em] text-[#F4F7FB]">
              Tasmil Finance
            </span>
          </Link>
          <p className="mt-3 max-w-xs text-[14px] leading-relaxed text-[rgba(244,247,251,0.34)]">
            Autonomous DeFi yield optimization. Browse, deploy, and track trading
            strategies on Stellar.
          </p>
        </div>

        {/* Nav columns */}
        <div className="flex gap-16">
          <div className="flex flex-col gap-2">
            <span className="mb-1 font-semibold text-[11px] uppercase tracking-[0.18em] text-[rgba(244,247,251,0.34)]">
              Strategies
            </span>
            <Link
              href="/strategies"
              className="text-[14px] text-[rgba(244,247,251,0.58)] hover:text-[#F4F7FB] transition-colors"
            >
              Marketplace
            </Link>
            <Link
              href="/strategies/dashboard"
              className="text-[14px] text-[rgba(244,247,251,0.58)] hover:text-[#F4F7FB] transition-colors"
            >
              Publisher Dashboard
            </Link>
            <Link
              href="/strategies/leaderboard"
              className="text-[14px] text-[rgba(244,247,251,0.58)] hover:text-[#F4F7FB] transition-colors"
            >
              Leaderboard
            </Link>
            <Link
              href="/strategies/create"
              className="text-[14px] text-[rgba(244,247,251,0.58)] hover:text-[#F4F7FB] transition-colors"
            >
              Publish Strategy
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="mb-1 font-semibold text-[11px] uppercase tracking-[0.18em] text-[rgba(244,247,251,0.34)]">
              Resources
            </span>
            <a
              href={LINKS.website}
              target="_blank"
              rel="noreferrer"
              className="text-[14px] text-[rgba(244,247,251,0.58)] hover:text-[#F4F7FB] transition-colors"
            >
              Website
            </a>
            <a
              href={LINKS.docs}
              target="_blank"
              rel="noreferrer"
              className="text-[14px] text-[rgba(244,247,251,0.58)] hover:text-[#F4F7FB] transition-colors"
            >
              Docs
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mx-auto mt-10 flex max-w-[1280px] flex-col items-center justify-between gap-4 border-t border-[rgba(255,255,255,0.08)] pt-6 sm:flex-row">
        <p className="text-[13px] text-[rgba(244,247,251,0.34)]">
          &copy; 2025 Tasmil Network. All rights reserved.
        </p>
        <div className="flex gap-6">
          <a
            href={LINKS.x}
            target="_blank"
            rel="noreferrer"
            aria-label="X (Twitter)"
            className="text-[rgba(244,247,251,0.34)] hover:text-[#F4F7FB] transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a
            href={LINKS.telegram}
            target="_blank"
            rel="noreferrer"
            aria-label="Telegram"
            className="text-[rgba(244,247,251,0.34)] hover:text-[#F4F7FB] transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
              <path d="M21.9 4.3 18.7 19.4c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-4.9 9-8.1c.4-.3-.1-.5-.6-.2L6.4 13 1.7 11.5c-1-.3-1-.9.2-1.4L20.6 3c.8-.3 1.5.2 1.3 1.3Z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd tasmil-finance && npx tsc --noEmit --pretty 2>&1 | grep -i "StrategyFooter" | head -10`

- [ ] **Step 3: Commit**

```bash
git add src/features/strategies/components/StrategyFooter.tsx
git commit -m "feat: add StrategyFooter for strategy section"
```

---

### Task 4: Create (strategy)/layout.tsx

**Files:**
- Create: `src/app/(strategy)/layout.tsx`

- [ ] **Step 1: Create the route group layout**

```tsx
"use client";

import { Hanken_Grotesk } from "next/font/google";
import { StrategyFooter } from "@/features/strategies/components/StrategyFooter";
import { StrategyNav } from "@/features/strategies/components/StrategyNav";

const strategySans = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-strategy-sans",
  display: "swap",
});

export default function StrategyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${strategySans.variable} flex min-h-screen flex-col bg-black`}
      style={{
        fontFamily:
          "var(--font-strategy-sans), system-ui, -apple-system, sans-serif",
      }}
    >
      <StrategyNav />
      <main className="mx-auto w-full max-w-[1280px] flex-grow px-[clamp(20px,5vw,72px)] py-6">
        {children}
      </main>
      <StrategyFooter />
    </div>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd tasmil-finance && npx tsc --noEmit --pretty 2>&1 | grep -E "strategy|layout" | head -10`

- [ ] **Step 3: Commit**

```bash
git add src/app/'(strategy)'/layout.tsx
git commit -m "feat: add (strategy) route group layout with StrategyNav + StrategyFooter"
```

---

### Task 5: Create marketplace browse page at /strategies

**Files:**
- Create: `src/app/(strategy)/strategies/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
import { MarketplacePage } from "@/features/marketplace";

export default function StrategiesBrowseRoute() {
  return <MarketplacePage />;
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd tasmil-finance && npx tsc --noEmit --pretty 2>&1 | head -5`

- [ ] **Step 3: Commit**

```bash
git add src/app/'(strategy)'/strategies/page.tsx
git commit -m "feat: add /strategies marketplace browse page"
```

---

### Task 6: Create strategy detail page at /strategies/[id]

**Files:**
- Create: `src/app/(strategy)/strategies/[id]/page.tsx`

- [ ] **Step 1: Write the page**

Note: The old route used `params.strategyId`. The new folder `[id]` means the param key is `id`.

```tsx
"use client";

import { useParams } from "next/navigation";
import { StrategyDetailPage } from "@/features/strategies";

export default function StrategyDetailRoute() {
  const params = useParams();
  const strategyId = params.id as string;

  return <StrategyDetailPage strategyId={strategyId} />;
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd tasmil-finance && npx tsc --noEmit --pretty 2>&1 | head -5`

- [ ] **Step 3: Commit**

```bash
git add src/app/'(strategy)'/strategies/'[id]'/page.tsx
git commit -m "feat: add strategy detail page at /strategies/[id]"
```

---

### Task 7: Create PublisherDashboard component and page

**Files:**
- Create: `src/features/strategies/components/PublisherDashboard.tsx`
- Create: `src/app/(strategy)/strategies/dashboard/page.tsx`

- [ ] **Step 1: Write the PublisherDashboard component**

Extract the logic from the existing `src/app/(dashboard)/my-agents/page.tsx` into a reusable component:

```tsx
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Loader2, Power, RefreshCw, Shield } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:6756";

interface MyAgent {
  keeperWalletAddress: string;
  baseAsset: string;
  status: string;
  activeStrategy: {
    strategyId: string;
    name: string;
    publisherName: string;
    currentApy: number;
    totalDepositedUsd: number;
    activatedAt: string;
  } | null;
}

function fetchMyAgents(): Promise<{ vaults: MyAgent[] }> {
  return fetch(`${BASE_URL}/api/marketplace/my-strategies`)
    .then((r) => r.json())
    .then((j) => j.data);
}

export function PublisherDashboard() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["my-agents"],
    queryFn: fetchMyAgents,
    refetchInterval: 30000,
  });

  const deactivate = useMutation({
    mutationFn: (strategyId: string) =>
      fetch(`${BASE_URL}/api/marketplace/strategies/${strategyId}/deactivate`, {
        method: "POST",
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-agents"] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-white/30" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <AlertCircle className="h-8 w-8 text-red-400" />
        <p className="mt-4 text-sm text-red-400">Failed to load your agents</p>
        <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  const vaults = data?.vaults ?? [];

  if (vaults.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <Shield className="mx-auto h-12 w-12 text-white/20" />
        <h1 className="mt-4 text-xl font-bold text-white">Publisher Dashboard</h1>
        <p className="mt-2 text-sm text-white/40">
          No vaults found. Deploy a vault first to start using strategies.
        </p>
        <Button className="mt-6" onClick={() => window.location.assign("/strategies")}>
          Browse Marketplace
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-white">Publisher Dashboard</h1>
      <div className="space-y-4">
        {vaults.map((vault) => (
          <Card key={vault.keeperWalletAddress} className="border-white/5 bg-white/3 p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-semibold text-white">
                    {vault.baseAsset} Vault
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      vault.status === "ACTIVE"
                        ? "bg-green-900/50 text-green-400"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {vault.status}
                  </span>
                </div>
                <p className="mt-1 font-mono text-xs text-white/40">
                  {vault.keeperWalletAddress.slice(0, 12)}...
                </p>
              </div>
            </div>

            {vault.activeStrategy ? (
              <div className="mt-4 rounded-lg border border-white/5 bg-white/5 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {vault.activeStrategy.name}
                    </p>
                    <p className="text-xs text-white/40">
                      by {vault.activeStrategy.publisherName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-emerald-400">
                      {vault.activeStrategy.currentApy.toFixed(1)}% APY
                    </p>
                    <p className="text-xs text-white/30">
                      Activated{" "}
                      {new Date(vault.activeStrategy.activatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 h-7 gap-1.5 border-red-900/50 text-xs text-red-400"
                  onClick={() => deactivate.mutate(vault.activeStrategy!.strategyId)}
                  disabled={deactivate.isPending}
                >
                  <Power className="h-3 w-3" /> Deactivate
                </Button>
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-sm text-white/30">No active strategy</p>
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={() => window.location.assign("/strategies")}
                >
                  Browse Strategies
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write the route page**

```tsx
import { PublisherDashboard } from "@/features/strategies/components/PublisherDashboard";

export default function PublisherDashboardRoute() {
  return <PublisherDashboard />;
}
```

- [ ] **Step 3: Verify compilation**

Run: `cd tasmil-finance && npx tsc --noEmit --pretty 2>&1 | head -5`

- [ ] **Step 4: Commit**

```bash
git add src/features/strategies/components/PublisherDashboard.tsx src/app/'(strategy)'/strategies/dashboard/page.tsx
git commit -m "feat: add publisher dashboard at /strategies/dashboard"
```

---

### Task 8: Create leaderboard page

**Files:**
- Create: `src/app/(strategy)/strategies/leaderboard/page.tsx`

The marketplace feature already has `LeaderboardTable` and `useLeaderboard` hook.

- [ ] **Step 1: Write the leaderboard page**

```tsx
"use client";

import { LeaderboardTable } from "@/features/marketplace/components/leaderboard-table";
import { useLeaderboard } from "@/features/marketplace/hooks/use-marketplace-api";

export default function LeaderboardPage() {
  const { data: entries, isLoading } = useLeaderboard();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#67E8F9]">
          <span className="inline-block h-px w-[26px] bg-[#67E8F9] opacity-60" />
          Performance
        </div>
        <h1 className="mt-3 text-[clamp(36px,5vw,56px)] font-extrabold leading-[0.97] tracking-[-0.04em] text-[#F4F7FB]">
          Leaderboard
        </h1>
        <p className="mt-3 text-[17px] text-[rgba(244,247,251,0.58)]">
          Top performing strategies ranked by APY
        </p>
      </div>
      <LeaderboardTable entries={entries ?? []} loading={isLoading} />
    </div>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd tasmil-finance && npx tsc --noEmit --pretty 2>&1 | head -5`

- [ ] **Step 3: Commit**

```bash
git add src/app/'(strategy)'/strategies/leaderboard/page.tsx
git commit -m "feat: add leaderboard page at /strategies/leaderboard"
```

---

### Task 9: Create publish strategy page at /strategies/create

**Files:**
- Create: `src/app/(strategy)/strategies/create/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
import { CreateStrategyPage } from "@/features/marketplace";

export default function CreateStrategyRoute() {
  return <CreateStrategyPage />;
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd tasmil-finance && npx tsc --noEmit --pretty 2>&1 | head -5`

- [ ] **Step 3: Commit**

```bash
git add src/app/'(strategy)'/strategies/create/page.tsx
git commit -m "feat: add publish strategy page at /strategies/create"
```

---

### Task 10: Update sidebar-data and TopNavBar

**Files:**
- Modify: `src/shared/layout/sidebar-data.ts`
- Modify: `src/shared/layout/top-nav-bar.tsx`

- [ ] **Step 1: Remove Marketplace and My Agents from sidebar-data, add Strategies**

In `src/shared/layout/sidebar-data.ts`, delete the nav group containing Marketplace and My Agents. Replace with a single Strategies item:

```typescript
// Remove the entire block (currently lines 97-109):
// {
//   items: [
//     { title: "Marketplace", url: "/marketplace", icon: Store },
//     { title: "My Agents", url: "/my-agents", icon: Shield },
//   ],
// },
//
// Replace with:
{
  items: [
    {
      title: "Strategies",
      url: "/strategies",
      icon: Store,
    },
  ],
},
```

`Shield` is still used in admin sidebar (Sponsor item), so keep the import.

- [ ] **Step 2: Add megamenu trigger to TopNavBar**

In `src/shared/layout/top-nav-bar.tsx`, add import at top:

```tsx
import { MegaMenu } from "@/features/strategies/components/MegaMenu";
```

Replace the items mapping (lines 36-40) with:

```tsx
{items.map((item) => {
  const isStrategies = item.url === "/strategies";
  if (isStrategies) {
    return (
      <div key={item.url} className="relative group">
        <Link
          href={item.url}
          className="flex items-center gap-1 font-medium text-base text-muted-foreground hover:text-foreground transition-colors"
        >
          {item.title}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </Link>
        <MegaMenu />
      </div>
    );
  }
  return <NavLink key={item.url} item={item} />;
})}
```

- [ ] **Step 3: Verify compilation**

Run: `cd tasmil-finance && npx tsc --noEmit --pretty 2>&1 | head -10`

- [ ] **Step 4: Commit**

```bash
git add src/shared/layout/sidebar-data.ts src/shared/layout/top-nav-bar.tsx
git commit -m "feat: add Strategies megamenu to TopNavBar, consolidate nav items"
```

---

### Task 11: Add redirects for old paths

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Add redirects to next.config.ts**

Add a `redirects` async function to the NextConfig object:

```ts
async redirects() {
  return [
    {
      source: "/marketplace",
      destination: "/strategies",
      permanent: true,
    },
    {
      source: "/marketplace/:path*",
      destination: "/strategies/:path*",
      permanent: true,
    },
    {
      source: "/my-agents",
      destination: "/strategies/dashboard",
      permanent: true,
    },
  ];
},
```

- [ ] **Step 2: Verify build succeeds**

Run: `cd tasmil-finance && pnpm build 2>&1 | tail -10`

Expected: Build succeeds (exit 0).

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "feat: add redirects from /marketplace and /my-agents to /strategies"
```

---

### Task 12: Delete old route directories

**Files:**
- Delete: `src/app/(dashboard)/marketplace/`
- Delete: `src/app/(dashboard)/my-agents/`
- Delete: `src/app/(dashboard)/strategies/`

- [ ] **Step 1: Delete old directories**

```bash
rm -rf "src/app/(dashboard)/marketplace"
rm -rf "src/app/(dashboard)/my-agents"
rm -rf "src/app/(dashboard)/strategies"
```

- [ ] **Step 2: Verify build still passes**

Run: `cd tasmil-finance && pnpm build 2>&1 | tail -10`

Expected: Build succeeds (exit 0).

- [ ] **Step 3: Commit**

```bash
git add src/app/'(dashboard)'/marketplace/ src/app/'(dashboard)'/my-agents/ src/app/'(dashboard)'/strategies/
git commit -m "chore: remove old marketplace, my-agents, and strategies dashboard routes"
```

---

### Task 13: Update barrel exports

**Files:**
- Modify: `src/features/strategies/components/index.ts`

- [ ] **Step 1: Add new component exports**

Read the existing `src/features/strategies/components/index.ts` and append:

```ts
export { MegaMenu } from "./MegaMenu";
export type { MegaMenuItem } from "./MegaMenu";
export { StrategyNav } from "./StrategyNav";
export { StrategyFooter } from "./StrategyFooter";
export { PublisherDashboard } from "./PublisherDashboard";
```

- [ ] **Step 2: Verify compilation**

Run: `cd tasmil-finance && npx tsc --noEmit --pretty 2>&1 | head -5`

- [ ] **Step 3: Commit**

```bash
git add src/features/strategies/components/index.ts
git commit -m "feat: export new strategy components from barrel"
```

---

### Task 14: Test all navigation flows

- [ ] **Step 1: Start dev server**

Run: `cd tasmil-finance && pnpm dev`

- [ ] **Step 2: Verify all routes resolve**

```bash
curl -sI http://localhost:3000/strategies | head -3
curl -sI http://localhost:3000/strategies/leaderboard | head -3
curl -sI http://localhost:3000/strategies/dashboard | head -3
curl -sI http://localhost:3000/strategies/create | head -3
curl -sI http://localhost:3000/marketplace | head -3
curl -sI http://localhost:3000/my-agents | head -3
```

Expected:
- `/strategies` → 200
- `/strategies/leaderboard` → 200
- `/strategies/dashboard` → 200
- `/strategies/create` → 200
- `/marketplace` → 308, Location: /strategies
- `/my-agents` → 308, Location: /strategies/dashboard

- [ ] **Step 3: Verify megamenu hover behavior in browser**

1. Navigate to `http://localhost:3000/strategies`
2. Hover over "Strategies ▼" - megamenu appears with 4 labeled items
3. Move mouse away - megamenu disappears
4. Click "Leaderboard" → navigates to `/strategies/leaderboard`
5. Verify active state shows on all `/strategies/*` pages (accent underline under Strategies item)

- [ ] **Step 4: Verify StrategyNav replaces dashboard TopNavBar**

Check that `/strategies`, `/strategies/leaderboard`, `/strategies/dashboard`, and `/strategies/create` all show StrategyNav (dark glass topbar with "Strategies ▼" megamenu trigger) - NOT the dashboard TopNavBar.

- [ ] **Step 5: Commit final verification**

```bash
git add .
git commit -m "test: verify all strategy navigation flows pass"
```
