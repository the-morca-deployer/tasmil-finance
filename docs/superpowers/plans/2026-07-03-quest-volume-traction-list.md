# Quest-volume transaction list on `/traction` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a paginated UI on `/traction` that lists individual quest-volume transactions (one row per `reward_volume_events` row).

**Architecture:** New public paginated backend endpoint `GET /public/quest-volume` on the existing `PublicController`/`TractionService` returns keyset-paginated events with the wallet masked server-side. The Kubb-generated client is regenerated, then a `QuestVolumeList` React component (TanStack `useInfiniteQuery`) renders the rows in the existing traction dashboard.

**Tech Stack:** Backend — NestJS, Prisma (`$queryRaw`), Redis, Jest. Frontend — Next.js 16, React, TanStack Query, Kubb-generated client, Biome, Jest + Testing Library.

## Global Constraints

- **Two repos.** Backend tasks run in `/Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/backend`. Frontend tasks run in `/Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/tasmil-finance`.
- **Branch:** work on `feat/quest-volume-traction-list` in each repo. **NEVER commit or push to `deploy/prod`.** Do not push at all unless the user asks — commit locally only.
- **Backend envelope:** controllers return the DTO; a global interceptor wraps responses as `{ success, data }`. The frontend unwraps `.data`.
- **Frontend Biome rules:** 2-space indent, double quotes, line width 100, `import type` for type-only imports, no `any`, no `console.log`. Path alias `@/*` → `src/*`. Import from feature-internal relative paths; features never import other features.
- **Never hand-edit `src/gen-backend/`** — it is Kubb-generated.
- **Privacy:** the full Stellar pubkey and `tx_hash` must never appear in the public payload. Wallet is masked server-side.

---

## Phase A — Backend (`backend` repo)

### Task A0: Create the backend feature branch

- [ ] **Step 1: Branch off deploy/prod**

```bash
cd /Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/backend
git checkout -b feat/quest-volume-traction-list
git branch --show-current   # expect: feat/quest-volume-traction-list
```

---

### Task A1: Pure helpers — wallet mask + cursor codec

**Files:**
- Create: `backend/src/modules/public/quest-volume.util.ts`
- Test: `backend/src/modules/public/quest-volume.util.spec.ts`

**Interfaces:**
- Produces:
  - `maskPubkey(pubkey: string | null): string`
  - `encodeCursor(c: { createdAt: Date | string; id: string }): string`
  - `decodeCursor(raw: string): { createdAt: string; id: string } | null`

- [ ] **Step 1: Write the failing test**

Create `backend/src/modules/public/quest-volume.util.spec.ts`:

```ts
import { decodeCursor, encodeCursor, maskPubkey } from './quest-volume.util';

describe('quest-volume util', () => {
  describe('maskPubkey', () => {
    it('masks a full pubkey to first-5…last-4', () => {
      expect(maskPubkey('GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQR4F7Q')).toBe(
        'GABCD…4F7Q',
      );
    });

    it('returns an em dash for a null pubkey', () => {
      expect(maskPubkey(null)).toBe('—');
    });

    it('returns short strings unchanged', () => {
      expect(maskPubkey('GABC')).toBe('GABC');
    });
  });

  describe('cursor codec', () => {
    it('round-trips createdAt (as ISO) and id', () => {
      const iso = '2026-07-02T12:00:00.000Z';
      const decoded = decodeCursor(encodeCursor({ createdAt: new Date(iso), id: 'abc123' }));
      expect(decoded).toEqual({ createdAt: iso, id: 'abc123' });
    });

    it('returns null for a malformed cursor', () => {
      expect(decodeCursor('!!!not-valid')).toBeNull();
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd /Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/backend
pnpm test -- quest-volume.util
```
Expected: FAIL — cannot find module `./quest-volume.util`.

- [ ] **Step 3: Write the implementation**

Create `backend/src/modules/public/quest-volume.util.ts`:

```ts
/**
 * Pure helpers for the public quest-volume endpoint. Kept separate from the
 * service so masking and cursor encoding can be unit-tested without Prisma.
 */

/** First-5…last-4 mask so the full Stellar pubkey never leaves the server. */
export function maskPubkey(pubkey: string | null): string {
  if (!pubkey) return '—';
  if (pubkey.length <= 9) return pubkey;
  return `${pubkey.slice(0, 5)}…${pubkey.slice(-4)}`;
}

/** Opaque keyset cursor over (createdAt, id). base64url of a compact JSON. */
export function encodeCursor(c: { createdAt: Date | string; id: string }): string {
  const iso = typeof c.createdAt === 'string' ? c.createdAt : c.createdAt.toISOString();
  return Buffer.from(JSON.stringify({ t: iso, i: c.id })).toString('base64url');
}

export function decodeCursor(raw: string): { createdAt: string; id: string } | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as {
      t?: unknown;
      i?: unknown;
    };
    if (typeof parsed.t === 'string' && typeof parsed.i === 'string') {
      return { createdAt: parsed.t, id: parsed.i };
    }
    return null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm test -- quest-volume.util
```
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/modules/public/quest-volume.util.ts src/modules/public/quest-volume.util.spec.ts
git commit -m "feat(public): quest-volume mask + cursor helpers"
```

---

### Task A2: Response DTOs + `TractionService.getQuestVolume`

**Files:**
- Create: `backend/src/modules/public/dto/quest-volume-response.dto.ts`
- Modify: `backend/src/modules/public/traction.service.ts`
- Test: `backend/src/modules/public/traction.service.quest-volume.spec.ts`

**Interfaces:**
- Consumes: `maskPubkey`, `encodeCursor`, `decodeCursor` from Task A1.
- Produces:
  - `QuestVolumeItemDto = { id: string; protocol: string; operationKind: string; amountUsd: number; walletMasked: string; createdAt: string }`
  - `QuestVolumeResponseDto = { items: QuestVolumeItemDto[]; nextCursor: string | null }`
  - `TractionService.getQuestVolume(params: { limit?: number; cursor?: string }): Promise<QuestVolumeResponseDto>`

- [ ] **Step 1: Create the DTO file** (no test of its own — exercised via the service)

Create `backend/src/modules/public/dto/quest-volume-response.dto.ts`:

```ts
import { ApiProperty } from '@nestjs/swagger';

export class QuestVolumeItemDto {
  @ApiProperty({ description: 'reward_volume_events row id', example: 'clx0abc123' })
  id!: string;

  @ApiProperty({ description: 'Protocol', example: 'soroswap' })
  protocol!: string;

  @ApiProperty({ description: 'Operation kind', example: 'swap' })
  operationKind!: string;

  @ApiProperty({ description: 'Volume for this tx (USD)', example: 1234.56 })
  amountUsd!: number;

  @ApiProperty({ description: 'Masked wallet — never the full pubkey', example: 'GABCD…4F7Q' })
  walletMasked!: string;

  @ApiProperty({ description: 'ISO timestamp', example: '2026-07-02T12:00:00.000Z' })
  createdAt!: string;
}

export class QuestVolumeResponseDto {
  @ApiProperty({ type: [QuestVolumeItemDto] })
  items!: QuestVolumeItemDto[];

  @ApiProperty({
    description: 'Cursor for the next page; null when there are no more rows',
    nullable: true,
    example: 'eyJ0IjoiMjAyNi0wNy0wMlQxMjowMDowMC4wMDBaIiwiaSI6ImFiYyJ9',
  })
  nextCursor!: string | null;
}
```

- [ ] **Step 2: Write the failing service test**

Create `backend/src/modules/public/traction.service.quest-volume.spec.ts`:

```ts
import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { decodeCursor } from './quest-volume.util';
import { TractionService } from './traction.service';

const FULL_PUBKEY = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQR4F7Q';

function row(i: number) {
  return {
    id: `id-${i}`,
    protocol: 'soroswap',
    operationKind: 'swap',
    amountUsd: 100 + i,
    pubkey: FULL_PUBKEY,
    createdAt: new Date(`2026-07-0${(i % 9) + 1}T12:00:00.000Z`),
  };
}

describe('TractionService.getQuestVolume', () => {
  let prisma: { $queryRaw: jest.Mock };
  let redis: { getJson: jest.Mock; setJson: jest.Mock };
  let service: TractionService;

  beforeEach(() => {
    prisma = { $queryRaw: jest.fn().mockResolvedValue([row(1), row(2)]) };
    redis = {
      getJson: jest.fn().mockResolvedValue(null),
      setJson: jest.fn().mockResolvedValue('OK'),
    };
    service = new TractionService(prisma as never, redis as never, {} as never);
  });

  it('masks the wallet and never leaks the full pubkey', async () => {
    const result = await service.getQuestVolume({ limit: 25 });

    expect(result.items[0].walletMasked).toBe('GABCD…4F7Q');
    expect(JSON.stringify(result)).not.toContain(FULL_PUBKEY);
  });

  it('omits tx hash and pubkey fields from items', async () => {
    const result = await service.getQuestVolume({ limit: 25 });

    expect(result.items[0]).not.toHaveProperty('pubkey');
    expect(result.items[0]).not.toHaveProperty('txHash');
    expect(Object.keys(result.items[0]).sort()).toEqual(
      ['amountUsd', 'createdAt', 'id', 'operationKind', 'protocol', 'walletMasked'].sort(),
    );
  });

  it('sets nextCursor only when more than `limit` rows come back', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([row(1), row(2), row(3)]); // limit+1
    const result = await service.getQuestVolume({ limit: 2 });

    expect(result.items).toHaveLength(2);
    expect(result.nextCursor).toEqual(expect.any(String));
    expect(decodeCursor(result.nextCursor as string)?.id).toBe('id-2'); // last of the page
  });

  it('returns nextCursor=null when the page is not full', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([row(1)]);
    const result = await service.getQuestVolume({ limit: 25 });

    expect(result.nextCursor).toBeNull();
  });

  it('clamps limit to a max of 100', async () => {
    prisma.$queryRaw.mockResolvedValueOnce(Array.from({ length: 101 }, (_, i) => row(i)));
    const result = await service.getQuestVolume({ limit: 500 });

    expect(result.items).toHaveLength(100);
  });

  it('clamps limit to a minimum of 1', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([row(1), row(2), row(3)]);
    const result = await service.getQuestVolume({ limit: 0 });

    expect(result.items).toHaveLength(1);
  });

  it('returns the cached first page without querying', async () => {
    const cached = { items: [], nextCursor: null };
    redis.getJson.mockResolvedValueOnce(cached);

    const result = await service.getQuestVolume({});

    expect(result).toBe(cached);
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('does not read the cache when a cursor is supplied', async () => {
    await service.getQuestVolume({ cursor: 'anything', limit: 25 });
    expect(redis.getJson).not.toHaveBeenCalled();
  });

  it('throws 503 when the query fails', async () => {
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    prisma.$queryRaw.mockRejectedValueOnce(new Error('db down'));

    await expect(service.getQuestVolume({ limit: 25 })).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    errorSpy.mockRestore();
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

```bash
pnpm test -- traction.service.quest-volume
```
Expected: FAIL — `service.getQuestVolume is not a function`.

- [ ] **Step 4: Implement `getQuestVolume`**

In `backend/src/modules/public/traction.service.ts`, add imports at the top (alongside the existing imports):

```ts
import { Prisma } from '@prisma/client';
import {
  QuestVolumeItemDto,
  QuestVolumeResponseDto,
} from './dto/quest-volume-response.dto';
import { decodeCursor, encodeCursor, maskPubkey } from './quest-volume.util';
```

Add these constants next to the existing `TRACTION_*` constants:

```ts
const QV_CACHE_KEY = 'public:quest-volume:v1:first';
const QV_CACHE_TTL_SECONDS = 60;
const QV_DEFAULT_LIMIT = 25;
const QV_MAX_LIMIT = 100;

type QuestVolumeRow = {
  id: string;
  protocol: string;
  operationKind: string;
  amountUsd: number;
  pubkey: string | null;
  createdAt: Date;
};
```

Add this method to the `TractionService` class (e.g. after `getTraction`):

```ts
  async getQuestVolume(params: {
    limit?: number;
    cursor?: string;
  }): Promise<QuestVolumeResponseDto> {
    const limit = Number.isFinite(params.limit)
      ? Math.min(Math.max(Math.trunc(params.limit as number), 1), QV_MAX_LIMIT)
      : QV_DEFAULT_LIMIT;
    const cursor = params.cursor ? decodeCursor(params.cursor) : null;
    const isFirstPage = !cursor;
    const cacheKey = `${QV_CACHE_KEY}:${limit}`;

    if (isFirstPage) {
      const cached = await this.redis
        .getJson<QuestVolumeResponseDto>(cacheKey)
        .catch(() => null);
      if (cached) return cached;
    }

    try {
      const cursorClause = cursor
        ? Prisma.sql`AND (rve.created_at, rve.id) < (${new Date(cursor.createdAt)}, ${cursor.id})`
        : Prisma.empty;

      const rows = await this.prisma.$queryRaw<QuestVolumeRow[]>(Prisma.sql`
        SELECT rve.id AS "id",
               rve.protocol AS "protocol",
               rve.operation_kind AS "operationKind",
               rve.amount_usd::float8 AS "amountUsd",
               rve.created_at AS "createdAt",
               u.stellar_pubkey AS "pubkey"
        FROM reward_volume_events rve
        JOIN users u ON u.id = rve.user_id
        WHERE rve.amount_usd > 0
        ${cursorClause}
        ORDER BY rve.created_at DESC, rve.id DESC
        LIMIT ${limit + 1}
      `);

      const hasMore = rows.length > limit;
      const page = rows.slice(0, limit);
      const items: QuestVolumeItemDto[] = page.map((r) => ({
        id: r.id,
        protocol: r.protocol,
        operationKind: r.operationKind,
        amountUsd: Number(r.amountUsd),
        walletMasked: maskPubkey(r.pubkey),
        createdAt: new Date(r.createdAt).toISOString(),
      }));

      const last = page[page.length - 1];
      const nextCursor =
        hasMore && last ? encodeCursor({ createdAt: last.createdAt, id: last.id }) : null;

      const payload: QuestVolumeResponseDto = { items, nextCursor };
      if (isFirstPage) {
        await this.redis.setJson(cacheKey, payload, QV_CACHE_TTL_SECONDS).catch(() => null);
      }
      return payload;
    } catch (error) {
      this.logger.error(
        `Failed to compute quest-volume list: ${error instanceof Error ? error.message : error}`,
      );
      throw new ServiceUnavailableException('Quest volume data temporarily unavailable');
    }
  }
```

- [ ] **Step 5: Run it to verify it passes**

```bash
pnpm test -- traction.service.quest-volume
```
Expected: PASS (9 tests).

- [ ] **Step 6: Commit**

```bash
git add src/modules/public/dto/quest-volume-response.dto.ts \
        src/modules/public/traction.service.ts \
        src/modules/public/traction.service.quest-volume.spec.ts
git commit -m "feat(public): getQuestVolume service + DTOs"
```

---

### Task A3: Controller route

**Files:**
- Modify: `backend/src/modules/public/public.controller.ts`
- Test: `backend/src/modules/public/public.controller.spec.ts`

**Interfaces:**
- Consumes: `TractionService.getQuestVolume` (Task A2).
- Produces: `GET /public/quest-volume?limit=&cursor=`.

- [ ] **Step 1: Add the failing controller test**

In `backend/src/modules/public/public.controller.spec.ts`, add `getQuestVolume` to the `TractionService` mock's `useValue`:

```ts
        {
          provide: TractionService,
          useValue: {
            getTraction: jest.fn().mockResolvedValue(mockTraction),
            getQuestVolume: jest
              .fn()
              .mockResolvedValue({ items: [{ id: '1' }], nextCursor: 'next' }),
          },
        },
```

Then add this describe block before the closing `});` of the top-level describe:

```ts
  describe('getQuestVolume', () => {
    it('parses limit to a number and forwards limit + cursor to the service', async () => {
      const result = await controller.getQuestVolume('50', 'cur');

      expect(tractionService.getQuestVolume).toHaveBeenCalledWith({ limit: 50, cursor: 'cur' });
      expect(result).toEqual({ items: [{ id: '1' }], nextCursor: 'next' });
    });

    it('passes limit undefined when the query param is absent', async () => {
      await controller.getQuestVolume(undefined, undefined);

      expect(tractionService.getQuestVolume).toHaveBeenCalledWith({
        limit: undefined,
        cursor: undefined,
      });
    });
  });
```

- [ ] **Step 2: Run it to verify it fails**

```bash
pnpm test -- public.controller
```
Expected: FAIL — `controller.getQuestVolume is not a function`.

- [ ] **Step 3: Implement the route**

In `backend/src/modules/public/public.controller.ts`:

Update the nest imports and add the DTO import:

```ts
import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { QuestVolumeResponseDto } from './dto/quest-volume-response.dto';
```

Add this method inside the `PublicController` class (after `getTraction`):

```ts
  @Get('quest-volume')
  @ApiOperation({ summary: 'List individual quest-volume transactions (paginated, newest first)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Page size (1–100, default 25)' })
  @ApiQuery({ name: 'cursor', required: false, type: String, description: 'Opaque keyset cursor' })
  @ApiResponse({ status: 200, description: 'Quest-volume page', type: QuestVolumeResponseDto })
  @ApiResponse({ status: 503, description: 'Metrics temporarily unavailable' })
  async getQuestVolume(
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ): Promise<QuestVolumeResponseDto> {
    return this.tractionService.getQuestVolume({
      limit: limit !== undefined ? Number(limit) : undefined,
      cursor,
    });
  }
```

- [ ] **Step 4: Run it to verify it passes**

```bash
pnpm test -- public.controller
```
Expected: PASS.

- [ ] **Step 5: Full backend build gate**

```bash
pnpm build
```
Expected: builds with no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/modules/public/public.controller.ts src/modules/public/public.controller.spec.ts
git commit -m "feat(public): GET /public/quest-volume route"
```

- [ ] **Step 7: Manual smoke test** (backend running locally on :6756 against a DB)

```bash
curl -s 'http://localhost:6756/api/public/quest-volume?limit=3' | head -c 600
```
Expected: `{"success":true,"data":{"items":[...],"nextCursor":...}}`. Confirm no full `G...` pubkey and no `txHash` in the output.

---

## Phase B — Frontend (`tasmil-finance` repo)

> The feature branch `feat/quest-volume-traction-list` already exists in `tasmil-finance` (created during design). Confirm with `git branch --show-current`.

### Task B1: Regenerate the backend client

**Prerequisite:** the backend from Phase A must be running locally on :6756 (so its OpenAPI spec includes `/public/quest-volume`).

**Files:**
- Generated (do not hand-edit): `src/gen-backend/client/public-controller-get-quest-volume.ts`, `src/gen-backend/hooks/use-public-controller-get-quest-volume.ts`, `src/gen-backend/types/quest-volume-response-dto.ts`, `src/gen-backend/types/quest-volume-item-dto.ts`, `src/gen-backend/types/public-controller-get-quest-volume.ts`

- [ ] **Step 1: Regenerate**

```bash
cd /Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/tasmil-finance
pnpm generate:backend
```

- [ ] **Step 2: Verify the new files exist and note the exact client signature**

```bash
ls src/gen-backend/client/public-controller-get-quest-volume.ts \
   src/gen-backend/types/quest-volume-response-dto.ts
grep -n "export async function publicControllerGetQuestVolume" \
   src/gen-backend/client/public-controller-get-quest-volume.ts
```
Expected: files exist; the client function signature is `(params, config)` (query-param endpoint, no path params). If the generated param/type names differ from those referenced in Task B3, use the generated names.

- [ ] **Step 3: Commit the generated client**

```bash
git add src/gen-backend
git commit -m "chore(gen): regenerate backend client with quest-volume"
```

---

### Task B2: Row formatters

**Files:**
- Modify: `src/features/traction/lib/format.ts`
- Test: `src/features/traction/lib/format.test.ts`

**Interfaces:**
- Produces: `fmtUsd(n: number): string`, `fmtDate(iso: string): string`.

- [ ] **Step 1: Write the failing test**

Create `src/features/traction/lib/format.test.ts`:

```ts
import { fmtDate, fmtUsd } from "./format";

describe("fmtUsd", () => {
  it("rounds to a whole dollar with thousands separators", () => {
    expect(fmtUsd(1234.5)).toBe("$1,235");
    expect(fmtUsd(0)).toBe("$0");
  });
});

describe("fmtDate", () => {
  it("formats an ISO timestamp as a short UTC date", () => {
    expect(fmtDate("2026-07-02T12:00:00.000Z")).toBe("Jul 2, 2026");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
pnpm test -- format.test
```
Expected: FAIL — `fmtUsd`/`fmtDate` are not exported.

- [ ] **Step 3: Add the helpers**

Append to `src/features/traction/lib/format.ts`:

```ts
export function fmtUsd(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
```

- [ ] **Step 4: Run it to verify it passes**

```bash
pnpm test -- format.test
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/traction/lib/format.ts src/features/traction/lib/format.test.ts
git commit -m "feat(traction): row formatters for quest-volume list"
```

---

### Task B3: `useQuestVolume` hook

**Files:**
- Create: `src/features/traction/hooks/use-quest-volume.ts`

**Interfaces:**
- Consumes: generated `publicControllerGetQuestVolume` + `QuestVolumeResponseDto` (Task B1).
- Produces: `useQuestVolume(limit?: number)` — TanStack `useInfiniteQuery` result whose `data.pages[n]` is `QuestVolumeResponseDto`.

- [ ] **Step 1: Create the hook** (no unit test — covered via the component test in Task B4, matching the untested `use-traction.ts` pattern)

Create `src/features/traction/hooks/use-quest-volume.ts`:

```ts
"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { publicControllerGetQuestVolume } from "@/gen-backend/client/public-controller-get-quest-volume";
import type { QuestVolumeResponseDto } from "@/gen-backend/types/quest-volume-response-dto";

export function useQuestVolume(limit = 25) {
  return useInfiniteQuery({
    queryKey: ["public", "quest-volume", limit] as const,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam, signal }) => {
      const res = await publicControllerGetQuestVolume(
        { limit, ...(pageParam ? { cursor: pageParam } : {}) },
        { signal },
      );
      // Backend wraps the DTO in a { success, data } envelope (see use-traction.ts).
      return (res as unknown as { data: QuestVolumeResponseDto }).data;
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 60_000,
  });
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```
Expected: no errors. (If the generated client name/param type differs from Task B1, align the import and the `{ limit, cursor }` shape.)

- [ ] **Step 3: Commit**

```bash
git add src/features/traction/hooks/use-quest-volume.ts
git commit -m "feat(traction): useQuestVolume infinite-query hook"
```

---

### Task B4: `QuestVolumeList` component

**Files:**
- Create: `src/features/traction/components/quest-volume-list.tsx`
- Test: `src/features/traction/__tests__/quest-volume-list.test.tsx`

**Interfaces:**
- Consumes: `useQuestVolume` (B3), `fmtUsd`/`fmtDate` (B2), `@/shared/ui/{table,badge,button,skeleton}`.
- Produces: `QuestVolumeList` (named export, no props).

- [ ] **Step 1: Write the failing test**

Create `src/features/traction/__tests__/quest-volume-list.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { QuestVolumeList } from "../components/quest-volume-list";
import { useQuestVolume } from "../hooks/use-quest-volume";

jest.mock("../hooks/use-quest-volume", () => ({
  useQuestVolume: jest.fn(),
}));

const mockUse = useQuestVolume as unknown as jest.Mock;

type Item = {
  id: string;
  protocol: string;
  operationKind: string;
  amountUsd: number;
  walletMasked: string;
  createdAt: string;
};

function withPage(items: Item[], nextCursor: string | null = null) {
  return { pages: [{ items, nextCursor }] };
}

const rows: Item[] = [
  {
    id: "1",
    protocol: "soroswap",
    operationKind: "swap",
    amountUsd: 1234.5,
    walletMasked: "GABCD…4F7Q",
    createdAt: "2026-07-02T12:00:00.000Z",
  },
];

const base = {
  isLoading: false,
  isError: false,
  hasNextPage: false,
  isFetchingNextPage: false,
  fetchNextPage: jest.fn(),
};

beforeEach(() => mockUse.mockReset());

describe("QuestVolumeList", () => {
  it("renders a row from the hook data", () => {
    mockUse.mockReturnValue({ ...base, data: withPage(rows) });
    render(<QuestVolumeList />);

    expect(screen.getByText("soroswap")).toBeInTheDocument();
    expect(screen.getByText("GABCD…4F7Q")).toBeInTheDocument();
    expect(screen.getByText("$1,235")).toBeInTheDocument();
  });

  it("shows skeletons while loading", () => {
    mockUse.mockReturnValue({ ...base, isLoading: true, data: undefined });
    render(<QuestVolumeList />);

    expect(screen.getByTestId("qv-loading")).toBeInTheDocument();
  });

  it("shows the empty state when there are no items", () => {
    mockUse.mockReturnValue({ ...base, data: withPage([]) });
    render(<QuestVolumeList />);

    expect(screen.getByText("No quest volume yet.")).toBeInTheDocument();
  });

  it("renders Load more and calls fetchNextPage on click", () => {
    const fetchNextPage = jest.fn();
    mockUse.mockReturnValue({
      ...base,
      data: withPage(rows, "cursor2"),
      hasNextPage: true,
      fetchNextPage,
    });
    render(<QuestVolumeList />);

    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(fetchNextPage).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
pnpm test -- quest-volume-list
```
Expected: FAIL — cannot find `../components/quest-volume-list`.

- [ ] **Step 3: Implement the component**

Create `src/features/traction/components/quest-volume-list.tsx`:

```tsx
"use client";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { useQuestVolume } from "../hooks/use-quest-volume";
import { fmtDate, fmtUsd } from "../lib/format";

export function QuestVolumeList() {
  const { data, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useQuestVolume();
  const items = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-1">
        <h2 className="font-semibold text-lg">Quest volume — recent transactions</h2>
        <span className="text-muted-foreground text-xs">
          On-chain activity counted toward quests
        </span>
      </div>

      {isError && items.length === 0 ? (
        <p className="rounded border border-border bg-card px-4 py-6 text-center text-muted-foreground text-sm">
          Quest volume is temporarily unavailable.
        </p>
      ) : isLoading ? (
        <div className="flex flex-col gap-2" data-testid="qv-loading">
          {["a", "b", "c", "d", "e"].map((k) => (
            <Skeleton key={k} className="h-10 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="rounded border border-border bg-card px-4 py-6 text-center text-muted-foreground text-sm">
          No quest volume yet.
        </p>
      ) : (
        <>
          <div className="rounded border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Protocol</TableHead>
                  <TableHead>Operation</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {tx.protocol}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{tx.operationKind}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtUsd(tx.amountUsd)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{tx.walletMasked}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-xs">
                      {fmtDate(tx.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {hasNextPage && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

```bash
pnpm test -- quest-volume-list
```
Expected: PASS (4 tests). If `Badge` has no `secondary` variant, run `grep -n "variant" src/shared/ui/badge.tsx` and use an existing one (e.g. `outline`).

- [ ] **Step 5: Commit**

```bash
git add src/features/traction/components/quest-volume-list.tsx \
        src/features/traction/__tests__/quest-volume-list.test.tsx
git commit -m "feat(traction): QuestVolumeList component"
```

---

### Task B5: Mount in the traction dashboard

**Files:**
- Modify: `src/features/traction/components/traction-dashboard.tsx`
- Modify: `src/features/traction/__tests__/traction-dashboard.test.tsx`

**Interfaces:**
- Consumes: `QuestVolumeList` (B4).

- [ ] **Step 1: Update the dashboard test (failing)**

In `src/features/traction/__tests__/traction-dashboard.test.tsx`, add a mock for the quest-volume hook below the existing `jest.mock("../hooks/use-traction", ...)`:

```tsx
jest.mock("../hooks/use-quest-volume", () => ({
  useQuestVolume: () => ({
    data: { pages: [{ items: [], nextCursor: null }] },
    isLoading: false,
    isError: false,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: jest.fn(),
  }),
}));
```

Then in the first test ("renders header, KPIs, charts, and the updated badge on success"), add this assertion at the end:

```tsx
    expect(screen.getByText("Quest volume — recent transactions")).toBeInTheDocument();
```

- [ ] **Step 2: Run it to verify it fails**

```bash
pnpm test -- traction-dashboard
```
Expected: FAIL — "Quest volume — recent transactions" not found.

- [ ] **Step 3: Mount the component**

In `src/features/traction/components/traction-dashboard.tsx`:

Add the import next to the other component imports:

```tsx
import { QuestVolumeList } from "./quest-volume-list";
```

Add the element immediately after `<UserGrowthChart ... />`:

```tsx
      <UserGrowthChart data={data?.userGrowth} isLoading={isLoading} />
      <QuestVolumeList />
```

- [ ] **Step 4: Run it to verify it passes**

```bash
pnpm test -- traction-dashboard
```
Expected: PASS.

- [ ] **Step 5: Full frontend gate**

```bash
pnpm type-check
pnpm test
pnpm check:fix
```
Expected: type-check clean, all tests pass, Biome makes no further changes (or only formats — re-stage if so).

- [ ] **Step 6: Commit**

```bash
git add src/features/traction/components/traction-dashboard.tsx \
        src/features/traction/__tests__/traction-dashboard.test.tsx
git commit -m "feat(traction): mount QuestVolumeList on /traction"
```

- [ ] **Step 7: Visual verification**

Run the frontend (`pnpm dev`, backend also up on :6756) and open `http://localhost:3000/traction`. Confirm the "Quest volume — recent transactions" table renders below the charts, wallets show masked (`G…`), "Load more" appends a page, and the empty state reads cleanly when there is no data.

---

## Self-Review (completed during planning)

- **Spec coverage:** data source `reward_volume_events` ✓ (A2); columns protocol/operation/amount/wallet/date ✓ (B4); masked wallet server-side ✓ (A1/A2); no tx-hash/explorer link ✓ (A2 test asserts omission); paginated endpoint (option A) ✓ (A2/A3); Redis first-page cache ✓ (A2); empty/loading/error states ✓ (B4); tests both repos ✓.
- **Placeholder scan:** none — every code step has full code.
- **Type consistency:** `QuestVolumeResponseDto`/`QuestVolumeItemDto` names and the `{ items, nextCursor }` shape are identical across A2, A3, B3, B4; `getQuestVolume({ limit, cursor })` matches between service (A2) and controller (A3); hook returns pages of `{ items, nextCursor }` consumed by the component (B4).
- **Known post-generation check:** the exact generated client symbol/param-type names (Task B1 Step 2) must be confirmed; Task B3 aligns imports if they differ.
