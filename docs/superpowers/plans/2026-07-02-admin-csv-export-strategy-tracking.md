# Admin CSV Export + Strategy Marketplace Tracking — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full-dataset CSV export to every data table in the tasmil-finance admin (backend-generated), and a new `/admin/strategies` page tracking the tasmil-strategy marketplace (all strategies + approve/reject, TVL/deposits, publishers/leaderboard).

**Architecture:** Backend gets a shared CSV utility (`toCsv`/`sendCsv`) plus one `GET .../export` endpoint per admin table, all under the existing `AdminAuthGuard`. A new `MarketplaceAdminController` at `admin/marketplace/*` (in the **admin** module, NOT the marketplace module) exposes strategy tracking to the tasmil-finance admin JWT — the marketplace module's existing admin endpoints use a *different* auth system (`AuthGuard`+`AdminGuard` with user JWTs) and cannot be reused. Frontend gets a shared `ExportCsvButton` in `src/shared/` (feature-isolation: `admin-topups` cannot import from `features/admin`) and a new `admin-strategies` feature module. **No Next.js proxy routes are needed**: `next.config` rewrites `/api/admin/:path*` straight to the backend, and App Router route handlers only shadow their exact paths.

**Tech Stack:** NestJS 10 + Prisma (repo `backend`), Next.js 16 App Router + React Query + Jest (repo `tasmil-finance`).

**Spec:** `tasmil-finance/docs/superpowers/specs/2026-07-02-admin-csv-export-strategy-tracking-design.md`

## Global Constraints

- Two repos: `backend` at `/Users/nathan/Documents/morcalab/tasmil/backend`, frontend at `/Users/nathan/Documents/morcalab/tasmil/tasmil-finance`. Each gets ONE feature branch; never commit to `deploy/prod` or push it.
- Backend branch: `feat/admin-csv-export-marketplace-admin`. Frontend branch: `feat/admin-csv-export-strategies-page` (branch from the current checked-out branch).
- Database migrations live ONLY in `backend/prisma/migrations/`. Local dev DB is **native Postgres on localhost:5432** (not the docker container).
- Backend code style: single quotes, semicolons (existing NestJS style). Frontend: Biome — 2-space indent, width 100, double quotes, `import type` for type-only imports, no `any` in frontend code, no `console.log`.
- Frontend features must NOT import from other features — cross-feature shared code goes in `src/shared/`.
- Backend admin endpoints guard: `AdminAuthGuard` from `../admin-auth/admin-auth.guard` (NOT `common/guards/admin.guard`).
- Derived strategy status order (must never change): `REJECTED` (rejectedAt set) → `PENDING` (!isApproved) → `PAUSED` (pausedAt set) → `PUBLISHED` (isActive) → `INACTIVE`.
- CSV format: RFC-4180 (quote cells containing `,` `"` or newlines, double embedded quotes), dates as ISO-8601, null/undefined as empty cell, `Content-Disposition: attachment; filename="<base>-YYYY-MM-DD.csv"`.

---

# PHASE A — backend repo

All Task 1–5 commands run in `/Users/nathan/Documents/morcalab/tasmil/backend`.

### Task 0a: Create backend feature branch

- [ ] **Step 1: Branch**

```bash
cd /Users/nathan/Documents/morcalab/tasmil/backend
git checkout -b feat/admin-csv-export-marketplace-admin
```

---

### Task 1: Shared CSV utility

**Files:**
- Create: `src/common/utils/csv.ts`
- Test: `src/common/utils/csv.spec.ts`

**Interfaces:**
- Produces: `CsvColumn { key: string; header: string }`, `toCsv(columns: CsvColumn[], rows: Array<Record<string, unknown>>): string`, `sendCsv(res: Response, filenameBase: string, columns: CsvColumn[], rows: Array<Record<string, unknown>>): void`. Every export endpoint in Tasks 2, 3, 5 calls `sendCsv`.

- [ ] **Step 1: Write the failing test**

Create `src/common/utils/csv.spec.ts`:

```typescript
import { toCsv, sendCsv, CsvColumn } from './csv';

describe('csv util', () => {
  const columns: CsvColumn[] = [
    { key: 'id', header: 'id' },
    { key: 'name', header: 'display_name' },
    { key: 'createdAt', header: 'created_at' },
  ];

  it('renders header row from column headers', () => {
    expect(toCsv(columns, [])).toBe('id,display_name,created_at\n');
  });

  it('renders rows in column order, formatting dates as ISO and nulls as empty', () => {
    const rows = [
      { id: 'a1', name: 'Alice', createdAt: new Date('2026-07-02T10:00:00.000Z') },
      { id: 'a2', name: null, createdAt: undefined },
    ];
    expect(toCsv(columns, rows)).toBe(
      'id,display_name,created_at\n' +
        'a1,Alice,2026-07-02T10:00:00.000Z\n' +
        'a2,,\n',
    );
  });

  it('escapes cells containing commas, quotes, and newlines (RFC 4180)', () => {
    const rows = [{ id: 'a,b', name: 'say "hi"', createdAt: 'line1\nline2' }];
    expect(toCsv(columns, rows)).toBe(
      'id,display_name,created_at\n' + '"a,b","say ""hi""","line1\nline2"\n',
    );
  });

  it('sendCsv sets content-type and dated attachment filename', () => {
    const res = { setHeader: jest.fn(), send: jest.fn() } as any;
    sendCsv(res, 'waitlist-entries', columns, []);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
    const disposition = res.setHeader.mock.calls.find(
      (c: string[]) => c[0] === 'Content-Disposition',
    )[1];
    expect(disposition).toMatch(
      /^attachment; filename="waitlist-entries-\d{4}-\d{2}-\d{2}\.csv"$/,
    );
    expect(res.send).toHaveBeenCalledWith('id,display_name,created_at\n');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- csv.spec`
Expected: FAIL — cannot find module `./csv`.

- [ ] **Step 3: Write the implementation**

Create `src/common/utils/csv.ts`:

```typescript
import type { Response } from 'express';

export interface CsvColumn {
  key: string;
  header: string;
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function escapeCell(cell: string): string {
  return /[",\n\r]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
}

/** Serialize rows to RFC-4180 CSV. Dates → ISO-8601, null/undefined → empty. */
export function toCsv(columns: CsvColumn[], rows: Array<Record<string, unknown>>): string {
  const header = columns.map((c) => escapeCell(c.header)).join(',');
  const lines = rows.map((row) =>
    columns.map((c) => escapeCell(formatCell(row[c.key]))).join(','),
  );
  return [header, ...lines].join('\n') + '\n';
}

/** Write a CSV attachment response named `<filenameBase>-YYYY-MM-DD.csv`. */
export function sendCsv(
  res: Response,
  filenameBase: string,
  columns: CsvColumn[],
  rows: Array<Record<string, unknown>>,
): void {
  const date = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}-${date}.csv"`);
  res.send(toCsv(columns, rows));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- csv.spec`
Expected: 4 passing.

- [ ] **Step 5: Commit**

```bash
git add src/common/utils/csv.ts src/common/utils/csv.spec.ts
git commit -m "feat(admin): shared RFC-4180 CSV export utility"
```

---

### Task 2: Export endpoints — admin controller (waitlist, codes, campaigns, quest-campaigns, quest-wallets, tier-bands, registrations)

**Files:**
- Modify: `src/modules/admin/admin.service.ts` (add 2 methods at the end of the class)
- Modify: `src/modules/admin/admin.controller.ts`

**Interfaces:**
- Consumes: `sendCsv`, `CsvColumn` from Task 1; existing `AdminService.listCampaigns()`, `listQuestCampaigns()`, `getQuestLeaderboard(limit)`, `listTierBands()`, `getRegistrationStats(days)`.
- Produces: `AdminService.exportWaitlistEntries(status?: string, search?: string)`, `AdminService.exportCodes()`; HTTP endpoints `GET /api/admin/waitlist/entries/export`, `GET /api/admin/codes/export`, `GET /api/admin/campaigns/export`, `GET /api/admin/quest-campaigns/export`, `GET /api/admin/quest-wallets/export`, `GET /api/admin/tier-bands/export`, `GET /api/admin/stats/registrations/export` — all `AdminAuthGuard`, all `text/csv`.

These are thin unpaginated Prisma reads; the CSV mechanics are covered by Task 1's tests, and endpoint wiring is verified by build + the curl check in Task 5's final step (no per-endpoint unit tests — `AdminService` has too many constructor dependencies to mock economically, matching the repo's existing pattern of testing services with focused specs only where logic exists).

- [ ] **Step 1: Add export query methods to AdminService**

In `src/modules/admin/admin.service.ts`, add before the closing brace of the class (after `getQuestLeaderboard`):

```typescript
  /** Full unpaginated waitlist export (same filters as getWaitlistEntries). */
  async exportWaitlistEntries(status?: string, search?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (search)
      where.OR = [
        { walletAddress: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    return this.prisma.waitlistEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        walletAddress: true,
        email: true,
        status: true,
        successfulReferralCount: true,
        createdAt: true,
      },
    });
  }

  /** Full unpaginated EARLY_ACCESS code export. */
  async exportCodes() {
    return this.prisma.accessCode.findMany({
      where: { type: 'EARLY_ACCESS' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        status: true,
        maxActivations: true,
        activationCount: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  }
```

- [ ] **Step 2: Add controller endpoints**

In `src/modules/admin/admin.controller.ts`:

Add to the existing imports:

```typescript
import { Res } from '@nestjs/common'; // merge into the existing @nestjs/common import list
import type { Response } from 'express';
import { sendCsv } from '../../common/utils/csv';
```

Insert the following methods. **Placement matters for one of them:** `exportQuestCampaigns` MUST be declared *above* the existing `@Get('quest-campaigns/:id')` handler, otherwise `export` is captured as an `:id`. The rest can go at the end of the class.

```typescript
  @Get('waitlist/entries/export')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export all waitlist entries as CSV' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async exportWaitlistEntries(
    @Res() res: Response,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const rows = await this.adminService.exportWaitlistEntries(status, search);
    sendCsv(
      res,
      'waitlist-entries',
      [
        { key: 'id', header: 'id' },
        { key: 'walletAddress', header: 'wallet_address' },
        { key: 'email', header: 'email' },
        { key: 'status', header: 'status' },
        { key: 'successfulReferralCount', header: 'successful_referral_count' },
        { key: 'createdAt', header: 'created_at' },
      ],
      rows,
    );
  }

  @Get('codes/export')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export all EARLY_ACCESS codes as CSV' })
  async exportCodes(@Res() res: Response) {
    const rows = await this.adminService.exportCodes();
    sendCsv(
      res,
      'access-codes',
      [
        { key: 'id', header: 'id' },
        { key: 'code', header: 'code' },
        { key: 'status', header: 'status' },
        { key: 'maxActivations', header: 'max_activations' },
        { key: 'activationCount', header: 'activation_count' },
        { key: 'expiresAt', header: 'expires_at' },
        { key: 'createdAt', header: 'created_at' },
      ],
      rows,
    );
  }

  @Get('campaigns/export')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export all email campaign runs as CSV' })
  async exportCampaigns(@Res() res: Response) {
    const rows = await this.adminService.listCampaigns();
    sendCsv(
      res,
      'email-campaigns',
      [
        { key: 'id', header: 'id' },
        { key: 'name', header: 'name' },
        { key: 'status', header: 'status' },
        { key: 'targetedCount', header: 'targeted' },
        { key: 'sentCount', header: 'sent' },
        { key: 'failedCount', header: 'failed' },
        { key: 'skippedCount', header: 'skipped' },
        { key: 'startedAt', header: 'started_at' },
        { key: 'completedAt', header: 'completed_at' },
        { key: 'createdAt', header: 'created_at' },
      ],
      rows as unknown as Array<Record<string, unknown>>,
    );
  }

  // NOTE: must be declared ABOVE @Get('quest-campaigns/:id')
  @Get('quest-campaigns/export')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export all quest campaigns as CSV' })
  async exportQuestCampaigns(@Res() res: Response) {
    const campaigns = await this.adminService.listQuestCampaigns();
    const rows = campaigns.map((c: any) => ({ ...c, taskCount: c._count?.tasks ?? 0 }));
    sendCsv(
      res,
      'quest-campaigns',
      [
        { key: 'id', header: 'id' },
        { key: 'title', header: 'title' },
        { key: 'category', header: 'category' },
        { key: 'protocol', header: 'protocol' },
        { key: 'isActive', header: 'is_active' },
        { key: 'isDaily', header: 'is_daily' },
        { key: 'isFeatured', header: 'is_featured' },
        { key: 'taskCount', header: 'task_count' },
        { key: 'startAt', header: 'start_at' },
        { key: 'endAt', header: 'end_at' },
        { key: 'maxParticipants', header: 'max_participants' },
        { key: 'createdAt', header: 'created_at' },
      ],
      rows,
    );
  }

  @Get('quest-wallets/export')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export full quest wallet leaderboard as CSV' })
  async exportQuestWallets(@Res() res: Response) {
    const rows = await this.adminService.getQuestLeaderboard(10000);
    sendCsv(
      res,
      'quest-wallets',
      [
        { key: 'rank', header: 'rank' },
        { key: 'walletAddress', header: 'wallet_address' },
        { key: 'username', header: 'username' },
        { key: 'totalPoints', header: 'total_points' },
        { key: 'tier', header: 'tier' },
      ],
      rows,
    );
  }

  @Get('tier-bands/export')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export tier bands as CSV' })
  async exportTierBands(@Res() res: Response) {
    const bands = await this.adminService.listTierBands();
    sendCsv(
      res,
      'tier-bands',
      [
        { key: 'tier', header: 'tier' },
        { key: 'min', header: 'min_points' },
      ],
      bands as unknown as Array<Record<string, unknown>>,
    );
  }

  @Get('stats/registrations/export')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export daily registration counts as CSV' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async exportRegistrationStats(@Res() res: Response, @Query('days') days = '30') {
    const daysNum = Math.min(Math.max(parseInt(days, 10) || 30, 1), 90);
    const rows = await this.adminService.getRegistrationStats(daysNum);
    sendCsv(
      res,
      'registrations',
      [
        { key: 'date', header: 'date' },
        { key: 'count', header: 'count' },
      ],
      rows,
    );
  }
```

- [ ] **Step 3: Build and run existing tests**

Run: `pnpm build && pnpm test`
Expected: build clean; all existing tests still pass.

- [ ] **Step 4: Commit**

```bash
git add src/modules/admin/admin.service.ts src/modules/admin/admin.controller.ts
git commit -m "feat(admin): CSV export endpoints for waitlist, codes, campaigns, quests, tier bands, registrations"
```

---

### Task 3: Export endpoints — topups + sponsor logs

**Files:**
- Modify: `src/modules/admin/topup-admin.controller.ts`
- Modify: `src/modules/admin/sponsor-admin.service.ts`
- Modify: `src/modules/admin/sponsor-admin.controller.ts`

**Interfaces:**
- Consumes: `sendCsv` from Task 1; existing `TopupAdminService.listFiatPending()` (returns Topup rows with `user.stellarPubkey` + `package` included); existing `gasSponsorshipUsage` mapping in `SponsorAdminService.getSponsorLogs`.
- Produces: `GET /api/admin/topups/export`, `GET /api/admin/sponsor/logs/export`; `SponsorAdminService.exportSponsorLogs()`.

- [ ] **Step 1: Add topups export endpoint**

In `src/modules/admin/topup-admin.controller.ts`, add to imports:

```typescript
import { Res } from '@nestjs/common'; // merge into existing @nestjs/common import
import type { Response } from 'express';
import { sendCsv } from '../../common/utils/csv';
```

Add this method to `TopupAdminController` (after `list`):

```typescript
  @Get('topups/export')
  @UseGuards(AdminAuthGuard)
  @Roles('SUPER_ADMIN', 'CAMPAIGN_ADMIN', 'ANALYST')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export pending fiat topups as CSV' })
  async export(@Res() res: Response) {
    const rows = await this.service.listFiatPending();
    const flat = rows.map((t: any) => ({
      id: t.id,
      wallet: t.user?.stellarPubkey ?? '',
      packageId: t.packageId,
      reference: t.reference,
      priceUsd: t.pricingSnapshotUsd,
      credits: t.pricingCredits,
      points: t.pricingPoints,
      status: t.status,
      createdAt: t.createdAt,
      expiresAt: t.expiresAt,
    }));
    sendCsv(
      res,
      'fiat-topups',
      [
        { key: 'id', header: 'id' },
        { key: 'wallet', header: 'wallet' },
        { key: 'packageId', header: 'package_id' },
        { key: 'reference', header: 'reference' },
        { key: 'priceUsd', header: 'price_usd' },
        { key: 'credits', header: 'credits' },
        { key: 'points', header: 'points' },
        { key: 'status', header: 'status' },
        { key: 'createdAt', header: 'created_at' },
        { key: 'expiresAt', header: 'expires_at' },
      ],
      flat,
    );
  }
```

- [ ] **Step 2: Add sponsor logs export (service + controller)**

In `src/modules/admin/sponsor-admin.service.ts`, add after `getSponsorLogs`:

```typescript
  /** Full unpaginated sponsor log export (same row shape as getSponsorLogs items). */
  async exportSponsorLogs() {
    const rows = await this.prisma.gasSponsorshipUsage.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { stellarPubkey: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      publicKey: r.user?.stellarPubkey ?? '',
      txHash: r.txHash,
      feeXlm: Number(r.feeStroops ?? 0n) / 1e7,
      txType: String(r.action),
      createdAt: r.createdAt,
    }));
  }
```

In `src/modules/admin/sponsor-admin.controller.ts`, add to imports (`Res` merged into `@nestjs/common`, plus):

```typescript
import type { Response } from 'express';
import { sendCsv } from '../../common/utils/csv';
```

Add after `getLogs`:

```typescript
  @Get('logs/export')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export all sponsor transaction logs as CSV' })
  async exportLogs(@Res() res: Response) {
    const rows = await this.service.exportSponsorLogs();
    sendCsv(
      res,
      'sponsor-logs',
      [
        { key: 'id', header: 'id' },
        { key: 'publicKey', header: 'public_key' },
        { key: 'txHash', header: 'tx_hash' },
        { key: 'feeXlm', header: 'fee_xlm' },
        { key: 'txType', header: 'tx_type' },
        { key: 'createdAt', header: 'created_at' },
      ],
      rows,
    );
  }
```

- [ ] **Step 3: Build and test**

Run: `pnpm build && pnpm test`
Expected: clean build, all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/modules/admin/topup-admin.controller.ts src/modules/admin/sponsor-admin.service.ts src/modules/admin/sponsor-admin.controller.ts
git commit -m "feat(admin): CSV export endpoints for fiat topups and sponsor logs"
```

---

### Task 4: `rejectedAt` migration + exclude rejected from pending list

**Files:**
- Modify: `prisma/schema.prisma` (Strategy model)
- Create: `prisma/migrations/<timestamp>_add_strategy_rejected_at/migration.sql` (generated)
- Modify: `src/modules/marketplace/marketplace.service.ts:686-691` (`listPendingStrategies` where-clause)

**Interfaces:**
- Produces: `Strategy.rejectedAt: Date | null` (`rejected_at` column) — Task 5's status derivation depends on it.

- [ ] **Step 1: Add the field to the Prisma model**

In `prisma/schema.prisma`, inside `model Strategy`, after the line `pausedAt DateTime? @map("paused_at")`, add:

```prisma
  rejectedAt             DateTime?             @map("rejected_at")
```

- [ ] **Step 2: Generate the migration**

Run (uses the native local Postgres on :5432):

```bash
npx prisma migrate dev --name add_strategy_rejected_at
```

Expected: a new folder under `prisma/migrations/` containing `ALTER TABLE "strategies" ADD COLUMN "rejected_at" TIMESTAMP(3);` and Prisma client regenerated.

- [ ] **Step 3: Exclude rejected strategies from the pending queue**

In `src/modules/marketplace/marketplace.service.ts`, in `listPendingStrategies`, change:

```typescript
      where: { isApproved: false },
```

to:

```typescript
      where: { isApproved: false, rejectedAt: null },
```

- [ ] **Step 4: Build and test**

Run: `pnpm build && pnpm test`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations src/modules/marketplace/marketplace.service.ts
git commit -m "feat(marketplace): add Strategy.rejectedAt; exclude rejected from pending queue"
```

---

### Task 5: MarketplaceAdminService + MarketplaceAdminController

**Files:**
- Create: `src/modules/admin/marketplace-admin.service.ts`
- Create: `src/modules/admin/marketplace-admin.service.spec.ts`
- Create: `src/modules/admin/marketplace-admin.controller.ts`
- Modify: `src/modules/admin/admin.module.ts` (register controller + provider)

**Interfaces:**
- Consumes: `Strategy.rejectedAt` (Task 4), `sendCsv` (Task 1), `PrismaService` from `../../database/prisma.service`, `AdminAuthGuard`.
- Produces (all consumed by frontend Task 9's hooks):
  - `GET /api/admin/marketplace/strategies?status=` → `AdminStrategyRow[]`: `{ id, name, slug, status, publisherName, publisherAddress, baseAsset, riskTier, perfFeeBps, keeperWalletAddress, publishTxHash, tvlUsd: number, userCount: number, publishedAt: string }`
  - `GET /api/admin/marketplace/strategies/export` → CSV of the same rows
  - `GET /api/admin/marketplace/overview` → `{ totalTvlUsd, totalDepositors, publisherCount, statusCounts: { PENDING, PUBLISHED, PAUSED, REJECTED, INACTIVE } }`
  - `GET /api/admin/marketplace/publishers` → `{ id, name, stellarAddress, commissionBps, strategyCount, createdAt }[]`
  - `GET /api/admin/marketplace/publishers/export` → CSV of the same rows
  - `POST /api/admin/marketplace/strategies/:id/approve` → `{ id, name, status }` (also clears `rejectedAt`)
  - `POST /api/admin/marketplace/strategies/:id/reject` → `{ id, name, status }`; 404 unknown id, **409** if not PENDING

- [ ] **Step 1: Write the failing service test**

Create `src/modules/admin/marketplace-admin.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  MarketplaceAdminService,
  deriveStrategyStatus,
} from './marketplace-admin.service';
import { PrismaService } from '../../database/prisma.service';

function makeStrategy(overrides: Record<string, unknown> = {}) {
  return {
    id: 's1',
    name: 'Alpha',
    slug: 'alpha',
    baseAsset: 'USDC',
    riskTier: 'BALANCED',
    perfFeeBps: 500,
    keeperWalletAddress: 'CKEEPER',
    publishTxHash: 'tx1',
    isApproved: false,
    isActive: true,
    pausedAt: null,
    rejectedAt: null,
    publishedAt: new Date('2026-07-01T00:00:00Z'),
    publisher: { name: 'Pub', stellarAddress: 'GPUB' },
    performance: { tvlUsd: '1234.56', userCount: 7 },
    ...overrides,
  };
}

describe('deriveStrategyStatus', () => {
  it('orders REJECTED > PENDING > PAUSED > PUBLISHED > INACTIVE', () => {
    expect(
      deriveStrategyStatus({ rejectedAt: new Date(), isApproved: false, pausedAt: null, isActive: true }),
    ).toBe('REJECTED');
    expect(
      deriveStrategyStatus({ rejectedAt: null, isApproved: false, pausedAt: null, isActive: true }),
    ).toBe('PENDING');
    expect(
      deriveStrategyStatus({ rejectedAt: null, isApproved: true, pausedAt: new Date(), isActive: true }),
    ).toBe('PAUSED');
    expect(
      deriveStrategyStatus({ rejectedAt: null, isApproved: true, pausedAt: null, isActive: true }),
    ).toBe('PUBLISHED');
    expect(
      deriveStrategyStatus({ rejectedAt: null, isApproved: true, pausedAt: null, isActive: false }),
    ).toBe('INACTIVE');
  });
});

describe('MarketplaceAdminService', () => {
  let service: MarketplaceAdminService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      strategy: { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
      strategyPublisher: { count: jest.fn(), findMany: jest.fn() },
    };
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [MarketplaceAdminService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(MarketplaceAdminService);
  });

  it('listStrategies maps publisher, performance, and derived status', async () => {
    prisma.strategy.findMany.mockResolvedValue([makeStrategy()]);
    const rows = await service.listStrategies();
    expect(rows).toEqual([
      {
        id: 's1',
        name: 'Alpha',
        slug: 'alpha',
        status: 'PENDING',
        publisherName: 'Pub',
        publisherAddress: 'GPUB',
        baseAsset: 'USDC',
        riskTier: 'BALANCED',
        perfFeeBps: 500,
        keeperWalletAddress: 'CKEEPER',
        publishTxHash: 'tx1',
        tvlUsd: 1234.56,
        userCount: 7,
        publishedAt: '2026-07-01T00:00:00.000Z',
      },
    ]);
  });

  it('listStrategies?status filters by derived status', async () => {
    prisma.strategy.findMany.mockResolvedValue([
      makeStrategy(),
      makeStrategy({ id: 's2', isApproved: true }),
    ]);
    const rows = await service.listStrategies('PUBLISHED');
    expect(rows.map((r) => r.id)).toEqual(['s2']);
  });

  it('getOverview aggregates TVL, depositors, publisher count, status counts', async () => {
    prisma.strategy.findMany.mockResolvedValue([
      makeStrategy(),
      makeStrategy({ id: 's2', isApproved: true, performance: { tvlUsd: '100', userCount: 3 } }),
    ]);
    prisma.strategyPublisher.count.mockResolvedValue(4);
    const o = await service.getOverview();
    expect(o.totalTvlUsd).toBeCloseTo(1334.56);
    expect(o.totalDepositors).toBe(10);
    expect(o.publisherCount).toBe(4);
    expect(o.statusCounts).toEqual({
      PENDING: 1,
      PUBLISHED: 1,
      PAUSED: 0,
      REJECTED: 0,
      INACTIVE: 0,
    });
  });

  it('approve marks approved+active and clears rejectedAt', async () => {
    prisma.strategy.findUnique.mockResolvedValue(makeStrategy());
    prisma.strategy.update.mockResolvedValue(
      makeStrategy({ isApproved: true, rejectedAt: null }),
    );
    const out = await service.approve('s1');
    expect(prisma.strategy.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { isApproved: true, isActive: true, rejectedAt: null },
    });
    expect(out.status).toBe('PUBLISHED');
  });

  it('reject sets rejectedAt on a PENDING strategy', async () => {
    prisma.strategy.findUnique.mockResolvedValue(makeStrategy());
    prisma.strategy.update.mockResolvedValue(makeStrategy({ rejectedAt: new Date() }));
    const out = await service.reject('s1');
    expect(prisma.strategy.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { rejectedAt: expect.any(Date) },
    });
    expect(out.status).toBe('REJECTED');
  });

  it('reject throws 409 when strategy is not PENDING', async () => {
    prisma.strategy.findUnique.mockResolvedValue(makeStrategy({ isApproved: true }));
    await expect(service.reject('s1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('approve/reject throw 404 for unknown id', async () => {
    prisma.strategy.findUnique.mockResolvedValue(null);
    await expect(service.approve('nope')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.reject('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('listPublishers maps strategy counts', async () => {
    prisma.strategyPublisher.findMany.mockResolvedValue([
      {
        id: 'p1',
        name: 'Pub',
        stellarAddress: 'GPUB',
        commissionBps: 10000,
        createdAt: new Date('2026-06-01T00:00:00Z'),
        _count: { strategies: 2 },
      },
    ]);
    const pubs = await service.listPublishers();
    expect(pubs).toEqual([
      {
        id: 'p1',
        name: 'Pub',
        stellarAddress: 'GPUB',
        commissionBps: 10000,
        strategyCount: 2,
        createdAt: '2026-06-01T00:00:00.000Z',
      },
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- marketplace-admin`
Expected: FAIL — cannot find module `./marketplace-admin.service`.

- [ ] **Step 3: Write the service**

Create `src/modules/admin/marketplace-admin.service.ts`:

```typescript
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export type DerivedStrategyStatus =
  | 'PENDING'
  | 'PUBLISHED'
  | 'PAUSED'
  | 'REJECTED'
  | 'INACTIVE';

/** Status is derived from flags — evaluation order is load-bearing. */
export function deriveStrategyStatus(s: {
  rejectedAt: Date | null;
  isApproved: boolean;
  pausedAt: Date | null;
  isActive: boolean;
}): DerivedStrategyStatus {
  if (s.rejectedAt) return 'REJECTED';
  if (!s.isApproved) return 'PENDING';
  if (s.pausedAt) return 'PAUSED';
  return s.isActive ? 'PUBLISHED' : 'INACTIVE';
}

@Injectable()
export class MarketplaceAdminService {
  private readonly logger = new Logger(MarketplaceAdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listStrategies(status?: string) {
    const strategies = await this.prisma.strategy.findMany({
      orderBy: { publishedAt: 'desc' },
      include: { publisher: true, performance: true },
    });
    const rows = strategies.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      status: deriveStrategyStatus(s),
      publisherName: s.publisher?.name ?? null,
      publisherAddress: s.publisher?.stellarAddress ?? null,
      baseAsset: s.baseAsset,
      riskTier: s.riskTier,
      perfFeeBps: s.perfFeeBps,
      keeperWalletAddress: s.keeperWalletAddress,
      publishTxHash: s.publishTxHash,
      tvlUsd: Number(s.performance?.tvlUsd ?? 0),
      userCount: s.performance?.userCount ?? 0,
      publishedAt: s.publishedAt.toISOString(),
    }));
    return status ? rows.filter((r) => r.status === status) : rows;
  }

  async getOverview() {
    const [rows, publisherCount] = await Promise.all([
      this.listStrategies(),
      this.prisma.strategyPublisher.count(),
    ]);
    const statusCounts: Record<DerivedStrategyStatus, number> = {
      PENDING: 0,
      PUBLISHED: 0,
      PAUSED: 0,
      REJECTED: 0,
      INACTIVE: 0,
    };
    let totalTvlUsd = 0;
    let totalDepositors = 0;
    for (const r of rows) {
      statusCounts[r.status]++;
      totalTvlUsd += r.tvlUsd;
      totalDepositors += r.userCount;
    }
    return { totalTvlUsd, totalDepositors, publisherCount, statusCounts };
  }

  async listPublishers() {
    const pubs = await this.prisma.strategyPublisher.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { strategies: true } } },
    });
    return pubs.map((p) => ({
      id: p.id,
      name: p.name,
      stellarAddress: p.stellarAddress,
      commissionBps: p.commissionBps,
      strategyCount: p._count.strategies,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  async approve(strategyId: string) {
    const strategy = await this.prisma.strategy.findUnique({ where: { id: strategyId } });
    if (!strategy) throw new NotFoundException('Strategy not found');
    const updated = await this.prisma.strategy.update({
      where: { id: strategyId },
      data: { isApproved: true, isActive: true, rejectedAt: null },
    });
    this.logger.log(`Admin approved strategy ${strategyId} (${updated.name})`);
    return { id: updated.id, name: updated.name, status: deriveStrategyStatus(updated) };
  }

  async reject(strategyId: string) {
    const strategy = await this.prisma.strategy.findUnique({ where: { id: strategyId } });
    if (!strategy) throw new NotFoundException('Strategy not found');
    if (deriveStrategyStatus(strategy) !== 'PENDING') {
      throw new ConflictException('Only PENDING strategies can be rejected');
    }
    const updated = await this.prisma.strategy.update({
      where: { id: strategyId },
      data: { rejectedAt: new Date() },
    });
    this.logger.log(`Admin rejected strategy ${strategyId} (${updated.name})`);
    return { id: updated.id, name: updated.name, status: deriveStrategyStatus(updated) };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- marketplace-admin`
Expected: all passing.

- [ ] **Step 5: Write the controller**

Create `src/modules/admin/marketplace-admin.controller.ts`:

```typescript
import { Controller, Get, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CsvColumn, sendCsv } from '../../common/utils/csv';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import { MarketplaceAdminService } from './marketplace-admin.service';

const STRATEGY_COLUMNS: CsvColumn[] = [
  { key: 'id', header: 'id' },
  { key: 'name', header: 'name' },
  { key: 'slug', header: 'slug' },
  { key: 'status', header: 'status' },
  { key: 'publisherName', header: 'publisher_name' },
  { key: 'publisherAddress', header: 'publisher_address' },
  { key: 'baseAsset', header: 'base_asset' },
  { key: 'riskTier', header: 'risk_tier' },
  { key: 'perfFeeBps', header: 'perf_fee_bps' },
  { key: 'keeperWalletAddress', header: 'keeper_wallet' },
  { key: 'publishTxHash', header: 'publish_tx_hash' },
  { key: 'tvlUsd', header: 'tvl_usd' },
  { key: 'userCount', header: 'depositors' },
  { key: 'publishedAt', header: 'published_at' },
];

const PUBLISHER_COLUMNS: CsvColumn[] = [
  { key: 'id', header: 'id' },
  { key: 'name', header: 'name' },
  { key: 'stellarAddress', header: 'stellar_address' },
  { key: 'commissionBps', header: 'commission_bps' },
  { key: 'strategyCount', header: 'strategy_count' },
  { key: 'createdAt', header: 'created_at' },
];

@ApiTags('admin')
@Controller('admin/marketplace')
export class MarketplaceAdminController {
  constructor(private readonly service: MarketplaceAdminService) {}

  @Get('strategies')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'All marketplace strategies with derived status + TVL' })
  @ApiQuery({ name: 'status', required: false, type: String })
  async listStrategies(@Query('status') status?: string) {
    return this.service.listStrategies(status);
  }

  @Get('strategies/export')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export marketplace strategies as CSV' })
  @ApiQuery({ name: 'status', required: false, type: String })
  async exportStrategies(@Res() res: Response, @Query('status') status?: string) {
    const rows = await this.service.listStrategies(status);
    sendCsv(res, 'marketplace-strategies', STRATEGY_COLUMNS, rows);
  }

  @Get('overview')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marketplace KPI aggregates (TVL, depositors, status counts)' })
  async getOverview() {
    return this.service.getOverview();
  }

  @Get('publishers')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Strategy publishers with strategy counts' })
  async listPublishers() {
    return this.service.listPublishers();
  }

  @Get('publishers/export')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export strategy publishers as CSV' })
  async exportPublishers(@Res() res: Response) {
    const rows = await this.service.listPublishers();
    sendCsv(res, 'strategy-publishers', PUBLISHER_COLUMNS, rows);
  }

  @Post('strategies/:id/approve')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a strategy for the marketplace' })
  async approve(@Param('id') id: string) {
    return this.service.approve(id);
  }

  @Post('strategies/:id/reject')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a PENDING strategy (409 otherwise)' })
  async reject(@Param('id') id: string) {
    return this.service.reject(id);
  }
}
```

- [ ] **Step 6: Register in the admin module**

In `src/modules/admin/admin.module.ts`:

```typescript
import { MarketplaceAdminController } from './marketplace-admin.controller';
import { MarketplaceAdminService } from './marketplace-admin.service';
```

Add `MarketplaceAdminController` to the `controllers` array and `MarketplaceAdminService` to the `providers` array.

- [ ] **Step 7: Build and full test run**

Run: `pnpm build && pnpm test`
Expected: clean.

- [ ] **Step 8 (optional, if local backend runs): smoke-test one export end-to-end**

```bash
# with backend running on :6756 and an admin user seeded
TOKEN=$(curl -s -X POST http://localhost:6756/api/admin-auth/login -H 'Content-Type: application/json' -d '{"email":"<admin>","password":"<pass>"}' | jq -r '.data.accessToken // .accessToken')
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:6756/api/admin/marketplace/strategies/export" | head -3
```

Expected: CSV header line `id,name,slug,status,...`.

- [ ] **Step 9: Commit**

```bash
git add src/modules/admin/marketplace-admin.service.ts src/modules/admin/marketplace-admin.service.spec.ts src/modules/admin/marketplace-admin.controller.ts src/modules/admin/admin.module.ts
git commit -m "feat(admin): marketplace admin endpoints — strategies, overview, publishers, approve/reject, CSV exports"
```

---

# PHASE B — tasmil-finance repo

All Task 6–12 commands run in `/Users/nathan/Documents/morcalab/tasmil/tasmil-finance`.

### Task 0b: Create frontend feature branch

- [ ] **Step 1: Branch**

```bash
cd /Users/nathan/Documents/morcalab/tasmil/tasmil-finance
git checkout -b feat/admin-csv-export-strategies-page
```

---

### Task 6: Shared `adminDownload` + `ExportCsvButton`

**Files:**
- Create: `src/shared/lib/admin-download.ts`
- Create: `src/shared/components/export-csv-button.tsx`
- Test: `src/features/admin/__tests__/export-csv-button.test.tsx`

**Interfaces:**
- Consumes: `useAdminAuthStore` from `@/store/use-admin-auth` (existing global store with `token`, `clearAuth`).
- Produces: `adminDownload(path: string): Promise<void>`; `<ExportCsvButton endpoint={string} params?={Record<string,string>} disabled?={boolean} />` — used by every admin page in Tasks 7 and 10–12. Lives in `src/shared/` so feature modules (`admin-topups`, `admin-strategies`) can use it without cross-feature imports.

- [ ] **Step 1: Write the failing test**

Create `src/features/admin/__tests__/export-csv-button.test.tsx`:

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { ExportCsvButton } from "@/shared/components/export-csv-button";
import { adminDownload } from "@/shared/lib/admin-download";

jest.mock("@/shared/lib/admin-download", () => ({ adminDownload: jest.fn() }));
jest.mock("sonner", () => ({ toast: { error: jest.fn() } }));

const mockDownload = adminDownload as jest.Mock;

describe("ExportCsvButton", () => {
  beforeEach(() => {
    mockDownload.mockReset();
    (toast.error as jest.Mock).mockReset();
  });

  it("downloads from the endpoint with params as a query string", async () => {
    mockDownload.mockResolvedValue(undefined);
    render(
      <ExportCsvButton endpoint="/api/admin/waitlist/entries/export" params={{ search: "gab" }} />
    );
    fireEvent.click(screen.getByRole("button", { name: /export csv/i }));
    await waitFor(() =>
      expect(mockDownload).toHaveBeenCalledWith("/api/admin/waitlist/entries/export?search=gab")
    );
  });

  it("downloads from the bare endpoint when no params given", async () => {
    mockDownload.mockResolvedValue(undefined);
    render(<ExportCsvButton endpoint="/api/admin/codes/export" />);
    fireEvent.click(screen.getByRole("button", { name: /export csv/i }));
    await waitFor(() => expect(mockDownload).toHaveBeenCalledWith("/api/admin/codes/export"));
  });

  it("disables while the download is in flight", async () => {
    let release: () => void = () => {};
    mockDownload.mockImplementation(() => new Promise<void>((r) => (release = r)));
    render(<ExportCsvButton endpoint="/api/admin/codes/export" />);
    const btn = screen.getByRole("button", { name: /export csv/i });
    fireEvent.click(btn);
    await waitFor(() => expect(btn).toBeDisabled());
    release();
    await waitFor(() => expect(btn).not.toBeDisabled());
  });

  it("shows an error toast when the download fails", async () => {
    mockDownload.mockRejectedValue(new Error("Service unavailable"));
    render(<ExportCsvButton endpoint="/api/admin/codes/export" />);
    fireEvent.click(screen.getByRole("button", { name: /export csv/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Service unavailable"));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- export-csv-button`
Expected: FAIL — cannot resolve `@/shared/components/export-csv-button`.

- [ ] **Step 3: Write `adminDownload`**

Create `src/shared/lib/admin-download.ts`:

```typescript
import { useAdminAuthStore } from "@/store/use-admin-auth";

/**
 * Fetch an admin CSV/binary endpoint with the admin JWT and trigger a browser
 * download named from the Content-Disposition header.
 */
export async function adminDownload(path: string): Promise<void> {
  const token = useAdminAuthStore.getState().token;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, { headers });

  if (res.status === 401) {
    useAdminAuthStore.getState().clearAuth();
    if (typeof window !== "undefined") window.location.assign("/admin/login");
    throw new Error("Session expired");
  }
  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(json?.message ?? `HTTP ${res.status}`);
  }

  const blob = await res.blob();
  const disposition = res.headers.get("content-disposition") ?? "";
  const match = /filename="?([^";]+)"?/.exec(disposition);
  const filename = match?.[1] ?? `export-${new Date().toISOString().slice(0, 10)}.csv`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 4: Write `ExportCsvButton`**

Create `src/shared/components/export-csv-button.tsx` (inline styles match the existing admin pages):

```tsx
"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { adminDownload } from "@/shared/lib/admin-download";

interface ExportCsvButtonProps {
  /** Backend export path, e.g. "/api/admin/codes/export". */
  endpoint: string;
  /** Optional query params (current table filters). */
  params?: Record<string, string>;
  disabled?: boolean;
}

export function ExportCsvButton({ endpoint, params, disabled }: ExportCsvButtonProps) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      const qs = params && Object.keys(params).length > 0 ? `?${new URLSearchParams(params)}` : "";
      await adminDownload(`${endpoint}${qs}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || pending}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 14px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
        color: "#F5F8FC",
        cursor: disabled || pending ? "default" : "pointer",
        opacity: disabled || pending ? 0.6 : 1,
        fontSize: 13,
      }}
    >
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
      Export CSV
    </button>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test -- export-csv-button`
Expected: 4 passing.

- [ ] **Step 6: Commit**

```bash
git add src/shared/lib/admin-download.ts src/shared/components/export-csv-button.tsx src/features/admin/__tests__/export-csv-button.test.tsx
git commit -m "feat(admin): shared ExportCsvButton + adminDownload helper"
```

---

### Task 7: Wire the export button into every admin page

**Files:**
- Modify: `src/app/admin/(app)/quests/page.tsx` (replace ad-hoc export)
- Modify: `src/app/admin/(app)/waitlist/page.tsx:195`
- Modify: `src/features/admin-topups/components/admin-topups-page.tsx:51`
- Modify: `src/app/admin/(app)/codes/page.tsx` (codes-list panel heading, second `Typography h2`)
- Modify: `src/app/admin/(app)/campaigns/page.tsx:284` ("Campaign History" heading)
- Modify: `src/app/admin/(app)/quest-campaigns/page.tsx:145`
- Modify: `src/app/admin/(app)/tier-bands/page.tsx:108`
- Modify: `src/app/admin/(app)/sponsor/page.tsx:865`
- Modify: `src/app/admin/(app)/dashboard/page.tsx` ("Overview" header block)

**Interfaces:**
- Consumes: `ExportCsvButton` from Task 6; backend endpoints from Tasks 2–3 (reached directly through the existing `/api/admin/:path*` rewrite — no proxy routes).

Every page gets `import { ExportCsvButton } from "@/shared/components/export-csv-button";`. Line numbers are anchors from planning time — locate by the quoted JSX if drifted.

- [ ] **Step 1: quests page — replace the ad-hoc export**

In `src/app/admin/(app)/quests/page.tsx`:
1. Delete the whole `exportCsv` function (lines 13–33) and remove `Download` from the `lucide-react` import.
2. Replace the header `<button …>Export CSV</button>` block (lines 60–79) with:

```tsx
        <ExportCsvButton endpoint="/api/admin/quest-wallets/export" />
```

3. Add the import.

- [ ] **Step 2: waitlist page**

Replace `<h1 style={{ fontSize: 22, fontWeight: 800 }}>Waitlist</h1>` with:

```tsx
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Waitlist</h1>
        <ExportCsvButton
          endpoint="/api/admin/waitlist/entries/export"
          params={search ? { search } : undefined}
        />
      </div>
```

(`search` is the page's existing debounced state, line 145.)

- [ ] **Step 3: topups feature page**

In `src/features/admin-topups/components/admin-topups-page.tsx`, replace
`<h1 className="mb-6 font-bold text-2xl tracking-tight">Pending fiat topups</h1>` with:

```tsx
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-bold text-2xl tracking-tight">Pending fiat topups</h1>
        <ExportCsvButton endpoint="/api/admin/topups/export" />
      </div>
```

- [ ] **Step 4: codes page**

Wrap the codes-list panel heading (the second `<Typography variant="h2" className="font-bold text-xl">`, ~line 123) in a flex row with `<ExportCsvButton endpoint="/api/admin/codes/export" />`:

```tsx
        <div className="flex items-center justify-between">
          <Typography variant="h2" className="font-bold text-xl">
            {/* keep existing heading text */}
          </Typography>
          <ExportCsvButton endpoint="/api/admin/codes/export" />
        </div>
```

- [ ] **Step 5: campaigns page**

Replace the "Campaign History" heading (line 284) with:

```tsx
        <div className="mb-4 flex items-center justify-between">
          <Typography variant="h2" className="font-bold text-xl">
            Campaign History
          </Typography>
          <ExportCsvButton endpoint="/api/admin/campaigns/export" />
        </div>
```

- [ ] **Step 6: quest-campaigns page**

Wrap the `<h1 …>Quest Campaigns</h1>` (line 145) in the same flex-row pattern as Step 2, with `<ExportCsvButton endpoint="/api/admin/quest-campaigns/export" />`.

- [ ] **Step 7: tier-bands page**

Wrap `<h1 …>Quest Tier Bands</h1>` (line 108) in the flex-row pattern with `<ExportCsvButton endpoint="/api/admin/tier-bands/export" />`. Note this h1 has `marginBottom: 6` — move that to the wrapper div.

- [ ] **Step 8: sponsor page**

Wrap `<h1 …>Gas Sponsor</h1>` (line 865) in the flex-row pattern with `<ExportCsvButton endpoint="/api/admin/sponsor/logs/export" />`, moving its `margin: "0 0 20px"` to the wrapper.

- [ ] **Step 9: dashboard page**

Wrap the "Overview" header block (the `<div>` containing the `Overview` Typography and its subtitle) in:

```tsx
      <div className="flex items-start justify-between">
        {/* existing Overview header div stays unchanged inside */}
        <ExportCsvButton endpoint="/api/admin/stats/registrations/export" params={{ days: "30" }} />
      </div>
```

- [ ] **Step 10: Verify**

Run: `pnpm type-check && pnpm check:fix && pnpm test`
Expected: clean types, Biome auto-fixes formatting, existing tests (incl. `admin-topups` tests — the page kept its `data-testid`s) pass.

- [ ] **Step 11: Commit**

```bash
git add -A src/app/admin src/features/admin-topups
git commit -m "feat(admin): CSV export buttons on all admin data tables"
```

---

### Task 8: `/api/marketplace` proxy rewrite

**Files:**
- Modify: `src/lib/runtime-urls.ts` (backend `prefixes` array, ~line 83)

**Interfaces:**
- Produces: same-origin `/api/marketplace/*` forwards to the backend — Task 9's participants + leaderboard hooks depend on it. The file's own comment says the rewrites test adapts automatically.

- [ ] **Step 1: Add the prefix**

In the `PROXY_TARGETS.backend.prefixes` array, insert `"/api/marketplace",` between `"/api/internal/credit"` and `"/api/pools"` (keep alphabetical order).

- [ ] **Step 2: Verify**

Run: `pnpm test -- runtime-urls`
Expected: pass (the rewrites test derives from the same array).

- [ ] **Step 3: Commit**

```bash
git add src/lib/runtime-urls.ts
git commit -m "feat(admin): proxy /api/marketplace to backend for strategies admin page"
```

---

### Task 9: `admin-strategies` feature — types + hooks

**Files:**
- Create: `src/features/admin-strategies/types.ts`
- Create: `src/features/admin-strategies/hooks/use-admin-marketplace.ts`
- Create: `src/features/admin-strategies/index.ts`

**Interfaces:**
- Consumes: `adminFetch` from `@/features/admin/lib/admin-fetch` — **not allowed** (cross-feature). Instead this feature re-implements the tiny authorized-fetch inline using `useAdminAuthStore` (same pattern `admin-topups` uses); backend endpoints from Task 5; public `/api/marketplace/*` endpoints via Task 8's rewrite.
- Produces (used by Tasks 10–12): `useAdminStrategies(status?)`, `useApproveStrategy()`, `useRejectStrategy()`, `useMarketplaceOverview()`, `useAdminPublishers()`, `useStrategyParticipants(strategyId | null)`, `useMarketplaceLeaderboard()`; types `AdminStrategy`, `StrategyStatus`, `MarketplaceOverview`, `AdminPublisher`, `StrategyParticipant`, `LeaderboardEntry`.

- [ ] **Step 1: Write types**

Create `src/features/admin-strategies/types.ts`:

```typescript
export type StrategyStatus = "PENDING" | "PUBLISHED" | "PAUSED" | "REJECTED" | "INACTIVE";

export interface AdminStrategy {
  id: string;
  name: string;
  slug: string;
  status: StrategyStatus;
  publisherName: string | null;
  publisherAddress: string | null;
  baseAsset: string;
  riskTier: string;
  perfFeeBps: number;
  keeperWalletAddress: string | null;
  publishTxHash: string | null;
  tvlUsd: number;
  userCount: number;
  publishedAt: string;
}

export interface MarketplaceOverview {
  totalTvlUsd: number;
  totalDepositors: number;
  publisherCount: number;
  statusCounts: Record<StrategyStatus, number>;
}

export interface AdminPublisher {
  id: string;
  name: string;
  stellarAddress: string;
  commissionBps: number;
  strategyCount: number;
  createdAt: string;
}

export interface StrategyParticipant {
  wallet: string;
  joined: string;
  deposited: number;
  sharePct: number;
}

export interface LeaderboardEntry {
  rank: number;
  strategyId: string;
  slug: string;
  name: string;
  publisherName: string;
  apy: number;
  tvlUsd: number;
  userCount: number;
  riskTier: string;
}
```

- [ ] **Step 2: Write hooks**

Create `src/features/admin-strategies/hooks/use-admin-marketplace.ts`:

```typescript
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAdminAuthStore } from "@/store/use-admin-auth";
import type {
  AdminPublisher,
  AdminStrategy,
  LeaderboardEntry,
  MarketplaceOverview,
  StrategyParticipant,
} from "../types";

/** Authorized fetch against admin endpoints (mirrors features/admin/lib/admin-fetch). */
async function marketplaceAdminFetch<T>(path: string, method = "GET"): Promise<T> {
  const token = useAdminAuthStore.getState().token;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(path, { method, headers });
  const json = (await res.json().catch(() => null)) as
    | { data?: T; message?: string }
    | null;
  if (res.status === 401) {
    useAdminAuthStore.getState().clearAuth();
    if (typeof window !== "undefined") window.location.assign("/admin/login");
    throw new Error(json?.message ?? "Session expired");
  }
  if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
  return (json?.data ?? json) as T;
}

/** Public marketplace endpoints return { success, data } — unwrap without auth. */
async function marketplacePublicFetch<T>(path: string): Promise<T> {
  const res = await fetch(path);
  const json = (await res.json().catch(() => null)) as
    | { data?: T; message?: string }
    | null;
  if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
  return (json?.data ?? json) as T;
}

export function useAdminStrategies(status?: string) {
  return useQuery({
    queryKey: ["admin-marketplace-strategies", status ?? "ALL"],
    queryFn: () =>
      marketplaceAdminFetch<AdminStrategy[]>(
        `/api/admin/marketplace/strategies${status ? `?status=${status}` : ""}`
      ),
    refetchInterval: 30_000,
  });
}

export function useMarketplaceOverview() {
  return useQuery({
    queryKey: ["admin-marketplace-overview"],
    queryFn: () => marketplaceAdminFetch<MarketplaceOverview>("/api/admin/marketplace/overview"),
    refetchInterval: 30_000,
  });
}

export function useAdminPublishers() {
  return useQuery({
    queryKey: ["admin-marketplace-publishers"],
    queryFn: () => marketplaceAdminFetch<AdminPublisher[]>("/api/admin/marketplace/publishers"),
  });
}

function useStrategyAction(action: "approve" | "reject") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (strategyId: string) =>
      marketplaceAdminFetch<{ id: string; name: string; status: string }>(
        `/api/admin/marketplace/strategies/${strategyId}/${action}`,
        "POST"
      ),
    onSuccess: (data) => {
      toast.success(`${data.name} ${action}d`);
      qc.invalidateQueries({ queryKey: ["admin-marketplace-strategies"] });
      qc.invalidateQueries({ queryKey: ["admin-marketplace-overview"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useApproveStrategy() {
  return useStrategyAction("approve");
}

export function useRejectStrategy() {
  return useStrategyAction("reject");
}

export function useStrategyParticipants(strategyId: string | null) {
  return useQuery({
    queryKey: ["admin-marketplace-participants", strategyId],
    enabled: strategyId !== null,
    queryFn: async () => {
      const data = await marketplacePublicFetch<{ participants: StrategyParticipant[] }>(
        `/api/marketplace/strategies/${strategyId}/participants`
      );
      return data.participants;
    },
  });
}

export function useMarketplaceLeaderboard() {
  return useQuery({
    queryKey: ["admin-marketplace-leaderboard"],
    queryFn: async () => {
      const data = await marketplacePublicFetch<{ entries: LeaderboardEntry[] }>(
        "/api/marketplace/leaderboard?sort=tvl_desc&limit=100"
      );
      return data.entries;
    },
  });
}
```

(No barrel yet — the components it exports arrive in Tasks 10–12, so the barrel `index.ts` is created in Task 12 to keep every commit type-clean.)

- [ ] **Step 3: Verify what exists so far**

Run: `pnpm type-check`
Expected: clean (no barrel yet, only types + hooks).

- [ ] **Step 4: Commit**

```bash
git add src/features/admin-strategies
git commit -m "feat(admin-strategies): types + marketplace admin hooks"
```

---

### Task 10: Strategies tab (table, status filter, approve/reject)

**Files:**
- Create: `src/features/admin-strategies/components/strategies-tab.tsx`
- Test: `src/features/admin/__tests__/admin-strategies-tab.test.tsx`

**Interfaces:**
- Consumes: `useAdminStrategies`, `useApproveStrategy`, `useRejectStrategy` (Task 9), `ExportCsvButton` (Task 6), `AdminStrategy`, `StrategyStatus` types.
- Produces: `<StrategiesTab />` used by Task 12's page.

- [ ] **Step 1: Write the failing test**

Create `src/features/admin/__tests__/admin-strategies-tab.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { StrategiesTab } from "@/features/admin-strategies/components/strategies-tab";
import {
  useAdminStrategies,
  useApproveStrategy,
  useRejectStrategy,
} from "@/features/admin-strategies/hooks/use-admin-marketplace";

jest.mock("@/features/admin-strategies/hooks/use-admin-marketplace", () => ({
  useAdminStrategies: jest.fn(),
  useApproveStrategy: jest.fn(),
  useRejectStrategy: jest.fn(),
}));
jest.mock("@/shared/lib/admin-download", () => ({ adminDownload: jest.fn() }));

const mockStrategies = useAdminStrategies as jest.Mock;
const mockApprove = useApproveStrategy as jest.Mock;
const mockReject = useRejectStrategy as jest.Mock;

const rows = [
  {
    id: "s1",
    name: "Alpha",
    slug: "alpha",
    status: "PENDING",
    publisherName: "Pub",
    publisherAddress: "GPUB",
    baseAsset: "USDC",
    riskTier: "BALANCED",
    perfFeeBps: 500,
    keeperWalletAddress: "CKEEPER",
    publishTxHash: "tx1",
    tvlUsd: 1000,
    userCount: 3,
    publishedAt: "2026-07-01T00:00:00.000Z",
  },
  {
    id: "s2",
    name: "Beta",
    slug: "beta",
    status: "PUBLISHED",
    publisherName: null,
    publisherAddress: null,
    baseAsset: "XLM",
    riskTier: "AGGRESSIVE",
    perfFeeBps: 1000,
    keeperWalletAddress: null,
    publishTxHash: null,
    tvlUsd: 250.5,
    userCount: 1,
    publishedAt: "2026-06-15T00:00:00.000Z",
  },
];

describe("StrategiesTab", () => {
  const approveMutate = jest.fn();
  const rejectMutate = jest.fn();

  beforeEach(() => {
    approveMutate.mockReset();
    rejectMutate.mockReset();
    mockStrategies.mockReturnValue({ data: rows, isLoading: false, isError: false });
    mockApprove.mockReturnValue({ mutate: approveMutate, isPending: false });
    mockReject.mockReturnValue({ mutate: rejectMutate, isPending: false });
  });

  it("renders one row per strategy with status badge", () => {
    render(<StrategiesTab />);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByText("PENDING")).toBeInTheDocument();
    expect(screen.getByText("PUBLISHED")).toBeInTheDocument();
  });

  it("shows approve/reject only on PENDING rows and confirms before mutating", () => {
    render(<StrategiesTab />);
    expect(screen.getAllByRole("button", { name: /approve/i })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /approve/i }));
    // confirm dialog appears
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));
    expect(approveMutate).toHaveBeenCalledWith("s1");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- admin-strategies-tab`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the component**

Create `src/features/admin-strategies/components/strategies-tab.tsx`:

```tsx
"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { ExportCsvButton } from "@/shared/components/export-csv-button";
import {
  useAdminStrategies,
  useApproveStrategy,
  useRejectStrategy,
} from "../hooks/use-admin-marketplace";
import type { StrategyStatus } from "../types";

const STATUS_FILTERS: Array<StrategyStatus | "ALL"> = [
  "ALL",
  "PENDING",
  "PUBLISHED",
  "PAUSED",
  "REJECTED",
  "INACTIVE",
];

const STATUS_COLORS: Record<StrategyStatus, { bg: string; fg: string }> = {
  PENDING: { bg: "rgba(251,191,36,0.15)", fg: "#FBBF24" },
  PUBLISHED: { bg: "rgba(74,222,128,0.15)", fg: "#4ADE80" },
  PAUSED: { bg: "rgba(148,163,184,0.15)", fg: "#94A3B8" },
  REJECTED: { bg: "rgba(251,113,133,0.15)", fg: "#FB7185" },
  INACTIVE: { bg: "rgba(148,163,184,0.15)", fg: "#94A3B8" },
};

function short(addr: string | null): string {
  if (!addr) return "—";
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-6)}` : addr;
}

export function StrategiesTab() {
  const [status, setStatus] = useState<StrategyStatus | "ALL">("ALL");
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    name: string;
    action: "approve" | "reject";
  } | null>(null);

  const { data, isLoading, isError } = useAdminStrategies(
    status === "ALL" ? undefined : status
  );
  const approve = useApproveStrategy();
  const reject = useRejectStrategy();

  const strategies = data ?? [];

  function handleConfirm() {
    if (!confirmAction) return;
    if (confirmAction.action === "approve") approve.mutate(confirmAction.id);
    else reject.mutate(confirmAction.id);
    setConfirmAction(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              style={{
                padding: "6px 12px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                border: "1px solid rgba(255,255,255,0.1)",
                background: status === s ? "rgba(0,191,255,0.2)" : "rgba(255,255,255,0.04)",
                color: status === s ? "#7DD3FC" : "rgba(245,248,252,0.6)",
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <ExportCsvButton
          endpoint="/api/admin/marketplace/strategies/export"
          params={status === "ALL" ? undefined : { status }}
        />
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Loader2 className="animate-spin" />
        </div>
      ) : isError ? (
        <div style={{ color: "#FB7185" }}>Failed to load strategies</div>
      ) : strategies.length === 0 ? (
        <div style={{ color: "rgba(245,248,252,0.4)", padding: 40, textAlign: "center" }}>
          No strategies
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "rgba(245,248,252,0.4)" }}>
              <th style={{ padding: "8px 10px" }}>Name</th>
              <th style={{ padding: "8px 10px" }}>Status</th>
              <th style={{ padding: "8px 10px" }}>Publisher</th>
              <th style={{ padding: "8px 10px" }}>Asset</th>
              <th style={{ padding: "8px 10px", textAlign: "right" }}>Fee (bps)</th>
              <th style={{ padding: "8px 10px", textAlign: "right" }}>TVL (USD)</th>
              <th style={{ padding: "8px 10px", textAlign: "right" }}>Depositors</th>
              <th style={{ padding: "8px 10px" }}>Keeper</th>
              <th style={{ padding: "8px 10px" }}>Published</th>
              <th style={{ padding: "8px 10px" }} />
            </tr>
          </thead>
          <tbody>
            {strategies.map((s) => (
              <tr key={s.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <td style={{ padding: 10, fontWeight: 600 }}>{s.name}</td>
                <td style={{ padding: 10 }}>
                  <span
                    style={{
                      padding: "3px 10px",
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 600,
                      background: STATUS_COLORS[s.status].bg,
                      color: STATUS_COLORS[s.status].fg,
                    }}
                  >
                    {s.status}
                  </span>
                </td>
                <td style={{ padding: 10 }}>
                  {s.publisherName ?? "—"}
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(245,248,252,0.4)" }}>
                    {short(s.publisherAddress)}
                  </div>
                </td>
                <td style={{ padding: 10 }}>{s.baseAsset}</td>
                <td style={{ padding: 10, textAlign: "right" }}>{s.perfFeeBps}</td>
                <td style={{ padding: 10, textAlign: "right", fontWeight: 600 }}>
                  {s.tvlUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </td>
                <td style={{ padding: 10, textAlign: "right" }}>{s.userCount}</td>
                <td style={{ padding: 10, fontFamily: "monospace", fontSize: 11 }}>
                  {short(s.keeperWalletAddress)}
                </td>
                <td style={{ padding: 10, color: "rgba(245,248,252,0.6)", fontSize: 12 }}>
                  {s.publishedAt.slice(0, 10)}
                </td>
                <td style={{ padding: 10 }}>
                  {s.status === "PENDING" && (
                    <span style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        disabled={approve.isPending || reject.isPending}
                        onClick={() => setConfirmAction({ id: s.id, name: s.name, action: "approve" })}
                        style={{
                          padding: "5px 10px",
                          borderRadius: 8,
                          fontSize: 12,
                          cursor: "pointer",
                          border: "1px solid rgba(74,222,128,0.3)",
                          background: "rgba(74,222,128,0.12)",
                          color: "#4ADE80",
                        }}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={approve.isPending || reject.isPending}
                        onClick={() => setConfirmAction({ id: s.id, name: s.name, action: "reject" })}
                        style={{
                          padding: "5px 10px",
                          borderRadius: 8,
                          fontSize: 12,
                          cursor: "pointer",
                          border: "1px solid rgba(251,113,133,0.3)",
                          background: "rgba(251,113,133,0.12)",
                          color: "#FB7185",
                        }}
                      >
                        Reject
                      </button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {confirmAction && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 16px",
            borderRadius: 10,
            background:
              confirmAction.action === "approve" ? "rgba(74,222,128,0.08)" : "rgba(251,113,133,0.08)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <span style={{ fontSize: 13 }}>
            {confirmAction.action === "approve" ? "Approve" : "Reject"} “{confirmAction.name}”?
          </span>
          <button
            type="button"
            onClick={handleConfirm}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              background: confirmAction.action === "approve" ? "#4ADE80" : "#FB7185",
              color: "#0B0F14",
            }}
          >
            Confirm
          </button>
          <button
            type="button"
            onClick={() => setConfirmAction(null)}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              fontSize: 12,
              cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "transparent",
              color: "rgba(245,248,252,0.7)",
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- admin-strategies-tab`
Expected: 2 passing.

- [ ] **Step 5: Commit**

```bash
git add src/features/admin-strategies/components/strategies-tab.tsx src/features/admin/__tests__/admin-strategies-tab.test.tsx
git commit -m "feat(admin-strategies): strategies tab with status filter and approve/reject"
```

---

### Task 11: Deposits & TVL tab (overview KPIs + per-strategy breakdown + participants)

**Files:**
- Create: `src/features/admin-strategies/components/overview-tab.tsx`

**Interfaces:**
- Consumes: `useMarketplaceOverview`, `useAdminStrategies`, `useStrategyParticipants` (Task 9), `ExportCsvButton` (Task 6).
- Produces: `<OverviewTab />` for Task 12.

- [ ] **Step 1: Write the component**

Create `src/features/admin-strategies/components/overview-tab.tsx`:

```tsx
"use client";

import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { Fragment, useState } from "react";
import { ExportCsvButton } from "@/shared/components/export-csv-button";
import {
  useAdminStrategies,
  useMarketplaceOverview,
  useStrategyParticipants,
} from "../hooks/use-admin-marketplace";

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        flex: 1,
        padding: "14px 16px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: "rgba(245,248,252,0.4)" }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function ParticipantsRow({ strategyId }: { strategyId: string }) {
  const { data, isLoading } = useStrategyParticipants(strategyId);
  if (isLoading)
    return (
      <div style={{ padding: 14 }}>
        <Loader2 size={16} className="animate-spin" />
      </div>
    );
  const participants = data ?? [];
  if (participants.length === 0)
    return <div style={{ padding: 14, color: "rgba(245,248,252,0.4)", fontSize: 12 }}>No participants</div>;
  return (
    <table style={{ width: "100%", fontSize: 12 }}>
      <thead>
        <tr style={{ textAlign: "left", color: "rgba(245,248,252,0.4)" }}>
          <th style={{ padding: "6px 10px" }}>Wallet</th>
          <th style={{ padding: "6px 10px", textAlign: "right" }}>Deposited (USD)</th>
          <th style={{ padding: "6px 10px", textAlign: "right" }}>Share %</th>
          <th style={{ padding: "6px 10px" }}>Joined</th>
        </tr>
      </thead>
      <tbody>
        {participants.map((p) => (
          <tr key={p.wallet}>
            <td style={{ padding: "6px 10px", fontFamily: "monospace" }}>
              {p.wallet.length > 12 ? `${p.wallet.slice(0, 6)}…${p.wallet.slice(-6)}` : p.wallet}
            </td>
            <td style={{ padding: "6px 10px", textAlign: "right" }}>
              {p.deposited.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </td>
            <td style={{ padding: "6px 10px", textAlign: "right" }}>{p.sharePct}%</td>
            <td style={{ padding: "6px 10px", color: "rgba(245,248,252,0.6)" }}>{p.joined.slice(0, 10)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function OverviewTab() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const overview = useMarketplaceOverview();
  const strategies = useAdminStrategies();

  const o = overview.data;
  const rows = strategies.data ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {overview.isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
          <Loader2 className="animate-spin" />
        </div>
      ) : o ? (
        <div style={{ display: "flex", gap: 12 }}>
          <Kpi
            label="Total TVL"
            value={`$${o.totalTvlUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          />
          <Kpi label="Depositors" value={o.totalDepositors.toLocaleString()} />
          <Kpi label="Published" value={String(o.statusCounts.PUBLISHED)} />
          <Kpi label="Pending" value={String(o.statusCounts.PENDING)} />
          <Kpi label="Publishers" value={String(o.publisherCount)} />
        </div>
      ) : (
        <div style={{ color: "#FB7185" }}>Failed to load overview</div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontSize: 15, fontWeight: 700 }}>Per-strategy breakdown</h2>
        <ExportCsvButton endpoint="/api/admin/marketplace/strategies/export" />
      </div>

      {strategies.isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "rgba(245,248,252,0.4)" }}>
              <th style={{ padding: "8px 10px", width: 28 }} />
              <th style={{ padding: "8px 10px" }}>Strategy</th>
              <th style={{ padding: "8px 10px" }}>Asset</th>
              <th style={{ padding: "8px 10px", textAlign: "right" }}>TVL (USD)</th>
              <th style={{ padding: "8px 10px", textAlign: "right" }}>Depositors</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <Fragment key={s.id}>
                <tr
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}
                  onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                >
                  <td style={{ padding: 10 }}>
                    {expandedId === s.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </td>
                  <td style={{ padding: 10, fontWeight: 600 }}>{s.name}</td>
                  <td style={{ padding: 10 }}>{s.baseAsset}</td>
                  <td style={{ padding: 10, textAlign: "right", fontWeight: 600 }}>
                    {s.tvlUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: 10, textAlign: "right" }}>{s.userCount}</td>
                </tr>
                {expandedId === s.id && (
                  <tr>
                    <td colSpan={5} style={{ background: "rgba(255,255,255,0.02)" }}>
                      <ParticipantsRow strategyId={s.id} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm type-check`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/features/admin-strategies/components/overview-tab.tsx
git commit -m "feat(admin-strategies): deposits & TVL tab with participants drill-down"
```

---

### Task 12: Users & Activity tab + page + sidebar entry + barrel

**Files:**
- Create: `src/features/admin-strategies/components/activity-tab.tsx`
- Create: `src/features/admin-strategies/index.ts`
- Create: `src/app/admin/(app)/strategies/page.tsx`
- Modify: `src/shared/layout/sidebar-data.ts` (adminSidebarData navGroups, ~line 180)

**Interfaces:**
- Consumes: `useAdminPublishers`, `useMarketplaceLeaderboard` (Task 9), `ExportCsvButton` (Task 6), `Tabs/TabsList/TabsTrigger/TabsContent` from `@/shared/ui/tabs`, `StrategiesTab` (Task 10), `OverviewTab` (Task 11).
- Produces: route `/admin/strategies`; sidebar entry "Strategies".

- [ ] **Step 1: Write the activity tab**

Create `src/features/admin-strategies/components/activity-tab.tsx`:

```tsx
"use client";

import { Loader2 } from "lucide-react";
import { ExportCsvButton } from "@/shared/components/export-csv-button";
import { useAdminPublishers, useMarketplaceLeaderboard } from "../hooks/use-admin-marketplace";

function shortAddr(addr: string): string {
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-6)}` : addr;
}

export function ActivityTab() {
  const publishers = useAdminPublishers();
  const leaderboard = useMarketplaceLeaderboard();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>Publishers</h2>
          <ExportCsvButton endpoint="/api/admin/marketplace/publishers/export" />
        </div>
        {publishers.isLoading ? (
          <Loader2 className="animate-spin" />
        ) : (publishers.data ?? []).length === 0 ? (
          <div style={{ color: "rgba(245,248,252,0.4)", fontSize: 13 }}>No publishers yet</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "rgba(245,248,252,0.4)" }}>
                <th style={{ padding: "8px 10px" }}>Name</th>
                <th style={{ padding: "8px 10px" }}>Address</th>
                <th style={{ padding: "8px 10px", textAlign: "right" }}>Commission (bps)</th>
                <th style={{ padding: "8px 10px", textAlign: "right" }}>Strategies</th>
                <th style={{ padding: "8px 10px" }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {(publishers.data ?? []).map((p) => (
                <tr key={p.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <td style={{ padding: 10, fontWeight: 600 }}>{p.name}</td>
                  <td style={{ padding: 10, fontFamily: "monospace", fontSize: 11 }}>
                    {shortAddr(p.stellarAddress)}
                  </td>
                  <td style={{ padding: 10, textAlign: "right" }}>{p.commissionBps}</td>
                  <td style={{ padding: 10, textAlign: "right" }}>{p.strategyCount}</td>
                  <td style={{ padding: 10, color: "rgba(245,248,252,0.6)", fontSize: 12 }}>
                    {p.createdAt.slice(0, 10)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700 }}>Strategy leaderboard (by TVL)</h2>
        {leaderboard.isLoading ? (
          <Loader2 className="animate-spin" />
        ) : (leaderboard.data ?? []).length === 0 ? (
          <div style={{ color: "rgba(245,248,252,0.4)", fontSize: 13 }}>No ranked strategies yet</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "rgba(245,248,252,0.4)" }}>
                <th style={{ padding: "8px 10px" }}>#</th>
                <th style={{ padding: "8px 10px" }}>Strategy</th>
                <th style={{ padding: "8px 10px" }}>Publisher</th>
                <th style={{ padding: "8px 10px", textAlign: "right" }}>APY %</th>
                <th style={{ padding: "8px 10px", textAlign: "right" }}>TVL (USD)</th>
                <th style={{ padding: "8px 10px", textAlign: "right" }}>Users</th>
              </tr>
            </thead>
            <tbody>
              {(leaderboard.data ?? []).map((e) => (
                <tr key={e.strategyId} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <td style={{ padding: 10, color: "rgba(245,248,252,0.4)" }}>{e.rank}</td>
                  <td style={{ padding: 10, fontWeight: 600 }}>{e.name}</td>
                  <td style={{ padding: 10 }}>{e.publisherName || "—"}</td>
                  <td style={{ padding: 10, textAlign: "right" }}>{e.apy.toFixed(2)}</td>
                  <td style={{ padding: 10, textAlign: "right", fontWeight: 600 }}>
                    {e.tvlUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: 10, textAlign: "right" }}>{e.userCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Write the barrel**

Create `src/features/admin-strategies/index.ts`:

```typescript
export { ActivityTab } from "./components/activity-tab";
export { OverviewTab } from "./components/overview-tab";
export { StrategiesTab } from "./components/strategies-tab";
export * from "./types";
```

- [ ] **Step 3: Write the page**

Create `src/app/admin/(app)/strategies/page.tsx`:

```tsx
"use client";

import { ActivityTab, OverviewTab, StrategiesTab } from "@/features/admin-strategies";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

export default function AdminStrategiesPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Strategy Marketplace</h1>
      <Tabs defaultValue="strategies">
        <TabsList>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
          <TabsTrigger value="tvl">Deposits & TVL</TabsTrigger>
          <TabsTrigger value="activity">Users & Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="strategies">
          <StrategiesTab />
        </TabsContent>
        <TabsContent value="tvl">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 4: Add the sidebar entry**

In `src/shared/layout/sidebar-data.ts`, in `adminSidebarData.navGroups`, insert a new group between "Gas Sponsor" and "System":

```typescript
    {
      title: "Marketplace",
      items: [{ title: "Strategies", url: "/admin/strategies", icon: Store }],
    },
```

Add `Store` to the existing `lucide-react` import at the top of the file.

- [ ] **Step 5: Full verify**

Run: `pnpm type-check && pnpm check:fix && pnpm test && pnpm build`
Expected: all clean; build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/features/admin-strategies src/app/admin/\(app\)/strategies src/shared/layout/sidebar-data.ts
git commit -m "feat(admin): /admin/strategies marketplace tracking page with tabs + sidebar entry"
```

---

### Task 13: End-to-end verification (both repos, local)

**Files:** none (verification only). Requires local backend on :6756 with the native Postgres, frontend dev on :3000, and an admin login.

- [ ] **Step 1: Start services**

```bash
# terminal 1
cd /Users/nathan/Documents/morcalab/tasmil/backend && pnpm prisma:migrate && pnpm dev
# terminal 2
cd /Users/nathan/Documents/morcalab/tasmil/tasmil-finance && pnpm dev
```

- [ ] **Step 2: Manual pass**

1. Log in at `http://localhost:3000/admin/login`.
2. On each of: Waitlist, Topups, Quest Wallets, Access Codes, Email Campaigns, Quest Campaigns, Tier Bands, Sponsor, Dashboard — click **Export CSV**, confirm a dated `.csv` downloads and opens with a header row plus data.
3. Open **Strategies** in the sidebar: verify all three tabs render, status filter works, a PENDING strategy shows Approve/Reject with confirm, TVL tab expands participants, Activity tab lists publishers + leaderboard, and both marketplace export buttons download CSVs.
4. Reject a PENDING test strategy, verify its badge flips to REJECTED and it no longer appears in the tasmil-strategy app's pending admin queue.

- [ ] **Step 3: Report**

Record any failures; fix on the same branches before opening PRs. Deployment order per spec: backend PR merges first, frontend second, `gh run list` after each merge.
