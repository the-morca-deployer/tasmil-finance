# Admin Foundation Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deep-dive admin analytics page (volume, wallet, and transaction breakdowns) so the team can pull numbers for Stellar Development Foundation / grant reporting.

**Architecture:** Four new read-only `GET /admin/analytics/*` endpoints extend the existing `backend` NestJS `admin` module (raw-SQL/Prisma aggregation, same pattern as the existing dashboard/quest-stats endpoints). The `tasmil-finance` frontend proxies these through new `/api/admin/analytics/*` Next.js route handlers (matching the existing proxy pattern), and a new `admin-analytics` feature module renders the page at `admin/analytics` (replacing today's redirect-to-dashboard stub) using React Query hooks, recharts, and the existing `shared/ui` components.

**Tech Stack:** NestJS + Prisma (backend, port 6756), Next.js 16 App Router + React Query + recharts + Tailwind (frontend), Jest (both repos), `@testing-library/react`.

## Global Constraints

- Repos: `backend/` (NestJS API) and `tasmil-finance/` (Next.js frontend). This plan touches both.
- Data volume is small (hundreds of wallets, low thousands of transactions) — direct Postgres queries via Prisma, no new aggregate/cache tables, no cron jobs.
- No historical TVL snapshot table exists. "TVL over time" is approximated as a cumulative running sum of net deposits (`DEPOSIT amountUsd` minus `WITHDRAW amountUsd`) from `Activity`, seeded by the net total of all activity before the selected range's start. "Current TVL" (e.g. in the wallet table) is NOT computed this way — it reads live from `Position.balanceUsd`.
- The wallets table shows **trade-volume keeper-wallets only** (`ManagedAccount.keeperWalletAddress`) — it is a separate table from the existing quest-wallet leaderboard (`GET /admin/quest-wallets`), never merged with it.
- No per-wallet drill-down page/route. The wallets table and transactions log table are flat, sortable/filterable/paginated tables — no row click-through.
- CSV export exists for exactly 3 blocks: the volume/TVL chart data, the wallets table, and the transactions log table. The transactions **stats** summary (cards) has no CSV export — it isn't tabular.
- Transactions log/stats default to the four core lifecycle types `DEPOSIT`, `WITHDRAW`, `REBALANCE`, `HARVEST` (out of `Activity`'s full 14-value `ActivityType` enum) unless the caller explicitly requests other types — internal control-plane events (`HALT`, `PRESET_CHANGE`, etc.) are noise for a foundation report.
- `Activity` has no status/success field in the schema — there is no "success rate" stat. Do not stub one.
- Existing `admin.controller.ts` endpoints do NOT use `@ApiResponse` decorators, and this repo's `nest-cli.json` has no `@nestjs/swagger` CLI plugin configured — so Kubb-generated frontend types for those endpoints resolve to an empty `{}` (verified: `tasmil-finance/src/gen-backend/types/admin-controller-get-dashboard.ts` contains `export type AdminControllerGetDashboardQueryResponse = {};`). Since this plan's frontend types deliberately depend on the generated client (per the requested backend→codegen→frontend sequencing), the new endpoints in this plan MUST add explicit `@ApiResponse({ status: 200, type: ... })` decorators — this is a deliberate deviation from the existing controller's convention, done because it's required for the generated types to be non-empty.

---

### Task 1: CSV export utility (backend)

**Files:**
- Create: `backend/src/modules/admin/csv.util.ts`
- Test: `backend/src/modules/admin/csv.util.spec.ts`

**Interfaces:**
- Produces: `CsvColumn<T>` (`{ key: keyof T; header: string }`), `toCsv<T extends Record<string, unknown>>(rows: T[], columns: CsvColumn<T>[]): string` — consumed by Tasks 3, 5, 8 (controller CSV branches).

- [ ] **Step 1: Write the failing test**

```typescript
// backend/src/modules/admin/csv.util.spec.ts
import { toCsv } from './csv.util';

describe('toCsv', () => {
  it('should render a header row and one row per input, in column order', () => {
    const rows = [
      { id: 'a1', amount: 10 },
      { id: 'a2', amount: 20 },
    ];
    const csv = toCsv(rows, [
      { key: 'id', header: 'id' },
      { key: 'amount', header: 'amount' },
    ]);
    expect(csv).toBe('id,amount\na1,10\na2,20');
  });

  it('should render null/undefined values as an empty cell', () => {
    const rows = [{ id: 'a1', note: null, other: undefined }];
    const csv = toCsv(rows, [
      { key: 'id', header: 'id' },
      { key: 'note', header: 'note' },
      { key: 'other', header: 'other' },
    ]);
    expect(csv).toBe('id,note,other\na1,,');
  });

  it('should quote and escape values containing commas, quotes, or newlines', () => {
    const rows = [{ id: 'a1', label: 'has, comma' }, { id: 'a2', label: 'has "quote"' }];
    const csv = toCsv(rows, [
      { key: 'id', header: 'id' },
      { key: 'label', header: 'label' },
    ]);
    expect(csv).toBe('id,label\na1,"has, comma"\na2,"has ""quote"""');
  });

  it('should serialize Date values as ISO strings', () => {
    const rows = [{ id: 'a1', createdAt: new Date('2026-06-01T12:00:00.000Z') }];
    const csv = toCsv(rows, [
      { key: 'id', header: 'id' },
      { key: 'createdAt', header: 'created_at' },
    ]);
    expect(csv).toBe('id,created_at\na1,2026-06-01T12:00:00.000Z');
  });

  it('should return just the header row for an empty input', () => {
    const csv = toCsv([], [{ key: 'id', header: 'id' }]);
    expect(csv).toBe('id');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest src/modules/admin/csv.util.spec.ts`
Expected: FAIL with "Cannot find module './csv.util'"

- [ ] **Step 3: Write minimal implementation**

```typescript
// backend/src/modules/admin/csv.util.ts
export interface CsvColumn<T> {
  key: keyof T;
  header: string;
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = value instanceof Date ? value.toISOString() : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: CsvColumn<T>[],
): string {
  const header = columns.map((c) => c.header).join(',');
  const lines = rows.map((row) => columns.map((c) => csvCell(row[c.key])).join(','));
  return [header, ...lines].join('\n');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx jest src/modules/admin/csv.util.spec.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
cd backend
git add src/modules/admin/csv.util.ts src/modules/admin/csv.util.spec.ts
git commit -m "feat(admin): add CSV export utility"
```

---

### Task 2: `getVolumeTvlSeries` service method (backend)

**Files:**
- Modify: `backend/src/modules/admin/admin.dto.ts` (add DTOs, append after `RegistrationDataPointDto` at line 125)
- Modify: `backend/src/modules/admin/admin.service.ts` (add import, private helper, and method after `getRegistrationStats`, which currently ends at line 426)
- Modify: `backend/src/modules/admin/admin.service.spec.ts` (add `describe('getVolumeTvlSeries', ...)`)

**Interfaces:**
- Consumes: `PrismaService.$queryRaw` (existing, injected as `this.prisma` in `AdminService`'s constructor at line 24).
- Produces: `VolumeTvlPointDto` (`{ date: string; volumeUsd: number; cumulativeTvlUsd: number }`), `AdminService.getVolumeTvlSeries(from: string | undefined, to: string | undefined, granularity: 'day' | 'week' | 'month'): Promise<VolumeTvlPointDto[]>`, and a private `AdminService.parseDateRange(from?: string, to?: string): { since: Date; until: Date }` (throws `BadRequestException` on invalid/reversed range) — the `parseDateRange` helper is reused by Tasks 4, 6, 7.

- [ ] **Step 1: Write the failing test**

Add to `backend/src/modules/admin/admin.service.spec.ts`, after the `getRegistrationStats` describe block (ends at line 298):

```typescript
  describe('getVolumeTvlSeries', () => {
    it('should compute cumulative TVL from net deposits, seeded by activity before the range', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([
          { bucket: new Date('2026-06-01T00:00:00Z'), volume_usd: '100', net_usd: '80' },
          { bucket: new Date('2026-06-02T00:00:00Z'), volume_usd: '50', net_usd: '-20' },
        ])
        .mockResolvedValueOnce([{ net_usd: '1000' }]);

      const result = await service.getVolumeTvlSeries('2026-06-01', '2026-06-02', 'day');

      expect(result).toEqual([
        { date: '2026-06-01', volumeUsd: 100, cumulativeTvlUsd: 1080 },
        { date: '2026-06-02', volumeUsd: 50, cumulativeTvlUsd: 1060 },
      ]);
    });

    it('should default the cumulative seed to 0 when there is no prior activity', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([
          { bucket: new Date('2026-06-01T00:00:00Z'), volume_usd: '10', net_usd: '10' },
        ])
        .mockResolvedValueOnce([{ net_usd: null }]);

      const result = await service.getVolumeTvlSeries(undefined, undefined, 'day');

      expect(result[0].cumulativeTvlUsd).toBe(10);
    });

    it('should throw BadRequestException when from is after to', async () => {
      await expect(
        service.getVolumeTvlSeries('2026-06-10', '2026-06-01', 'day'),
      ).rejects.toThrow(BadRequestException);
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest src/modules/admin/admin.service.spec.ts -t getVolumeTvlSeries`
Expected: FAIL with "service.getVolumeTvlSeries is not a function"

- [ ] **Step 3: Write minimal implementation**

In `backend/src/modules/admin/admin.dto.ts`, append after `RegistrationDataPointDto` (after line 125):

```typescript
export class VolumeTvlPointDto {
  @ApiProperty() date: string;
  @ApiProperty() volumeUsd: number;
  @ApiProperty() cumulativeTvlUsd: number;
}
```

In `backend/src/modules/admin/admin.service.ts`, add `VolumeTvlPointDto` to the existing import from `./admin.dto` (line 6-19), then add this private helper right after the constructor (after line 28) and the new method right after `getRegistrationStats` (after line 426):

```typescript
  private parseDateRange(from?: string, to?: string): { since: Date; until: Date } {
    const until = to ? new Date(to) : new Date();
    const since = from ? new Date(from) : new Date(until.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (Number.isNaN(since.getTime()) || Number.isNaN(until.getTime())) {
      throw new BadRequestException('Invalid `from`/`to` date');
    }
    if (since > until) {
      throw new BadRequestException('`from` must be before `to`');
    }
    return { since, until };
  }

  async getVolumeTvlSeries(
    from: string | undefined,
    to: string | undefined,
    granularity: 'day' | 'week' | 'month',
  ): Promise<VolumeTvlPointDto[]> {
    const { since, until } = this.parseDateRange(from, to);

    const buckets = await this.prisma.$queryRaw<
      Array<{ bucket: Date; volume_usd: string | null; net_usd: string | null }>
    >`
      SELECT
        DATE_TRUNC(${granularity}, created_at AT TIME ZONE 'UTC') AS bucket,
        SUM(CASE WHEN type IN ('DEPOSIT', 'WITHDRAW') THEN amount_usd ELSE 0 END) AS volume_usd,
        SUM(CASE WHEN type = 'DEPOSIT' THEN amount_usd
                 WHEN type = 'WITHDRAW' THEN -amount_usd
                 ELSE 0 END) AS net_usd
      FROM activities
      WHERE created_at >= ${since} AND created_at <= ${until}
      GROUP BY bucket
      ORDER BY bucket ASC
    `;

    const priorNetRows = await this.prisma.$queryRaw<Array<{ net_usd: string | null }>>`
      SELECT SUM(
        CASE WHEN type = 'DEPOSIT' THEN amount_usd
             WHEN type = 'WITHDRAW' THEN -amount_usd
             ELSE 0 END
      ) AS net_usd
      FROM activities
      WHERE created_at < ${since}
    `;

    let cumulativeTvlUsd = Number(priorNetRows[0]?.net_usd ?? 0);
    return buckets.map((row) => {
      cumulativeTvlUsd += Number(row.net_usd ?? 0);
      return {
        date: row.bucket.toISOString().slice(0, 10),
        volumeUsd: Number(row.volume_usd ?? 0),
        cumulativeTvlUsd,
      };
    });
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx jest src/modules/admin/admin.service.spec.ts -t getVolumeTvlSeries`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
cd backend
git add src/modules/admin/admin.dto.ts src/modules/admin/admin.service.ts src/modules/admin/admin.service.spec.ts
git commit -m "feat(admin): add getVolumeTvlSeries analytics aggregation"
```

---

### Task 3: `GET /admin/analytics/volume-tvl` endpoint (backend)

**Files:**
- Modify: `backend/src/modules/admin/admin.controller.ts` (add imports, add endpoint after `getRegistrationStats`, currently ending at line 74)

**Interfaces:**
- Consumes: `AdminService.getVolumeTvlSeries` (Task 2), `toCsv` (Task 1).
- Produces: `GET /admin/analytics/volume-tvl?from&to&granularity&format` — JSON array of `VolumeTvlPointDto`, or `text/csv` when `format=csv`. Consumed by Task 9 (codegen) and Task 10 (frontend proxy).

- [ ] **Step 1: Update controller imports**

In `backend/src/modules/admin/admin.controller.ts`, replace the `@nestjs/common` import (lines 1-15) with:

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
```

Replace the `@nestjs/swagger` import (line 16) with:

```typescript
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
```

Add after the `AdminAuthGuard` import (line 37):

```typescript
import type { Response } from 'express';
import { toCsv } from './csv.util';
```

Add `VolumeTvlPointDto` to the `from './admin.dto'` import list (lines 18-36).

- [ ] **Step 2: Add the endpoint**

In `backend/src/modules/admin/admin.controller.ts`, add after `getRegistrationStats` (after line 74):

```typescript
  @Get('analytics/volume-tvl')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Volume and cumulative TVL time series for the analytics page' })
  @ApiQuery({ name: 'from', required: false, type: String, description: 'ISO date, default: 30 days ago' })
  @ApiQuery({ name: 'to', required: false, type: String, description: 'ISO date, default: now' })
  @ApiQuery({ name: 'granularity', required: false, enum: ['day', 'week', 'month'] })
  @ApiQuery({ name: 'format', required: false, enum: ['json', 'csv'] })
  @ApiResponse({ status: 200, type: VolumeTvlPointDto, isArray: true })
  async getVolumeTvl(
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Query('granularity') granularity = 'day',
    @Query('format') format = 'json',
    @Res({ passthrough: true }) res: Response,
  ): Promise<VolumeTvlPointDto[] | string> {
    if (!['day', 'week', 'month'].includes(granularity)) {
      throw new BadRequestException('granularity must be day, week, or month');
    }
    const points = await this.adminService.getVolumeTvlSeries(
      from,
      to,
      granularity as 'day' | 'week' | 'month',
    );
    if (format === 'csv') {
      res.set({
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="volume-tvl.csv"',
      });
      return toCsv(points, [
        { key: 'date', header: 'date' },
        { key: 'volumeUsd', header: 'volume_usd' },
        { key: 'cumulativeTvlUsd', header: 'cumulative_tvl_usd' },
      ]);
    }
    return points;
  }
```

- [ ] **Step 3: Verify manually**

Run: `cd backend && pnpm dev` (in one terminal), then in another:
```bash
curl -s "http://localhost:6756/api/admin/analytics/volume-tvl?granularity=day" -H "Authorization: Bearer $ADMIN_JWT" | head -c 500
curl -s "http://localhost:6756/api/admin/analytics/volume-tvl?format=csv" -H "Authorization: Bearer $ADMIN_JWT"
```
Expected: first call returns a JSON array (`[]` if no activity yet is fine); second returns CSV text starting with `date,volume_usd,cumulative_tvl_usd`. (Get `$ADMIN_JWT` from the existing admin login flow — see how other admin endpoints are tested in this repo if unsure.)

- [ ] **Step 4: Commit**

```bash
cd backend
git add src/modules/admin/admin.controller.ts
git commit -m "feat(admin): add GET /admin/analytics/volume-tvl endpoint"
```

---

### Task 4: `getWalletsAnalytics` service method (backend)

**Files:**
- Modify: `backend/src/modules/admin/admin.dto.ts` (add DTOs after `VolumeTvlPointDto`)
- Modify: `backend/src/modules/admin/admin.service.ts` (add method after `getVolumeTvlSeries`)
- Modify: `backend/src/modules/admin/admin.service.spec.ts` (add `mockPrisma.managedAccount`, add describe block)

**Interfaces:**
- Consumes: `PrismaService.managedAccount.findMany` (Prisma model, not yet mocked in the spec file — must be added).
- Produces: `WalletRowDto` (`{ keeperWalletAddress: string; currentTvlUsd: number; volumeUsd: number; txCount: number; joinedAt: Date; lastActivityAt: Date | null }`), `WalletsListResponseDto` (`{ rows: WalletRowDto[]; total: number }`), `AdminService.getWalletsAnalytics(params: { from?: string; to?: string; sort: 'tvl' | 'volume' | 'txCount' | 'joinedAt'; order: 'asc' | 'desc'; search?: string; page: number; pageSize: number }): Promise<WalletsListResponseDto>` — consumed by Task 5.

- [ ] **Step 1: Add `managedAccount` to the shared Prisma mock**

In `backend/src/modules/admin/admin.service.spec.ts`, add to the `mockPrisma` object (after the `emailCampaignRun` block, before `$queryRaw` at line 44):

```typescript
    managedAccount: {
      findMany: jest.fn(),
    },
```

- [ ] **Step 2: Write the failing test**

Add to `backend/src/modules/admin/admin.service.spec.ts`, after the `getVolumeTvlSeries` describe block (added in Task 2):

```typescript
  describe('getWalletsAnalytics', () => {
    it('should aggregate TVL/volume/txCount per wallet and default-sort by volume desc', async () => {
      mockPrisma.managedAccount.findMany.mockResolvedValue([
        {
          keeperWalletAddress: 'WALLET_A',
          createdAt: new Date('2026-01-01'),
          lastRebalanceAt: new Date('2026-06-01'),
          lastHarvestAt: null,
          positions: [{ balanceUsd: '100' }, { balanceUsd: '50' }],
          activities: [{ amountUsd: '10' }, { amountUsd: '20' }],
        },
        {
          keeperWalletAddress: 'WALLET_B',
          createdAt: new Date('2026-02-01'),
          lastRebalanceAt: null,
          lastHarvestAt: new Date('2026-05-01'),
          positions: [{ balanceUsd: '500' }],
          activities: [{ amountUsd: '1000' }],
        },
      ] as any);

      const result = await service.getWalletsAnalytics({
        from: undefined,
        to: undefined,
        sort: 'volume',
        order: 'desc',
        search: undefined,
        page: 1,
        pageSize: 20,
      });

      expect(result.total).toBe(2);
      expect(result.rows[0].keeperWalletAddress).toBe('WALLET_B');
      expect(result.rows[0].volumeUsd).toBe(1000);
      expect(result.rows[1].currentTvlUsd).toBe(150);
      expect(result.rows[1].txCount).toBe(2);
      expect(result.rows[1].lastActivityAt).toEqual(new Date('2026-06-01'));
    });

    it('should paginate sorted results', async () => {
      mockPrisma.managedAccount.findMany.mockResolvedValue(
        Array.from({ length: 5 }, (_, i) => ({
          keeperWalletAddress: `WALLET_${i}`,
          createdAt: new Date(`2026-01-0${i + 1}`),
          lastRebalanceAt: null,
          lastHarvestAt: null,
          positions: [],
          activities: [],
        })) as any,
      );

      const result = await service.getWalletsAnalytics({
        from: undefined,
        to: undefined,
        sort: 'joinedAt',
        order: 'asc',
        search: undefined,
        page: 2,
        pageSize: 2,
      });

      expect(result.total).toBe(5);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].keeperWalletAddress).toBe('WALLET_2');
    });

    it('should filter by search term against the keeper wallet address', async () => {
      mockPrisma.managedAccount.findMany.mockResolvedValue([]);

      await service.getWalletsAnalytics({
        from: undefined,
        to: undefined,
        sort: 'volume',
        order: 'desc',
        search: 'GABC',
        page: 1,
        pageSize: 20,
      });

      expect(mockPrisma.managedAccount.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { keeperWalletAddress: { contains: 'GABC', mode: 'insensitive' } },
        }),
      );
    });
  });
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd backend && npx jest src/modules/admin/admin.service.spec.ts -t getWalletsAnalytics`
Expected: FAIL with "service.getWalletsAnalytics is not a function"

- [ ] **Step 4: Write minimal implementation**

In `backend/src/modules/admin/admin.dto.ts`, append after `VolumeTvlPointDto`:

```typescript
export class WalletRowDto {
  @ApiProperty() keeperWalletAddress: string;
  @ApiProperty() currentTvlUsd: number;
  @ApiProperty() volumeUsd: number;
  @ApiProperty() txCount: number;
  @ApiProperty() joinedAt: Date;
  @ApiProperty({ nullable: true }) lastActivityAt: Date | null;
}

export class WalletsListResponseDto {
  @ApiProperty({ type: [WalletRowDto] }) rows: WalletRowDto[];
  @ApiProperty() total: number;
}
```

In `backend/src/modules/admin/admin.service.ts`, add `WalletRowDto, WalletsListResponseDto` to the `./admin.dto` import, then add after `getVolumeTvlSeries`:

```typescript
  async getWalletsAnalytics(params: {
    from?: string;
    to?: string;
    sort: 'tvl' | 'volume' | 'txCount' | 'joinedAt';
    order: 'asc' | 'desc';
    search?: string;
    page: number;
    pageSize: number;
  }): Promise<WalletsListResponseDto> {
    const { since, until } = this.parseDateRange(params.from, params.to);

    const accounts = await this.prisma.managedAccount.findMany({
      where: params.search
        ? { keeperWalletAddress: { contains: params.search, mode: 'insensitive' } }
        : undefined,
      select: {
        keeperWalletAddress: true,
        createdAt: true,
        lastRebalanceAt: true,
        lastHarvestAt: true,
        positions: { select: { balanceUsd: true } },
        activities: {
          where: { createdAt: { gte: since, lte: until } },
          select: { amountUsd: true },
        },
      },
    });

    const rows: WalletRowDto[] = accounts.map((account) => {
      const currentTvlUsd = account.positions.reduce((sum, p) => sum + Number(p.balanceUsd), 0);
      const volumeUsd = account.activities.reduce((sum, a) => sum + Number(a.amountUsd ?? 0), 0);
      const lastActivityAt =
        account.lastRebalanceAt && account.lastHarvestAt
          ? account.lastRebalanceAt > account.lastHarvestAt
            ? account.lastRebalanceAt
            : account.lastHarvestAt
          : (account.lastRebalanceAt ?? account.lastHarvestAt ?? null);

      return {
        keeperWalletAddress: account.keeperWalletAddress,
        currentTvlUsd,
        volumeUsd,
        txCount: account.activities.length,
        joinedAt: account.createdAt,
        lastActivityAt,
      };
    });

    const sortValue: Record<
      'tvl' | 'volume' | 'txCount' | 'joinedAt',
      (row: WalletRowDto) => number
    > = {
      tvl: (row) => row.currentTvlUsd,
      volume: (row) => row.volumeUsd,
      txCount: (row) => row.txCount,
      joinedAt: (row) => row.joinedAt.getTime(),
    };
    const getValue = sortValue[params.sort];
    rows.sort((a, b) =>
      params.order === 'asc' ? getValue(a) - getValue(b) : getValue(b) - getValue(a),
    );

    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / params.pageSize));
    const page = Math.min(params.page, lastPage);
    const start = (page - 1) * params.pageSize;
    return { rows: rows.slice(start, start + params.pageSize), total };
  }
```

- [ ] **Step 5: Add a pagination-clamp test**

Add to the same `describe('getWalletsAnalytics', ...)` block, after the "should paginate sorted results" test:

```typescript
    it('should clamp a page past the last page to the last page instead of returning empty', async () => {
      mockPrisma.managedAccount.findMany.mockResolvedValue(
        Array.from({ length: 5 }, (_, i) => ({
          keeperWalletAddress: `WALLET_${i}`,
          createdAt: new Date(`2026-01-0${i + 1}`),
          lastRebalanceAt: null,
          lastHarvestAt: null,
          positions: [],
          activities: [],
        })) as any,
      );

      const result = await service.getWalletsAnalytics({
        from: undefined,
        to: undefined,
        sort: 'joinedAt',
        order: 'asc',
        search: undefined,
        page: 99,
        pageSize: 2,
      });

      expect(result.total).toBe(5);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].keeperWalletAddress).toBe('WALLET_4');
    });
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd backend && npx jest src/modules/admin/admin.service.spec.ts -t getWalletsAnalytics`
Expected: PASS (4 tests)

- [ ] **Step 7: Commit**

```bash
cd backend
git add src/modules/admin/admin.dto.ts src/modules/admin/admin.service.ts src/modules/admin/admin.service.spec.ts
git commit -m "feat(admin): add getWalletsAnalytics keeper-wallet aggregation"
```

---

### Task 5: `GET /admin/analytics/wallets` endpoint (backend)

**Files:**
- Modify: `backend/src/modules/admin/admin.controller.ts` (add endpoint after the volume-tvl endpoint from Task 3)

**Interfaces:**
- Consumes: `AdminService.getWalletsAnalytics` (Task 4), `toCsv` (Task 1).
- Produces: `GET /admin/analytics/wallets?from&to&sort&order&search&page&pageSize&format` — JSON `WalletsListResponseDto`, or `text/csv`. Consumed by Task 9, Task 10.

- [ ] **Step 1: Add `WalletRowDto, WalletsListResponseDto` to the controller's DTO import** (from `./admin.dto`, same import list touched in Task 3).

- [ ] **Step 2: Add the endpoint**

In `backend/src/modules/admin/admin.controller.ts`, add after the `getVolumeTvl` method (Task 3):

```typescript
  @Get('analytics/wallets')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Trade-volume keeper-wallet table for the analytics page' })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'sort', required: false, enum: ['tvl', 'volume', 'txCount', 'joinedAt'] })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'format', required: false, enum: ['json', 'csv'] })
  @ApiResponse({ status: 200, type: WalletsListResponseDto })
  async getWallets(
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Query('sort') sort = 'volume',
    @Query('order') order = 'desc',
    @Query('search') search: string | undefined,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('format') format = 'json',
    @Res({ passthrough: true }) res: Response,
  ): Promise<WalletsListResponseDto | string> {
    const sortKeys = ['tvl', 'volume', 'txCount', 'joinedAt'] as const;
    if (!sortKeys.includes(sort as (typeof sortKeys)[number])) {
      throw new BadRequestException(`sort must be one of ${sortKeys.join(', ')}`);
    }
    if (order !== 'asc' && order !== 'desc') {
      throw new BadRequestException('order must be asc or desc');
    }
    const result = await this.adminService.getWalletsAnalytics({
      from,
      to,
      sort: sort as (typeof sortKeys)[number],
      order,
      search,
      page: Math.max(parseInt(page, 10) || 1, 1),
      pageSize: Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100),
    });
    if (format === 'csv') {
      res.set({
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="wallets.csv"',
      });
      return toCsv(result.rows, [
        { key: 'keeperWalletAddress', header: 'keeper_wallet_address' },
        { key: 'currentTvlUsd', header: 'current_tvl_usd' },
        { key: 'volumeUsd', header: 'volume_usd' },
        { key: 'txCount', header: 'tx_count' },
        { key: 'joinedAt', header: 'joined_at' },
        { key: 'lastActivityAt', header: 'last_activity_at' },
      ]);
    }
    return result;
  }
```

- [ ] **Step 3: Verify manually**

Run (with `pnpm dev` already up from Task 3):
```bash
curl -s "http://localhost:6756/api/admin/analytics/wallets?sort=volume&order=desc&page=1&pageSize=5" -H "Authorization: Bearer $ADMIN_JWT"
```
Expected: JSON `{ "rows": [...], "total": N }`.

- [ ] **Step 4: Commit**

```bash
cd backend
git add src/modules/admin/admin.controller.ts
git commit -m "feat(admin): add GET /admin/analytics/wallets endpoint"
```

---

### Task 6: `getTransactionsLog` service method (backend)

**Files:**
- Modify: `backend/src/modules/admin/admin.dto.ts` (add DTOs after `WalletsListResponseDto`)
- Modify: `backend/src/modules/admin/admin.service.ts` (add static constant + method after `getWalletsAnalytics`)
- Modify: `backend/src/modules/admin/admin.service.spec.ts` (add `mockPrisma.activity`, add describe block)

**Interfaces:**
- Consumes: `PrismaService.activity.findMany`, `PrismaService.activity.count` (not yet mocked — must be added).
- Produces: `TransactionRowDto` (`{ id: string; createdAt: Date; type: string; keeperWalletAddress: string; amountUsd: number | null; txHash: string | null }`), `TransactionsListResponseDto` (`{ rows: TransactionRowDto[]; total: number }`), `AdminService.CORE_ACTIVITY_TYPES` (static `string[]`, reused by Task 7), `AdminService.getTransactionsLog(params: { from?: string; to?: string; type?: string[]; page: number; pageSize: number }): Promise<TransactionsListResponseDto>` — consumed by Task 8.

- [ ] **Step 1: Add `activity` to the shared Prisma mock**

In `backend/src/modules/admin/admin.service.spec.ts`, add to `mockPrisma` (next to the `managedAccount` block added in Task 4):

```typescript
    activity: {
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
```

(`groupBy` is unused until Task 7 but added now since it's the same model mock.)

- [ ] **Step 2: Write the failing test**

Add to `backend/src/modules/admin/admin.service.spec.ts`, after the `getWalletsAnalytics` describe block:

```typescript
  describe('getTransactionsLog', () => {
    it('should default to the four core activity types and map account to wallet address', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([
        {
          id: 'a1',
          createdAt: new Date('2026-06-01'),
          type: 'DEPOSIT',
          amountUsd: '100',
          txHash: '0xabc',
          account: { keeperWalletAddress: 'WALLET_A' },
        },
      ] as any);
      mockPrisma.activity.count.mockResolvedValue(1);

      const result = await service.getTransactionsLog({
        from: undefined,
        to: undefined,
        type: undefined,
        page: 1,
        pageSize: 20,
      });

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: { in: ['DEPOSIT', 'WITHDRAW', 'REBALANCE', 'HARVEST'] },
          }),
        }),
      );
      expect(result.rows).toEqual([
        {
          id: 'a1',
          createdAt: new Date('2026-06-01'),
          type: 'DEPOSIT',
          keeperWalletAddress: 'WALLET_A',
          amountUsd: 100,
          txHash: '0xabc',
        },
      ]);
      expect(result.total).toBe(1);
    });

    it('should filter by an explicit type list when provided', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      await service.getTransactionsLog({
        from: undefined,
        to: undefined,
        type: ['HARVEST'],
        page: 1,
        pageSize: 20,
      });

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ type: { in: ['HARVEST'] } }) }),
      );
    });

    it('should return null amountUsd when the activity has none', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([
        {
          id: 'a2',
          createdAt: new Date('2026-06-01'),
          type: 'REBALANCE',
          amountUsd: null,
          txHash: null,
          account: { keeperWalletAddress: 'WALLET_B' },
        },
      ] as any);
      mockPrisma.activity.count.mockResolvedValue(1);

      const result = await service.getTransactionsLog({
        from: undefined,
        to: undefined,
        type: undefined,
        page: 1,
        pageSize: 20,
      });

      expect(result.rows[0].amountUsd).toBeNull();
    });

    it('should clamp a page past the last page to the last page instead of returning empty', async () => {
      mockPrisma.activity.count.mockResolvedValue(3);
      mockPrisma.activity.findMany.mockResolvedValue([
        {
          id: 'a3',
          createdAt: new Date('2026-06-03'),
          type: 'DEPOSIT',
          amountUsd: '5',
          txHash: null,
          account: { keeperWalletAddress: 'WALLET_C' },
        },
      ] as any);

      const result = await service.getTransactionsLog({
        from: undefined,
        to: undefined,
        type: undefined,
        page: 99,
        pageSize: 2,
      });

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 2, take: 2 }),
      );
      expect(result.total).toBe(3);
      expect(result.rows).toHaveLength(1);
    });
  });
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd backend && npx jest src/modules/admin/admin.service.spec.ts -t getTransactionsLog`
Expected: FAIL with "service.getTransactionsLog is not a function"

- [ ] **Step 4: Write minimal implementation**

In `backend/src/modules/admin/admin.dto.ts`, append after `WalletsListResponseDto`:

```typescript
export class TransactionRowDto {
  @ApiProperty() id: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() type: string;
  @ApiProperty() keeperWalletAddress: string;
  @ApiProperty({ nullable: true }) amountUsd: number | null;
  @ApiProperty({ nullable: true }) txHash: string | null;
}

export class TransactionsListResponseDto {
  @ApiProperty({ type: [TransactionRowDto] }) rows: TransactionRowDto[];
  @ApiProperty() total: number;
}
```

In `backend/src/modules/admin/admin.service.ts`, add `TransactionRowDto, TransactionsListResponseDto` to the `./admin.dto` import, then add a static constant right after the `constructor` closing brace (after line 28, before `parseDateRange`) and the method after `getWalletsAnalytics`:

```typescript
  private static readonly CORE_ACTIVITY_TYPES = ['DEPOSIT', 'WITHDRAW', 'REBALANCE', 'HARVEST'];
```

```typescript
  async getTransactionsLog(params: {
    from?: string;
    to?: string;
    type?: string[];
    page: number;
    pageSize: number;
  }): Promise<TransactionsListResponseDto> {
    const { since, until } = this.parseDateRange(params.from, params.to);
    const types =
      params.type && params.type.length > 0 ? params.type : AdminService.CORE_ACTIVITY_TYPES;

    const where = {
      createdAt: { gte: since, lte: until },
      type: { in: types as any },
    };

    const total = await this.prisma.activity.count({ where });
    const lastPage = Math.max(1, Math.ceil(total / params.pageSize));
    const page = Math.min(params.page, lastPage);

    const activities = await this.prisma.activity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * params.pageSize,
      take: params.pageSize,
      select: {
        id: true,
        createdAt: true,
        type: true,
        amountUsd: true,
        txHash: true,
        account: { select: { keeperWalletAddress: true } },
      },
    });

    return {
      rows: activities.map((a) => ({
        id: a.id,
        createdAt: a.createdAt,
        type: a.type,
        keeperWalletAddress: a.account.keeperWalletAddress,
        amountUsd: a.amountUsd ? Number(a.amountUsd) : null,
        txHash: a.txHash,
      })),
      total,
    };
  }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && npx jest src/modules/admin/admin.service.spec.ts -t getTransactionsLog`
Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
cd backend
git add src/modules/admin/admin.dto.ts src/modules/admin/admin.service.ts src/modules/admin/admin.service.spec.ts
git commit -m "feat(admin): add getTransactionsLog activity feed"
```

---

### Task 7: `getTransactionsStats` service method (backend)

**Files:**
- Modify: `backend/src/modules/admin/admin.dto.ts` (add DTOs after `TransactionsListResponseDto`)
- Modify: `backend/src/modules/admin/admin.service.ts` (add method after `getTransactionsLog`)
- Modify: `backend/src/modules/admin/admin.service.spec.ts` (add describe block)

**Interfaces:**
- Consumes: `PrismaService.activity.groupBy` (mocked in Task 6), `AdminService.CORE_ACTIVITY_TYPES` (Task 6).
- Produces: `TransactionTypeCountDto` (`{ type: string; count: number }`), `TransactionsStatsDto` (`{ totalCount: number; byType: TransactionTypeCountDto[] }`), `AdminService.getTransactionsStats(from?: string, to?: string): Promise<TransactionsStatsDto>` — consumed by Task 8.

- [ ] **Step 1: Write the failing test**

Add to `backend/src/modules/admin/admin.service.spec.ts`, after the `getTransactionsLog` describe block:

```typescript
  describe('getTransactionsStats', () => {
    it('should return total count and breakdown by type, scoped to the core activity types', async () => {
      mockPrisma.activity.groupBy.mockResolvedValue([
        { type: 'DEPOSIT', _count: { _all: 5 } },
        { type: 'WITHDRAW', _count: { _all: 2 } },
      ] as any);

      const result = await service.getTransactionsStats(undefined, undefined);

      expect(mockPrisma.activity.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ['type'],
          where: expect.objectContaining({
            type: { in: ['DEPOSIT', 'WITHDRAW', 'REBALANCE', 'HARVEST'] },
          }),
        }),
      );
      expect(result.totalCount).toBe(7);
      expect(result.byType).toEqual([
        { type: 'DEPOSIT', count: 5 },
        { type: 'WITHDRAW', count: 2 },
      ]);
    });

    it('should return zero total and empty breakdown when there is no activity', async () => {
      mockPrisma.activity.groupBy.mockResolvedValue([]);

      const result = await service.getTransactionsStats(undefined, undefined);

      expect(result.totalCount).toBe(0);
      expect(result.byType).toEqual([]);
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest src/modules/admin/admin.service.spec.ts -t getTransactionsStats`
Expected: FAIL with "service.getTransactionsStats is not a function"

- [ ] **Step 3: Write minimal implementation**

In `backend/src/modules/admin/admin.dto.ts`, append after `TransactionsListResponseDto`:

```typescript
export class TransactionTypeCountDto {
  @ApiProperty() type: string;
  @ApiProperty() count: number;
}

export class TransactionsStatsDto {
  @ApiProperty() totalCount: number;
  @ApiProperty({ type: [TransactionTypeCountDto] }) byType: TransactionTypeCountDto[];
}
```

In `backend/src/modules/admin/admin.service.ts`, add `TransactionTypeCountDto, TransactionsStatsDto` to the `./admin.dto` import, then add after `getTransactionsLog`:

```typescript
  async getTransactionsStats(from?: string, to?: string): Promise<TransactionsStatsDto> {
    const { since, until } = this.parseDateRange(from, to);

    const grouped = await this.prisma.activity.groupBy({
      by: ['type'],
      where: {
        createdAt: { gte: since, lte: until },
        type: { in: AdminService.CORE_ACTIVITY_TYPES as any },
      },
      _count: { _all: true },
    });

    return {
      totalCount: grouped.reduce((sum, g) => sum + g._count._all, 0),
      byType: grouped.map((g) => ({ type: g.type, count: g._count._all })),
    };
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx jest src/modules/admin/admin.service.spec.ts -t getTransactionsStats`
Expected: PASS (2 tests)

- [ ] **Step 5: Run the full admin service spec file to confirm no regressions**

Run: `cd backend && npx jest src/modules/admin/admin.service.spec.ts`
Expected: PASS (all tests, old and new)

- [ ] **Step 6: Commit**

```bash
cd backend
git add src/modules/admin/admin.dto.ts src/modules/admin/admin.service.ts src/modules/admin/admin.service.spec.ts
git commit -m "feat(admin): add getTransactionsStats breakdown"
```

---

### Task 8: `GET /admin/analytics/transactions` and `GET /admin/analytics/transactions/stats` endpoints (backend)

**Files:**
- Modify: `backend/src/modules/admin/admin.controller.ts` (add two endpoints after the `getWallets` method from Task 5)

**Interfaces:**
- Consumes: `AdminService.getTransactionsLog` (Task 6), `AdminService.getTransactionsStats` (Task 7), `toCsv` (Task 1).
- Produces: `GET /admin/analytics/transactions?from&to&type&page&pageSize&format`, `GET /admin/analytics/transactions/stats?from&to` — consumed by Task 9, Task 10.

- [ ] **Step 1: Add `TransactionRowDto, TransactionsListResponseDto, TransactionsStatsDto` to the controller's DTO import** (same import list touched in Tasks 3/5).

- [ ] **Step 2: Add the endpoints**

In `backend/src/modules/admin/admin.controller.ts`, add after the `getWallets` method (Task 5):

```typescript
  @Get('analytics/transactions')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Transaction log for the analytics page' })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({
    name: 'type',
    required: false,
    type: String,
    description: 'Comma-separated ActivityType values; default: DEPOSIT,WITHDRAW,REBALANCE,HARVEST',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'format', required: false, enum: ['json', 'csv'] })
  @ApiResponse({ status: 200, type: TransactionsListResponseDto })
  async getTransactions(
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Query('type') type: string | undefined,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('format') format = 'json',
    @Res({ passthrough: true }) res: Response,
  ): Promise<TransactionsListResponseDto | string> {
    const result = await this.adminService.getTransactionsLog({
      from,
      to,
      type: type ? type.split(',').map((t) => t.trim().toUpperCase()) : undefined,
      page: Math.max(parseInt(page, 10) || 1, 1),
      pageSize: Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100),
    });
    if (format === 'csv') {
      res.set({
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="transactions.csv"',
      });
      return toCsv(result.rows, [
        { key: 'id', header: 'id' },
        { key: 'createdAt', header: 'created_at' },
        { key: 'type', header: 'type' },
        { key: 'keeperWalletAddress', header: 'keeper_wallet_address' },
        { key: 'amountUsd', header: 'amount_usd' },
        { key: 'txHash', header: 'tx_hash' },
      ]);
    }
    return result;
  }

  @Get('analytics/transactions/stats')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Transaction count and type breakdown for the analytics page' })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiResponse({ status: 200, type: TransactionsStatsDto })
  async getTransactionsStats(
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
  ): Promise<TransactionsStatsDto> {
    return this.adminService.getTransactionsStats(from, to);
  }
```

- [ ] **Step 3: Verify manually**

Run (with `pnpm dev` already up):
```bash
curl -s "http://localhost:6756/api/admin/analytics/transactions?page=1&pageSize=5" -H "Authorization: Bearer $ADMIN_JWT"
curl -s "http://localhost:6756/api/admin/analytics/transactions/stats" -H "Authorization: Bearer $ADMIN_JWT"
curl -s "http://localhost:6756/api/admin/analytics/transactions?format=csv" -H "Authorization: Bearer $ADMIN_JWT"
```
Expected: first two return JSON, third returns CSV text starting with `id,created_at,type,keeper_wallet_address,amount_usd,tx_hash`.

- [ ] **Step 4: Run the full backend test suite for the admin module**

Run: `cd backend && npx jest src/modules/admin`
Expected: PASS (all admin.service.spec.ts + csv.util.spec.ts tests)

- [ ] **Step 5: Commit**

```bash
cd backend
git add src/modules/admin/admin.controller.ts
git commit -m "feat(admin): add GET /admin/analytics/transactions and /transactions/stats endpoints"
```

---

### Task 9: Regenerate the frontend backend client (sequencing checkpoint)

This task has no code to write — it re-runs codegen against the now-live backend endpoints from Tasks 3/5/8, so the frontend tasks that follow have real generated types (not the empty `{}` the existing dashboard endpoints produce, since Tasks 3/5/8 added explicit `@ApiResponse` decorators the older endpoints lack).

**Files:**
- Generates (do not hand-edit): `tasmil-finance/src/gen-backend/types/admin-controller-get-volume-tvl.ts`, `admin-controller-get-wallets.ts`, `admin-controller-get-transactions.ts`, `admin-controller-get-transactions-stats.ts` (and matching files under `src/gen-backend/client/`).

**Interfaces:**
- Consumes: the live backend on `:6756` (Tasks 3, 5, 8 must be committed and the backend dev server running).
- Produces: `AdminControllerGetVolumeTvlQueryResponse` (`VolumeTvlPointDto[]`), `AdminControllerGetWalletsQueryResponse` (`WalletsListResponseDto`), `AdminControllerGetTransactionsQueryResponse` (`TransactionsListResponseDto`), `AdminControllerGetTransactionsStatsQueryResponse` (`TransactionsStatsDto`) — consumed by Task 11.

- [ ] **Step 1: Start the backend dev server**

Run: `cd backend && pnpm dev` (leave running in the background; confirm `http://localhost:6756/api-json` responds with a JSON OpenAPI document before continuing)

- [ ] **Step 2: Regenerate the backend client**

Run: `cd tasmil-finance && pnpm generate:backend`
Expected: command exits 0; new files appear at the four paths listed above.

- [ ] **Step 3: Verify the generated types are non-empty**

Run: `cat tasmil-finance/src/gen-backend/types/admin-controller-get-volume-tvl.ts`
Expected: contains a real shape (`{ date: string; volumeUsd: number; cumulativeTvlUsd: number }[]`), NOT `export type AdminControllerGetVolumeTvlQueryResponse = {};`. If it IS empty, go back and confirm the `@ApiResponse` decorators from Tasks 3/5/8 were applied correctly, then re-run this task.

- [ ] **Step 4: Commit the generated files**

```bash
cd tasmil-finance
git add src/gen-backend
git commit -m "chore: regenerate backend client for analytics endpoints"
```

---

### Task 10: Next.js proxy routes (frontend)

**Files:**
- Create: `tasmil-finance/src/app/api/admin/analytics/volume-tvl/route.ts`
- Create: `tasmil-finance/src/app/api/admin/analytics/wallets/route.ts`
- Create: `tasmil-finance/src/app/api/admin/analytics/transactions/route.ts`
- Create: `tasmil-finance/src/app/api/admin/analytics/transactions/stats/route.ts`

**Interfaces:**
- Consumes: `getServerBackendBaseUrl` from `@/lib/runtime-urls` (existing), the backend endpoints from Tasks 3/5/8.
- Produces: `GET /api/admin/analytics/volume-tvl`, `/wallets`, `/transactions`, `/transactions/stats` — consumed by Task 11's hooks.

These four routes are near-identical (only the backend path differs), matching this repo's existing one-route-per-file convention (e.g. `src/app/api/admin/stats/registrations/route.ts`). Each forwards the query string and bearer token, and passes through `text/csv` responses instead of parsing them as JSON.

- [ ] **Step 1: Create the volume-tvl proxy route**

```typescript
// tasmil-finance/src/app/api/admin/analytics/volume-tvl/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { getServerBackendBaseUrl } from "@/lib/runtime-urls";

const BACKEND_URL = getServerBackendBaseUrl();

function getAdminToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  return null;
}

export async function GET(request: NextRequest) {
  const token = getAdminToken(request);
  if (!token) return NextResponse.json({ message: "No admin token" }, { status: 401 });

  const search = new URL(request.url).search;

  try {
    const response = await fetch(`${BACKEND_URL}/api/admin/analytics/volume-tvl${search}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("text/csv")) {
      const body = await response.text();
      return new NextResponse(body, {
        status: response.status,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": response.headers.get("content-disposition") ?? "attachment",
        },
      });
    }
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "Service unavailable" }, { status: 503 });
  }
}
```

- [ ] **Step 2: Create the wallets proxy route**

```typescript
// tasmil-finance/src/app/api/admin/analytics/wallets/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { getServerBackendBaseUrl } from "@/lib/runtime-urls";

const BACKEND_URL = getServerBackendBaseUrl();

function getAdminToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  return null;
}

export async function GET(request: NextRequest) {
  const token = getAdminToken(request);
  if (!token) return NextResponse.json({ message: "No admin token" }, { status: 401 });

  const search = new URL(request.url).search;

  try {
    const response = await fetch(`${BACKEND_URL}/api/admin/analytics/wallets${search}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("text/csv")) {
      const body = await response.text();
      return new NextResponse(body, {
        status: response.status,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": response.headers.get("content-disposition") ?? "attachment",
        },
      });
    }
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "Service unavailable" }, { status: 503 });
  }
}
```

- [ ] **Step 3: Create the transactions proxy route**

```typescript
// tasmil-finance/src/app/api/admin/analytics/transactions/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { getServerBackendBaseUrl } from "@/lib/runtime-urls";

const BACKEND_URL = getServerBackendBaseUrl();

function getAdminToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  return null;
}

export async function GET(request: NextRequest) {
  const token = getAdminToken(request);
  if (!token) return NextResponse.json({ message: "No admin token" }, { status: 401 });

  const search = new URL(request.url).search;

  try {
    const response = await fetch(`${BACKEND_URL}/api/admin/analytics/transactions${search}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("text/csv")) {
      const body = await response.text();
      return new NextResponse(body, {
        status: response.status,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": response.headers.get("content-disposition") ?? "attachment",
        },
      });
    }
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "Service unavailable" }, { status: 503 });
  }
}
```

- [ ] **Step 4: Create the transactions/stats proxy route**

This one never returns CSV, but keeping the same content-type check is harmless and keeps all four routes identical in shape (easier to maintain as a set).

```typescript
// tasmil-finance/src/app/api/admin/analytics/transactions/stats/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { getServerBackendBaseUrl } from "@/lib/runtime-urls";

const BACKEND_URL = getServerBackendBaseUrl();

function getAdminToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  return null;
}

export async function GET(request: NextRequest) {
  const token = getAdminToken(request);
  if (!token) return NextResponse.json({ message: "No admin token" }, { status: 401 });

  const search = new URL(request.url).search;

  try {
    const response = await fetch(`${BACKEND_URL}/api/admin/analytics/transactions/stats${search}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "Service unavailable" }, { status: 503 });
  }
}
```

- [ ] **Step 5: Verify manually**

Run: `cd tasmil-finance && pnpm dev` (with backend from Task 9 still running), then in the browser devtools console on any admin page (already authenticated), or via curl with a real admin token:
```bash
curl -s "http://localhost:3000/api/admin/analytics/volume-tvl" -H "Authorization: Bearer $ADMIN_JWT"
```
Expected: same JSON the backend returned directly in Task 3.

- [ ] **Step 6: Commit**

```bash
cd tasmil-finance
git add src/app/api/admin/analytics
git commit -m "feat(admin): add analytics API proxy routes"
```

---

### Task 11: Feature types and data-fetching hooks (frontend)

**Files:**
- Create: `tasmil-finance/src/features/admin-analytics/types.ts`
- Create: `tasmil-finance/src/features/admin-analytics/hooks/use-volume-tvl.ts`
- Create: `tasmil-finance/src/features/admin-analytics/hooks/use-wallets-analytics.ts`
- Create: `tasmil-finance/src/features/admin-analytics/hooks/use-transactions-log.ts`
- Create: `tasmil-finance/src/features/admin-analytics/hooks/use-transactions-stats.ts`
- Create: `tasmil-finance/src/features/admin-analytics/lib/download-csv.ts`

**Interfaces:**
- Consumes: `AdminControllerGetVolumeTvlQueryResponse` etc. (Task 9), `useAdminAuthStore` from `@/store/use-admin-auth` (existing), the proxy routes from Task 10.
- Produces: `VolumeTvlPoint`, `WalletRow`, `TransactionRow`, `TransactionsStats` types; `useVolumeTvl(from?: string, to?: string, granularity: 'day'|'week'|'month')`, `useWalletsAnalytics(params: { from?: string; to?: string; sort: string; order: 'asc'|'desc'; search?: string; page: number; pageSize: number })`, `useTransactionsLog(params: { from?: string; to?: string; type?: string[]; page: number; pageSize: number })`, `useTransactionsStats(from?: string, to?: string)`, `downloadCsvExport(path: string, token: string, filename: string): Promise<void>` — all consumed by Tasks 12-16.

This feature module does not import from `src/features/admin/` or `src/features/admin-whitelist/` (features must not import from other features per this repo's convention) — the fetch pattern below is self-contained, mirroring `src/features/admin-whitelist/hooks/use-registration-stats.ts`.

- [ ] **Step 1: Create the types file**

```typescript
// tasmil-finance/src/features/admin-analytics/types.ts
import type { AdminControllerGetTransactionsQueryResponse } from "@/gen-backend/types/admin-controller-get-transactions";
import type { AdminControllerGetTransactionsStatsQueryResponse } from "@/gen-backend/types/admin-controller-get-transactions-stats";
import type { AdminControllerGetVolumeTvlQueryResponse } from "@/gen-backend/types/admin-controller-get-volume-tvl";
import type { AdminControllerGetWalletsQueryResponse } from "@/gen-backend/types/admin-controller-get-wallets";

export type VolumeTvlPoint = AdminControllerGetVolumeTvlQueryResponse[number];
export type WalletsAnalyticsResponse = AdminControllerGetWalletsQueryResponse;
export type WalletRow = WalletsAnalyticsResponse["rows"][number];
export type TransactionsLogResponse = AdminControllerGetTransactionsQueryResponse;
export type TransactionRow = TransactionsLogResponse["rows"][number];
export type TransactionsStats = AdminControllerGetTransactionsStatsQueryResponse;

export type WalletSortKey = "tvl" | "volume" | "txCount" | "joinedAt";
export type SortOrder = "asc" | "desc";
export type Granularity = "day" | "week" | "month";
```

- [ ] **Step 2: Create the CSV download helper**

```typescript
// tasmil-finance/src/features/admin-analytics/lib/download-csv.ts
export async function downloadCsvExport(
  path: string,
  token: string,
  filename: string
): Promise<void> {
  const response = await fetch(path, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to export CSV");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 3: Create the volume-tvl hook**

```typescript
// tasmil-finance/src/features/admin-analytics/hooks/use-volume-tvl.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { useAdminAuthStore } from "@/store/use-admin-auth";
import type { Granularity, VolumeTvlPoint } from "../types";

async function fetchVolumeTvl(
  token: string,
  from: string | undefined,
  to: string | undefined,
  granularity: Granularity
): Promise<VolumeTvlPoint[]> {
  const params = new URLSearchParams({ granularity });
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const response = await fetch(`/api/admin/analytics/volume-tvl?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch volume/TVL series");
  const json = await response.json();
  return json.data ?? json;
}

export function useVolumeTvl(from: string | undefined, to: string | undefined, granularity: Granularity) {
  const token = useAdminAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["admin-analytics", "volume-tvl", from, to, granularity],
    queryFn: () => fetchVolumeTvl(token!, from, to, granularity),
    enabled: !!token,
  });
}
```

- [ ] **Step 4: Create the wallets-analytics hook**

```typescript
// tasmil-finance/src/features/admin-analytics/hooks/use-wallets-analytics.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { useAdminAuthStore } from "@/store/use-admin-auth";
import type { SortOrder, WalletSortKey, WalletsAnalyticsResponse } from "../types";

export interface WalletsAnalyticsParams {
  from?: string;
  to?: string;
  sort: WalletSortKey;
  order: SortOrder;
  search?: string;
  page: number;
  pageSize: number;
}

async function fetchWalletsAnalytics(
  token: string,
  params: WalletsAnalyticsParams
): Promise<WalletsAnalyticsResponse> {
  const search = new URLSearchParams({
    sort: params.sort,
    order: params.order,
    page: String(params.page),
    pageSize: String(params.pageSize),
  });
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  if (params.search) search.set("search", params.search);

  const response = await fetch(`/api/admin/analytics/wallets?${search.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch wallets analytics");
  const json = await response.json();
  return json.data ?? json;
}

export function useWalletsAnalytics(params: WalletsAnalyticsParams) {
  const token = useAdminAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["admin-analytics", "wallets", params],
    queryFn: () => fetchWalletsAnalytics(token!, params),
    enabled: !!token,
  });
}
```

- [ ] **Step 5: Create the transactions-log hook**

```typescript
// tasmil-finance/src/features/admin-analytics/hooks/use-transactions-log.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { useAdminAuthStore } from "@/store/use-admin-auth";
import type { TransactionsLogResponse } from "../types";

export interface TransactionsLogParams {
  from?: string;
  to?: string;
  type?: string[];
  page: number;
  pageSize: number;
}

async function fetchTransactionsLog(
  token: string,
  params: TransactionsLogParams
): Promise<TransactionsLogResponse> {
  const search = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  });
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  if (params.type && params.type.length > 0) search.set("type", params.type.join(","));

  const response = await fetch(`/api/admin/analytics/transactions?${search.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch transactions log");
  const json = await response.json();
  return json.data ?? json;
}

export function useTransactionsLog(params: TransactionsLogParams) {
  const token = useAdminAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["admin-analytics", "transactions", params],
    queryFn: () => fetchTransactionsLog(token!, params),
    enabled: !!token,
  });
}
```

- [ ] **Step 6: Create the transactions-stats hook**

```typescript
// tasmil-finance/src/features/admin-analytics/hooks/use-transactions-stats.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { useAdminAuthStore } from "@/store/use-admin-auth";
import type { TransactionsStats } from "../types";

async function fetchTransactionsStats(
  token: string,
  from: string | undefined,
  to: string | undefined
): Promise<TransactionsStats> {
  const search = new URLSearchParams();
  if (from) search.set("from", from);
  if (to) search.set("to", to);

  const response = await fetch(`/api/admin/analytics/transactions/stats?${search.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch transactions stats");
  const json = await response.json();
  return json.data ?? json;
}

export function useTransactionsStats(from: string | undefined, to: string | undefined) {
  const token = useAdminAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["admin-analytics", "transactions-stats", from, to],
    queryFn: () => fetchTransactionsStats(token!, from, to),
    enabled: !!token,
  });
}
```

- [ ] **Step 7: Type-check**

Run: `cd tasmil-finance && pnpm type-check`
Expected: no errors referencing `features/admin-analytics`.

- [ ] **Step 8: Commit**

```bash
cd tasmil-finance
git add src/features/admin-analytics/types.ts src/features/admin-analytics/hooks src/features/admin-analytics/lib
git commit -m "feat(admin): add analytics data-fetching hooks"
```

---

### Task 12: DateRangePicker component (frontend)

**Files:**
- Create: `tasmil-finance/src/features/admin-analytics/components/date-range-picker.tsx`
- Test: `tasmil-finance/src/features/admin-analytics/__tests__/date-range-picker.test.tsx`

**Interfaces:**
- Consumes: `@/shared/ui/button` (existing).
- Produces: `DateRangeValue` (`{ from: string; to: string }`), `DateRangePicker({ value, onChange }: { value: DateRangeValue; onChange: (value: DateRangeValue) => void })` — consumed by Task 16.

No new date-range-picker component exists in this codebase (confirmed by exploration) — this builds a minimal one from preset buttons + native `<input type="date">` for custom range, since the design only calls for 7d/30d/90d/custom presets, not a full calendar widget.

- [ ] **Step 1: Write the failing test**

```tsx
// tasmil-finance/src/features/admin-analytics/__tests__/date-range-picker.test.tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { DateRangePicker } from "../components/date-range-picker";

describe("DateRangePicker", () => {
  it("calls onChange with a 7-day range when the 7d preset is clicked", () => {
    const onChange = jest.fn();
    render(
      <DateRangePicker value={{ from: "2026-06-01", to: "2026-06-30" }} onChange={onChange} />
    );

    fireEvent.click(screen.getByRole("button", { name: "7d" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const [{ from, to }] = onChange.mock.calls[0];
    expect(new Date(to).getTime() - new Date(from).getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("calls onChange with the typed custom range", () => {
    const onChange = jest.fn();
    render(
      <DateRangePicker value={{ from: "2026-06-01", to: "2026-06-30" }} onChange={onChange} />
    );

    fireEvent.change(screen.getByLabelText("From"), { target: { value: "2026-05-01" } });
    fireEvent.change(screen.getByLabelText("To"), { target: { value: "2026-05-15" } });

    expect(onChange).toHaveBeenLastCalledWith({ from: "2026-05-01", to: "2026-05-15" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd tasmil-finance && npx jest src/features/admin-analytics/__tests__/date-range-picker.test.tsx`
Expected: FAIL with "Cannot find module '../components/date-range-picker'"

- [ ] **Step 3: Write minimal implementation**

```tsx
// tasmil-finance/src/features/admin-analytics/components/date-range-picker.tsx
"use client";

import { Button } from "@/shared/ui/button";

export interface DateRangeValue {
  from: string;
  to: string;
}

const PRESETS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex gap-1">
        {PRESETS.map((preset) => (
          <Button
            key={preset.label}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange({ from: isoDaysAgo(preset.days), to: isoDaysAgo(0) })}
          >
            {preset.label}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-2 text-xs">
        <label className="flex items-center gap-1" htmlFor="analytics-from">
          From
          <input
            id="analytics-from"
            type="date"
            value={value.from}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
            className="rounded border border-border bg-background px-2 py-1"
          />
        </label>
        <label className="flex items-center gap-1" htmlFor="analytics-to">
          To
          <input
            id="analytics-to"
            type="date"
            value={value.to}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
            className="rounded border border-border bg-background px-2 py-1"
          />
        </label>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd tasmil-finance && npx jest src/features/admin-analytics/__tests__/date-range-picker.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
cd tasmil-finance
git add src/features/admin-analytics/components/date-range-picker.tsx src/features/admin-analytics/__tests__/date-range-picker.test.tsx
git commit -m "feat(admin): add DateRangePicker for analytics page"
```

---

### Task 13: VolumeTvlChart component (frontend)

**Files:**
- Create: `tasmil-finance/src/features/admin-analytics/components/volume-tvl-chart.tsx`

**Interfaces:**
- Consumes: `VolumeTvlPoint` (Task 11), `@/shared/ui/card` (existing).
- Produces: `VolumeTvlChart({ data, isLoading }: { data: VolumeTvlPoint[] | undefined; isLoading: boolean })` — consumed by Task 16.

No dedicated unit test for this one — it's a thin recharts wrapper, matching this repo's existing convention where chart-rendering blocks in `admin/dashboard/page.tsx` also have no direct test (recharts SVG output isn't meaningfully assertable in jsdom without heavy mocking). Its behavior is covered indirectly by the Task 16 page-level test.

- [ ] **Step 1: Write the component**

```tsx
// tasmil-finance/src/features/admin-analytics/components/volume-tvl-chart.tsx
"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/shared/ui/card";
import { Typography } from "@/shared/ui/typography";
import type { VolumeTvlPoint } from "../types";

export function VolumeTvlChart({
  data,
  isLoading,
}: {
  data: VolumeTvlPoint[] | undefined;
  isLoading: boolean;
}) {
  const points = data ?? [];

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6">
        <div className="mb-4">
          <Typography variant="h3" className="font-semibold text-base">
            Volume &amp; TVL
          </Typography>
          <Typography variant="p" className="text-muted-foreground text-xs">
            Deposit/withdraw volume and cumulative net-deposit TVL over the selected range
          </Typography>
        </div>
        {isLoading ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground text-xs">
            Loading…
          </div>
        ) : points.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground text-xs">
            No transactions in this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={points} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="volumeUsd"
                name="Volume (USD)"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#volumeGrad)"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="cumulativeTvlUsd"
                name="Cumulative TVL (USD, est.)"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `cd tasmil-finance && pnpm type-check`
Expected: no errors referencing `volume-tvl-chart.tsx`.

- [ ] **Step 3: Commit**

```bash
cd tasmil-finance
git add src/features/admin-analytics/components/volume-tvl-chart.tsx
git commit -m "feat(admin): add VolumeTvlChart component"
```

---

### Task 14: WalletsTable component (frontend)

**Files:**
- Create: `tasmil-finance/src/features/admin-analytics/components/wallets-table.tsx`
- Test: `tasmil-finance/src/features/admin-analytics/__tests__/wallets-table.test.tsx`

**Interfaces:**
- Consumes: `WalletRow`, `WalletSortKey`, `SortOrder` (Task 11), `@/shared/ui/table`, `@/shared/ui/button`, `@/shared/ui/input` (existing).
- Produces: `WalletsTable({ rows, total, sort, order, onSortChange, search, onSearchChange, page, pageSize, onPageChange, isLoading, onExport }: WalletsTableProps)` — consumed by Task 16.

- [ ] **Step 1: Write the failing test**

```tsx
// tasmil-finance/src/features/admin-analytics/__tests__/wallets-table.test.tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { WalletsTable } from "../components/wallets-table";

const rows = [
  {
    keeperWalletAddress: "GABC123",
    currentTvlUsd: 500,
    volumeUsd: 1000,
    txCount: 3,
    joinedAt: "2026-01-01T00:00:00.000Z",
    lastActivityAt: "2026-06-01T00:00:00.000Z",
  },
];

describe("WalletsTable", () => {
  it("renders one row per wallet with formatted numbers", () => {
    render(
      <WalletsTable
        rows={rows}
        total={1}
        sort="volume"
        order="desc"
        onSortChange={jest.fn()}
        search=""
        onSearchChange={jest.fn()}
        page={1}
        pageSize={20}
        onPageChange={jest.fn()}
        isLoading={false}
        onExport={jest.fn()}
      />
    );

    expect(screen.getByText("GABC123")).toBeInTheDocument();
    expect(screen.getByText("$1,000")).toBeInTheDocument();
  });

  it("shows an empty state when there are no rows", () => {
    render(
      <WalletsTable
        rows={[]}
        total={0}
        sort="volume"
        order="desc"
        onSortChange={jest.fn()}
        search=""
        onSearchChange={jest.fn()}
        page={1}
        pageSize={20}
        onPageChange={jest.fn()}
        isLoading={false}
        onExport={jest.fn()}
      />
    );

    expect(screen.getByText("No wallets in this period")).toBeInTheDocument();
  });

  it("toggles sort order when clicking the active sort column header", () => {
    const onSortChange = jest.fn();
    render(
      <WalletsTable
        rows={rows}
        total={1}
        sort="volume"
        order="desc"
        onSortChange={onSortChange}
        search=""
        onSearchChange={jest.fn()}
        page={1}
        pageSize={20}
        onPageChange={jest.fn()}
        isLoading={false}
        onExport={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /volume/i }));

    expect(onSortChange).toHaveBeenCalledWith("volume", "asc");
  });

  it("calls onExport when the Export CSV button is clicked", () => {
    const onExport = jest.fn();
    render(
      <WalletsTable
        rows={rows}
        total={1}
        sort="volume"
        order="desc"
        onSortChange={jest.fn()}
        search=""
        onSearchChange={jest.fn()}
        page={1}
        pageSize={20}
        onPageChange={jest.fn()}
        isLoading={false}
        onExport={onExport}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /export csv/i }));

    expect(onExport).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd tasmil-finance && npx jest src/features/admin-analytics/__tests__/wallets-table.test.tsx`
Expected: FAIL with "Cannot find module '../components/wallets-table'"

- [ ] **Step 3: Write minimal implementation**

```tsx
// tasmil-finance/src/features/admin-analytics/components/wallets-table.tsx
"use client";

import { Download } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import type { SortOrder, WalletRow, WalletSortKey } from "../types";

const SORT_COLUMNS: { key: WalletSortKey; label: string }[] = [
  { key: "tvl", label: "TVL" },
  { key: "volume", label: "Volume" },
  { key: "txCount", label: "Tx Count" },
  { key: "joinedAt", label: "Joined" },
];

function formatUsd(value: number): string {
  return `$${Math.round(value).toLocaleString()}`;
}

export interface WalletsTableProps {
  rows: WalletRow[];
  total: number;
  sort: WalletSortKey;
  order: SortOrder;
  onSortChange: (sort: WalletSortKey, order: SortOrder) => void;
  search: string;
  onSearchChange: (search: string) => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  onExport: () => void;
}

export function WalletsTable({
  rows,
  total,
  sort,
  order,
  onSortChange,
  search,
  onSearchChange,
  page,
  pageSize,
  onPageChange,
  isLoading,
  onExport,
}: WalletsTableProps) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));

  function handleSortClick(key: WalletSortKey) {
    onSortChange(key, sort === key && order === "desc" ? "asc" : "desc");
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <Input
          placeholder="Search by wallet address…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-xs"
        />
        <Button type="button" variant="outline" size="sm" onClick={onExport}>
          <Download size={14} />
          Export CSV
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-10 text-muted-foreground text-xs">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="p-10 text-center text-muted-foreground text-xs">
          No wallets in this period
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Keeper Wallet</TableHead>
              {SORT_COLUMNS.map((col) => (
                <TableHead key={col.key}>
                  <button type="button" onClick={() => handleSortClick(col.key)}>
                    {col.label}
                    {sort === col.key ? (order === "asc" ? " ↑" : " ↓") : ""}
                  </button>
                </TableHead>
              ))}
              <TableHead>Last Activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.keeperWalletAddress}>
                <TableCell className="font-mono text-xs">{row.keeperWalletAddress}</TableCell>
                <TableCell>{formatUsd(row.currentTvlUsd)}</TableCell>
                <TableCell>{formatUsd(row.volumeUsd)}</TableCell>
                <TableCell>{row.txCount}</TableCell>
                <TableCell>{new Date(row.joinedAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  {row.lastActivityAt ? new Date(row.lastActivityAt).toLocaleDateString() : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <div className="flex items-center justify-between text-muted-foreground text-xs">
        <span>{total} total wallets</span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Prev
          </Button>
          <span>
            Page {page} / {lastPage}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= lastPage}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd tasmil-finance && npx jest src/features/admin-analytics/__tests__/wallets-table.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
cd tasmil-finance
git add src/features/admin-analytics/components/wallets-table.tsx src/features/admin-analytics/__tests__/wallets-table.test.tsx
git commit -m "feat(admin): add WalletsTable component"
```

---

### Task 15: TransactionsStatsCards and TransactionsLogTable components (frontend)

**Files:**
- Create: `tasmil-finance/src/features/admin-analytics/components/transactions-stats-cards.tsx`
- Create: `tasmil-finance/src/features/admin-analytics/components/transactions-log-table.tsx`
- Test: `tasmil-finance/src/features/admin-analytics/__tests__/transactions-stats-cards.test.tsx`

**Interfaces:**
- Consumes: `TransactionsStats`, `TransactionRow` (Task 11), `@/shared/ui/card`, `@/shared/ui/table`, `@/shared/ui/button` (existing).
- Produces: `TransactionsStatsCards({ stats, isLoading }: { stats: TransactionsStats | undefined; isLoading: boolean })`, `TransactionsLogTable({ rows, total, page, pageSize, onPageChange, isLoading, onExport }: TransactionsLogTableProps)` — both consumed by Task 16.

- [ ] **Step 1: Write the failing test (stats cards only — the log table follows the same tested pattern as Task 14's WalletsTable, so it's implemented directly without a duplicate test suite)**

```tsx
// tasmil-finance/src/features/admin-analytics/__tests__/transactions-stats-cards.test.tsx
import { render, screen } from "@testing-library/react";
import { TransactionsStatsCards } from "../components/transactions-stats-cards";

describe("TransactionsStatsCards", () => {
  it("renders total count and a card per activity type", () => {
    render(
      <TransactionsStatsCards
        stats={{
          totalCount: 7,
          byType: [
            { type: "DEPOSIT", count: 5 },
            { type: "WITHDRAW", count: 2 },
          ],
        }}
        isLoading={false}
      />
    );

    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("DEPOSIT")).toBeInTheDocument();
    expect(screen.getByText("WITHDRAW")).toBeInTheDocument();
  });

  it("shows a loading state", () => {
    render(<TransactionsStatsCards stats={undefined} isLoading={true} />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd tasmil-finance && npx jest src/features/admin-analytics/__tests__/transactions-stats-cards.test.tsx`
Expected: FAIL with "Cannot find module '../components/transactions-stats-cards'"

- [ ] **Step 3: Write the stats cards component**

```tsx
// tasmil-finance/src/features/admin-analytics/components/transactions-stats-cards.tsx
"use client";

import { Card, CardContent } from "@/shared/ui/card";
import type { TransactionsStats } from "../types";

export function TransactionsStatsCards({
  stats,
  isLoading,
}: {
  stats: TransactionsStats | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <div className="p-6 text-muted-foreground text-xs">Loading…</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      <Card className="border-border border-t-2 border-t-blue-500/60 bg-card">
        <CardContent className="p-4">
          <p className="mb-1 text-[10px] text-muted-foreground uppercase tracking-widest">
            Total Transactions
          </p>
          <p className="font-bold text-2xl leading-none">{stats?.totalCount ?? 0}</p>
        </CardContent>
      </Card>
      {(stats?.byType ?? []).map((entry) => (
        <Card key={entry.type} className="border-border bg-card">
          <CardContent className="p-4">
            <p className="mb-1 text-[10px] text-muted-foreground uppercase tracking-widest">
              {entry.type}
            </p>
            <p className="font-bold text-2xl leading-none">{entry.count}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd tasmil-finance && npx jest src/features/admin-analytics/__tests__/transactions-stats-cards.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Write the transactions log table component (following the WalletsTable pattern from Task 14, filtered by type instead of sorted by column, no client-side sort since the log is always newest-first)**

```tsx
// tasmil-finance/src/features/admin-analytics/components/transactions-log-table.tsx
"use client";

import { Download } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import type { TransactionRow } from "../types";

export interface TransactionsLogTableProps {
  rows: TransactionRow[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  onExport: () => void;
}

export function TransactionsLogTable({
  rows,
  total,
  page,
  pageSize,
  onPageChange,
  isLoading,
  onExport,
}: TransactionsLogTableProps) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onExport}>
          <Download size={14} />
          Export CSV
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-10 text-muted-foreground text-xs">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="p-10 text-center text-muted-foreground text-xs">
          No transactions in this period
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Wallet</TableHead>
              <TableHead>Amount (USD)</TableHead>
              <TableHead>Tx Hash</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                <TableCell>{row.type}</TableCell>
                <TableCell className="font-mono text-xs">{row.keeperWalletAddress}</TableCell>
                <TableCell>{row.amountUsd !== null ? `$${row.amountUsd.toLocaleString()}` : "—"}</TableCell>
                <TableCell>
                  {row.txHash ? (
                    <a
                      href={`https://stellar.expert/explorer/public/tx/${row.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-blue-400 text-xs"
                    >
                      {row.txHash.slice(0, 8)}…
                    </a>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <div className="flex items-center justify-between text-muted-foreground text-xs">
        <span>{total} total transactions</span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Prev
          </Button>
          <span>
            Page {page} / {lastPage}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= lastPage}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Type-check**

Run: `cd tasmil-finance && pnpm type-check`
Expected: no errors referencing the new component files.

- [ ] **Step 7: Commit**

```bash
cd tasmil-finance
git add src/features/admin-analytics/components/transactions-stats-cards.tsx src/features/admin-analytics/components/transactions-log-table.tsx src/features/admin-analytics/__tests__/transactions-stats-cards.test.tsx
git commit -m "feat(admin): add transactions stats and log table components"
```

---

### Task 16: Assemble the analytics page (frontend)

**Files:**
- Modify: `tasmil-finance/src/app/admin/(app)/analytics/page.tsx` (currently a 5-line redirect stub — replaced entirely)
- Test: `tasmil-finance/src/features/admin-analytics/__tests__/analytics-page.test.tsx`

**Interfaces:**
- Consumes: all hooks from Task 11, all components from Tasks 12-15.
- Produces: the rendered `/admin/analytics` page — consumed by Task 17 (nav link) and Task 18 (manual verification).

- [ ] **Step 1: Write the failing test**

```tsx
// tasmil-finance/src/features/admin-analytics/__tests__/analytics-page.test.tsx
import { render, screen } from "@testing-library/react";
import AnalyticsPage from "@/app/admin/(app)/analytics/page";
import { useTransactionsLog } from "@/features/admin-analytics/hooks/use-transactions-log";
import { useTransactionsStats } from "@/features/admin-analytics/hooks/use-transactions-stats";
import { useVolumeTvl } from "@/features/admin-analytics/hooks/use-volume-tvl";
import { useWalletsAnalytics } from "@/features/admin-analytics/hooks/use-wallets-analytics";

jest.mock("@/features/admin-analytics/hooks/use-volume-tvl", () => ({
  useVolumeTvl: jest.fn(),
}));
jest.mock("@/features/admin-analytics/hooks/use-wallets-analytics", () => ({
  useWalletsAnalytics: jest.fn(),
}));
jest.mock("@/features/admin-analytics/hooks/use-transactions-log", () => ({
  useTransactionsLog: jest.fn(),
}));
jest.mock("@/features/admin-analytics/hooks/use-transactions-stats", () => ({
  useTransactionsStats: jest.fn(),
}));

describe("AnalyticsPage", () => {
  beforeEach(() => {
    (useVolumeTvl as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    (useWalletsAnalytics as jest.Mock).mockReturnValue({ data: { rows: [], total: 0 }, isLoading: false });
    (useTransactionsLog as jest.Mock).mockReturnValue({ data: { rows: [], total: 0 }, isLoading: false });
    (useTransactionsStats as jest.Mock).mockReturnValue({
      data: { totalCount: 0, byType: [] },
      isLoading: false,
    });
  });

  it("renders the date range picker, chart, stats, wallets table, and transactions log", () => {
    render(<AnalyticsPage />);

    expect(screen.getByRole("button", { name: "7d" })).toBeInTheDocument();
    expect(screen.getByText("Volume & TVL")).toBeInTheDocument();
    expect(screen.getByText("Total Transactions")).toBeInTheDocument();
    expect(screen.getByText("No wallets in this period")).toBeInTheDocument();
    expect(screen.getByText("No transactions in this period")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd tasmil-finance && npx jest src/features/admin-analytics/__tests__/analytics-page.test.tsx`
Expected: FAIL (page still redirects, hooks don't exist at those call sites yet)

- [ ] **Step 3: Replace the page**

```tsx
// tasmil-finance/src/app/admin/(app)/analytics/page.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DateRangePicker, type DateRangeValue } from "@/features/admin-analytics/components/date-range-picker";
import { TransactionsLogTable } from "@/features/admin-analytics/components/transactions-log-table";
import { TransactionsStatsCards } from "@/features/admin-analytics/components/transactions-stats-cards";
import { VolumeTvlChart } from "@/features/admin-analytics/components/volume-tvl-chart";
import { WalletsTable } from "@/features/admin-analytics/components/wallets-table";
import { useTransactionsLog } from "@/features/admin-analytics/hooks/use-transactions-log";
import { useTransactionsStats } from "@/features/admin-analytics/hooks/use-transactions-stats";
import { useVolumeTvl } from "@/features/admin-analytics/hooks/use-volume-tvl";
import { useWalletsAnalytics } from "@/features/admin-analytics/hooks/use-wallets-analytics";
import { downloadCsvExport } from "@/features/admin-analytics/lib/download-csv";
import type { SortOrder, WalletSortKey } from "@/features/admin-analytics/types";
import { useAdminAuthStore } from "@/store/use-admin-auth";

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

const WALLETS_PAGE_SIZE = 20;
const TX_PAGE_SIZE = 20;

export default function AnalyticsPage() {
  const token = useAdminAuthStore((s) => s.token);
  const [range, setRange] = useState<DateRangeValue>({ from: isoDaysAgo(30), to: isoDaysAgo(0) });
  const [walletSort, setWalletSort] = useState<WalletSortKey>("volume");
  const [walletOrder, setWalletOrder] = useState<SortOrder>("desc");
  const [walletSearch, setWalletSearch] = useState("");
  const [walletPage, setWalletPage] = useState(1);
  const [txPage, setTxPage] = useState(1);

  const volumeTvl = useVolumeTvl(range.from, range.to, "day");
  const wallets = useWalletsAnalytics({
    from: range.from,
    to: range.to,
    sort: walletSort,
    order: walletOrder,
    search: walletSearch || undefined,
    page: walletPage,
    pageSize: WALLETS_PAGE_SIZE,
  });
  const transactions = useTransactionsLog({
    from: range.from,
    to: range.to,
    page: txPage,
    pageSize: TX_PAGE_SIZE,
  });
  const transactionsStats = useTransactionsStats(range.from, range.to);

  async function exportCsv(path: string, filename: string) {
    if (!token) return;
    try {
      await downloadCsvExport(path, token, filename);
    } catch {
      toast.error("Export failed");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl">Analytics</h1>
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      <VolumeTvlChart data={volumeTvl.data} isLoading={volumeTvl.isLoading} />

      <TransactionsStatsCards stats={transactionsStats.data} isLoading={transactionsStats.isLoading} />

      <WalletsTable
        rows={wallets.data?.rows ?? []}
        total={wallets.data?.total ?? 0}
        sort={walletSort}
        order={walletOrder}
        onSortChange={(sort, order) => {
          setWalletSort(sort);
          setWalletOrder(order);
          setWalletPage(1);
        }}
        search={walletSearch}
        onSearchChange={(search) => {
          setWalletSearch(search);
          setWalletPage(1);
        }}
        page={walletPage}
        pageSize={WALLETS_PAGE_SIZE}
        onPageChange={setWalletPage}
        isLoading={wallets.isLoading}
        onExport={() =>
          exportCsv(
            `/api/admin/analytics/wallets?from=${range.from}&to=${range.to}&sort=${walletSort}&order=${walletOrder}&format=csv`,
            "wallets.csv"
          )
        }
      />

      <TransactionsLogTable
        rows={transactions.data?.rows ?? []}
        total={transactions.data?.total ?? 0}
        page={txPage}
        pageSize={TX_PAGE_SIZE}
        onPageChange={setTxPage}
        isLoading={transactions.isLoading}
        onExport={() =>
          exportCsv(
            `/api/admin/analytics/transactions?from=${range.from}&to=${range.to}&format=csv`,
            "transactions.csv"
          )
        }
      />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd tasmil-finance && npx jest src/features/admin-analytics/__tests__/analytics-page.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 5: Run the full frontend test suite to confirm no regressions**

Run: `cd tasmil-finance && pnpm test`
Expected: PASS (all existing tests plus the new admin-analytics ones)

- [ ] **Step 6: Commit**

```bash
cd tasmil-finance
git add src/app/admin/\(app\)/analytics/page.tsx src/features/admin-analytics/__tests__/analytics-page.test.tsx
git commit -m "feat(admin): build out the analytics page"
```

---

### Task 17: Sidebar navigation entry (frontend)

**Files:**
- Modify: `tasmil-finance/src/shared/layout/sidebar-data.ts`

**Interfaces:**
- Consumes: none new.
- Produces: a visible "Analytics" nav link at `/admin/analytics` — no other task depends on this; it's the last piece needed for the page to be reachable from the admin UI (previously it was reachable only by typing the URL directly, since it just redirected to the dashboard).

- [ ] **Step 1: Add the `BarChart3` icon import**

In `tasmil-finance/src/shared/layout/sidebar-data.ts`, add `BarChart3` to the `lucide-react` import (lines 1-15):

```typescript
import {
  ArrowLeftRight,
  BarChart3,
  Bot,
  Home,
  KeyRound,
  ListChecks,
  Mail,
  Settings,
  Share2,
  Shield,
  Tractor,
  TrendingUp,
  Trophy,
  Wallet,
} from "lucide-react";
```

- [ ] **Step 2: Add the nav item**

In the same file, update the "Overview" group (line 161-163):

```typescript
    {
      title: "Overview",
      items: [
        { title: "Dashboard", url: "/admin/dashboard", icon: Home },
        { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
      ],
    },
```

- [ ] **Step 3: Verify manually**

Run: `cd tasmil-finance && pnpm dev`, log into `/admin`, confirm "Analytics" appears in the sidebar under "Overview" and clicking it loads the new page (not a redirect to Dashboard).

- [ ] **Step 4: Commit**

```bash
cd tasmil-finance
git add src/shared/layout/sidebar-data.ts
git commit -m "feat(admin): add Analytics link to admin sidebar"
```

---

### Task 18: End-to-end manual verification

No new files — this is the final manual pass tying every prior task together, per the design doc's testing section (no load/perf testing needed; data volume was explicitly confirmed as small).

- [ ] **Step 1: Start both dev servers**

```bash
cd backend && pnpm dev &
cd tasmil-finance && pnpm dev &
```

- [ ] **Step 2: Confirm the 4 endpoints respond correctly through the full stack**

In a browser, log into `http://localhost:3000/admin`, navigate to Analytics, and confirm:
- The date range picker's 7d/30d/90d buttons each refetch all four blocks (network tab shows new requests with updated `from`/`to`).
- The Volume & TVL chart renders (or shows "No transactions in this period" if the local dev DB has no `Activity` rows yet — seed some via the existing dev flow if needed to see real data).
- The Transactions stats cards show a total and one card per activity type present in range.
- The Wallets table sorts when clicking column headers, filters when typing in the search box, and paginates.
- The Transactions log table paginates and each `Tx Hash` cell links out to Stellar Expert.
- Clicking "Export CSV" on both the wallets table and the transactions log table downloads a `.csv` file with the expected columns (open it and check the header row).

- [ ] **Step 3: Confirm error handling**

- Manually edit the URL query the picker builds (e.g. via devtools) to send `from` after `to` — confirm the request returns 400 and the picker's Apply is guarded (if any invalid state can be reached in the UI, it should be prevented before firing the request; if the current implementation doesn't fully guard this, note it but do not block completion on it, since the design doc's constraint is that the *backend* rejects invalid ranges with 400, which Task 2's `parseDateRange` already covers and Task 2's test already verifies).
- Stop the backend (`Ctrl+C`) and confirm each block shows a reasonable loading/error state rather than a crash, then restart it.

- [ ] **Step 4: Run both repos' full test suites one final time**

```bash
cd backend && npx jest src/modules/admin
cd tasmil-finance && pnpm test
```
Expected: PASS in both repos.

- [ ] **Step 5: Report results to the user**

Summarize what was verified (chart, stats, both tables, both CSV exports, sidebar link, error handling) and flag anything that didn't work as expected before considering the feature done.
