# Strategy Navigation & Mega Menu — Design Spec

**Date:** 2026-06-24
**Repo:** Tasmil-Finance/tasmil-finance

---

## Goal

Add "Strategies" to the main top navbar with a mega menu dropdown, and create a dedicated sub-header for all `/strategies/*` pages — treating the strategy section as a sub-project within Tasmil Finance (same pattern as Quest, but as a sub-header instead of a full header replacement).

## Design References

All UI design tokens and component styling pulled from:
`/Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/side-repo/design-tasmil/`

Relevant files: `marketplace-browse.html`, `strategy-detail.html`, `publish-strategy.html`, `leaderboard.html`, `publisher-dashboard.html`, `my-agents.html`

Design tokens from the references:
- `--bg: #000000`, `--surface: #0D111A`, `--text: #F4F7FB`, `--muted: rgba(244,247,251,0.58)`
- `--accent: #67E8F9`, `--accent-glow: rgba(103,232,249,0.50)`
- `--line: rgba(255,255,255,0.08)`, `--font: 'Hanken Grotesk'`
- `--r-pill: 100px`, `--r-card: 22px`, `--r-sm: 14px`

---

## URL Structure

All strategy pages live under `/strategies/*`:

| Path | Purpose | Status |
|---|---|---|
| `/strategies` | Browse Strategies (newer list) | Exists |
| `/strategies/marketplace` | Agent Marketplace browse | Move from `/marketplace` |
| `/strategies/create` | Publish/Create new strategy | Move from `/marketplace/create` |
| `/strategies/[strategyId]` | Strategy detail view | Exists |
| `/strategies/leaderboard` | Strategy performance ranking | New |
| `/strategies/dashboard` | Publisher dashboard | New |

**Redirects needed:** Old paths `/marketplace` and `/marketplace/create` redirect to new `/strategies/marketplace` and `/strategies/create`.

**Not moving:** `/my-agents` stays independent (dashboard feature, not strategy-specific).

---

## Architecture

### Layout Group

Create `src/app/(dashboard)/strategies/layout.tsx` — a Next.js App Router layout group that wraps all `/strategies/*` pages. This layout renders:

1. The main `TopNavBar` (from shared layout — the global app header)
2. `StrategyNav` — the strategy sub-header (new component, like Quest's `QuestNav` but as a sub-header)
3. The page content via `{children}`

### Component Tree

```
TopNavBar (modified)
├── Logo + Brand (unchanged)
├── Nav Items (modified: add StrategyMegaMenu trigger)
│   ├── Chat
│   ├── Strategies ▼         ← NEW: mega menu trigger
│   │   └── StrategyMegaMenu  ← NEW: dropdown panel
│   ├── Missions
│   ├── Farming
│   ├── Aggregator
│   ├── Portfolio
│   └── Tasmil Quest
└── Right side (wallet, badges — unchanged)

StrategyNav (new, rendered in strategies layout)
├── Brand: Tasmil · Strategies
└── Internal nav links:
    ├── Browse
    ├── Marketplace
    ├── Leaderboard
    ├── Publish
    └── Dashboard
```

---

## Component Design

### 1. `StrategyMegaMenu`

**Location:** `src/features/strategies/components/StrategyMegaMenu.tsx`

**Purpose:** Dropdown trigger + panel rendered inside `TopNavBar` as a special nav item.

**Props:**
```ts
interface StrategyMegaMenuProps {
  items: MegaMenuGroup[];
}
interface MegaMenuGroup {
  title: string;
  items: MegaMenuItem[];
}
interface MegaMenuItem {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
}
```

**Behavior:**
- 150ms open delay on hover to prevent flicker
- 200ms close delay on mouse leave
- Click item navigates and closes menu
- Keyboard: Esc closes, Tab cycles through items
- Active state: if current path starts with `/strategies`, show accent underline

**Styling (from design reference):**
- Panel: full-width below navbar, `max-w-[1280px]`, `bg-black/90 backdrop-blur-xl`, `border-b border-[var(--line)]`
- Grid: 2 columns (`grid-cols-2`)
- Items: `rounded-[var(--r-sm)]`, hover `bg-white/[0.05]`, transition 200ms
- Icons: 24px, muted color, group-hover → accent
- Labels: `text-[14.5px] font-medium text-[var(--text)]`
- Descriptions: `text-[12px] text-[var(--muted)]`

**Menu content (two groups):**
```
Discover                    Manage
Browse Strategies           Publish Strategy
  All available strategies    Create and deploy your own
Marketplace                 Publisher Dashboard
  Agent-driven strategies     Track your published strategies' performance
Leaderboard
  Top performing strategies
```

### 2. `StrategyNav`

**Location:** `src/features/strategies/components/StrategyNav.tsx`

**Purpose:** Sub-header for all `/strategies/*` pages. Rendered in the strategies layout, sitting below the global TopNavBar.

**Props:** None (uses `usePathname()` internally)

**Behavior:**
- Sticky below TopNavBar (z-index just under TopNavBar)
- Active link detection via pathname matching
- Links navigate to strategy sub-pages

**Styling (from design reference `.topnav`):**
- Height: 56px
- Background: `rgba(0,0,0,0.72)`, `backdrop-filter: blur(18px)`
- Border-bottom: `1px solid var(--line)`
- Padding: `0 clamp(20px, 5vw, 72px)`

**Layout:**
- Left: Brand link "Tasmil" + accent dot separator + "Strategies" (accent text)
- Center: Nav links as pill buttons
  - Items: [{ href: "/strategies", label: "Browse" }, { href: "/strategies/marketplace", label: "Marketplace" }, { href: "/strategies/leaderboard", label: "Leaderboard" }, { href: "/strategies/create", label: "Publish" }, { href: "/strategies/dashboard", label: "Dashboard" }]
  - Each: `text-[14.5px] font-medium`, pill `rounded-[100px] px-[18px] py-[8px]`
  - Active: white text + `::after` accent underline with glow
  - Inactive: muted text, hover → white + subtle bg

### 3. `TopNavBar` modifications

**Location:** `src/shared/layout/top-nav-bar.tsx`

**Changes:**
- Add `StrategyMegaMenu` as a special nav item (not a plain `NavLink`)
- Must detect if current path is under `/strategies` to set active state
- When on `/strategies/*`, other nav items remain visible — `StrategyNav` handles internal navigation, `TopNavBar` stays as global navigation

**How to integrate:**
- The sidebar-data config remains the flat list for other items
- Strategy is hardcoded into TopNavBar as a standalone component entry (it behaves differently from flat links)
- This keeps sidebar-data.ts clean while giving the mega menu its dedicated component slot

---

## Page Migration Plan

### Pages to move (route change only, component logic reused):

1. `src/app/(dashboard)/marketplace/page.tsx` → `src/app/(dashboard)/strategies/marketplace/page.tsx`
   - Same component: `MarketplacePage` from `@/features/marketplace`
2. `src/app/(dashboard)/marketplace/create/page.tsx` → `src/app/(dashboard)/strategies/create/page.tsx`
   - Same component: uses create-strategy-page
3. Old `/marketplace/[...]` route files removed

### Pages already in place:
- `src/app/(dashboard)/strategies/page.tsx` — Browse Strategies
- `src/app/(dashboard)/strategies/[strategyId]/page.tsx` — Strategy Detail

### New pages to build:
- `/strategies/leaderboard` — renders leaderboard table (reuse `LeaderboardTable` from marketplace feature, styled per design reference)
- `/strategies/dashboard` — renders publisher dashboard (new component based on `publisher-dashboard.html` design)

### Redirects:
- `/marketplace` → `/strategies/marketplace` (Next.js redirect in next.config or middleware)
- `/marketplace/create` → `/strategies/create`

---

## Error & Edge Cases

- **No strategies data:** Empty state with icon + message + CTA to publish, matching design reference `.empty-state`
- **Invalid strategy ID:** 404 page or redirect to browse
- **Mobile:** Mega menu collapses to expandable accordion in mobile hamburger menu. StrategyNav links render inline (scrollable horizontal pills) or collapse into hamburger.
- **Keyboard navigation:** Mega menu items focusable via Tab, close on Escape
- **Performance:** Mega menu panel lazy-renders on first hover (avoid DOM cost when unused)

---

## Files to Create / Modify

| File | Action |
|---|---|
| `src/app/(dashboard)/strategies/layout.tsx` | Create — strategy sub-project layout |
| `src/app/(dashboard)/strategies/marketplace/page.tsx` | Move from `/marketplace/page.tsx` |
| `src/app/(dashboard)/strategies/create/page.tsx` | Move from `/marketplace/create/page.tsx` |
| `src/app/(dashboard)/strategies/leaderboard/page.tsx` | Create — new leaderboard page |
| `src/app/(dashboard)/strategies/dashboard/page.tsx` | Create — new publisher dashboard |
| `src/features/strategies/components/StrategyNav.tsx` | Create — sub-header |
| `src/features/strategies/components/StrategyMegaMenu.tsx` | Create — mega menu dropdown |
| `src/shared/layout/top-nav-bar.tsx` | Modify — add StrategyMegaMenu |
| `src/shared/layout/sidebar-data.ts` | Modify — remove moved marketplace nav item |
| `next.config.ts` or middleware | Modify — add redirects for old paths |
| Old route files under `/marketplace/` | Delete |
