# Strategy Navigation & Mega Menu - Design Spec

**Date:** 2026-06-24
**Repo:** Tasmil-Finance/tasmil-finance
**Status:** Approved

---

## Goal

Add a "Strategies" dropdown megamenu to the navbar, and create a
dedicated layout for all strategy pages - same pattern as the Quest
section (`(quest)/layout.tsx` with its own `QuestNav`).

## Design References

From `/Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/side-repo/design-tasmil-trading-stratergy/`:

| File | Page |
|------|------|
| `marketplace-browse.html` | Strategy marketplace listing |
| `strategy-detail.html` | Individual strategy detail |
| `publish-strategy.html` | Multi-step publish form |
| `publisher-dashboard.html` | Publisher dashboard (was My Agents) |
| `leaderboard.html` | Performance leaderboard |
| `my-agents.html` | User's agents listing |

All share the same design tokens:
- `--bg: #000000`, `--surface: #0D111A`, `--text: #F4F7FB`
- `--accent: #67E8F9`, `--accent-glow: rgba(103,232,249,0.50)`
- `--font: 'Hanken Grotesk'`, `--r-pill: 100px`, `--r-card: 22px`

---

## URL Structure

All strategy pages under `/strategies/*`:

| Path | Purpose | Status |
|------|---------|--------|
| `/strategies` | Marketplace browse | Migrated from `/marketplace` |
| `/strategies/[id]` | Strategy detail | Exists, moved |
| `/strategies/dashboard` | Publisher dashboard | Migrated from `/my-agents` |
| `/strategies/leaderboard` | Leaderboard | New |
| `/strategies/create` | Publish strategy | Migrated from `/marketplace/create` |

**Redirects:** `/marketplace` → `/strategies`, `/my-agents` → `/strategies/dashboard`

---

## Architecture

### Route Group

Create `src/app/(strategy)/` - a Next.js route group wrapping all
strategy pages. Its `layout.tsx` renders `StrategyNav` + page content
+ `StrategyFooter`, exactly like `(quest)/layout.tsx` does for quest.

```
src/app/(strategy)/
  layout.tsx                  StrategyLayout (StrategyNav + StrategyFooter)
  strategies/
    page.tsx                  Marketplace browse
    create/page.tsx           Publish strategy
    dashboard/page.tsx        Publisher dashboard
    leaderboard/page.tsx      Leaderboard
    [id]/page.tsx             Strategy detail
```

### Layout Wrappers

Like `(quest)/layout.tsx`, the strategy layout wraps everything in
`WalletProvider` + `AutoReconnect` so wallet state is available across
all strategy pages.

### Component Tree

```
StrategyLayout
+-- WalletProvider + AutoReconnect
+-- StrategyNav (new, dedicated header)
|   +-- Brand: Tasmil mark + name → /strategies
|   +-- Nav links with megamenu trigger
|   |   +-- Strategies ▼        ← group wrapper
|   |   |   +-- MegaMenu        ← dropdown on hover
|   |   +-- Chat
|   |   +-- Missions
|   |   +-- Farming
|   |   +-- Aggregator
|   |   +-- Portfolio
|   +-- Right side: wallet chip, badges
+-- <main> {children} </main>
+-- StrategyFooter (new)
```

---

## Component Design

### 1. StrategyNav

**File:** `src/features/strategies/components/StrategyNav.tsx`

Dedicated navbar for all strategy pages. Replaces `TopNavBar` entirely
when on `/strategies/*` paths. Visually matches the HTML design files.

**Styling (from design reference `.topnav`):**
- `position: sticky; top: 0; z-index: 100; height: 68px`
- `background: rgba(0,0,0,0.72); backdrop-filter: blur(18px)`
- `border-bottom: 1px solid var(--line)`
- `padding: 0 clamp(20px, 5vw, 72px)`
- Flexbox, space-between

**Left - Brand:**
- Tasmil mark (26x26, gradient bg, "T" letter)
- "Tasmil Finance" text, 17px, weight 700

**Center - Nav links:**
- Pill-style buttons: `font-size: 14.5px; font-weight: 500; padding: 8px 18px; border-radius: var(--r-pill)`
- Default: `color: var(--muted)`
- Hover: `color: var(--text); background: rgba(255,255,255,0.05)`
- Active: `color: var(--text)` + `::after` underline (2px, accent color, 60% width, glow)
- "Strategies" item includes chevron-down SVG, wrapped in `relative group`

**Right - Wallet area:**
- Wallet chip: avatar + address (mono font, 13px)
- Same design as HTML `.wallet-chip`

### 2. MegaMenu

**File:** `src/features/strategies/components/MegaMenu.tsx`

Hover-based dropdown panel. Opens on hover of "Strategies ▼" item.

**Behavior:**
- Tailwind `group` + `group-hover:opacity-100 group-hover:visible`
- Default: `opacity-0 invisible`
- Entrance: `translate-y-2 group-hover:translate-y-0 transition-all duration-200`
- Panel: `absolute left-0 top-full mt-2`
- No click required - pure CSS hover
- Closes on mouse leave

**Menu items (4 links):**

| Label | Description | Href |
|-------|-------------|------|
| Marketplace | Browse all available strategies | `/strategies` |
| Publisher Dashboard | Track your published strategies | `/strategies/dashboard` |
| Leaderboard | Top performing strategies | `/strategies/leaderboard` |
| Publish Strategy | Create and deploy your own strategy | `/strategies/create` |

**Styling:**
- Panel bg: `var(--surface)` with border `var(--line)`, rounded `var(--r-card)`
- Items: `padding: 12px 20px`, rounded on hover, icon + label + description
- Active item highlighted via `usePathname()`
- Width: fixed 280px

### 3. StrategyFooter

**File:** `src/features/strategies/components/StrategyFooter.tsx`

Simple footer matching the quest footer pattern. Links to social,
copyright, "Powered by Tasmil Finance."

---

## Sidebar Data + TopNavBar Change

In `src/shared/layout/sidebar-data.ts`:
- Remove "Marketplace" and "My Agents" from nav groups

In `src/shared/layout/top-nav-bar.tsx`:
- Hardcode a "Strategies ▼" mega-menu trigger into the nav items list
  (it behaves differently from flat NavLinks, so it doesn't belong in
  sidebar-data)

The megamenu appears in TWO places:
1. **TopNavBar** (dashboard layout) - so users can navigate INTO
   strategies from any dashboard page
2. **StrategyNav** (strategy layout) - for internal navigation while
   on strategy pages

Both use the same `MegaMenu` component.

---

## Error & Edge Cases

- **No strategies:** Empty state per `my-agents.html` design (icon + message + CTA)
- **Invalid strategy ID:** Redirect to `/strategies` with toast
- **Mobile:** StrategyNav collapses to hamburger; megamenu becomes accordion
- **Keyboard:** Megamenu items focusable via Tab, closes on Escape
- **Performance:** Megamenu lazily renders on first hover

---

## Files to Create / Modify

| File | Action |
|------|--------|
| `src/app/(strategy)/layout.tsx` | Create |
| `src/app/(strategy)/strategies/page.tsx` | Move from `(dashboard)/marketplace/` |
| `src/app/(strategy)/strategies/[id]/page.tsx` | Move from `(dashboard)/strategies/[id]/` |
| `src/app/(strategy)/strategies/dashboard/page.tsx` | Move from `(dashboard)/my-agents/` |
| `src/app/(strategy)/strategies/leaderboard/page.tsx` | Create |
| `src/app/(strategy)/strategies/create/page.tsx` | Move from `(dashboard)/marketplace/create/` |
| `src/features/strategies/components/StrategyNav.tsx` | Create |
| `src/features/strategies/components/MegaMenu.tsx` | Create |
| `src/features/strategies/components/StrategyFooter.tsx` | Create |
| `src/shared/layout/sidebar-data.ts` | Modify |
| `src/app/(dashboard)/marketplace/` | Delete |
| `src/app/(dashboard)/my-agents/` | Delete |
| `src/app/(dashboard)/strategies/` | Delete |

---

## Implementation Order

1. Create `MegaMenu.tsx`
2. Create `StrategyNav.tsx`
3. Create `StrategyFooter.tsx`
4. Create `(strategy)/layout.tsx`
5. Migrate existing pages to new routes
6. Build new pages (leaderboard, create if needed)
7. Update `sidebar-data.ts`
8. Add redirects for old paths
9. Delete old route directories
10. Test all navigation flows
