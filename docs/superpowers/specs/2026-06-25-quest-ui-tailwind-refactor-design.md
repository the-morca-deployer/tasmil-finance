# Quest UI — Tailwind + shared/ui Refactor

**Date:** 2026-06-25
**Repo:** `tasmil-finance`
**Status:** Approved design

## Problem

The quest feature in `tasmil-finance` is styled by a monolithic, hand-written
`src/features/quest/quest.css` (~875 lines) scoped to `.quest-scope`. This
approach is hard to maintain and inconsistent with the rest of the app. The
visual design already matches the reference mockups in
`/Users/nathan/Documents/morcalab/tasmil/tmp/quest-tasmil`; the problem is *how*
the styling is authored, not how it looks.

## Goal

Refactor the existing quest UI from the monolithic scoped CSS file to **Tailwind
v4 utility classes** plus reuse of the existing **`src/shared/ui/` Radix
components**. This is a CSS-architecture refactor, **not a redesign**.

### Non-goals
- No visual changes: colors, cards, and layout stay identical to current/mockup.
- No new shadcn dependency. We reuse `src/shared/ui/` (the existing Radix-based
  library) + Tailwind utilities. ("Wrap existing shared/ui.")
- No refactoring outside the quest feature.

## Decisions (from brainstorming)

| Topic | Decision |
|-------|----------|
| Component strategy | Wrap/reuse existing `src/shared/ui/`; **no new shadcn dep** |
| Visual design | **Keep identical** — same colors, cards, no restyling |
| Pages in scope | **All 5**: Explore, Campaigns list, Campaign detail, Profile, Leaderboard |
| Effects | **Port all**: THREE.js beams, Rank Reveal, TF Loader |
| Data | Use **mock data** (mock UI first) so pages render without backend |
| Verification | **Per-page autonomous** Playwright screenshot-compare loop; report before/after after each page, get sign-off, then next page |

## Design

### 1. Design tokens
- Move the quest palette (arctic cyan `#67E8F9`, `#0EA5E9`, jet black, pill/card
  radii, gradients, easings) into Tailwind v4 `@theme` with a `quest-` prefix,
  generating utilities like `bg-quest-bg`, `text-quest-accent`,
  `rounded-quest-card`.
- The `quest-` prefix prevents collision with the app's existing design tokens.
  Colors stay byte-for-byte identical.

### 2. Component decomposition
- Each page is split into focused components, each with one clear purpose,
  reusing `src/shared/ui/` primitives (Card, Button, Badge, Dialog, ScrollArea,
  etc.).
- Replace bespoke `.quest-*` classes with utility classes. Use `@apply` or a
  component-level class only where a pattern is genuinely repeated many times.
- `quest.css` shrinks incrementally as components are converted. Target end
  state: only keyframes + a few complex selectors remain (ideally near-empty).

### 3. Pages (build order: simple → complex)
1. **Explore** (`/quest`, `/quest/explore`) — hero, "why quest" cards, stats.
2. **Campaigns list** (`/quest/campaigns`) — filterable/searchable card grid.
3. **Campaign detail** (`/quest/campaign/[id]`) — quest checklist, progress
   bars, expandable items, sidebar.
4. **Leaderboard** (`/quest/leaderboard`) — ranked list, podium.
5. **Profile** (`/quest/profile`) — sidebar, questlog, referrals, tier.

### 4. Effects (port all)
- **Beams 3D**: client component `QuestBeams` using THREE.js (add `three` dep),
  lazy-loaded to split the bundle, disabled under `prefers-reduced-motion`.
- **Rank Reveal**: modal built on `shared/ui` `Dialog` + CSS keyframes for glow.
- **TF Loader**: RGB-split animated logo loader component for route loading.

### 5. Mock data
- Reuse existing mock data in `features/quest/lib` (extend where missing) so all
  5 pages render with no backend dependency, enabling the screenshot loop.

### 6. Per-page verification loop (autonomous)
1. Run `pnpm dev` (:3000); serve `tmp/quest-tasmil` mockups via a static server.
2. Playwright screenshots the **reference mockup** and the **Next route** at the
   same viewports (desktop + mobile).
3. Diff visually → fix → repeat until it matches the mockup.
4. Send user before/after + diff, await sign-off, then proceed to next page.

### 7. Risks & mitigations
- `shared/ui` may lack a few primitives (progress bar, tabs, expandable). If so,
  **add 1–2 new components to `shared/ui`** following existing patterns.
- THREE.js bundle weight → lazy-load and code-split.
- Tailwind v4 token scoping → verified via the `quest-` prefix approach.

### 8. Definition of done (per page)
- Visual parity with mockup at desktop + mobile viewports.
- `pnpm type-check` and `pnpm lint` pass.
- Corresponding `.quest-*` rules removed from `quest.css`.
