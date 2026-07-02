# Admin Foundation Analytics — Design

**Date:** 2026-07-01
**Status:** Approved for planning

## Purpose

The admin panel needs a deep-dive analytics page — volume, per-wallet breakdown, and transaction detail — so the team can pull numbers to report to the Stellar Development Foundation (or a similar grant body). This is a reporting/evidence tool, not a user-facing feature.

The existing `admin/dashboard` already shows registration trends and quest stats. The existing `admin/analytics` route is a stub that redirects to the dashboard — this design turns it into the real deep-dive page.

## Non-goals

- Not a per-wallet drill-down page (no dedicated "wallet detail" route). The wallet table is a flat, sortable/filterable summary — clicking a row does not navigate anywhere.
- Not a unified table merging quest wallets and trade-volume wallets. Quest wallets already have their own leaderboard elsewhere in admin; this page's wallet table is trade-volume/keeper-wallet only, and stays a separate table.
- Not a new database table or cron job. Data volume is small (hundreds of wallets, low thousands of transactions) — direct Postgres queries are fast enough. No aggregate/cache table.
- No historical TVL snapshot infrastructure. See "TVL over time" below for how this is approximated instead.

## Architecture

**Frontend** — new feature module `tasmil-finance/src/features/admin-analytics/` (own UI, hooks, state — per repo convention, features don't import from each other). Renders at `admin/analytics/page.tsx`, replacing the current redirect-to-dashboard stub.

The page has one shared `DateRangePicker` at the top (presets: 7d / 30d / 90d / custom; granularity: day / week / month), which drives all four blocks below via React Query (query key includes `from`/`to`/`granularity`, so switching range refetches independently per block):

1. **Volume & TVL chart** — recharts area/line chart over time.
2. **Wallets table** — trade-volume keeper-wallets, sortable/filterable/searchable, server-side paginated.
3. **Transactions stats summary** — total tx count, breakdown by type, success rate (cards, not a chart).
4. **Transactions log table** — individual `Activity` rows, filterable by type, server-side paginated.

Each block has its own **Export CSV** button, which re-calls that block's endpoint with `?format=csv`.

**Backend** — extend the existing `admin` module (`admin.controller.ts` / `admin.service.ts`) rather than create a new module. This repo's admin module already owns dashboard/quest-stats/registration-stats raw-SQL aggregation; the new endpoints follow the same pattern (raw SQL joining `ManagedAccount` + `Activity` + `RewardVolumeEvent`). At this data volume, a separate "reports" module would be premature separation for no real benefit yet.

New endpoints:
- `GET /admin/analytics/volume-tvl?from&to&granularity[&format=csv]`
- `GET /admin/analytics/wallets?from&to&sort&order&search&page&pageSize[&format=csv]`
- `GET /admin/analytics/transactions?from&to&type&status&page&pageSize[&format=csv]`
- `GET /admin/analytics/transactions/stats?from&to`

`format=csv` reuses the same query/service method as the JSON variant — the controller only changes serialization (`text/csv` + `Content-Disposition: attachment`) — so filter/sort/date-range logic is never duplicated between the JSON and CSV paths.

After adding these to the backend's Swagger spec, run `pnpm generate:backend` in `tasmil-finance` to regenerate the typed client in `src/gen-backend/` — never hand-edit that directory.

## TVL over time (open design decision, confirmed with user)

The schema stores current-state TVL (`Position.balanceUsd`) but no historical daily snapshot. Rather than add new snapshot infrastructure, the "TVL over time" series in the chart is a **running cumulative sum of net deposits (deposit − withdraw) from `Activity`**, bucketed by the selected granularity. This is an approximation (it doesn't reflect harvested yield being re-invested), but is accepted as good enough to show growth trend for a grant report. The "current TVL" figure shown elsewhere on the page (e.g. wallet table's TVL column) is NOT derived this way — it still reads live from `Position`/`ManagedAccount`.

## Data columns

### Wallets table (trade-volume keeper-wallets)

One row per `ManagedAccount.keeperWalletAddress`:

| Column | Source |
|---|---|
| Keeper-wallet address | `ManagedAccount.keeperWalletAddress` |
| Current TVL (USD) | `Position.balanceUsd` summed per account |
| Total volume (USD) | sum of `Activity.amountUsd` within selected date range |
| Tx count | count of `Activity` rows within selected date range |
| Joined date | `ManagedAccount.createdAt` |
| Last activity | max of `ManagedAccount.lastRebalanceAt` / `lastHarvestAt` |

Sortable by: TVL, volume, tx count, joined date (default: volume descending). Searchable by address (partial match).

### Transactions log table

One row per `Activity` record:

| Column | Source |
|---|---|
| Timestamp | `Activity.createdAt` |
| Type | `Activity.type` (DEPOSIT / WITHDRAW / REBALANCE / HARVEST) |
| Wallet | `ManagedAccount.keeperWalletAddress` (joined via `accountId`) |
| Amount (USD) | `Activity.amountUsd` |
| Tx hash | `Activity.txHash` (linked to Stellar Expert) |

Filterable by type (multi-select). Filterable by status only if `Activity` has a status field — to be confirmed against the actual schema during implementation planning; if absent, the status filter and the success-rate stat are dropped, not stubbed.

### Transactions stats summary

Not a table — a small set of summary cards: total tx count in range, count broken down by type, success rate (only if a status field exists on `Activity`).

## Error handling

- **Invalid date range** (`from > to`, range in the future): backend validates and returns 400 with a clear message; frontend disables the Apply button until the range is valid.
- **No data in selected range**: each block shows its own empty state ("No transactions in this period") rather than an ambiguous blank chart/table.
- **Slow/timeout queries**: not expected to be a real risk at this data volume; standard spinner (already used elsewhere in admin) is sufficient — no special skeleton/streaming needed.
- **CSV export failure**: returns a normal JSON error (not a broken/empty CSV file); frontend shows an error toast.
- **Pagination past the last page**: backend clamps to the last valid page rather than returning an empty array.

## Testing

- **Backend**: unit tests per new `admin.service.ts` aggregation method — correct volume/TVL cumulative sum over a date range, correct tx-type breakdown, correct wallet table sort/filter/search, correct pagination clamping.
- **Frontend**: component tests for `DateRangePicker` (presets + custom range) and for chart/table data formatting.
- **E2E**: one Playwright smoke test loading `/admin/analytics` and asserting all four blocks render, following the existing admin E2E pattern if one exists.
- No load/perf testing — data volume is small and this was explicitly confirmed with the user.
