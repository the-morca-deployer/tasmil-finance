# Quest Plan 1 — Backend dev-login + full seed (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a guarded `POST /auth/dev-login` to the quest backend that mints a real JWT for a wallet without a signature, and expand the Prisma seed into a full dataset, so authenticated quest screens load real data under dev-bypass and Playwright.

**Architecture:** The quest backend (`tasmil-quest-folder/backend`, NestJS) runs its quest data layer on **Prisma/PostgreSQL** (services call `this.prisma.questCampaign...`). dev-login mirrors the existing `walletLogin` minus signature verification, gated by `NODE_ENV !== 'production'` **and** `QUEST_DEV_LOGIN=true`. The seed is expanded in `prisma/seed.ts` (data only — schema is migrated centrally from the `backend` repo; **no new migrations here**). Tests: dev-login is unit-tested with mocked deps (matching the existing `auth.service.spec.ts` style); the seed is verified by a standalone `prisma/verify-seed.ts` assertion script run against a disposable PostgreSQL test DB.

**Tech Stack:** NestJS 11, Prisma 7 (`generated/prisma/client`), `@stellar/stellar-sdk`, Jest (`pnpm test`), ts-node.

## Global Constraints

- Repo: `tasmil-quest-folder/backend` (GitHub `Tasmil-Finance/tasmil-quest-backend`). Branch `feat/quest-seed-dev-login` cut from `origin/deploy/staging`.
- **Never create migrations in this repo.** All schema migrations live in `backend/prisma/migrations/` (shared DB). This plan changes only `prisma/seed.ts`, auth module code, DTO, env example, and tests.
- TDD: no behavioral production code without a failing test first (RED → verify fail → GREEN → REFACTOR).
- English-only in all source and copy. No `any` in new code except where mirroring existing typed-`any` boundaries (`LoginResponse.user` is `any` upstream).
- Prisma client import path in this repo: `import { PrismaClient } from './generated/prisma/client'` from `prisma/` files, or `'../../generated/prisma/client'` from `src/`.
- dev-login guard is dual: `process.env.NODE_ENV !== 'production' && process.env.QUEST_DEV_LOGIN === 'true'`. Both required.
- Primary dev wallet (must match the frontend `DEV_WALLET` constant): `GDQI7LOGDRQRM5OXEIEY7TDHUYEHGQ7RX3KOJU3FNUP6HBDHUGWA3I6R`.
- Commit message footer (every commit):
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_012NHwXrkNtuVzWRoAMsJGNP
  ```

---

## File Structure

- `src/modules/auth/auth.service.ts` — add `devLogin(walletAddress, res)` method (mirrors `walletLogin` minus nonce/signature).
- `src/modules/auth/auth.controller.ts` — add `@Public() @Post('dev-login')` route with the env guard.
- `src/modules/auth/dto/dev-login.dto.ts` — **create** `DevLoginDto { walletAddress: string }`.
- `src/modules/auth/auth.service.spec.ts` — add `devLogin` unit tests.
- `src/modules/auth/auth.controller.spec.ts` — **create** controller guard tests.
- `prisma/verify-seed.ts` — **create** standalone seed-invariant assertion script (the failing "test").
- `prisma/seed.ts` — expand from the 3-layer `QuestReferralConfig` seed to the full dataset.
- `package.json` — add `"verify:seed": "ts-node prisma/verify-seed.ts"`.
- `.env.example` — add `QUEST_DEV_LOGIN=false`.

---

### Task 1: dev-login service method

**Files:**
- Modify: `src/modules/auth/auth.service.ts`
- Test: `src/modules/auth/auth.service.spec.ts`

**Interfaces:**
- Consumes: `this.usersService.ensureWalletUser(walletAddress)`, `this.usersService.handleLoginSuccess(id)`, `this.usersService.getMe(id)`, private `this.validatePublicKey`, `this.issueTokens`, `this.setRefreshTokenCookie`.
- Produces: `AuthService.devLogin(walletAddress: string, res: Response): Promise<LoginResponse>` where `LoginResponse = { accessToken: string; user: any }`.

- [ ] **Step 1: Write the failing test**

Append to `src/modules/auth/auth.service.spec.ts` (after the existing `describe('AuthService walletLogin', ...)` block, reusing the same mock objects defined at module scope — declare a new `describe` that constructs its own `AuthService` with the same mocks):

```typescript
describe('AuthService devLogin', () => {
  const usersService = {
    ensureWalletUser: jest
      .fn()
      .mockResolvedValue({ id: 'user-1', walletAddress: 'GDQI7LOGDRQRM5OXEIEY7TDHUYEHGQ7RX3KOJU3FNUP6HBDHUGWA3I6R', role: 'user', username: 'dev' }),
    handleLoginSuccess: jest.fn().mockResolvedValue(undefined),
    getMe: jest.fn().mockResolvedValue({ id: 'user-1', username: 'dev' }),
  } as unknown as UsersService;

  const jwtService = { signAsync: jest.fn().mockResolvedValue('access-token') } as unknown as JwtService;
  const configService = {
    get: (key: string) =>
      (({ 'auth.jwtAccessTtl': 900, 'auth.jwtRefreshTtl': 604800, 'auth.jwtRefreshSecret': 'refresh' }) as Record<string, unknown>)[key],
  } as unknown as ConfigService;
  const redisService = { setValue: jest.fn(), getValue: jest.fn(), delete: jest.fn() } as unknown as RedisService;
  const rateLimiterService = { consume: jest.fn().mockResolvedValue(undefined) } as unknown as RateLimiterService;

  const authService = new AuthService(usersService, jwtService, configService, redisService, rateLimiterService);

  it('mints a token for a valid wallet without signature verification', async () => {
    const mockRes = { cookie: jest.fn() } as any;
    const walletAddress = 'GDQI7LOGDRQRM5OXEIEY7TDHUYEHGQ7RX3KOJU3FNUP6HBDHUGWA3I6R';

    const result = await authService.devLogin(walletAddress, mockRes);

    expect(result.accessToken).toBe('access-token');
    expect(result.user).toEqual({ id: 'user-1', username: 'dev' });
    expect(usersService.ensureWalletUser).toHaveBeenCalledWith(walletAddress);
    expect(mockRes.cookie).toHaveBeenCalled();
  });

  it('rejects an invalid wallet address', async () => {
    const mockRes = { cookie: jest.fn() } as any;
    await expect(authService.devLogin('not-a-key', mockRes)).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- auth.service.spec.ts`
Expected: FAIL — `authService.devLogin is not a function`.

- [ ] **Step 3: Write minimal implementation**

In `src/modules/auth/auth.service.ts`, add this method to the `AuthService` class (place it right after `usernameLogin`):

```typescript
  // ─── Dev login (guarded at the controller) ────────────────────────────────
  async devLogin(walletAddress: string, res: Response): Promise<LoginResponse> {
    const publicKey = this.validatePublicKey(walletAddress);
    const user = await this.usersService.ensureWalletUser(publicKey);
    await this.usersService.handleLoginSuccess(user.id);
    const tokens = await this.issueTokens(user);
    this.setRefreshTokenCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken, user: await this.usersService.getMe(user.id) };
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- auth.service.spec.ts`
Expected: PASS (both new tests green; existing walletLogin test still green).

- [ ] **Step 5: Commit**

```bash
git add src/modules/auth/auth.service.ts src/modules/auth/auth.service.spec.ts
git commit -m "feat(auth): add devLogin service method (mints JWT without signature)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012NHwXrkNtuVzWRoAMsJGNP"
```

---

### Task 2: dev-login controller route + DTO + env guard

**Files:**
- Create: `src/modules/auth/dto/dev-login.dto.ts`
- Modify: `src/modules/auth/auth.controller.ts`
- Modify: `.env.example`
- Test: `src/modules/auth/auth.controller.spec.ts` (create)

**Interfaces:**
- Consumes: `AuthService.devLogin` (Task 1).
- Produces: route `POST /api/auth/dev-login`, body `{ walletAddress: string }`, returns `LoginResponse`. Returns HTTP 404 (`NotFoundException`) unless `NODE_ENV !== 'production' && QUEST_DEV_LOGIN === 'true'`.

- [ ] **Step 1: Write the failing test**

Create `src/modules/auth/auth.controller.spec.ts`:

```typescript
import { NotFoundException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController dev-login guard', () => {
  const authService = {
    devLogin: jest.fn().mockResolvedValue({ accessToken: 'tok', user: { id: 'u1' } }),
  } as unknown as AuthService;
  const controller = new AuthController(authService);
  const res = { cookie: jest.fn() } as any;
  const dto = { walletAddress: 'GDQI7LOGDRQRM5OXEIEY7TDHUYEHGQ7RX3KOJU3FNUP6HBDHUGWA3I6R' };

  const ORIGINAL = { NODE_ENV: process.env.NODE_ENV, QUEST_DEV_LOGIN: process.env.QUEST_DEV_LOGIN };
  afterEach(() => {
    process.env.NODE_ENV = ORIGINAL.NODE_ENV;
    process.env.QUEST_DEV_LOGIN = ORIGINAL.QUEST_DEV_LOGIN;
    jest.clearAllMocks();
  });

  it('mints a token when enabled in non-production', async () => {
    process.env.NODE_ENV = 'development';
    process.env.QUEST_DEV_LOGIN = 'true';
    const result = await controller.devLogin(dto, res);
    expect(result.accessToken).toBe('tok');
    expect(authService.devLogin).toHaveBeenCalledWith(dto.walletAddress, res);
  });

  it('returns 404 when the flag is off', async () => {
    process.env.NODE_ENV = 'development';
    process.env.QUEST_DEV_LOGIN = 'false';
    await expect(controller.devLogin(dto, res)).rejects.toBeInstanceOf(NotFoundException);
    expect(authService.devLogin).not.toHaveBeenCalled();
  });

  it('returns 404 in production even when the flag is on', async () => {
    process.env.NODE_ENV = 'production';
    process.env.QUEST_DEV_LOGIN = 'true';
    await expect(controller.devLogin(dto, res)).rejects.toBeInstanceOf(NotFoundException);
    expect(authService.devLogin).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- auth.controller.spec.ts`
Expected: FAIL — `controller.devLogin is not a function`.

- [ ] **Step 3: Write minimal implementation**

Create `src/modules/auth/dto/dev-login.dto.ts`:

```typescript
import { IsNotEmpty, IsString } from 'class-validator';

export class DevLoginDto {
  @IsString()
  @IsNotEmpty()
  walletAddress!: string;
}
```

In `src/modules/auth/auth.controller.ts`, add `NotFoundException` to the `@nestjs/common` import, import the DTO, and add the route inside the class (after `usernameLogin`):

```typescript
// add to existing import:
import { Body, Controller, Ip, Post, Res, Req, NotFoundException } from '@nestjs/common';
// new import:
import { DevLoginDto } from './dto/dev-login.dto';
```

```typescript
  // POST /api/auth/dev-login — local/dev only, mints a JWT without a signature.
  @Public()
  @Post('dev-login')
  async devLogin(
    @Body() dto: DevLoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    const enabled = process.env.NODE_ENV !== 'production' && process.env.QUEST_DEV_LOGIN === 'true';
    if (!enabled) {
      throw new NotFoundException();
    }
    return this.authService.devLogin(dto.walletAddress, res);
  }
```

In `.env.example`, add:

```
# Dev-only: enable POST /auth/dev-login (never set true in production)
QUEST_DEV_LOGIN=false
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- auth.controller.spec.ts`
Expected: PASS (all three cases green).

- [ ] **Step 5: Commit**

```bash
git add src/modules/auth/auth.controller.ts src/modules/auth/dto/dev-login.dto.ts src/modules/auth/auth.controller.spec.ts .env.example
git commit -m "feat(auth): add guarded POST /auth/dev-login route

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012NHwXrkNtuVzWRoAMsJGNP"
```

---

### Task 3: Seed harness + verify script + all users & profiles

**Files:**
- Create: `prisma/verify-seed.ts`
- Modify: `prisma/seed.ts`
- Modify: `package.json` (add `verify:seed` script)

**Interfaces:**
- Produces: a deterministic users dataset. Primary user has `stellarPubkey = 'GDQI7LOGDRQRM5OXEIEY7TDHUYEHGQ7RX3KOJU3FNUP6HBDHUGWA3I6R'`, profile `username='user_3abe7ed8'`, `totalPoints=10`, `tier='COHORT_4'` (Bronze), `loginStreak=1`, `referralCode='46676f23'`. 10 supporting users with deterministic Stellar pubkeys and descending points (14000 → 10420) for the leaderboard. The seed exports `SEED_USERS` (array of `{ pubkey, username, points, streak }`) for reuse by later tasks.

**Test-DB setup (run once before Step 2, and whenever re-verifying):**

```bash
# From tasmil-quest-folder/backend. Requires the local Postgres from `backend`'s docker compose to be up.
export TEST_DB_URL="postgresql://postgres:postgres@localhost:5432/tasmil_quest_test"
psql "postgresql://postgres:postgres@localhost:5432/postgres" -c "DROP DATABASE IF EXISTS tasmil_quest_test;" -c "CREATE DATABASE tasmil_quest_test;"
# Apply the shared schema from the source-of-truth repo (NEVER migrate from this repo):
( cd ../../backend && DATABASE_URL="$TEST_DB_URL" pnpm prisma migrate deploy )
```

- [ ] **Step 1: Write the failing test (verify script)**

Create `prisma/verify-seed.ts`:

```typescript
import assert from 'node:assert';
import * as pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

export const PRIMARY_PUBKEY = 'GDQI7LOGDRQRM5OXEIEY7TDHUYEHGQ7RX3KOJU3FNUP6HBDHUGWA3I6R';

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter } as any);
  try {
    // Task 3 — users & profiles
    const primary = await prisma.user.findUnique({
      where: { stellarPubkey: PRIMARY_PUBKEY },
      include: { questProfile: true },
    });
    assert(primary, 'primary dev user must exist');
    assert(primary.questProfile, 'primary user must have a quest profile');
    assert.equal(primary.questProfile?.referralCode, '46676f23', 'primary referralCode');
    assert.equal(primary.questProfile?.totalPoints, 10, 'primary totalPoints');
    const profileCount = await prisma.userQuestProfile.count();
    assert(profileCount >= 11, `expected >= 11 quest profiles, got ${profileCount}`);

    console.log('verify-seed: OK');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

Add to `package.json` `scripts`:

```json
    "verify:seed": "ts-node prisma/verify-seed.ts",
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
DATABASE_URL="$TEST_DB_URL" pnpm prisma:seed        # current seed: only QuestReferralConfig
DATABASE_URL="$TEST_DB_URL" pnpm verify:seed
```
Expected: FAIL — `primary dev user must exist` (AssertionError, exit 1).

- [ ] **Step 3: Write minimal implementation**

Replace `prisma/seed.ts` with the users section (keeps the existing referral-config seed, adds users). Use deterministic Stellar keypairs for supporting users:

```typescript
import { createHash } from 'node:crypto';
import * as pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { Keypair } from '@stellar/stellar-sdk';
import { PrismaClient } from './generated/prisma/client';

const PRIMARY_PUBKEY = 'GDQI7LOGDRQRM5OXEIEY7TDHUYEHGQ7RX3KOJU3FNUP6HBDHUGWA3I6R';

function deterministicPubkey(label: string): string {
  const seed = createHash('sha256').update(`tasmil-quest-seed:${label}`).digest();
  return Keypair.fromRawEd25519Seed(seed).publicKey();
}

export interface SeedUser {
  pubkey: string;
  username: string;
  points: number;
  streak: number;
}

// Names/points mirror the reference leaderboard screenshots.
export const SEED_USERS: SeedUser[] = [
  { pubkey: PRIMARY_PUBKEY, username: 'user_3abe7ed8', points: 10, streak: 1 },
  { pubkey: deterministicPubkey('stellar_nomad'), username: 'stellar_nomad', points: 14000, streak: 41 },
  { pubkey: deterministicPubkey('aqua_whale'), username: 'aqua_whale', points: 13500, streak: 40 },
  { pubkey: deterministicPubkey('blendmaxi'), username: 'blendmaxi', points: 13000, streak: 39 },
  { pubkey: deterministicPubkey('soroswapper'), username: 'soroswapper', points: 12710, streak: 38 },
  { pubkey: deterministicPubkey('yield_pilgrim'), username: 'yield_pilgrim', points: 12210, streak: 37 },
  { pubkey: deterministicPubkey('chain_surfer'), username: 'chain_surfer', points: 11710, streak: 36 },
  { pubkey: deterministicPubkey('lumen_lord'), username: 'lumen_lord', points: 11420, streak: 35 },
  { pubkey: deterministicPubkey('defi_drifter'), username: 'defi_drifter', points: 10920, streak: 34 },
  { pubkey: deterministicPubkey('orbit_trader'), username: 'orbit_trader', points: 10420, streak: 33 },
  { pubkey: deterministicPubkey('vault_keeper'), username: 'vault_keeper', points: 9800, streak: 30 },
];

function tierForPoints(points: number): 'COHORT_4' | 'COHORT_3' | 'COHORT_2' | 'COHORT_1' {
  if (points >= 13000) return 'COHORT_1';
  if (points >= 11500) return 'COHORT_2';
  if (points >= 10000) return 'COHORT_3';
  return 'COHORT_4';
}

async function seedReferralConfig(prisma: PrismaClient) {
  for (const { layer, rateBps } of [
    { layer: 1, rateBps: 1000 },
    { layer: 2, rateBps: 300 },
    { layer: 3, rateBps: 100 },
  ]) {
    await prisma.questReferralConfig.upsert({ where: { layer }, update: {}, create: { layer, rateBps, isActive: true } });
  }
}

async function seedUsers(prisma: PrismaClient): Promise<Record<string, string>> {
  const idByUsername: Record<string, string> = {};
  for (const u of SEED_USERS) {
    const user = await prisma.user.upsert({
      where: { stellarPubkey: u.pubkey },
      update: {},
      create: { stellarPubkey: u.pubkey },
    });
    await prisma.userQuestProfile.upsert({
      where: { userId: user.id },
      update: { totalPoints: u.points, loginStreak: u.streak, tier: tierForPoints(u.points) },
      create: {
        userId: user.id,
        username: u.username,
        totalPoints: u.points,
        loginStreak: u.streak,
        tier: tierForPoints(u.points),
        referralCode: u.username === 'user_3abe7ed8' ? '46676f23' : createHash('sha256').update(u.username).digest('hex').slice(0, 8),
        lastLoginAt: new Date('2026-06-20T00:00:00Z'),
      },
    });
    idByUsername[u.username] = user.id;
  }
  return idByUsername;
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter } as any);
  try {
    await seedReferralConfig(prisma);
    const userIds = await seedUsers(prisma);
    console.log(`Seeded ${Object.keys(userIds).length} users + profiles`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
DATABASE_URL="$TEST_DB_URL" pnpm prisma:seed
DATABASE_URL="$TEST_DB_URL" pnpm verify:seed
```
Expected: `verify-seed: OK` (exit 0).

- [ ] **Step 5: Commit**

```bash
git add prisma/seed.ts prisma/verify-seed.ts package.json
git commit -m "feat(seed): seed primary dev user + supporting users with profiles

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012NHwXrkNtuVzWRoAMsJGNP"
```

---

### Task 4: Seed campaigns + tasks + primary user participation/claims

**Files:**
- Modify: `prisma/seed.ts`
- Modify: `prisma/verify-seed.ts`

**Interfaces:**
- Consumes: `SEED_USERS`, `seedUsers` return map (Task 3).
- Produces: ≥6 `QuestCampaign` rows (mix of `isActive`/`isFeatured`, one with a sponsor in `metadata.sponsor`), each with 3 `QuestTask` rows spanning varied `TaskType`s; the primary user joined ≥1 campaign (`QuestCampaignParticipation`) with one `QuestUserTask` `CLAIMED` + matching `QuestTaskClaim`.

- [ ] **Step 1: Write the failing test (extend verify script)**

In `prisma/verify-seed.ts`, before `console.log('verify-seed: OK')`, add:

```typescript
    // Task 4 — campaigns & tasks
    const campaignCount = await prisma.questCampaign.count();
    assert(campaignCount >= 6, `expected >= 6 campaigns, got ${campaignCount}`);
    const taskTypes = await prisma.questTask.findMany({ distinct: ['type'], select: { type: true } });
    assert(taskTypes.length >= 4, `expected >= 4 distinct task types, got ${taskTypes.length}`);
    const sponsored = await prisma.questCampaign.findFirst({ where: { metadata: { path: ['sponsor'], not: undefined } } });
    assert(sponsored, 'at least one campaign must carry metadata.sponsor');
    const joined = await prisma.questCampaignParticipation.count({ where: { user: { stellarPubkey: PRIMARY_PUBKEY } } });
    assert(joined >= 1, 'primary user must have joined >= 1 campaign');
    const claimed = await prisma.questTaskClaim.count({ where: { user: { stellarPubkey: PRIMARY_PUBKEY } } });
    assert(claimed >= 1, 'primary user must have >= 1 task claim');
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
DATABASE_URL="$TEST_DB_URL" pnpm prisma:seed && DATABASE_URL="$TEST_DB_URL" pnpm verify:seed
```
Expected: FAIL — `expected >= 6 campaigns, got 0`.

- [ ] **Step 3: Write minimal implementation**

In `prisma/seed.ts`, add the campaign definitions and seeding function, and call it from `main`:

```typescript
type TaskType = 'X_FOLLOW' | 'X_RETWEET' | 'BROWSE' | 'ONCHAIN' | 'TELEGRAM_JOIN';
type Category = 'BLEND' | 'SOROSWAP' | 'AQUARIUS';

interface CampaignDef {
  title: string;
  description: string;
  category: Category;
  protocol: string;
  isActive: boolean;
  isFeatured: boolean;
  sponsor?: string;
  tasks: { type: TaskType; title: string; pointReward: number }[];
}

const CAMPAIGNS: CampaignDef[] = [
  { title: 'Index Builder', description: 'Deposit into a managed DeFi index strategy and track your position as the index rebalances automatically.', category: 'BLEND', protocol: 'defindex', isActive: true, isFeatured: true, sponsor: 'DefIndex',
    tasks: [ { type: 'BROWSE', title: 'Design your index', pointReward: 100 }, { type: 'ONCHAIN', title: 'Deposit into the index', pointReward: 300 }, { type: 'TELEGRAM_JOIN', title: 'Join the strategy channel', pointReward: 50 } ] },
  { title: 'Cross Chain Run', description: 'Bridge assets into Stellar with Allbridge and complete a round trip to prove the route end to end.', category: 'SOROSWAP', protocol: 'allbridge', isActive: true, isFeatured: true,
    tasks: [ { type: 'X_FOLLOW', title: 'Follow Allbridge', pointReward: 50 }, { type: 'ONCHAIN', title: 'Bridge an asset', pointReward: 400 }, { type: 'BROWSE', title: 'Read the bridge guide', pointReward: 50 } ] },
  { title: 'Trade and Rise', description: 'Execute trades on Soroswap, climb the volume tiers, and earn boosted points for active traders.', category: 'SOROSWAP', protocol: 'soroswap', isActive: true, isFeatured: true,
    tasks: [ { type: 'X_RETWEET', title: 'Retweet the launch', pointReward: 50 }, { type: 'ONCHAIN', title: 'Swap on Soroswap', pointReward: 450 }, { type: 'BROWSE', title: 'Explore pools', pointReward: 50 } ] },
  { title: 'Vault Guardian', description: 'Open a Stellar vault, add collateral, and hold a healthy ratio through the campaign window.', category: 'BLEND', protocol: 'templar', isActive: false, isFeatured: false,
    tasks: [ { type: 'ONCHAIN', title: 'Open a vault', pointReward: 200 }, { type: 'ONCHAIN', title: 'Add collateral', pointReward: 150 }, { type: 'BROWSE', title: 'Review the risk docs', pointReward: 50 } ] },
  { title: 'Orderbook Master', description: 'Place and fill limit orders on the native Stellar DEX to master orderbook trading.', category: 'AQUARIUS', protocol: 'sdex', isActive: false, isFeatured: false,
    tasks: [ { type: 'ONCHAIN', title: 'Place a limit order', pointReward: 200 }, { type: 'ONCHAIN', title: 'Fill an order', pointReward: 100 }, { type: 'X_FOLLOW', title: 'Follow SDEX', pointReward: 50 } ] },
  { title: 'Liquidity Voyager', description: 'Provide liquidity on Aquarius and keep your position active to earn the full reward.', category: 'AQUARIUS', protocol: 'aquarius', isActive: true, isFeatured: false,
    tasks: [ { type: 'ONCHAIN', title: 'Add liquidity', pointReward: 300 }, { type: 'TELEGRAM_JOIN', title: 'Join Aquarius TG', pointReward: 50 }, { type: 'X_FOLLOW', title: 'Follow Aquarius', pointReward: 50 } ] },
];

async function seedCampaigns(prisma: PrismaClient, primaryUserId: string) {
  for (const def of CAMPAIGNS) {
    const campaign = await prisma.questCampaign.upsert({
      where: { id: `seed-${def.protocol}` },
      update: {},
      create: {
        id: `seed-${def.protocol}`,
        title: def.title,
        description: def.description,
        category: def.category,
        protocol: def.protocol,
        isActive: def.isActive,
        isFeatured: def.isFeatured,
        startAt: new Date('2026-06-13T00:00:00Z'),
        endAt: new Date('2026-07-11T00:00:00Z'),
        metadata: def.sponsor ? { sponsor: def.sponsor } : undefined,
      },
    });
    const taskIds: string[] = [];
    for (let i = 0; i < def.tasks.length; i++) {
      const t = def.tasks[i];
      const task = await prisma.questTask.upsert({
        where: { id: `${campaign.id}-task-${i}` },
        update: {},
        create: { id: `${campaign.id}-task-${i}`, campaignId: campaign.id, type: t.type as any, title: t.title, pointReward: t.pointReward, order: i },
      });
      taskIds.push(task.id);
    }

    // Primary user joins the featured "Index Builder" and claims its first task.
    if (def.protocol === 'defindex') {
      await prisma.questCampaignParticipation.upsert({
        where: { userId_campaignId: { userId: primaryUserId, campaignId: campaign.id } },
        update: {},
        create: { userId: primaryUserId, campaignId: campaign.id },
      });
      await prisma.questUserTask.upsert({
        where: { userId_taskId: { userId: primaryUserId, taskId: taskIds[0] } },
        update: { status: 'CLAIMED' as any },
        create: { userId: primaryUserId, taskId: taskIds[0], status: 'CLAIMED' as any, completedAt: new Date('2026-06-19T00:00:00Z') },
      });
      await prisma.questTaskClaim.upsert({
        where: { userId_taskId: { userId: primaryUserId, taskId: taskIds[0] } },
        update: {},
        create: { userId: primaryUserId, taskId: taskIds[0], pointsAwarded: def.tasks[0].pointReward },
      });
    }
  }
}
```

Update `main()` to call it after `seedUsers`:

```typescript
    const userIds = await seedUsers(prisma);
    await seedCampaigns(prisma, userIds['user_3abe7ed8']);
    console.log(`Seeded ${Object.keys(userIds).length} users and ${CAMPAIGNS.length} campaigns`);
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
DATABASE_URL="$TEST_DB_URL" pnpm prisma:seed && DATABASE_URL="$TEST_DB_URL" pnpm verify:seed
```
Expected: `verify-seed: OK`.

- [ ] **Step 5: Commit**

```bash
git add prisma/seed.ts prisma/verify-seed.ts
git commit -m "feat(seed): seed campaigns, tasks, and primary user participation/claims

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012NHwXrkNtuVzWRoAMsJGNP"
```

---

### Task 5: Seed active season + rank rewards + season results (leaderboard)

**Files:**
- Modify: `prisma/seed.ts`
- Modify: `prisma/verify-seed.ts`

**Interfaces:**
- Consumes: `SEED_USERS`, `seedUsers` map (Task 3).
- Produces: one `QuestSeason` (`status='ACTIVE'`, `name='June 2026'`, `prizePoolUsdc=80`), 3 `QuestSeasonRankReward` rows (ranks 1/2/3 → 50/20/10 USDC + points), and one `QuestSeasonResult` per seed user ranked by descending points (`finalRank` 1..11). Primary user lands ~rank 11.

- [ ] **Step 1: Write the failing test (extend verify script)**

In `prisma/verify-seed.ts`, before the final `console.log`, add:

```typescript
    // Task 5 — season & leaderboard
    const season = await prisma.questSeason.findFirst({ where: { status: 'ACTIVE' } });
    assert(season, 'an ACTIVE season must exist');
    const rewards = await prisma.questSeasonRankReward.count({ where: { seasonId: season!.id } });
    assert(rewards >= 3, `expected >= 3 rank rewards, got ${rewards}`);
    const results = await prisma.questSeasonResult.count({ where: { seasonId: season!.id } });
    assert(results >= 11, `expected >= 11 season results, got ${results}`);
    const rank1 = await prisma.questSeasonResult.findFirst({ where: { seasonId: season!.id, finalRank: 1 } });
    assert.equal(rank1?.finalPoints, 14000, 'rank 1 should have 14000 points');
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
DATABASE_URL="$TEST_DB_URL" pnpm prisma:seed && DATABASE_URL="$TEST_DB_URL" pnpm verify:seed
```
Expected: FAIL — `an ACTIVE season must exist`.

- [ ] **Step 3: Write minimal implementation**

In `prisma/seed.ts`, add:

```typescript
async function seedSeason(prisma: PrismaClient, userIds: Record<string, string>) {
  const season = await prisma.questSeason.upsert({
    where: { id: 'seed-season-june-2026' },
    update: {},
    create: {
      id: 'seed-season-june-2026',
      name: 'June 2026',
      status: 'ACTIVE',
      startAt: new Date('2026-06-01T00:00:00Z'),
      endAt: new Date('2026-06-30T23:59:59Z'),
      prizePoolUsdc: 80,
      isActive: true,
    },
  });

  const rankRewards = [
    { rankFrom: 1, rankTo: 1, usdc: 50, points: 5000, badge: 'gold' },
    { rankFrom: 2, rankTo: 2, usdc: 20, points: 3000, badge: 'silver' },
    { rankFrom: 3, rankTo: 3, usdc: 10, points: 2000, badge: 'bronze' },
  ];
  for (let i = 0; i < rankRewards.length; i++) {
    const r = rankRewards[i];
    await prisma.questSeasonRankReward.upsert({
      where: { id: `${season.id}-reward-${i}` },
      update: {},
      create: { id: `${season.id}-reward-${i}`, seasonId: season.id, ...r },
    });
  }

  const ranked = [...SEED_USERS].sort((a, b) => b.points - a.points);
  for (let i = 0; i < ranked.length; i++) {
    const u = ranked[i];
    const reward = rankRewards.find((r) => i + 1 >= r.rankFrom && i + 1 <= r.rankTo);
    await prisma.questSeasonResult.upsert({
      where: { seasonId_userId: { seasonId: season.id, userId: userIds[u.username] } },
      update: { finalRank: i + 1, finalPoints: u.points },
      create: {
        seasonId: season.id,
        userId: userIds[u.username],
        finalRank: i + 1,
        finalPoints: u.points,
        usdcReward: reward?.usdc ?? 0,
        pointsReward: reward?.points ?? 0,
      },
    });
  }
}
```

Call it in `main()` after `seedCampaigns`:

```typescript
    await seedCampaigns(prisma, userIds['user_3abe7ed8']);
    await seedSeason(prisma, userIds);
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
DATABASE_URL="$TEST_DB_URL" pnpm prisma:seed && DATABASE_URL="$TEST_DB_URL" pnpm verify:seed
```
Expected: `verify-seed: OK`.

- [ ] **Step 5: Commit**

```bash
git add prisma/seed.ts prisma/verify-seed.ts
git commit -m "feat(seed): seed active season, rank rewards, and ranked results

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012NHwXrkNtuVzWRoAMsJGNP"
```

---

### Task 6: Seed referrals, social accounts, notifications

**Files:**
- Modify: `prisma/seed.ts`
- Modify: `prisma/verify-seed.ts`

**Interfaces:**
- Consumes: `seedUsers` map (Task 3).
- Produces: 2 `QuestReferralEvent` rows (primary → two referees), ≥1 `QuestReferralCommission` for the primary user, the primary user's `referredById` set on two referees' profiles, ≥1 `UserSocialAccount` for a supporting user, and 2 `UserNotification` rows for the primary user.

- [ ] **Step 1: Write the failing test (extend verify script)**

In `prisma/verify-seed.ts`, before the final `console.log`, add:

```typescript
    // Task 6 — referrals, socials, notifications
    const refEvents = await prisma.questReferralEvent.count({ where: { referrer: { stellarPubkey: PRIMARY_PUBKEY } } });
    assert(refEvents >= 2, `expected >= 2 referral events, got ${refEvents}`);
    const commissions = await prisma.questReferralCommission.count({ where: { earner: { stellarPubkey: PRIMARY_PUBKEY } } });
    assert(commissions >= 1, 'primary user must have >= 1 referral commission');
    const socials = await prisma.userSocialAccount.count();
    assert(socials >= 1, 'expected >= 1 social account');
    const notifs = await prisma.userNotification.count({ where: { user: { stellarPubkey: PRIMARY_PUBKEY } } });
    assert(notifs >= 2, `expected >= 2 notifications, got ${notifs}`);
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
DATABASE_URL="$TEST_DB_URL" pnpm prisma:seed && DATABASE_URL="$TEST_DB_URL" pnpm verify:seed
```
Expected: FAIL — `expected >= 2 referral events, got 0`.

- [ ] **Step 3: Write minimal implementation**

In `prisma/seed.ts`, add:

```typescript
async function seedReferralsSocialsNotifications(prisma: PrismaClient, userIds: Record<string, string>) {
  const primaryId = userIds['user_3abe7ed8'];
  const referees = ['stellar_nomad', 'aqua_whale'];

  for (const username of referees) {
    const refereeId = userIds[username];
    await prisma.questReferralEvent.upsert({
      where: { referrerId_refereeId: { referrerId: primaryId, refereeId } },
      update: {},
      create: { referrerId: primaryId, refereeId, pointsAwarded: 0 },
    });
    await prisma.userQuestProfile.update({ where: { userId: refereeId }, data: { referredById: primaryId } });
  }

  await prisma.questReferralCommission.upsert({
    where: { id: 'seed-commission-1' },
    update: {},
    create: {
      id: 'seed-commission-1',
      earnerId: primaryId,
      sourceUserId: userIds['stellar_nomad'],
      layer: 1,
      basePoints: 100,
      rateBps: 1000,
      pointsEarned: 10,
    },
  });

  await prisma.userSocialAccount.upsert({
    where: { userId_provider: { userId: userIds['stellar_nomad'], provider: 'TWITTER' } },
    update: {},
    create: { userId: userIds['stellar_nomad'], provider: 'TWITTER', externalId: 'seed-x-1', username: 'stellar_nomad' },
  });

  const notifications = [
    { title: 'Welcome to Tasmil Quest', body: 'Complete your first quest to start earning points.', type: 'system' },
    { title: 'Daily streak', body: 'You are on a 1 day streak. Check in tomorrow to keep it going.', type: 'streak' },
  ];
  for (let i = 0; i < notifications.length; i++) {
    await prisma.userNotification.upsert({
      where: { id: `seed-notif-${i}` },
      update: {},
      create: { id: `seed-notif-${i}`, userId: primaryId, ...notifications[i] },
    });
  }
}
```

Call it in `main()` after `seedSeason`:

```typescript
    await seedSeason(prisma, userIds);
    await seedReferralsSocialsNotifications(prisma, userIds);
    console.log('Seed complete');
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
DATABASE_URL="$TEST_DB_URL" pnpm prisma:seed && DATABASE_URL="$TEST_DB_URL" pnpm verify:seed
```
Expected: `verify-seed: OK`.

- [ ] **Step 5: Run the full unit suite and commit**

```bash
pnpm test    # all unit specs green, including the new auth specs
git add prisma/seed.ts prisma/verify-seed.ts
git commit -m "feat(seed): seed referrals, social accounts, and notifications

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012NHwXrkNtuVzWRoAMsJGNP"
```

---

## Self-Review

**Spec coverage (Plan 1 portion):**
- C2 dev-login (guarded, mints real JWT) → Tasks 1–2. ✓
- C1 seed (full: users, campaigns+tasks+all task types, season+leaderboard+rewards, participations/claims, referrals, socials, notifications) → Tasks 3–6. ✓
- "no new migrations in quest-backend" constraint → schema applied from `backend` migrate deploy in the test-DB setup; seed is data-only. ✓
- Seed-invariant test on a disposable Postgres → `verify-seed.ts` + `TEST_DB_URL` flow. ✓
- TDD test-first ordering → every task: RED (verify/unit fails) → GREEN. ✓

**Out of Plan 1 (handled in Plans 2–3):** the frontend dev-bypass calling `dev-login`; UI port; cross-surface badges; gap-check; Playwright. The seed's sponsor metadata (`metadata.sponsor`) and ranked results exist here so Plan 3's badge/leaderboard screens have data.

**Placeholder scan:** none — every step has concrete code and exact commands.

**Type consistency:** `SEED_USERS`/`SeedUser`, `seedUsers` returns `Record<string,string>` (username→id) consumed identically in Tasks 4–6; `deterministicPubkey`, `tierForPoints`, campaign id convention `seed-<protocol>`, task id `<campaignId>-task-<i>` used consistently. Prisma composite-unique where-keys (`userId_taskId`, `seasonId_userId`, `userId_campaignId`, `referrerId_refereeId`, `userId_provider`) match the schema `@@unique` definitions.

**Known follow-up:** if `ensureWalletUser` internally rejects the primary `DEV_WALLET` via `validatePublicKey`, dev-login Task 1's first test will surface it; the wallet constant is the app-wide `DEV_WALLET` and is expected valid.
