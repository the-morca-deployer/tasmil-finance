# Quest Referral End-to-End Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Quest L1/L2/L3 referral commission system work end-to-end - referral codes are captured on wallet connect and persisted to the DB (first-touch, no conflict), commissions cascade up 3 levels on every point-award path, and the UI shares correct links and shows the user's code + referrer.

**Architecture:** Two repos. **Backend** (`backend/`, NestJS + Prisma): thread an optional `referredByCode` through `/auth/verify`, persist `UserQuestProfile.referredById` once (first-touch), call the already-existing `CommissionService.applyCommissions` from all four point-award paths, and expose the referrer in `/referral/me`. **Frontend** (`tasmil-finance/`, Next.js): unify the share link to `/r/<code>` → `/quest?ref=`, send `referredByCode` on connect, fix the broken Profile copy/share/set-code buttons, and surface the code + referrer in the account dropdown.

**Tech Stack:** NestJS, Prisma, PostgreSQL, Jest (backend); Next.js App Router, React, TanStack Query, Jest + React Testing Library (frontend).

## Global Constraints

- Repos are separate git repos. Backend work commits under `backend/`; frontend work commits under `tasmil-finance/`. Use branch `feat/quest-referral-e2e` in **each** repo. Never push to `deploy/prod`.
- **First-touch-per-user:** `referredById` is written only when currently `null`; never overwrite; self-referral and cycles are rejected; a missing/invalid code is a silent no-op (never throws on the login path).
- **Commission base-points invariant:** callers pass **pre-FOMO-multiplier** base points to `applyCommissions` (e.g. `task.pointReward`, `rewardPoints`, `10`), **never** `award.pointsAwarded`. `commission.service.ts` math is unchanged.
- Commission cascade depth is capped at 3 layers (`MAX_LAYERS = 3`, existing).
- `referredByCode` on `/auth/verify` must be strictly optional and must not change existing login behavior when absent.
- Commission rates are config-driven (`QuestReferralConfig`: L1=1000, L2=300, L3=100 bps, seeded). Do not hard-code rates in new code.
- **Referral code format: UPPERCASE letters + digits only** (plus the existing `TASMIL-` style hyphen), e.g. `TASMIL-X7K9` - never lowercase. Generated codes use uppercase+digits. Custom codes are validated/normalized to uppercase (`.trim().toUpperCase()`, allowed charset `[A-Z0-9-]`). Any incoming `referredByCode` (from `?ref=`, localStorage, or a typed code) is normalized with `.trim().toUpperCase()` **before** the DB lookup, so a lowercased URL still matches.
- Backend lint/format: follow existing module style. Frontend: Biome - 2-space indent, double quotes, `import type`, no `any`, no `console.log`.

---

## File Structure

**Backend (`backend/`)**
- `src/modules/auth/auth.dto.ts` - add optional `referredByCode` to `WalletVerifyDto`.
- `src/modules/auth/auth.service.ts` - call `usersService.linkReferrer` inside `walletLogin` after user upsert.
- `src/modules/quest/users/users.service.ts` - new `linkReferrer(userId, code)`; remove dead `ensureWalletUser`; add commission call in `dailyLoginReward`.
- `src/modules/quest/claims/claims.service.ts` - add `applyCommissions` to `claimDailyTask` and `claimCampaign`.
- `src/modules/quest/referral/referral.service.ts` - `getMyReferral` returns `referredBy`.
- `prisma/migrations/<ts>_quest_referral_commission_unique/migration.sql` - unique index on `QuestReferralCommission`.
- `prisma/schema.prisma` - matching `@@unique` on `QuestReferralCommission`.
- Tests: `*.spec.ts` colocated next to each service (existing convention).

**Frontend (`tasmil-finance/`)**
- `src/app/r/[code]/page.tsx` - redirect to `/quest?ref=`.
- `src/features/quest/context/wallet-context.tsx` - send `referredByCode`.
- `src/features/quest/lib/referral-link.ts` - new tiny helper `buildShareUrl` + `readPendingReferralCode`.
- `src/features/quest/components/Profile.tsx` - wire share/set-code/copy-guard.
- `src/features/quest/components/Navbar.tsx` - dropdown shows code + referrer.
- Tests: colocated `__tests__/*.test.tsx` (existing convention).

---

## BACKEND

### Task 0: Branches

- [ ] **Step 1: Create backend branch**

```bash
cd backend && git checkout -b feat/quest-referral-e2e
```

- [ ] **Step 2: Create frontend branch**

```bash
cd ../tasmil-finance && git checkout -b feat/quest-referral-e2e
```

---

### Task 1: `UsersService.linkReferrer` (first-touch attribution)

**Files:**
- Modify: `backend/src/modules/quest/users/users.service.ts`
- Test: `backend/src/modules/quest/users/users.service.spec.ts` (create if absent)

**Interfaces:**
- Produces: `linkReferrer(userId: string, referredByCode?: string | null): Promise<void>` - resolves a referrer by quest `referralCode`; ensures the connecting user's `UserQuestProfile` exists; sets `referredById` only when currently null, referrer ≠ self, and not a direct cycle (referrer's own `referredById` ≠ userId). No-op otherwise. Never throws for missing/invalid input.

- [ ] **Step 1: Write the failing tests**

Create/extend `backend/src/modules/quest/users/users.service.spec.ts`:

```ts
import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../../database/prisma.service';

function makePrismaFake() {
  const profiles = new Map<string, any>(); // userId -> { userId, referralCode, referredById }
  const byCode = (code: string) =>
    [...profiles.values()].find((p) => p.referralCode === code);
  return {
    profiles,
    userQuestProfile: {
      findUnique: async ({ where }: any) =>
        where.userId ? (profiles.get(where.userId) ?? null) : null,
      findFirst: async ({ where }: any) => byCode(where.referralCode) ?? null,
      upsert: async ({ where, create, update }: any) => {
        const existing = profiles.get(where.userId);
        if (existing) { Object.assign(existing, update); return existing; }
        const row = { userId: where.userId, ...create };
        profiles.set(where.userId, row);
        return row;
      },
      update: async ({ where, data }: any) => {
        const row = profiles.get(where.userId);
        Object.assign(row, data);
        return row;
      },
    },
  };
}

async function buildService(prismaFake: any) {
  const moduleRef = await Test.createTestingModule({
    providers: [UsersService, { provide: PrismaService, useValue: prismaFake }],
  }).compile();
  return moduleRef.get(UsersService);
}

describe('UsersService.linkReferrer', () => {
  it('sets referredById on first touch when code resolves to another user', async () => {
    const p = makePrismaFake();
    p.profiles.set('refA', { userId: 'refA', referralCode: 'CODE-A', referredById: null });
    p.profiles.set('userB', { userId: 'userB', referralCode: 'CODE-B', referredById: null });
    const svc = await buildService(p);
    await svc.linkReferrer('userB', 'CODE-A');
    expect(p.profiles.get('userB').referredById).toBe('refA');
  });

  it('does not overwrite an existing referrer (first-touch wins)', async () => {
    const p = makePrismaFake();
    p.profiles.set('refA', { userId: 'refA', referralCode: 'CODE-A', referredById: null });
    p.profiles.set('userB', { userId: 'userB', referralCode: 'CODE-B', referredById: 'refX' });
    const svc = await buildService(p);
    await svc.linkReferrer('userB', 'CODE-A');
    expect(p.profiles.get('userB').referredById).toBe('refX');
  });

  it('rejects self-referral', async () => {
    const p = makePrismaFake();
    p.profiles.set('userB', { userId: 'userB', referralCode: 'CODE-B', referredById: null });
    const svc = await buildService(p);
    await svc.linkReferrer('userB', 'CODE-B');
    expect(p.profiles.get('userB').referredById).toBeNull();
  });

  it('rejects a direct cycle (referrer is referred by me)', async () => {
    const p = makePrismaFake();
    p.profiles.set('refA', { userId: 'refA', referralCode: 'CODE-A', referredById: 'userB' });
    p.profiles.set('userB', { userId: 'userB', referralCode: 'CODE-B', referredById: null });
    const svc = await buildService(p);
    await svc.linkReferrer('userB', 'CODE-A');
    expect(p.profiles.get('userB').referredById).toBeNull();
  });

  it('is a no-op for missing or unknown code', async () => {
    const p = makePrismaFake();
    p.profiles.set('userB', { userId: 'userB', referralCode: 'CODE-B', referredById: null });
    const svc = await buildService(p);
    await svc.linkReferrer('userB', undefined);
    await svc.linkReferrer('userB', 'NOPE');
    expect(p.profiles.get('userB').referredById).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && pnpm test -- users.service.spec`
Expected: FAIL - `linkReferrer is not a function`.

- [ ] **Step 3: Implement `linkReferrer`**

In `backend/src/modules/quest/users/users.service.ts` add the method (use the file's established prisma accessor - `db(this.prisma)` or `this.prisma` - to match neighboring methods):

```ts
/**
 * First-touch referral attribution. Sets the connecting user's referredById
 * exactly once. No-op when: no code, unknown code, self-referral, would create
 * a direct cycle, or the user already has a referrer. Never throws.
 */
async linkReferrer(userId: string, referredByCode?: string | null): Promise<void> {
  if (!referredByCode) return;

  const referrer = await this.prisma.userQuestProfile.findFirst({
    where: { referralCode: referredByCode },
    select: { userId: true, referredById: true },
  });
  if (!referrer || referrer.userId === userId) return;
  if (referrer.referredById === userId) return; // direct cycle guard

  const me = await this.prisma.userQuestProfile.findUnique({
    where: { userId },
    select: { referredById: true },
  });
  if (me && me.referredById) return; // first-touch wins

  await this.prisma.userQuestProfile.upsert({
    where: { userId },
    update: { referredById: referrer.userId },
    create: {
      userId,
      referralCode: this.generateReferralCode(),
      referredById: referrer.userId,
    },
  });
}
```

Note: confirm `generateReferralCode()` exists on this service (referenced by the dead `ensureWalletUser`); reuse it. If the schema requires more non-null fields in `create`, include them to match the other lazy-create call sites in this file.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && pnpm test -- users.service.spec`
Expected: PASS (5 tests).

- [ ] **Step 5: Remove dead `ensureWalletUser`**

Delete the unused `ensureWalletUser` method (zero callers). Run `cd backend && pnpm build` to confirm nothing references it.

- [ ] **Step 6: Commit**

```bash
cd backend && git add src/modules/quest/users/users.service.ts src/modules/quest/users/users.service.spec.ts
git commit -m "feat(quest): add first-touch linkReferrer, drop dead ensureWalletUser"
```

---

### Task 2: Thread `referredByCode` through `/auth/verify`

**Files:**
- Modify: `backend/src/modules/auth/auth.dto.ts` (`WalletVerifyDto`)
- Modify: `backend/src/modules/auth/auth.service.ts:159-220` (`walletLogin`)
- Test: `backend/src/modules/auth/auth.service.spec.ts`

**Interfaces:**
- Consumes: `UsersService.linkReferrer` (Task 1).
- Produces: `walletLogin` reads `dto.referredByCode` and calls `linkReferrer(user.id, dto.referredByCode)` after the user upsert, before returning tokens.

- [ ] **Step 1: Add optional field to DTO**

In `backend/src/modules/auth/auth.dto.ts`, add to `WalletVerifyDto` (import `IsOptional`, `IsString` from `class-validator` if needed):

```ts
@IsOptional()
@IsString()
referredByCode?: string;
```

- [ ] **Step 2: Write the failing test**

In `auth.service.spec.ts`, build the service with `UsersService.linkReferrer = jest.fn()` and minimal fakes (nonce store returns the stored nonce, signature verification stubbed to pass, `prisma.user.upsert` returns `{ id: 'userB' }`, jwt sign returns a string):

```ts
it('walletLogin forwards referredByCode to linkReferrer', async () => {
  await service.walletLogin({
    publicKey: 'GABC',
    signedMessage: 'sig',
    referredByCode: 'CODE-A',
  } as any);
  expect(usersService.linkReferrer).toHaveBeenCalledWith('userB', 'CODE-A');
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd backend && pnpm test -- auth.service.spec`
Expected: FAIL - `linkReferrer` not called.

- [ ] **Step 4: Wire the call in `walletLogin`**

In `auth.service.ts`, after the `user` upsert and alongside the existing `this.referralService.creditJoinIfEligible(user.id)` (~line 218), add a non-fatal call:

```ts
try {
  await this.usersService.linkReferrer(user.id, dto.referredByCode);
} catch (err) {
  this.logger?.warn?.(`linkReferrer failed: ${String(err)}`);
}
```

Ensure the quest `UsersService` is injected into `AuthService`. If this creates a circular dependency, use `@Inject(forwardRef(() => UsersService))` (NestJS) and document the choice in the commit message.

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && pnpm test -- auth.service.spec`
Expected: PASS.

- [ ] **Step 6: Regression - login without a code still works**

Add a test calling `walletLogin` with no `referredByCode`; assert it resolves to tokens and `linkReferrer` is called with `undefined` (a no-op per Task 1).

Run: `cd backend && pnpm test -- auth.service.spec`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
cd backend && git add src/modules/auth/auth.dto.ts src/modules/auth/auth.service.ts src/modules/auth/auth.service.spec.ts
git commit -m "feat(auth): accept optional referredByCode and link referrer on verify"
```

---

### Task 3: Cascade commissions on all point-award paths

**Files:**
- Modify: `backend/src/modules/quest/claims/claims.service.ts` (`claimDailyTask`, `claimCampaign`)
- Modify: `backend/src/modules/quest/users/users.service.ts` (`dailyLoginReward`)
- Test: `backend/src/modules/quest/claims/claims.service.spec.ts`

**Interfaces:**
- Consumes: `CommissionService.applyCommissions(tx, sourceUserId, basePoints, sourceClaimId)` (existing).

- [ ] **Step 1: Write failing tests**

In `claims.service.spec.ts`, build `ClaimsService` with `$transaction` running the callback against a tx fake, `PointsService.award` stubbed to `{ basePoints, multiplier: 1, pointsAwarded: basePoints }`, and `CommissionService.applyCommissions = jest.fn()`. Assert it is called with **base** points:

```ts
it('claimDailyTask cascades commission with base points', async () => {
  await service.claimDailyTask('userB', {
    id: 'task1', type: 'CUSTOM', pointReward: 50,
    campaign: { isActive: true, startAt: null, endAt: null },
  } as any);
  expect(commissionService.applyCommissions).toHaveBeenCalledWith(
    expect.anything(), 'userB', 50, expect.any(String));
});

it('claimCampaign cascades commission with base reward points', async () => {
  await service.claimCampaign('userB', 'camp1'); // rewardPoints meta = 200, eligible
  expect(commissionService.applyCommissions).toHaveBeenCalledWith(
    expect.anything(), 'userB', 200, expect.any(String));
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd backend && pnpm test -- claims.service.spec`
Expected: FAIL - `applyCommissions` not called in those paths.

- [ ] **Step 3: Wire `claimDailyTask`**

In `claims.service.ts` `claimDailyTask`, after the `questDailyTaskCompletion.update` (~line 125), still inside the `$transaction`, add:

```ts
await this.commissionService.applyCommissions(
  tx, userId, task.pointReward,
  `dailytask:${task.id}:${today.toISOString().slice(0, 10)}`,
);
```

- [ ] **Step 4: Wire `claimCampaign`**

In `claimCampaign`, after the `questCampaignClaim.create` (~line 243), inside the `try`, add:

```ts
await this.commissionService.applyCommissions(tx, userId, rewardPoints, claim.id);
```

- [ ] **Step 5: Wire `dailyLoginReward`**

In `users.service.ts` `dailyLoginReward` (~line 251-267), ensure the +10 award runs in a transaction, then add (base `10`):

```ts
await this.commissionService.applyCommissions(
  tx, userId, 10, `dailylogin:${userId}:${utcDateString}`,
);
```

Inject `CommissionService` into `UsersService`. If this creates a circular dependency (CommissionService → PointsService → UsersService), use `forwardRef` or move this specific call into a service that already depends on both; document the choice in the commit.

- [ ] **Step 6: Run to verify pass**

Run: `cd backend && pnpm test -- claims.service.spec`
Expected: PASS.

- [ ] **Step 7: Idempotency test - re-claim does not double-credit**

Add a test calling `claimDailyTask` twice for the same `(userId, taskId, today)`; the second throws `ALREADY_COMPLETED` (P2002) before reaching `applyCommissions`, so it is called exactly once.

Run: `cd backend && pnpm test -- claims.service.spec`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
cd backend && git add src/modules/quest/claims/claims.service.ts src/modules/quest/users/users.service.ts src/modules/quest/claims/claims.service.spec.ts
git commit -m "feat(quest): cascade referral commission on daily task, campaign, and daily login"
```

---

### Task 4: Expose `referredBy` in `/referral/me`

**Files:**
- Modify: `backend/src/modules/quest/referral/referral.service.ts:37-98` (`getMyReferral`)
- Test: `backend/src/modules/quest/referral/referral.service.spec.ts`

**Interfaces:**
- Produces: `getMyReferral` return object gains `referredBy: { code: string | null; name: string | null; walletAddress: string | null } | null`.

- [ ] **Step 1: Write failing test**

```ts
it('getMyReferral returns the direct referrer info', async () => {
  // fake: userB.referredById = refA; refA.referralCode=CODE-A, username=alice, user.stellarPubkey=GREFA
  const result = await service.getMyReferral('userB', 'GBWALLET');
  expect(result.referredBy).toEqual({ code: 'CODE-A', name: 'alice', walletAddress: 'GREFA' });
});

it('getMyReferral returns referredBy = null when user has no referrer', async () => {
  const result = await service.getMyReferral('userNoRef', 'GB');
  expect(result.referredBy).toBeNull();
});
```

- [ ] **Step 2: Run to verify fail**

Run: `cd backend && pnpm test -- referral.service.spec`
Expected: FAIL - `referredBy` undefined.

- [ ] **Step 3: Implement**

In `getMyReferral`, extend the `profile` select and resolve the referrer:

```ts
const profile = await db(this.prisma).userQuestProfile.findUnique({
  where: { userId },
  select: { referralCode: true, referredById: true },
});

let referredBy: { code: string | null; name: string | null; walletAddress: string | null } | null = null;
if (profile?.referredById) {
  const up = await db(this.prisma).userQuestProfile.findUnique({
    where: { userId: profile.referredById },
    select: { referralCode: true, username: true, user: { select: { stellarPubkey: true } } },
  });
  if (up) {
    referredBy = {
      code: up.referralCode ?? null,
      name: up.username ?? null,
      walletAddress: up.user?.stellarPubkey ?? null,
    };
  }
}
```

Add `referredBy` to the returned object (after `referralCode`). Confirm the `user` relation name on `userQuestProfile` from the schema; adjust the `select` if it differs.

- [ ] **Step 4: Run to verify pass**

Run: `cd backend && pnpm test -- referral.service.spec`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd backend && git add src/modules/quest/referral/referral.service.ts src/modules/quest/referral/referral.service.spec.ts
git commit -m "feat(quest): include referredBy (upline) in /referral/me"
```

---

### Task 5: Idempotency migration (defense-in-depth)

**Files:**
- Modify: `backend/prisma/schema.prisma` (`QuestReferralCommission`)
- Create: `backend/prisma/migrations/<timestamp>_quest_referral_commission_unique/migration.sql`

- [ ] **Step 1: Add `@@unique` to the model**

In `schema.prisma`, on `QuestReferralCommission` add:

```prisma
@@unique([earnerId, sourceClaimId, layer], name: "uq_commission_claim")
```

- [ ] **Step 2: Generate the migration (create-only)**

Run: `cd backend && pnpm prisma migrate dev --name quest_referral_commission_unique --create-only`

- [ ] **Step 3: Replace the SQL with a safe partial index**

Edit the generated `migration.sql` to tolerate existing rows and null claim ids:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS "uq_commission_claim"
  ON "quest_referral_commissions" ("earner_id", "source_claim_id", "layer")
  WHERE "source_claim_id" IS NOT NULL;
```

- [ ] **Step 4: Apply and verify**

Run: `cd backend && pnpm prisma migrate dev && pnpm prisma generate`
Expected: applies cleanly; client generates.

- [ ] **Step 5: Commit**

```bash
cd backend && git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): unique index to make referral commission idempotent"
```

---

## FRONTEND

### Task 6: `/r/[code]` redirects into Quest

**Files:**
- Modify: `tasmil-finance/src/app/r/[code]/page.tsx`
- Test: `tasmil-finance/src/app/r/[code]/__tests__/page.test.tsx` (create)

**Interfaces:**
- Produces: visiting `/r/<code>` stores `localStorage["tasmil.referral.pendingCode"] = code` and calls `router.replace("/quest?ref=<code>")`.

- [ ] **Step 1: Write failing test**

```tsx
import { render } from "@testing-library/react";
import ReferralLandingPage from "../page";

const replace = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

it("stores the code and redirects to /quest?ref=", async () => {
  render(<ReferralLandingPage params={Promise.resolve({ code: "CODE-A" })} />);
  await new Promise((r) => setTimeout(r, 0));
  expect(localStorage.getItem("tasmil.referral.pendingCode")).toBe("CODE-A");
  expect(replace).toHaveBeenCalledWith("/quest?ref=CODE-A");
});
```

- [ ] **Step 2: Run to verify fail**

Run: ``cd tasmil-finance && pnpm test -- 'r/\[code\]'``
Expected: FAIL - redirect target is `/?ref=CODE-A`.

- [ ] **Step 3: Change the redirect target**

In `src/app/r/[code]/page.tsx` line 26, change `` router.replace(`/?ref=${encodeURIComponent(code)}`) `` to `` router.replace(`/quest?ref=${encodeURIComponent(code)}`) ``.

- [ ] **Step 4: Run to verify pass**

Run: ``cd tasmil-finance && pnpm test -- 'r/\[code\]'``
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd tasmil-finance && git add src/app/r/ && git commit -m "fix(referral): land /r/<code> on /quest so ref is captured"
```

---

### Task 7: Send `referredByCode` on Quest wallet connect

**Files:**
- Create: `tasmil-finance/src/features/quest/lib/referral-link.ts`
- Modify: `tasmil-finance/src/features/quest/context/wallet-context.tsx` (~line 349, the `/api/auth/verify` POST)
- Test: `tasmil-finance/src/features/quest/lib/__tests__/referral-link.test.ts`

**Interfaces:**
- Produces:
  - `buildShareUrl(code: string): string` → `https://tasmil.finance/r/<code>`.
  - `readPendingReferralCode(): string | null` → `?ref=` from `window.location.search` if present, else `localStorage["tasmil.referral.pendingCode"]`, else null.

- [ ] **Step 1: Write failing tests for the helper**

```ts
import { buildShareUrl, readPendingReferralCode } from "../referral-link";

describe("referral-link", () => {
  it("buildShareUrl returns the canonical /r/ url", () => {
    expect(buildShareUrl("CODE-A")).toBe("https://tasmil.finance/r/CODE-A");
  });
  it("readPendingReferralCode falls back to localStorage", () => {
    localStorage.clear();
    localStorage.setItem("tasmil.referral.pendingCode", "FROM-LS");
    expect(readPendingReferralCode()).toBe("FROM-LS");
  });
  it("returns null when nothing is set", () => {
    localStorage.clear();
    expect(readPendingReferralCode()).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `cd tasmil-finance && pnpm test -- referral-link`
Expected: FAIL - module does not exist.

- [ ] **Step 3: Implement the helper**

Create `src/features/quest/lib/referral-link.ts`:

```ts
const PENDING_KEY = "tasmil.referral.pendingCode";
const SHARE_BASE = "https://tasmil.finance/r";

export function buildShareUrl(code: string): string {
  return `${SHARE_BASE}/${code}`;
}

export function readPendingReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  const fromQuery = new URLSearchParams(window.location.search).get("ref");
  if (fromQuery) return fromQuery;
  try {
    return window.localStorage.getItem(PENDING_KEY);
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `cd tasmil-finance && pnpm test -- referral-link`
Expected: PASS.

- [ ] **Step 5: Use it in wallet-context**

In `src/features/quest/context/wallet-context.tsx`, import `readPendingReferralCode` and change the verify POST (~line 349):

```ts
const referredByCode = readPendingReferralCode();
await apiClient.post("/api/auth/verify", {
  publicKey,
  signedMessage,
  ...(referredByCode ? { referredByCode } : {}),
});
```

- [ ] **Step 6: Test the verify payload includes the code**

Add `src/features/quest/context/__tests__/wallet-context-ref.test.tsx` mocking `apiClient.post`, seeding `localStorage` with a pending code, driving `authenticateWithWallet`, and asserting the `/api/auth/verify` body contains `referredByCode: "CODE-A"`. If the wallet-context harness is heavy, extract payload-building into a small tested function and assert there.

Run: `cd tasmil-finance && pnpm test -- wallet-context-ref`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
cd tasmil-finance && git add src/features/quest/lib/referral-link.ts src/features/quest/context/wallet-context.tsx src/features/quest/lib/__tests__ src/features/quest/context/__tests__
git commit -m "feat(quest): send referredByCode on wallet connect (query > localStorage)"
```

---

### Task 8: Fix Quest Profile copy / share / set-code

**Files:**
- Modify: `tasmil-finance/src/features/quest/components/Profile.tsx` (ReferralsTab ~1244-1648, OverviewTab referral card ~841-885)
- Test: `tasmil-finance/src/features/quest/components/__tests__/profile-referral-actions.test.tsx` (create)

**Interfaces:**
- Consumes: `buildShareUrl` (Task 7); `useUsersControllerSetReferralCode` (existing gen-quest hook).

- [ ] **Step 1: Write failing tests**

```tsx
it("Share Link copies the canonical /r/ url", async () => {
  const writeText = jest.fn();
  Object.assign(navigator, { clipboard: { writeText } });
  // render ReferralsTab with referralCode "CODE-A"; click "Share Link"
  expect(writeText).toHaveBeenCalledWith("https://tasmil.finance/r/CODE-A");
});

it("Copy Code does not copy the placeholder dash", async () => {
  const writeText = jest.fn();
  Object.assign(navigator, { clipboard: { writeText } });
  // referralCode resolves to "-"; click "Copy Code"
  expect(writeText).not.toHaveBeenCalledWith("-");
});
```

- [ ] **Step 2: Run to verify fail**

Run: `cd tasmil-finance && pnpm test -- profile-referral-actions`
Expected: FAIL - Share Link has no handler; Copy Code copies "-".

- [ ] **Step 3: Wire the buttons**

In `Profile.tsx`:
1. Import `buildShareUrl` from `../lib/referral-link`.
2. Replace the no-op "Set custom code" `onClick={() => {}}` (~line 1390). Add near the `ReferralsTab` hooks:

```ts
const setCode = useUsersControllerSetReferralCode();
const [draftCode, setDraftCode] = useState("");
const onSetCustomCode = async () => {
  if (!draftCode.trim()) return;
  await setCode.mutateAsync({ data: { code: draftCode.trim() } } as never);
};
```

(Confirm the request shape from `src/gen-quest/types/users-controller-set-referral-code.ts`; adjust `{ data: { code } }` to match, and wire `draftCode`/`setDraftCode` to the adjacent input. Invalidate the referral query after success.)

3. Add `onClick` to both "Share Link" buttons:

```ts
const onShareLink = () => {
  if (!referralCode || referralCode === "-") return;
  navigator.clipboard?.writeText(buildShareUrl(referralCode));
};
```

4. Guard the ReferralsTab "Copy Code" (~line 1416):

```ts
onClick={() => {
  if (!referralCode || referralCode === "-") return;
  navigator.clipboard?.writeText(referralCode);
}}
```

- [ ] **Step 4: Run to verify pass**

Run: `cd tasmil-finance && pnpm test -- profile-referral-actions`
Expected: PASS.

- [ ] **Step 5: Type-check + lint**

Run: `cd tasmil-finance && pnpm type-check && pnpm lint`
Expected: no errors in `Profile.tsx`.

- [ ] **Step 6: Commit**

```bash
cd tasmil-finance && git add src/features/quest/components/Profile.tsx src/features/quest/components/__tests__/profile-referral-actions.test.tsx
git commit -m "fix(quest): wire Profile share link, set custom code, guard copy placeholder"
```

---

### Task 9: Account dropdown shows referral code + referrer

**Files:**
- Modify: `tasmil-finance/src/features/quest/components/Navbar.tsx` (both dropdowns: desktop ~300-316, mobile ~440-465)
- Test: `tasmil-finance/src/features/quest/components/__tests__/navbar-referral.test.tsx` (create)

**Interfaces:**
- Consumes: `useReferralControllerGetMyReferral` (existing); `referredBy` (Task 4); `buildShareUrl` (Task 7).

- [ ] **Step 1: Write failing test**

```tsx
it("dropdown shows the user's referral code and referrer", () => {
  // mock useReferralControllerGetMyReferral -> { data: { data: {
  //   referralCode: "CODE-B",
  //   referredBy: { code: "CODE-A", name: "alice", walletAddress: "GREFA" } } } }
  // render Navbar connected
  expect(screen.getByText(/CODE-B/)).toBeInTheDocument();
  expect(screen.getByText(/alice|CODE-A|GREFA/)).toBeInTheDocument();
});

it("dropdown shows a placeholder when there is no referrer", () => {
  // referredBy: null
  expect(screen.getByText(/Referred by/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify fail**

Run: `cd tasmil-finance && pnpm test -- navbar-referral`
Expected: FAIL - no referral rows.

- [ ] **Step 3: Implement**

In `Navbar.tsx`, read the snapshot near the top of the component:

```ts
const { data: refRaw } = useReferralControllerGetMyReferral($ as never);
const ref = unwrapEnvelope<{
  referralCode: string | null;
  referredBy: { code: string | null; name: string | null; walletAddress: string | null } | null;
}>(refRaw);
const myCode = ref?.referralCode ?? null;
const referrer = ref?.referredBy ?? null;
const referrerLabel =
  referrer?.name ??
  referrer?.code ??
  (referrer?.walletAddress ? `${referrer.walletAddress.slice(0, 4)}...${referrer.walletAddress.slice(-4)}` : "-");
```

In **both** dropdown panels, insert above "Copy Address":

```tsx
{myCode && (
  <button
    onClick={() => navigator.clipboard?.writeText(buildShareUrl(myCode))}
    className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted hover:text-white hover:bg-white/5 flex items-center gap-2"
  >
    <Copy size={14} /> Referral: {myCode}
  </button>
)}
<div className="px-3 py-2 text-xs text-muted">Referred by: {referrerLabel}</div>
```

Import `buildShareUrl` and `unwrapEnvelope`; reuse the quest config token (`$`) used by other gen-quest hooks in this feature.

- [ ] **Step 4: Run to verify pass**

Run: `cd tasmil-finance && pnpm test -- navbar-referral`
Expected: PASS.

- [ ] **Step 5: Type-check + lint**

Run: `cd tasmil-finance && pnpm type-check && pnpm lint`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
cd tasmil-finance && git add src/features/quest/components/Navbar.tsx src/features/quest/components/__tests__/navbar-referral.test.tsx
git commit -m "feat(quest): show referral code and referrer in account dropdown"
```

---

### Task 10: Full-suite green + manual E2E

- [ ] **Step 1: Backend suite**

Run: `cd backend && pnpm test`
Expected: all green.

- [ ] **Step 2: Frontend suite + types + lint**

Run: `cd tasmil-finance && pnpm test && pnpm type-check && pnpm lint`
Expected: all green.

- [ ] **Step 3: Manual E2E (local: backend :6756 + frontend :3000)**

1. Wallet A connects → note `codeA` in the dropdown; copy `/r/codeA`.
2. Disconnect; open `/r/codeA`; connect a **new** wallet B → `user_quest_profiles.referred_by_id` for B = A.
3. B claims a one-time task, a daily task, a campaign, and does a daily check-in → `quest_referral_commissions` has an L1 row for A on each.
4. Add wallet C under B → C earns → B gets L1, A gets L2; add D under C → A gets L3, nothing at L4.
5. B's dropdown shows B's code and "Referred by: A".
6. Re-open `/r/codeA` as B → no change, no error.

- [ ] **Step 4: Push branches + open PRs (do NOT merge to deploy/prod without approval)**

```bash
cd backend && git push -u origin feat/quest-referral-e2e
cd ../tasmil-finance && git push -u origin feat/quest-referral-e2e
# Open PRs feat/quest-referral-e2e -> deploy/prod in each repo via gh pr create
```

---

## Self-Review

**Spec coverage:**
- §3 anti-conflict persistence → Tasks 1 (first-touch), 6 (localStorage + redirect), 7 (read pending + send). ✓
- §4.1 capture/persist referredById → Tasks 1, 2. ✓
- §4.2 cascade on all paths → Task 3 (one-time task already wired; daily task, campaign, daily login added). ✓
- §4.3 referredBy in /referral/me → Task 4. ✓
- §4.4 idempotency index → Task 5. ✓
- §5.1 link scheme → Task 6. ✓
- §5.2 capture on connect → Task 7. ✓
- §5.3 Profile copy/share/set-code → Task 8. ✓
- §5.4 dropdown code + referrer → Task 9. ✓
- §7 tests + manual E2E → per-task tests + Task 10. ✓

**Placeholder scan:** No TBD/TODO. Code steps show concrete code; spots that depend on exact existing signatures (set-referral-code request shape, `db()` accessor, `user` relation name, `$` config token) are flagged with how to confirm - not left blank.

**Type consistency:** `linkReferrer(userId, referredByCode?)`, `buildShareUrl(code)`, `readPendingReferralCode()`, and `referredBy: { code, name, walletAddress } | null` are used identically across producing and consuming tasks.

**Known integration risk to verify during execution:** circular dependency when injecting quest `UsersService` into `AuthService` (Task 2) and `CommissionService` into `UsersService` (Task 3). Both tasks call this out with a `forwardRef`/boundary fallback; resolve at execution time and note the choice in the commit.
