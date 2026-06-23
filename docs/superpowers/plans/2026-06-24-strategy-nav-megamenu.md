# Strategy Navigation & Mega Menu — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add "Strategies" mega menu to main navbar, create StrategyNav sub-header for all `/strategies/*` pages, migrate marketplace routes under `/strategies`, and restyle all strategy pages to match the `design-tasmil/` UI.

**Architecture:** `TopNavBar` gains a `StrategyMegaMenu` trigger rendering a 2-column dropdown panel. All `/strategies/*` pages share a `layout.tsx` that renders `StrategyNav` (a sub-header below the global nav). All strategy page UIs are rewritten to match the dark-theme design tokens from the HTML reference files in `design-tasmil/`.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS v4, React 19, TypeScript, Lucide icons

---

## File Structure

```
src/
├── app/(dashboard)/strategies/
│   ├── layout.tsx                 ← NEW: renders TopNavBar + StrategyNav + {children}
│   ├── page.tsx                   ← MODIFY: use new layout (remove MultiSidebarLayout)
│   ├── [strategyId]/page.tsx      ← MODIFY: use new layout
│   ├── marketplace/page.tsx       ← NEW: move from /marketplace
│   ├── create/page.tsx            ← NEW: move from /marketplace/create
│   ├── leaderboard/page.tsx       ← NEW: leaderboard page
│   └── dashboard/page.tsx         ← NEW: publisher dashboard page
├── features/strategies/
│   └── components/
│       ├── StrategyNav.tsx        ← NEW: sub-header
│       ├── StrategyMegaMenu.tsx   ← NEW: mega menu dropdown
│       ├── index.ts               ← MODIFY: add new exports
│       ├── strategy-list-page.tsx ← MODIFY: restyle to match marketplace-browse.html
│       └── strategy-detail-page.tsx ← MODIFY: restyle to match strategy-detail.html
├── features/marketplace/
│   └── components/
│       ├── marketplace-page.tsx   ← MODIFY: restyle to match marketplace-browse.html
│       └── create-strategy-page.tsx ← MODIFY: restyle to match publish-strategy.html
├── shared/layout/
│   ├── top-nav-bar.tsx            ← MODIFY: add StrategyMegaMenu
│   └── sidebar-data.ts            ← MODIFY: remove old marketplace nav item
├── next.config.ts                 ← MODIFY: add redirects
│
DELETED:
├── app/(dashboard)/marketplace/page.tsx
└── app/(dashboard)/marketplace/create/page.tsx
```

---

### Task 1: Remove old Marketplace nav item from sidebar-data

**Files:**
- Modify: `src/shared/layout/sidebar-data.ts`

**Why first:** Removing the flat "Marketplace" link from the top nav clears the way for the mega menu entry.

- [ ] **Step 1: Remove the Marketplace nav group from sidebar-data.ts**

Edit `src/shared/layout/sidebar-data.ts` — delete lines 97-109 (the Marketplace + My Agents group, but keep My Agents):

```typescript
// BEFORE (lines 96-109):
    // {
    //   items: [
    //     {
    //       title: "Marketplace",
    //       url: "/marketplace",
    //       icon: Store,
    //     },
    //     {
    //       title: "My Agents",
    //       url: "/my-agents",
    //       icon: Shield,
    //     },
    //   ],
    // },

// AFTER: Keep My Agents as standalone, remove Marketplace
    {
      items: [
        {
          title: "My Agents",
          url: "/my-agents",
          icon: Shield,
        },
      ],
    },
```

Also remove the unused `Store` import at the top:
```typescript
// BEFORE:
import {
  ArrowLeftRight,
  Bot,
  Gauge,
  Home,
  KeyRound,
  ListChecks,
  Mail,
  Settings,
  Share2,
  Shield,
  Store,     // ← REMOVE
  Tractor,
  Trophy,
  Wallet,
} from "lucide-react";

// AFTER: remove Store from imports
import {
  ArrowLeftRight,
  Bot,
  Gauge,
  Home,
  KeyRound,
  ListChecks,
  Mail,
  Settings,
  Share2,
  Shield,
  Tractor,
  Trophy,
  Wallet,
} from "lucide-react";
```

- [ ] **Step 2: Run type-check to verify**

```bash
cd /Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/tasmil-finance && pnpm type-check
```

Expected: PASS (no errors)

- [ ] **Step 3: Commit**

```bash
git add src/shared/layout/sidebar-data.ts
git commit -m "chore: remove marketplace from flat nav items, keep my-agents"
```

---

### Task 2: Create StrategyNav sub-header component

**Files:**
- Create: `src/features/strategies/components/StrategyNav.tsx`
- Modify: `src/features/strategies/components/index.ts`

**Design reference:** `marketplace-browse.html` lines 79-111 (`.topnav`, `.topnav-item` styles)

- [ ] **Step 1: Write the StrategyNav component**

Create `src/features/strategies/components/StrategyNav.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const STRATEGY_LINKS = [
  { href: "/strategies", label: "Browse" },
  { href: "/strategies/marketplace", label: "Marketplace" },
  { href: "/strategies/leaderboard", label: "Leaderboard" },
  { href: "/strategies/create", label: "Publish" },
  { href: "/strategies/dashboard", label: "Dashboard" },
] as const;

export function StrategyNav() {
  const pathname = usePathname() ?? "";

  const isActive = (href: string) => {
    if (href === "/strategies") return pathname === "/strategies";
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="sticky top-16 z-30 flex h-14 items-center border-b border-white/[0.08] px-[clamp(20px,5vw,72px)]"
      style={{
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
      }}
    >
      {/* Brand */}
      <Link
        href="/strategies"
        className="mr-8 flex items-center gap-3 font-bold text-[17px] tracking-[-0.02em]"
      >
        <span className="flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-gradient-to-br from-white via-[#67E8F9] to-[#0EA5E9] font-extrabold text-[#04141A] text-xs">
          T
        </span>
        <span>
          Tasmil{" "}
          <span className="text-[#67E8F9]">· Strategies</span>
        </span>
      </Link>

      {/* Nav links */}
      <div className="flex gap-1">
        {STRATEGY_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "relative rounded-[100px] px-[18px] py-[8px] font-medium text-[14.5px] transition-colors duration-200",
              isActive(link.href)
                ? "text-[#F4F7FB] after:absolute after:bottom-px after:left-[15px] after:right-[15px] after:h-[2px] after:rounded-sm after:bg-[#67E8F9] after:shadow-[0_0_10px_rgba(103,232,249,0.5)]"
                : "text-white/60 hover:bg-white/[0.05] hover:text-[#F4F7FB]"
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Export from index.ts**

Edit `src/features/strategies/components/index.ts` — add the export:

```typescript
export { AllActivitiesTab } from "./all-activities-tab";
export { ExecutionPanelComponent } from "./execution-panel";
export { ExecutionPanelFlow } from "./execution-panel-flow";
export { MyActivitiesTab } from "./my-activities-tab";
export { StrategyDetailPage } from "./strategy-detail-page";
export { StrategyListPage } from "./strategy-list-page";
export { StrategyMegaMenu } from "./StrategyMegaMenu";
export { StrategyNav } from "./StrategyNav";
export { StrategyOverviewTab } from "./strategy-overview-tab";
export { StrategyPromptTab } from "./strategy-prompt-tab";
```

Note: `StrategyMegaMenu` doesn't exist yet but will in Task 3 — add both exports now so we don't forget.

- [ ] **Step 3: Run type-check**

```bash
cd /Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/tasmil-finance && pnpm type-check
```

Expected: PASS (StrategyMegaMenu import will error until Task 3 — that's expected)

- [ ] **Step 4: Commit**

```bash
git add src/features/strategies/components/StrategyNav.tsx src/features/strategies/components/index.ts
git commit -m "feat: add StrategyNav sub-header component"
```

---

### Task 3: Create StrategyMegaMenu component

**Files:**
- Create: `src/features/strategies/components/StrategyMegaMenu.tsx`

**Design reference:** `marketplace-browse.html` lines 79-111 (nav item styles), the mega menu panel is a new component based on the same design tokens.

- [ ] **Step 1: Write the StrategyMegaMenu component**

Create `src/features/strategies/components/StrategyMegaMenu.tsx`:

```tsx
"use client";

import {
  BarChart3,
  Gauge,
  LayoutDashboard,
  PlusCircle,
  Search,
  Store,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface MegaMenuItem {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

interface MegaMenuGroup {
  title: string;
  items: MegaMenuItem[];
}

const MEGA_MENU_GROUPS: MegaMenuGroup[] = [
  {
    title: "Discover",
    items: [
      {
        label: "Browse Strategies",
        description: "All available strategies",
        href: "/strategies",
        icon: Search,
      },
      {
        label: "Marketplace",
        description: "Agent-driven strategies",
        href: "/strategies/marketplace",
        icon: Store,
      },
      {
        label: "Leaderboard",
        description: "Top performing strategies",
        href: "/strategies/leaderboard",
        icon: BarChart3,
      },
    ],
  },
  {
    title: "Manage",
    items: [
      {
        label: "Publish Strategy",
        description: "Create and deploy your own",
        href: "/strategies/create",
        icon: PlusCircle,
      },
      {
        label: "Publisher Dashboard",
        description: "Track your published strategies",
        href: "/strategies/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
];

export function StrategyMegaMenu() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const openTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isActive = pathname.startsWith("/strategies");

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    openTimeoutRef.current = setTimeout(() => setOpen(true), 150);
  };

  const handleMouseLeave = () => {
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    closeTimeoutRef.current = setTimeout(() => setOpen(false), 200);
  };

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger */}
      <button
        type="button"
        className={cn(
          "relative flex items-center gap-1 rounded-[100px] px-[18px] py-[8px] font-medium text-[14.5px] transition-colors duration-200",
          isActive || open
            ? "text-[#F4F7FB] after:absolute after:bottom-px after:left-[15px] after:right-[15px] after:h-[2px] after:rounded-sm after:bg-[#67E8F9] after:shadow-[0_0_10px_rgba(103,232,249,0.5)]"
            : "text-white/60 hover:bg-white/[0.05] hover:text-[#F4F7FB]"
        )}
        aria-expanded={open}
      >
        Strategies
        <svg
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-200",
            open && "rotate-180"
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      <div
        className={cn(
          "fixed left-0 right-0 top-[calc(4rem+1px)] z-20 border-b border-white/[0.08]",
          "bg-black/95 backdrop-blur-xl",
          "transition-all duration-200",
          open ? "visible opacity-100 translate-y-0" : "invisible opacity-0 -translate-y-2"
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="mx-auto max-w-[1280px] px-[clamp(20px,5vw,72px)] py-8">
          <div className="grid grid-cols-2 gap-x-16 gap-y-6">
            {MEGA_MENU_GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className="mb-4 font-semibold text-[11px] text-white/30 uppercase tracking-[0.12em]">
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-start gap-3 rounded-[14px] px-3 py-3 transition-colors duration-200 hover:bg-white/[0.05]"
                        onClick={() => setOpen(false)}
                      >
                        <Icon className="mt-0.5 h-5 w-5 text-white/40 transition-colors group-hover:text-[#67E8F9]" />
                        <div>
                          <div className="font-medium text-[14.5px] text-[#F4F7FB]">
                            {item.label}
                          </div>
                          <div className="text-[12px] text-white/60">{item.description}</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run type-check**

```bash
cd /Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/tasmil-finance && pnpm type-check
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/features/strategies/components/StrategyMegaMenu.tsx
git commit -m "feat: add StrategyMegaMenu dropdown for main navbar"
```

---

### Task 4: Integrate StrategyMegaMenu into TopNavBar

**Files:**
- Modify: `src/shared/layout/top-nav-bar.tsx`

- [ ] **Step 1: Edit TopNavBar to insert StrategyMegaMenu after Chat**

Read the current file first to understand the structure, then edit.

Edit `src/shared/layout/top-nav-bar.tsx`:

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { StrategyMegaMenu } from "@/features/strategies/components/StrategyMegaMenu";
import { QuestHeaderBadges } from "@/features/quest/components/QuestHeaderBadges";
import { WalletRankInfo } from "@/features/quest/components/WalletRankInfo";
import { SponsorIndicator } from "@/features/sponsorship/components/sponsor-indicator";
import { ConnectWalletButton } from "@/shared/components/connect-wallet-button";
import { NavLink } from "./nav-link";
import type { SidebarData } from "./sidebar-data";

interface TopNavBarProps {
  sidebarData: SidebarData;
  showRightSidebar?: boolean;
}

export function TopNavBar({ sidebarData }: TopNavBarProps) {
  const items = sidebarData.navGroups.flatMap((g) => g.items);

  return (
    <nav
      data-testid="top-nav-bar"
      className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-6 border-border border-b bg-background px-4"
    >
      <Link href="/chat/new" className="flex items-center gap-2.5">
        <Image src={sidebarData.header.logo_url} width={40} height={40} alt="Logo" />
        <span className="animate-shimmer-text bg-[length:200%_100%] bg-gradient-to-r from-[#b5eaff] via-white to-[#00bfff] bg-clip-text font-bold text-xl text-transparent">
          {sidebarData.header.brand_name}
        </span>
      </Link>

      <div className="ml-6 flex items-center gap-6 overflow-x-auto">
        {/* Insert StrategyMegaMenu after Chat */}
        <StrategyMegaMenu />
        {/* Skip "Marketplace" and "My Agents" from old flat links — now handled elsewhere */}
        {items
          .filter((item) => item.url !== "/marketplace" && item.url !== "/my-agents")
          .map((item) => (
            <NavLink key={item.url} item={item} />
          ))}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <QuestHeaderBadges />
        <SponsorIndicator />
        <ConnectWalletButton variant="topbar" rankSlot={<WalletRankInfo />} />
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Run type-check and verify it builds**

```bash
cd /Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/tasmil-finance && pnpm type-check
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/shared/layout/top-nav-bar.tsx
git commit -m "feat: integrate StrategyMegaMenu into TopNavBar"
```

---

### Task 5: Create strategies layout with StrategyNav

**Files:**
- Create: `src/app/(dashboard)/strategies/layout.tsx`
- Modify: `src/app/(dashboard)/strategies/page.tsx`
- Modify: `src/app/(dashboard)/strategies/[strategyId]/page.tsx`

**Why:** The layout wraps all `/strategies/*` pages with the global TopNavBar + StrategyNav sub-header. Existing pages currently use `MultiSidebarLayout` — they need to be updated to work inside the new layout.

- [ ] **Step 1: Create the layout**

Create `src/app/(dashboard)/strategies/layout.tsx`:

```tsx
import { StrategyNav } from "@/features/strategies/components/StrategyNav";

export default function StrategiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StrategyNav />
      <main className="min-h-screen bg-black">{children}</main>
    </>
  );
}
```

Note: The global `TopNavBar` is already rendered by the parent `(dashboard)` layout. This layout only adds `StrategyNav` below it.

- [ ] **Step 2: Update strategies/page.tsx to remove MultiSidebarLayout wrapper**

Edit `src/app/(dashboard)/strategies/page.tsx`:

```tsx
import { StrategyListPage } from "@/features/strategies";

export default function StrategiesPage() {
  return <StrategyListPage />;
}
```

- [ ] **Step 3: Update strategies/[strategyId]/page.tsx to remove MultiSidebarLayout wrapper**

Edit `src/app/(dashboard)/strategies/[strategyId]/page.tsx`:

```tsx
"use client";

import { useParams } from "next/navigation";
import { StrategyDetailPage } from "@/features/strategies";

export default function StrategyDetailPageRoute() {
  const params = useParams();
  const strategyId = params.strategyId as string;

  return <StrategyDetailPage strategyId={strategyId} />;
}
```

- [ ] **Step 4: Run type-check**

```bash
cd /Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/tasmil-finance && pnpm type-check
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/\(dashboard\)/strategies/layout.tsx src/app/\(dashboard\)/strategies/page.tsx src/app/\(dashboard\)/strategies/\[strategyId\]/page.tsx
git commit -m "feat: add strategies layout with StrategyNav sub-header"
```

---

### Task 6: Move Marketplace routes under /strategies

**Files:**
- Create: `src/app/(dashboard)/strategies/marketplace/page.tsx`
- Create: `src/app/(dashboard)/strategies/create/page.tsx`
- Delete: `src/app/(dashboard)/marketplace/page.tsx`
- Delete: `src/app/(dashboard)/marketplace/create/page.tsx`

**Note:** The old marketplace components (`MarketplacePage`, `CreateStrategyPage`) are reused directly — only the route files move. The components themselves get restyled in later tasks.

- [ ] **Step 1: Create new marketplace route**

Create `src/app/(dashboard)/strategies/marketplace/page.tsx`:

```tsx
import { MarketplacePage } from "@/features/marketplace";

export default function StrategiesMarketplaceRoute() {
  return <MarketplacePage />;
}
```

- [ ] **Step 2: Create new create-strategy route**

Create `src/app/(dashboard)/strategies/create/page.tsx`:

```tsx
import { CreateStrategyPage } from "@/features/marketplace";

export default function StrategiesCreateRoute() {
  return <CreateStrategyPage />;
}
```

- [ ] **Step 3: Delete old marketplace route files**

```bash
rm /Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/tasmil-finance/src/app/\(dashboard\)/marketplace/page.tsx
rm /Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/tasmil-finance/src/app/\(dashboard\)/marketplace/create/page.tsx
```

- [ ] **Step 4: Run type-check and verify old marketplace folder cleanup**

```bash
cd /Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/tasmil-finance && pnpm type-check
ls src/app/\(dashboard\)/marketplace/ 2>&1 || echo "marketplace folder is clean"
```

Expected: type-check PASS, marketplace folder either gone or only containing non-route files.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(dashboard\)/strategies/marketplace/page.tsx src/app/\(dashboard\)/strategies/create/page.tsx
git rm src/app/\(dashboard\)/marketplace/page.tsx src/app/\(dashboard\)/marketplace/create/page.tsx
git commit -m "feat: move marketplace routes under /strategies"
```

---

### Task 7: Add redirects for old marketplace paths

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Add redirects to next.config.ts**

Edit `next.config.ts` — add a `redirects()` function to the NextConfig object:

```typescript
// Add this inside the nextConfig object, e.g. after the rewrites() block:
  async redirects() {
    return [
      {
        source: "/marketplace",
        destination: "/strategies/marketplace",
        permanent: true,
      },
      {
        source: "/marketplace/create",
        destination: "/strategies/create",
        permanent: true,
      },
      {
        source: "/marketplace/:strategyId",
        destination: "/strategies/:strategyId",
        permanent: true,
      },
    ];
  },
```

- [ ] **Step 2: Run type-check to verify no syntax errors**

```bash
cd /Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/tasmil-finance && pnpm type-check
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "feat: add redirects from /marketplace to /strategies"
```

---

### Task 8: Create Leaderboard page

**Files:**
- Create: `src/app/(dashboard)/strategies/leaderboard/page.tsx`

**Design reference:** `leaderboard.html` lines 49-129 (podium, filter bar, leaderboard table)

- [ ] **Step 1: Create the Leaderboard page component**

Create `src/app/(dashboard)/strategies/leaderboard/page.tsx`:

```tsx
"use client";

import { Trophy } from "lucide-react";

// Placeholder leaderboard data — replace with real API hook when available
const LEADERBOARD_DATA = [
  { rank: 1, name: "Leveraged ETH Staker", publisher: "Jade Diaz", apy: "32.7%", tvl: "$1.8M", users: 124 },
  { rank: 2, name: "Cross-Chain Arb Fund", publisher: "Kova Capital", apy: "28.4%", tvl: "$2.4M", users: 165 },
  { rank: 3, name: "Arbitrum Yield Max", publisher: "Stratos Labs", apy: "24.1%", tvl: "$3.1M", users: 203 },
  { rank: 4, name: "Stablecoin Delta Neutral", publisher: "Arden Research", apy: "18.9%", tvl: "$5.2M", users: 312 },
  { rank: 5, name: "SOL Liquid Staking", publisher: "Helios Fund", apy: "15.3%", tvl: "$4.6M", users: 278 },
  { rank: 6, name: "BTC Yield Basis", publisher: "Nova Capital", apy: "12.7%", tvl: "$8.1M", users: 432 },
  { rank: 7, name: "Momentum Rotator", publisher: "Jade Diaz", apy: "11.2%", tvl: "$1.3M", users: 89 },
  { rank: 8, name: "DeFi Blue Chip Index", publisher: "Kova Capital", apy: "9.8%", tvl: "$6.4M", users: 367 },
];

const TOP3 = LEADERBOARD_DATA.slice(0, 3);
const REST = LEADERBOARD_DATA.slice(3);

export default function LeaderboardPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-[clamp(20px,5vw,72px)] py-12">
      {/* Page header */}
      <div className="mb-12 flex items-end justify-between gap-4">
        <div>
          <div className="mb-3 inline-flex items-center gap-2.5 font-semibold text-[#67E8F9] text-xs tracking-[0.22em] uppercase before:block before:h-px before:w-[26px] before:bg-[#67E8F9]/60">
            Rankings
          </div>
          <h1 className="font-extrabold text-4xl leading-[0.97] tracking-[-0.04em] md:text-5xl">
            Strategy{" "}
            <span className="bg-gradient-to-br from-white via-[#67E8F9] to-[#0EA5E9] bg-clip-text text-transparent">
              Leaderboard
            </span>
          </h1>
          <p className="mt-2 max-w-[480px] text-[15px] text-white/60">
            Top-performing strategies ranked by APY. Updated every 30 minutes.
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-8 flex items-center gap-3 rounded-[14px] border border-white/[0.08] bg-white/[0.02] px-5 py-3.5">
        <span className="ml-auto text-[13px] text-white/40">
          Updated <span className="font-semibold text-[#67E8F9]">just now</span> · Top{" "}
          <span className="font-semibold text-[#67E8F9]">{LEADERBOARD_DATA.length}</span> strategies
        </span>
      </div>

      {/* Podium */}
      <div className="mb-10 grid grid-cols-[1fr_1.2fr_1fr] gap-4 items-end">
        {/* 2nd place */}
        <div className="rounded-[22px] border border-white/[0.08] bg-[#0D111A] p-7 text-center transition-colors hover:border-[#67E8F9]/30">
          <div className="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-full border border-[#67E8F9]/30 bg-[#67E8F9]/10 font-bold text-[#67E8F9] text-[13px]">
            2
          </div>
          <div className="mb-1 font-bold text-[17px] tracking-[-0.02em]">{TOP3[1].name}</div>
          <div className="mb-3 text-[13px] text-white/60">{TOP3[1].publisher}</div>
          <div className="bg-gradient-to-br from-white via-[#67E8F9] to-[#0EA5E9] bg-clip-text font-extrabold text-3xl tracking-[-0.03em] text-transparent">
            {TOP3[1].apy}
          </div>
          <div className="mt-1 font-semibold text-[11px] text-white/40 uppercase tracking-[0.1em]">APY</div>
        </div>

        {/* 1st place */}
        <div className="scale-[1.04] rounded-[22px] border border-[#67E8F9]/30 bg-[#0D111A] p-7 text-center shadow-[0_0_30px_-12px_rgba(103,232,249,0.5)] transition-colors hover:border-[#67E8F9]/50">
          <div className="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-white via-[#67E8F9] to-[#0EA5E9] font-bold text-[#04141A] text-[13px] shadow-[0_0_20px_-4px_rgba(103,232,249,0.5)]">
            1
          </div>
          <div className="mb-1 font-bold text-[17px] tracking-[-0.02em]">{TOP3[0].name}</div>
          <div className="mb-3 text-[13px] text-white/60">{TOP3[0].publisher}</div>
          <div className="bg-gradient-to-br from-white via-[#67E8F9] to-[#0EA5E9] bg-clip-text font-extrabold text-3xl tracking-[-0.03em] text-transparent">
            {TOP3[0].apy}
          </div>
          <div className="mt-1 font-semibold text-[11px] text-white/40 uppercase tracking-[0.1em]">APY</div>
        </div>

        {/* 3rd place */}
        <div className="rounded-[22px] border border-white/[0.08] bg-[#0D111A] p-7 text-center transition-colors hover:border-[#67E8F9]/30">
          <div className="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-full border border-[#67E8F9]/30 bg-[#67E8F9]/10 font-bold text-[#67E8F9] text-[13px]">
            3
          </div>
          <div className="mb-1 font-bold text-[17px] tracking-[-0.02em]">{TOP3[2].name}</div>
          <div className="mb-3 text-[13px] text-white/60">{TOP3[2].publisher}</div>
          <div className="bg-gradient-to-br from-white via-[#67E8F9] to-[#0EA5E9] bg-clip-text font-extrabold text-3xl tracking-[-0.03em] text-transparent">
            {TOP3[2].apy}
          </div>
          <div className="mt-1 font-semibold text-[11px] text-white/40 uppercase tracking-[0.1em]">APY</div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[22px] border border-white/[0.08]">
        <table className="w-full border-collapse">
          <thead className="bg-[#0D111A]">
            <tr>
              <th className="px-5 py-3.5 text-left font-semibold text-[11px] text-white/40 uppercase tracking-[0.12em]">
                Rank
              </th>
              <th className="px-5 py-3.5 text-left font-semibold text-[11px] text-white/40 uppercase tracking-[0.12em]">
                Strategy
              </th>
              <th className="px-5 py-3.5 text-left font-semibold text-[11px] text-white/40 uppercase tracking-[0.12em]">
                Publisher
              </th>
              <th className="px-5 py-3.5 text-right font-semibold text-[11px] text-white/40 uppercase tracking-[0.12em]">
                APY
              </th>
              <th className="px-5 py-3.5 text-right font-semibold text-[11px] text-white/40 uppercase tracking-[0.12em]">
                TVL
              </th>
              <th className="px-5 py-3.5 text-right font-semibold text-[11px] text-white/40 uppercase tracking-[0.12em]">
                Users
              </th>
            </tr>
          </thead>
          <tbody>
            {TOP3.map((entry) => (
              <tr
                key={entry.rank}
                className="border-white/[0.08] border-b transition-colors hover:bg-[#67E8F9]/5"
              >
                <td className="px-5 py-4 text-center font-bold font-mono text-[#67E8F9]">
                  {entry.rank}
                </td>
                <td className="px-5 py-4 font-semibold cursor-pointer hover:text-[#67E8F9] transition-colors">
                  {entry.name}
                </td>
                <td className="px-5 py-4 text-[13px] text-white/60">{entry.publisher}</td>
                <td className="px-5 py-4 text-right font-bold font-mono text-[#6EE7B7]">
                  {entry.apy}
                </td>
                <td className="px-5 py-4 text-right font-mono">{entry.tvl}</td>
                <td className="px-5 py-4 text-right text-white/60">{entry.users}</td>
              </tr>
            ))}
            {REST.map((entry) => (
              <tr
                key={entry.rank}
                className="border-white/[0.08] border-b transition-colors hover:bg-[#67E8F9]/5"
              >
                <td className="px-5 py-4 text-center font-mono text-white/40">{entry.rank}</td>
                <td className="px-5 py-4 font-semibold cursor-pointer hover:text-[#67E8F9] transition-colors">
                  {entry.name}
                </td>
                <td className="px-5 py-4 text-[13px] text-white/60">{entry.publisher}</td>
                <td className="px-5 py-4 text-right font-bold font-mono text-[#6EE7B7]">
                  {entry.apy}
                </td>
                <td className="px-5 py-4 text-right font-mono">{entry.tvl}</td>
                <td className="px-5 py-4 text-right text-white/60">{entry.users}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run type-check**

```bash
cd /Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/tasmil-finance && pnpm type-check
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/strategies/leaderboard/page.tsx
git commit -m "feat: add leaderboard page with podium and table UI"
```

---

### Task 9: Create Publisher Dashboard page

**Files:**
- Create: `src/app/(dashboard)/strategies/dashboard/page.tsx`

**Design reference:** `publisher-dashboard.html` (profile card, stat grid, earnings card, strategy table)

- [ ] **Step 1: Create the Publisher Dashboard page**

Create `src/app/(dashboard)/strategies/dashboard/page.tsx`:

```tsx
"use client";

import { BarChart3, Plus, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

// Placeholder data — replace with real API when available
const PUBLISHER = {
  name: "Arden Research",
  bio: "Quantitative strategies built for on-chain momentum. Audited quarterly. Non-custodial.",
  initials: "AR",
  totalTvl: "$27.4M",
  strategyCount: 5,
  userCount: 3892,
  totalEarnings: "$184,200",
  claimable: "$12,840",
  avgApy: "14.6%",
};

const MY_STRATEGIES = [
  { name: "ETH Momentum Fund", risk: "Medium", apy: "18.4%", tvl: "$8.2M", users: 1240, fee: "1.5%" },
  { name: "SOL Liquid Staking", risk: "Low", apy: "12.1%", tvl: "$6.7M", users: 892, fee: "1.0%" },
  { name: "AVAX DeFi Basket", risk: "High", apy: "24.7%", tvl: "$4.3M", users: 567, fee: "2.0%" },
  { name: "Arbitrum Yield Basis", risk: "Medium", apy: "15.9%", tvl: "$5.1M", users: 723, fee: "1.5%" },
  { name: "Stablecoin Delta", risk: "Low", apy: "8.2%", tvl: "$3.1M", users: 470, fee: "0.8%" },
];

const CLAIM_HISTORY = [
  { tx: "0xa1b2...c3d4", amount: "+$4,200", date: "2026-06-15", status: "Confirmed" },
  { tx: "0xe5f6...g7h8", amount: "+$3,150", date: "2026-06-01", status: "Confirmed" },
  { tx: "0xi9j0...k1l2", amount: "+$2,800", date: "2026-05-15", status: "Confirmed" },
];

export default function PublisherDashboardPage() {
  return (
    <div className="mx-auto max-w-[1280px] px-[clamp(20px,5vw,72px)] py-12">
      {/* Page header */}
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2.5 font-semibold text-[#67E8F9] text-xs tracking-[0.22em] uppercase before:block before:h-px before:w-[26px] before:bg-[#67E8F9]/60">
          Publisher Console
        </div>
        <h1 className="font-extrabold text-4xl leading-[0.97] tracking-[-0.04em] md:text-5xl">
          Publisher{" "}
          <span className="bg-gradient-to-br from-white via-[#67E8F9] to-[#0EA5E9] bg-clip-text text-transparent">
            Dashboard
          </span>
        </h1>
      </div>

      {/* Profile card */}
      <div className="mb-8 flex flex-wrap items-center gap-6 rounded-[22px] border border-white/[0.08] bg-[#0D111A] p-7">
        <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-gradient-to-br from-white via-[#67E8F9] to-[#0EA5E9] font-bold text-[#04141A] text-xl">
          {PUBLISHER.initials}
        </div>
        <div className="flex-1">
          <div className="mb-1 text-xl font-bold tracking-[-0.02em]">{PUBLISHER.name}</div>
          <div className="max-w-[480px] text-[14px] text-white/60">{PUBLISHER.bio}</div>
        </div>
        <div className="flex gap-6">
          <div className="rounded-[14px] border border-white/[0.08] bg-[#07090F] px-5 py-2.5 text-center">
            <div className="font-bold font-mono text-[#6EE7B7] text-xl">{PUBLISHER.totalTvl}</div>
            <div className="mt-0.5 font-semibold text-[11px] text-white/40 uppercase tracking-[0.08em]">Total TVL</div>
          </div>
          <div className="rounded-[14px] border border-white/[0.08] bg-[#07090F] px-5 py-2.5 text-center">
            <div className="font-bold font-mono text-xl">{PUBLISHER.strategyCount}</div>
            <div className="mt-0.5 font-semibold text-[11px] text-white/40 uppercase tracking-[0.08em]">Strategies</div>
          </div>
          <div className="rounded-[14px] border border-white/[0.08] bg-[#07090F] px-5 py-2.5 text-center">
            <div className="font-bold font-mono text-xl">{PUBLISHER.userCount.toLocaleString()}</div>
            <div className="mt-0.5 font-semibold text-[11px] text-white/40 uppercase tracking-[0.08em]">Users</div>
          </div>
        </div>
      </div>

      {/* Stat grid */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="rounded-[14px] border border-white/[0.08] bg-[#0D111A] p-5">
          <div className="mb-1.5 font-semibold text-[11px] text-white/40 uppercase tracking-[0.08em]">
            Total Earnings
          </div>
          <div className="font-bold font-mono text-[#6EE7B7] text-2xl tracking-[-0.03em]">
            {PUBLISHER.totalEarnings}
          </div>
          <div className="mt-1 text-[12px] text-white/60">Lifetime fee revenue</div>
        </div>
        <div className="rounded-[14px] border border-white/[0.08] bg-[#0D111A] p-5">
          <div className="mb-1.5 font-semibold text-[11px] text-white/40 uppercase tracking-[0.08em]">
            Claimable
          </div>
          <div className="font-bold font-mono text-[#6EE7B7] text-2xl tracking-[-0.03em]">
            {PUBLISHER.claimable}
          </div>
          <div className="mt-1 text-[12px] text-white/60">Available to withdraw</div>
        </div>
        <div className="rounded-[14px] border border-white/[0.08] bg-[#0D111A] p-5">
          <div className="mb-1.5 font-semibold text-[11px] text-white/40 uppercase tracking-[0.08em]">
            Avg Strategy APY
          </div>
          <div className="font-bold text-[#6EE7B7] text-2xl tracking-[-0.03em]">
            {PUBLISHER.avgApy}
          </div>
          <div className="mt-1 text-[12px] text-white/60">Weighted across all strategies</div>
        </div>
      </div>

      {/* Earnings card */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-6 rounded-[22px] border border-[#67E8F9]/30 bg-gradient-to-br from-[rgba(20,28,40,0.85)] to-[rgba(7,9,15,0.7)] p-8">
        <div>
          <h3 className="mb-1.5 text-xl font-bold tracking-[-0.02em]">Unclaimed Earnings</h3>
          <p className="text-[14px] text-white/60">Fees accumulated from all active strategies. Withdraw anytime.</p>
        </div>
        <div className="text-right">
          <div className="bg-gradient-to-br from-white via-[#67E8F9] to-[#0EA5E9] bg-clip-text font-extrabold text-3xl tracking-[-0.03em] text-transparent">
            {PUBLISHER.claimable}
          </div>
          <div className="mt-1 text-[13px] text-white/40">≈ 4,280 USDC</div>
          <button className="mt-3 inline-flex items-center gap-2 rounded-[100px] bg-gradient-to-br from-white via-[#67E8F9] to-[#0EA5E9] px-6 py-2.5 font-semibold text-[#04141A] text-sm transition-transform hover:translate-y-[-2px] hover:shadow-[0_10px_40px_-8px_rgba(103,232,249,0.5)]">
            Claim Fees <span className="transition-transform group-hover:translate-x-1">→</span>
          </button>
        </div>
      </div>

      {/* My Strategies section */}
      <div className="mb-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-bold text-[22px] tracking-[-0.025em]">
            My <span className="text-[#67E8F9]">Strategies</span>
          </h2>
          <Link
            href="/strategies/create"
            className="inline-flex items-center gap-2 rounded-[100px] border border-[#67E8F9]/30 bg-[#67E8F9]/10 px-5 py-2 font-semibold text-[#67E8F9] text-sm transition-all hover:bg-[#67E8F9]/20 hover:translate-y-[-2px]"
          >
            <Plus className="h-4 w-4" /> New Strategy
          </Link>
        </div>

        <div className="overflow-hidden rounded-[22px] border border-white/[0.08]">
          <table className="w-full border-collapse">
            <thead className="bg-[#0D111A]">
              <tr>
                <th className="px-4 py-3.5 text-left font-semibold text-[11px] text-white/40 uppercase tracking-[0.12em]">
                  Strategy
                </th>
                <th className="px-4 py-3.5 text-left font-semibold text-[11px] text-white/40 uppercase tracking-[0.12em]">
                  Risk
                </th>
                <th className="px-4 py-3.5 text-right font-semibold text-[11px] text-white/40 uppercase tracking-[0.12em]">
                  APY
                </th>
                <th className="px-4 py-3.5 text-right font-semibold text-[11px] text-white/40 uppercase tracking-[0.12em]">
                  TVL
                </th>
                <th className="px-4 py-3.5 text-right font-semibold text-[11px] text-white/40 uppercase tracking-[0.12em]">
                  Users
                </th>
                <th className="px-4 py-3.5 text-right font-semibold text-[11px] text-white/40 uppercase tracking-[0.12em]">
                  Fee
                </th>
              </tr>
            </thead>
            <tbody>
              {MY_STRATEGIES.map((s) => (
                <tr
                  key={s.name}
                  className="border-white/[0.08] border-b transition-colors hover:bg-[#67E8F9]/5"
                >
                  <td className="px-4 py-3.5 font-semibold">{s.name}</td>
                  <td className="px-4 py-3.5 text-[14px] text-white/60">{s.risk}</td>
                  <td className="px-4 py-3.5 text-right font-bold font-mono text-[#6EE7B7]">{s.apy}</td>
                  <td className="px-4 py-3.5 text-right font-mono">{s.tvl}</td>
                  <td className="px-4 py-3.5 text-right text-white/60">{s.users.toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-right text-white/60">{s.fee}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Claim history */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-bold text-[22px] tracking-[-0.025em]">
            Claim <span className="text-[#67E8F9]">History</span>
          </h2>
        </div>

        <div className="overflow-hidden rounded-[22px] border border-white/[0.08]">
          <table className="w-full border-collapse">
            <thead className="bg-[#0D111A]">
              <tr>
                <th className="px-4 py-3.5 text-left font-semibold text-[11px] text-white/40 uppercase tracking-[0.12em]">
                  Transaction
                </th>
                <th className="px-4 py-3.5 text-right font-semibold text-[11px] text-white/40 uppercase tracking-[0.12em]">
                  Amount
                </th>
                <th className="px-4 py-3.5 text-right font-semibold text-[11px] text-white/40 uppercase tracking-[0.12em]">
                  Date
                </th>
                <th className="px-4 py-3.5 text-right font-semibold text-[11px] text-white/40 uppercase tracking-[0.12em]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {CLAIM_HISTORY.map((entry) => (
                <tr
                  key={entry.tx}
                  className="border-white/[0.08] border-b transition-colors hover:bg-[#67E8F9]/5"
                >
                  <td className="px-4 py-3.5 font-mono text-[13px] text-[#67E8F9]">{entry.tx}</td>
                  <td className="px-4 py-3.5 text-right font-bold font-mono text-[#6EE7B7]">{entry.amount}</td>
                  <td className="px-4 py-3.5 text-right text-white/60">{entry.date}</td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="inline-flex items-center gap-1.5 rounded-[100px] border border-[#6EE7B7]/30 bg-[#6EE7B7]/5 px-2.5 py-1 font-semibold text-[#6EE7B7] text-[10px] uppercase tracking-[0.1em]">
                      {entry.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run type-check**

```bash
cd /Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/tasmil-finance && pnpm type-check
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/strategies/dashboard/page.tsx
git commit -m "feat: add publisher dashboard page with stats, earnings, and tables"
```

---

### Task 10: Restyle Browse Strategies page to match design-tasmil

**Files:**
- Modify: `src/features/strategies/components/strategy-list-page.tsx`

**Design reference:** `marketplace-browse.html` (the full page — hero with gradient title + eyebrow, stats strip, filter bar, strategy card grid)

**Note:** The existing `StrategyListPage` at ~640 lines has its own hero section and grid already. This task replaces the page shell (background, colors, typography) to match the design reference tokens while preserving the data fetching and filter logic.

- [ ] **Step 1: Replace the page wrapper and hero section**

The key changes to `src/features/strategies/components/strategy-list-page.tsx`:

1. Page wrapper: `bg-zinc-950` → `bg-black`, remove `min-h-screen` (handled by layout)
2. Hero: replace gradient classes with design reference styles — `eyebrow` with accent line, `page-title` with gradient text
3. Stats/CTA cards: use `border-[var(--line)] bg-[var(--surface)]` pattern
4. Strategy cards: use `border border-white/[0.08] rounded-[var(--r-card)] bg-[var(--surface)]` pattern with `hover:border-[#67E8F9]/30` and glow effect
5. Filter/search: use pill-shaped inputs with `border-white/[0.08] bg-white/[0.05]`

Edit the return JSX of `StrategyListPage`:

```tsx
// Change the outer wrapper:
<div className={cn("bg-black", className)}>

// Replace the hero section with design-reference styling:
<div className="relative overflow-hidden px-6 py-14 lg:px-10">
  <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-10" />
  <div className="pointer-events-none absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-[#67E8F9]/10 blur-[120px]" />
  <div className="pointer-events-none absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[120px]" />

  <div className="relative mx-auto flex max-w-[1280px] flex-col justify-between gap-8 md:flex-row md:items-center">
    <div className="max-w-2xl space-y-5">
      <div className="mb-3 inline-flex items-center gap-2.5 font-semibold text-[#67E8F9] text-xs tracking-[0.22em] uppercase before:block before:h-px before:w-[26px] before:bg-[#67E8F9]/60">
        Marketplace
      </div>
      <h1 className="font-extrabold text-4xl leading-[0.97] tracking-[-0.04em] md:text-[56px]">
        <span className="bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">Intelligent</span>{" "}
        DeFi Strategies
      </h1>
      <p className="max-w-lg text-[17px] text-white/60 leading-relaxed">
        Deploy capital into automated yield strategies powered by the{" "}
        <span className="font-medium text-white">INFINIT AI Agent Swarm</span>.
      </p>
    </div>

    {/* Stats cards */}
    <div className="flex gap-4">
      <div className="min-w-[160px] rounded-[22px] border border-white/[0.08] bg-[#0D111A] p-6 text-center">
        <p className="font-bold text-sm text-white/40 uppercase tracking-widest">Total TVL</p>
        <p className="mt-1 font-bold text-3xl text-white">$42.8M</p>
      </div>
      <div className="min-w-[160px] rounded-[22px] border border-white/[0.08] bg-[#0D111A] p-6 text-center">
        <p className="font-bold text-sm text-white/40 uppercase tracking-widest">Active Agents</p>
        <p className="mt-1 font-bold text-3xl text-white">128</p>
      </div>
    </div>
  </div>
</div>
```

Continue restyling the card components — replace `GlassCard` with plain `div` using design reference card classes:

```tsx
// Strategy card for grid view — replace GlassCard:
<div
  className="group cursor-pointer rounded-[22px] border border-white/[0.08] bg-gradient-to-br from-[rgba(20,28,40,0.7)] to-[rgba(7,9,15,0.5)] p-0 transition-all duration-500 hover:-translate-y-1 hover:border-[#67E8F9]/30 hover:shadow-[0_32px_80px_-32px_rgba(0,0,0,0.8),0_0_50px_-24px_rgba(103,232,249,0.5)]"
  onClick={onClick}
>
```

- [ ] **Step 2: Run type-check**

```bash
cd /Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/tasmil-finance && pnpm type-check
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/features/strategies/components/strategy-list-page.tsx
git commit -m "style: restyle Browse Strategies page with design-tasmil tokens"
```

---

### Task 11: Restyle Strategy Detail page to match design-tasmil

**Files:**
- Modify: `src/features/strategies/components/strategy-detail-page.tsx`

**Design reference:** `strategy-detail.html` (breadcrumbs, hero-split with metrics, allocation donut, APY chart, activate card, publisher card)

**Note:** This is the most complex existing page. Key sections from the design reference:
- Breadcrumbs (line 44-48)
- Hero split: left (eyebrow + title + publisher + badges + desc) / right (4x hero-metric cards)
- Sections with border-top separator and section-header
- Allocation section with donut chart + legend
- APY chart area
- Activate card (accent-border gradient card)
- Publisher info card

The existing component needs its wrapper, header, and section styling updated. This is a surgical restyle — keep data logic, replace UI shell.

- [ ] **Step 1: Restyle the strategy detail page wrapper and hero section**

Replace the outermost wrapper with design-reference-compatible classes and add the breadcrumbs + hero-split layout:

```tsx
// Wrapper
<div className="mx-auto max-w-[1280px] px-[clamp(20px,5vw,72px)] py-8">

// Breadcrumbs (add above existing content)
<div className="flex items-center gap-2.5 pb-7 text-[14px]">
  <a href="/strategies" className="text-white/60 hover:text-[#67E8F9] transition-colors">Strategies</a>
  <span className="text-white/40">/</span>
  <span className="font-semibold text-white">{strategyName}</span>
</div>

// Hero split section
<div className="grid grid-cols-1 gap-12 md:grid-cols-2 items-start pb-12">
  {/* Left column */}
  <div>
    <div className="mb-3.5 inline-flex items-center gap-2.5 font-semibold text-[#67E8F9] text-xs tracking-[0.22em] uppercase before:block before:h-px before:w-[26px] before:bg-[#67E8F9]/60">
      Strategy
    </div>
    <h1 className="mb-4 font-extrabold text-4xl leading-[0.97] tracking-[-0.04em] md:text-5xl">
      {strategyName}
    </h1>
    <div className="mb-5 flex items-center gap-2.5 text-[15px] text-white/60">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-white via-[#67E8F9] to-[#0EA5E9] font-bold text-[#04141A] text-[10px]">
        {publisherInitials}
      </div>
      {publisherName}
    </div>
    <div className="mb-7 flex gap-2.5">
      {/* badges */}
    </div>
    <p className="max-w-[560px] text-[15px] text-white/60 leading-relaxed">
      {strategyDescription}
    </p>
  </div>

  {/* Right column — 2x2 metric grid */}
  <div className="grid grid-cols-2 gap-3.5">
    <div className="rounded-[14px] border border-white/[0.08] bg-[#0D111A] p-5">
      <div className="mb-1.5 font-semibold text-[11px] text-white/40 uppercase tracking-[0.1em]">APY</div>
      <div className="font-bold text-3xl text-[#6EE7B7] tracking-[-0.03em]">{apy}%</div>
      <div className="mt-1 text-[12px] text-white/60">30-day trailing</div>
    </div>
    {/* ... 3 more metric cards: TVL, Users, Risk */}
  </div>
</div>
```

Continue restyling the remaining sections (allocations, APY chart, activate card, publisher) following the same pattern — replace existing wrappers with design-reference styles.

- [ ] **Step 2: Run type-check**

```bash
cd /Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/tasmil-finance && pnpm type-check
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/features/strategies/components/strategy-detail-page.tsx
git commit -m "style: restyle Strategy Detail page with design-tasmil tokens"
```

---

### Task 12: Restyle Marketplace page to match design-tasmil

**Files:**
- Modify: `src/features/marketplace/components/marketplace-page.tsx`

**Design reference:** `marketplace-browse.html` (same as Browse Strategies — shared browse/marketplace visual language)

- [ ] **Step 1: Apply the same restyling pattern as Task 10**

Same design token replacements as the Browse Strategies page:
- Page wrapper: `bg-black`
- Header: eyebrow + gradient title from design reference
- Tabs: pill-shaped with accent active state
- Cards: `rounded-[var(--r-card)] border border-white/[0.08] bg-[var(--surface)]`
- Filters: pill inputs with `border-white/[0.08] bg-white/[0.05]`

The key change is replacing the `className` values to match the `marketplace-browse.html` design tokens.

- [ ] **Step 2: Run type-check**

```bash
cd /Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/tasmil-finance && pnpm type-check
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/features/marketplace/components/marketplace-page.tsx
git commit -m "style: restyle Marketplace page with design-tasmil tokens"
```

---

### Task 13: Restyle Create Strategy page to match design-tasmil

**Files:**
- Modify: `src/features/marketplace/components/create-strategy-page.tsx`

**Design reference:** `publish-strategy.html` (step indicator, form cards, inputs, toggle, allocation sliders, review section)

- [ ] **Step 1: Apply publish-strategy.html styling**

Key elements from the design reference to apply:
- Page wrapper: `max-w-[800px] mx-auto px-[clamp(20px,5vw,72px)] py-12 bg-black`
- Header: eyebrow "Publisher Tools" + gradient title "Publish Strategy"
- Step indicator: horizontal steps with circle numbers, active/done states
- Form cards: `border border-white/[0.08] rounded-[22px] bg-[#0D111A] p-10`
- Inputs: `bg-[#07090F] border-white/[0.14] rounded-[14px] focus:border-[#67E8F9] focus:shadow-[0_0_0_3px_rgba(103,232,249,0.14)]`
- Buttons: gradient primary, ghost secondary

Replace the existing form styling with design-reference-compatible classes.

- [ ] **Step 2: Run type-check**

```bash
cd /Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/tasmil-finance && pnpm type-check
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/features/marketplace/components/create-strategy-page.tsx
git commit -m "style: restyle Create Strategy page with design-tasmil tokens"
```

---

### Task 14: Build and verify

- [ ] **Step 1: Run full build**

```bash
cd /Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/tasmil-finance && pnpm build
```

Expected: `exit 0` — build succeeds with no errors.

- [ ] **Step 2: Run lint**

```bash
cd /Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/tasmil-finance && pnpm lint
```

Expected: PASS — no lint errors.

- [ ] **Step 3: Verify all pages render**

Start the dev server and manually check:
- `/strategies` — should show StrategyNav + Browse page
- `/strategies/marketplace` — should show Marketplace page
- `/strategies/create` — should show Create Strategy page  
- `/strategies/leaderboard` — should show leaderboard
- `/strategies/dashboard` — should show publisher dashboard
- `/marketplace` — should redirect to `/strategies/marketplace`
- `/marketplace/create` — should redirect to `/strategies/create`

```bash
cd /Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/tasmil-finance && pnpm dev
```

Then open browser and verify each route.

- [ ] **Step 4: Commit final build fixes (if any)**

```bash
git add -A
git commit -m "chore: final build fixes for strategy nav feature"
```
