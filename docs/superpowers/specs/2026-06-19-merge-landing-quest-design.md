# Design: Merge Landing + Quest into tasmil-finance

**Date:** 2026-06-19
**Status:** Approved (pending spec review)
**Target repo:** `tasmil-finance` (Next.js 16, Turbopack, Biome, `src/features/` architecture)

## Goal

Consolidate three separate frontends into one path-based Next.js app:

- **Landing** (`tasmil-finance-new`, currently `tasmil-finance.xyz`)
- **Quest** (`tasmil-quest-folder/frontend`, currently `quest.tasmil-finance.xyz`)
- **Main app** (`tasmil-finance`, currently `app.tasmil-finance.xyz`) - the merge target

The result is a single deployment serving the marketing landing at `/`, the app at `/chat` (etc.), and quest under `/quest/*`, all unified under the tasmil-finance theme.

## Locked decisions

| Decision | Choice |
|----------|--------|
| Routing model | Single app, path-based (landing `/`, app `/chat`, quest `/quest/*`) |
| Landing source | Full redesigned version from `tasmil-finance-new` (replaces the partial port already in target) |
| Access gating | Keep waitlist + access-code gate + admin access-codes UI |
| Quest depth | Full native de-iframe (campaigns, campaign detail, visit/task flow, profile, leaderboard, Discord/Telegram/X OAuth) |
| Theme | Quest re-skinned to app design tokens + `shared/ui`; landing keeps its bespoke 3D look but brand-aligned |
| Quest API access | Generated `gen-quest` client, browser calls quest backend directly via `NEXT_PUBLIC_QUEST_API_URL` (needs CORS) |
| Integration strategy | Phased vertical slices (4 shippable phases) |

## Pre-existing state (important)

A partial merge already happened in the target. Before building, note:

- Target `src/features/landing` holds a **subset** of landing components; the landing **route** (`(landing-page)/page.tsx`) is a "Launch App" stub. The redesigned source has more components (`Hero/Faq/Features/Fees/Security/Partners/Convergence/Statement/StellarReel/Preloader/Sidebar/Nav/Footer`).
- Target `src/features/quest` has **leaderboard only**; quest currently runs as an **iframe embed** (CSP `frame-ancestors` work in recent commits) plus admin quest-stats/quest-wallets.
- Target **already has** most landing/waitlist API routes (`/api/waitlist/*`, `/api/admin/codes/*`, `/api/admin-auth/*`) and quest-admin routes (`/api/admin/campaign*`, `/api/admin/quest-stats`).
- Target `src/shared/ui` already contains every primitive quest uses (`button`, `card`, `dialog`, `tabs`, `avatar`, `badge`, `separator`, `input`, `sonner`).
- Target `src/shared/context/wallet-context.tsx` exists (the landing access-flow depends on a `useWallet` context).

This significantly reduces the work: most backend plumbing and UI primitives are in place.

## 1. Architecture & routing

```
src/app/
  (landing-page)/          # marketing shell layout (landing nav/footer; 3D allowed)
    page.tsx               # ← full redesigned landing (replaces stub)
    waitlist/page.tsx
    access/page.tsx        # wallet-connect + access-code redeem
  (quest)/                 # NEW route group, own quest chrome (reskinned)
    quest/page.tsx                 # quest home / explore
    quest/campaigns/page.tsx
    quest/campaign/[id]/page.tsx
    quest/profile/page.tsx
    quest/leaderboard/page.tsx
    quest/visit/[taskId]/page.tsx
  (dashboard)/             # existing app (/chat, /portfolio, ...); remove old /quest stub
  admin/                   # access-codes, quest-stats, waitlist (already present)
  api/                     # existing routes kept + NEW /api/auth/{discord,telegram,x}(+callbacks)
```

- The current `(dashboard)/quest` leaderboard stub and the iframe embed are removed in favor of native `(quest)/quest/*`.
- The `(quest)` group gets its own layout/chrome (quest navbar/footer reskinned), rather than nesting inside the `(dashboard)` app sidebar.

## 2. Feature modules (`src/features/`)

- **`landing/`** - full replace with the redesigned components from `tasmil-finance-new`. Keep 3D/GSAP code-split so app/quest bundles never pull `three`.
- **`access/` + `waitlist/`** - ported from landing's `features/access` + `components/wl`; reuse existing `shared/context/wallet-context`.
- **`quest/`** - converted from quest's `components/ + context/ + data/` into the feature layout (`components/`, `hooks/`, `lib/`, `context/`). Keep the existing `quest/lib/tier.ts` + leaderboard.
- **`admin-*`** - access-codes / quest-stats / waitlist features already exist; wire the redesigned admin access-codes UI to them.

Feature isolation rule (per CLAUDE.md) preserved: features never import from each other; cross-cutting code lives in `src/shared/`.

## 3. Data / API layer

- **New `gen-quest` client**: add `kubb.config.quest.js` + `pnpm generate:quest`, generated from quest backend OpenAPI (`/api/docs-json`). Browser calls quest backend directly via `NEXT_PUBLIC_QUEST_API_URL` (`:5555` locally). **Requires CORS** enabled on the quest backend for the merged origin.
- Existing `gen-ai` (`:8001`) and `gen-backend` (`:6756`) untouched.
- **Social OAuth** stays server-side: port `/api/auth/{discord,x}` + `/api/auth/callback/{discord,x}` + `/api/auth/telegram` routes. Secrets (`DISCORD_CLIENT_ID/SECRET`, `X_CLIENT_ID/SECRET`, `TELEGRAM_BOT_TOKEN`) server-only; `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` public.
- Waitlist/access/admin-codes/admin-auth API routes already in target - reused as-is.

## 4. Theme unification

- **Quest reskinned**: replace quest's local `components/ui/*` imports with `@/shared/ui/*`; map quest color usage onto `globals.css` design tokens (`--primary` aqua `hsl(203 100% 61%)`, `--background`, etc.); delete quest's duplicate `ui/` after migration.
- **Landing preserved**: keep the bespoke 3D aesthetic; align its accent/brand CSS vars + font to the app tokens via the single `ThemeProvider`. One font setup, one `globals.css`.

## 5. Dependencies

- Quest deps are a subset of target's; landing deps (`three`, `gsap`, `@react-three/*`, `motion`) already present.
- Add only what's missing - notably **`jose`** (used by landing admin-auth routes).
- Drop quest's `vitest`; use the target's Jest.

## 6. Testing

- Port quest unit logic (e.g. `tier.test.ts`) to Jest.
- Playwright smoke specs: landing renders + "Launch App"; access-code redeem flow; `/quest` loads; quest leaderboard renders.
- `pnpm build` must exit 0 locally before any push to `deploy/prod` (per project rule).

## 7. Cutover & ops (Phase 4)

- One Vercel project (`tasmil-finance`); `tasmil-finance.xyz`, `app.*`, `quest.*` resolve to it. Exact host mapping (redirect vs alias) decided at cutover.
- **Update Discord/X OAuth redirect URIs** to the new callback URLs.
- Enable **CORS** on quest backend for the new origin.
- Remove quest iframe embed + CSP `frame-ancestors`.
- Archive `tasmil-finance-new` and `tasmil-quest-frontend` repos post-cutover.
- Backends remain separate services: `:5555` quest, `:6756` main, `:8001` ai.

## 8. Phasing (shippable slices)

1. **Landing + shell** - full landing port, unified theme/provider/nav/footer, access + waitlist wired to existing routes.
2. **Quest read** - `gen-quest` client; native leaderboard/campaigns/profile reskinned.
3. **Quest write/auth** - `visit/[taskId]` task flow + social OAuth routes.
4. **Cutover** - domains, OAuth URIs, CORS, remove iframe/CSP, archive repos.

Each phase is independently shippable and reviewable; OAuth/domain cutover is isolated to the final phase.

## Risks & mitigations

| Risk | Mitigation |
|------|-----------|
| Next 15 → 16 differences in ported quest code | Port carefully; rely on type-check + smoke tests per page |
| CORS on quest backend for direct client | Coordinate backend change before Phase 2 ships |
| OAuth redirect-URI coordination | Update Discord/X app configs as part of Phase 4 cutover |
| Landing token-alignment visual regressions | Align vars incrementally; visual smoke check |
| `three`/`gsap` leaking into non-landing bundles | Keep landing 3D dynamically imported / code-split |

## Open items deferred to implementation

- Exact Phase-4 host mapping (`quest.*` / `tasmil-finance.xyz` redirect vs host alias).
- Whether quest auth/session state shares the main app's auth or stays independent (quest backend is separate).
