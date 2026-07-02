# /traction Page — Design Spec

**Date:** 2026-07-02
**Status:** In review — access model decided by user (fully public, 2026-07-02); remaining defaults pending final OK
**Repos touched:** `tasmil-finance` (frontend), `backend` (NestJS API)

## Purpose

A read-only traction dashboard at `tasmil.finance/traction` that the foundation (external
reviewers, e.g. SDF/SCF) can open from a single link and see live growth metrics: TVL, users,
volume, and transaction activity over time. It reuses the data and visual patterns of the
internal Admin Panel (`/admin/dashboard`, `/admin/analytics`) but exposes only aggregate,
non-sensitive numbers.

## Decisions

1. **Access model: fully public** — decided by the user at spec review (2026-07-02). No token,
   no login; anyone with the URL can view. The endpoint takes the same no-auth posture as the
   existing `GET /public/stats`. The route stays `noindex` — the audience is foundation
   reviewers, not search traffic (flip to indexable later if it becomes a marketing asset).
2. **Metric set (v1):** all-time KPI cards + 90-day daily time series + transaction type
   breakdown. Quest/engagement stats and per-protocol volume are deferred (see Future work).
   Per-wallet tables and top-depositor lists are **deliberately excluded** — privacy.
3. **Fixed 90-day window, day granularity.** No date-range picker in v1.
4. **Page language: English** (foundation audience).

Items 2–4 were proposed as defaults while the user was away and stand unless changed at review.

## Approaches considered

- **A (chosen): public page + one new backend endpoint.** New unauthenticated
  `GET /public/traction` aggregating everything in one payload; new `(public)/traction` route.
  Real growth charts, ~1 endpoint + 1 feature module of work.
- **B: frontend-only reusing existing `GET /public/stats`.** Zero backend work but only 4
  static KPIs — no growth-over-time story, which is the point of a traction page. Rejected.
- **C: same as A behind a secret-link token (`?key=`).** Originally recommended to keep growth
  curves semi-private; the user chose fully public at review, so the guard, env var, and
  invalid-link UX were dropped.

## Backend design (`backend`)

### Endpoint

`GET /api/public/traction` — added to the existing `public` module (`src/modules/public/`),
same unauthenticated posture as `GET /public/stats`.

- **Auth: none.** Public endpoint, aggregate data only.
- **Response DTO** (`TractionResponseDto`):

```ts
{
  summary: {
    totalTvlUsd: number;        // sum Position.balanceUsd where account ACTIVE (same as /public/stats)
    totalUsers: number;         // prisma.user.count()
    totalTransactions: number;  // prisma.activity.count()
    avgApyPercent: number;      // avg ApySnapshot.apy last 24h (same as /public/stats)
  };
  volumeTvl: Array<{ date: string; volumeUsd: number; cumulativeTvlUsd: number }>; // 90 days, daily
  userGrowth: Array<{ date: string; newUsers: number; cumulativeUsers: number }>;  // 90 days, daily
  txByType: Array<{ type: string; count: number }>;                                // all-time
  updatedAt: string; // ISO timestamp of computation
}
```

- **Data sources:**
  - `volumeTvl`: same SQL as `AdminService.getVolumeTvlSeries` (`admin.service.ts:449`) —
    bucketed DEPOSIT/WITHDRAW volume from `activities` plus cumulative net-deposit TVL seeded
    with the pre-window sum. The ~25-line raw query is **duplicated into the new service**
    rather than refactoring `admin.service.ts` (967 lines, untouched = no admin regression
    risk). A comment on each copy cross-references the other; extract a shared
    `AnalyticsQueriesService` only when a third consumer appears (rule of three).
  - `userGrowth`: **new** query on `users.created_at` (daily counts + cumulative), NOT the
    admin dashboard's `waitlist_entries` query — so the curve's final value exactly equals the
    `totalUsers` KPI shown beside it. Zero-fill missing days like
    `getRegistrationStats` does.
  - `txByType`: `prisma.activity.groupBy({ by: ['type'], _count })`.
  - `summary`: `TractionService` injects `PublicService` and calls `getStats()` (reusing its
    queries **and** its 60 s cache), mapping the fields into `summary` — no duplication here.
- **Implementation shape:** new `TractionService` (`src/modules/public/traction.service.ts`)
  + DTOs in `src/modules/public/dto/traction-response.dto.ts` + one controller method in
  `public.controller.ts`. `PublicService` stays untouched.
- **Caching:** cache-aside in Redis, key `public:traction:v1`, TTL 300 s (pattern copied from
  `PublicService.getStats`). On query failure: log and
  return `503`, do **not** return zeroed data (a foundation page silently showing zeros is
  worse than an error state; note this deviates from `getStats`'s zero-fallback).
- **Swagger:** documented with `@ApiQuery`/`@ApiResponse` so `pnpm generate:backend` produces
  the typed client + hooks in `tasmil-finance/src/gen-backend/`.

### Security notes

- Fully public by design (user decision) — the payload is aggregate, marketing-grade data.
- Rate limiting: whatever global throttling backend already applies; nothing bespoke in v1.
  The 300 s cache means repeated hits cost one set of queries per 5 minutes.
- Responses contain no PII, no wallet addresses.

## Frontend design (`tasmil-finance`)

### Routing

- `src/app/(public)/traction/page.tsx` → URL `/traction` (the `(public)` group already exists
  with a pass-through layout and no auth).
- Server component simply renders the client dashboard. Exports `metadata` with
  `robots: { index: false, follow: false }` (audience is reviewers, not search) and title
  `"Tasmil — Traction"`.

### Feature module `src/features/traction/`

Follows the feature-isolation rule (no imports from other features; shared UI from
`@/shared/ui`, chart patterns copied — not imported — from `admin-analytics`):

```
src/features/traction/
  components/
    traction-dashboard.tsx    # "use client" orchestrator: fetch + section layout
    kpi-cards.tsx             # 4 stat cards (TVL, Users, Transactions, Avg APY)
    volume-tvl-chart.tsx      # recharts, same dual-series pattern as admin-analytics
                              # volume-tvl-chart (volume + cumulative TVL)
    user-growth-chart.tsx     # recharts AreaChart: cumulative users, daily new users overlay
    tx-breakdown.tsx          # transaction count by type (compact bar list)
  hooks/
    use-traction.ts           # wraps gen-backend hook `usePublicControllerGetTraction()`
  __tests__/                  # Jest, mirroring admin-analytics test patterns
  index.ts                    # barrel
```

- **Data fetching:** the Kubb-generated hook from `src/gen-backend` (exists after backend
  merge + `pnpm generate:backend`). One request, `refetchInterval` off, `staleTime` 5 min to
  match server cache.
- **Visual language:** dark theme, shadcn `Card` + `Typography`, KPI-card style lifted from
  `admin/dashboard`'s `KpiCard`, recharts config lifted from `admin-analytics`
  `volume-tvl-chart.tsx`. Minimal chrome: Tasmil logo header, "Live data — updated {updatedAt}"
  badge, footer link to tasmil.finance. English copy.
- **States:** loading skeletons per section; network/5xx → error card with Retry button; empty
  series → zero-state chart (not blank page).

## Error handling summary

| Failure | Behavior |
|---|---|
| DB/query failure | Backend 503 (no zeroed payload) → frontend error card + Retry |
| Redis down | Cache skipped (best-effort `.catch`), queries run live |
| Empty tables | Valid payload with zeros/empty arrays → zero-state UI |

## Testing

- **Backend (Jest):** `traction.service.spec.ts` — cumulative TVL math (prior-window seed +
  running sum), user-growth zero-fill, cache hit path. `public.controller.spec.ts` extension —
  200 + payload shape.
- **Frontend (Jest):** KPI cards render from mock payload, error/retry state, dashboard section
  smoke tests — mirroring `admin-analytics/__tests__` style.
- **Manual verification:** run backend + frontend locally, hit `/traction`, confirm charts
  against `/admin/analytics` for the same window.
- Playwright E2E: out of scope v1 (needs seeded backend).

## Rollout

1. Backend PR → `deploy/prod` (per repo git workflow); verify CI + `prod-backend` container
   logs (read-only SSH).
2. In `tasmil-finance`: `pnpm generate:backend` against the updated API, commit regenerated
   `src/gen-backend`, build the feature, PR → `deploy/prod`, verify CI + Vercel.
3. Smoke-test `https://tasmil.finance/traction`, then share the link with the foundation.

## Future work (explicitly out of v1)

- Quest/engagement section (questWallets, onchainCompleters — data already in
  `/admin/quest-stats`).
- Per-protocol volume breakdown.
- Date-range picker / granularity toggle.
- CSV export for reviewers.
- If a third analytics consumer appears: extract shared `AnalyticsQueriesService` in backend.
