# Quest-volume transaction list on `/traction` — Design

**Date:** 2026-07-03
**Status:** Approved (design)
**Repos touched:** `backend` (new endpoint), `tasmil-finance` (new UI)

## Problem

The public `/traction` page shows aggregate KPIs and two charts. Its "volume"
chart is derived from the `activities` table (DEPOSIT/WITHDRAW). Separately, the
quest system tracks **quest volume** in the `reward_volume_events` table — one
row per on-chain tx that counts toward a user's quest leaderboard. There is
currently no way to see the *individual* quest-volume transactions anywhere
public.

**Goal:** Add a UI on `/traction` that lists individual quest-volume
transactions (one row per `reward_volume_events` row).

## Scope decisions (confirmed with user)

- **Data source:** `reward_volume_events` (quest volume), NOT `activities`.
- **Columns:** protocol, operation, amount (USD), wallet, date.
- **Wallet privacy:** show a **masked** wallet (`GABC…4F7Q`) computed
  server-side — the full pubkey never leaves the backend. `tx_hash` is returned
  but **not** rendered as an explorer link (privacy). This reconciles the two
  answers given (show "which wallet" vs. "hide wallet completely"): the row
  shows *a* wallet handle without exposing the address or an identity lookup.
  Flip to fully-hidden by dropping the field — noted as a one-line change.
- **Endpoint shape:** separate paginated endpoint (option A), so the existing
  cached `/public/traction` payload stays lean and the list can "Load more".

## Non-goals (YAGNI)

- No filtering/sorting UI (protocol filter, date range) in v1.
- No explorer deep-links.
- No realtime/websocket updates — polling via the normal query cache is fine.
- No change to the existing Volume/TVL chart.

## Backend design (`backend`)

### New endpoint

`GET /public/quest-volume?limit=&cursor=`

- `limit`: default 25, clamped to `[1, 100]`.
- `cursor`: opaque string encoding the last row's `(createdAt, id)`; omitted for
  the first page.
- Response `QuestVolumeResponseDto`:
  ```ts
  {
    items: QuestVolumeItemDto[];
    nextCursor: string | null; // null when no more rows
  }
  ```
- `QuestVolumeItemDto`:
  ```ts
  {
    id: string;
    protocol: string;          // 'defindex' | 'blend' | 'soroswap' | 'aquarius' | ...
    operationKind: string;
    amountUsd: number;
    walletMasked: string;      // 'GABC…4F7Q' — never the full pubkey
    createdAt: string;         // ISO
    // txHash intentionally omitted from the public payload (privacy).
  }
  ```

### Service

- `TractionService.getQuestVolume({ limit, cursor })` (keep it in
  `traction.service.ts` — same public/analytics surface, no new module needed).
- Query `reward_volume_events` joined to `users` for `stellar_pubkey`,
  `WHERE amount_usd > 0`, ordered `created_at DESC, id DESC`, keyset-paginated on
  the cursor (`(created_at, id) < (cursorCreatedAt, cursorId)`). Fetch
  `limit + 1` rows to compute `nextCursor`.
- **Mask the pubkey server-side**: `pubkey.slice(0, 5) + '…' + pubkey.slice(-4)`.
  The raw pubkey and `tx_hash` are dropped before returning.
- Cache **only the first page** (no cursor) in Redis, key
  `public:quest-volume:v1:first`, TTL ~60s. Paginated pages are not cached.
- Follow the existing error convention: on failure throw
  `ServiceUnavailableException` (matches `getTraction`).

### DTOs / controller

- New `dto/quest-volume-response.dto.ts` with `QuestVolumeItemDto` +
  `QuestVolumeResponseDto`, Swagger-annotated like the traction DTOs.
- Add `@Get('quest-volume')` to `PublicController` with query params
  (`@Query`), `ApiOperation`, `200` + `503` `ApiResponse`.

## Frontend design (`tasmil-finance`, `src/features/traction/`)

### Generated client

- Run `pnpm generate:backend` (backend must be on :6756) to regenerate
  `src/gen-backend/*` — this produces the `usePublicControllerGetQuestVolume`
  hook + `QuestVolumeResponseDto`/`QuestVolumeItemDto` types. **Never hand-edit
  `src/gen-backend/`.**

### Hook

- `src/features/traction/hooks/use-quest-volume.ts` — wraps the generated hook.
  Use TanStack Query `useInfiniteQuery` semantics if the generated infinite hook
  exists; otherwise a simple `useQuery` for page 1 plus a manual "Load more"
  that appends. Unwrap the `{ success, data }` envelope like `use-traction.ts`
  does with `select`.

### Component

- `src/features/traction/components/quest-volume-list.tsx` —
  `QuestVolumeList`.
  - Uses `@/shared/ui/table` (`Table`, `TableHeader`, `TableBody`, `TableRow`,
    `TableHead`, `TableCell`), `@/shared/ui/badge` for the protocol, and
    `@/shared/ui/skeleton` for loading.
  - Columns: **Protocol** (badge), **Operation**, **Amount** (USD), **Wallet**
    (masked, monospace), **Date**.
  - States: loading (skeleton rows), empty ("No quest volume yet"), error
    (inline, non-fatal — the rest of the page still renders), and a "Load more"
    button gated on `nextCursor`.
  - Wrap in a titled section (`Card`/header) consistent with the charts.
- Mount `<QuestVolumeList />` in `TractionDashboard` below `UserGrowthChart`.

### Formatting

- Add to `src/features/traction/lib/format.ts`:
  - `fmtUsd(n)` — exact-ish USD for per-row amounts (e.g. `$1,234`), distinct
    from the compact KPI formatter.
  - `fmtDate(iso)` — short UTC date/time for the row.
- Wallet is already masked server-side, so the component just renders it.

## Testing

- **Backend:** `traction.service.spec.ts` (extend) or a focused spec —
  cover: limit clamping, keyset cursor round-trip, `nextCursor` emitted only
  when a `limit+1`th row exists, wallet masking (full pubkey never present in
  output), and `tx_hash` omitted. Mock Prisma like the existing spec.
- **Frontend:** `quest-volume-list.test.tsx` — renders rows from mock data,
  shows skeleton while loading, shows empty state, and shows "Load more" only
  when `nextCursor` is set. Mirror `traction-dashboard.test.tsx` patterns.

## Rollout / verification

- Backend: `pnpm build`, `pnpm test`, hit `GET /public/quest-volume` locally.
- Frontend: `pnpm generate:backend`, `pnpm type-check`, `pnpm test`,
  visually verify `/traction`.
- Two feature branches (`feat/quest-volume-traction-list` in each repo); PRs
  into `deploy/prod` per the repo workflow. Never push directly to
  `deploy/prod`.

## Open risks

- `reward_volume_events` may be sparse/empty on mainnet — the empty state must
  read cleanly, not like a broken page.
- Confirm `users.stellar_pubkey` is always present for rows with volume; if
  nullable, fall back to masking `managed_account_id` or show `—`.
