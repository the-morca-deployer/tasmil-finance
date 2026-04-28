/*
 * TODO Phase 3 followup: three additional scenarios from the plan are deferred
 * because they require test infrastructure not present in the repo:
 *
 *   - Scenario 4 (force_error revert): needs an AI agent that responds to an
 *     `<<force_error>>` input with a `status="error"` worker outcome, plus a
 *     test-only `X-E2E-Late-Error: 1` header on /api/runs to exercise the
 *     CHAT_REVERT compensation path.
 *   - Scenario 5 (5-parallel concurrency): needs a way to fire 5 in-flight
 *     /api/runs without a queued worker stalling on real LangGraph state and
 *     a `/api/internal/credit/ledger?reason=CHAT_DEBIT` admin-readable list.
 *   - Scenario 6 (daily reset): needs `/api/internal/admin/run-cron/chat-usage-daily-reset`
 *     to trigger the cron on demand. Today the cron only fires on its own
 *     schedule; we cannot deterministically advance UTC midnight from a test.
 *
 * The three scenarios in this file (initial snapshot shape, credit grant,
 * both-pools-exhausted state) cover what is achievable with existing infra:
 *   - /api/auth/wallet/test-login (NODE_ENV=development gated)
 *   - /api/internal/credit/apply (X-Service-Key)
 *   - /api/chat-usage/me (JWT auth)
 *   - direct DB nudge via `docker exec mainnet-db psql` for committed_turns.
 */

import { execSync } from "node:child_process";
import { expect, type Page, test } from "@playwright/test";

const BACKEND = process.env.PLAYWRIGHT_BACKEND_URL ?? "http://localhost:6856";
const SERVICE_KEY = process.env.AI_INTERNAL_SHARED_TOKEN ?? "tasmil-local-internal-token";

const SCENARIO_1_WALLET = "GCHATOVERFLOW1000000000000000000000000000000000000000000";
const SCENARIO_2_WALLET = "GCHATOVERFLOW2000000000000000000000000000000000000000000";
const SCENARIO_3_WALLET = "GCHATOVERFLOW3000000000000000000000000000000000000000000";

interface SnapshotShape {
  baseTurns: number;
  committedTurns: number;
  remainingTurns: number;
  credits: number;
  creditPending: number;
}

interface BackendUser {
  id: string;
  walletAddress: string;
}

interface TestSession {
  walletAddress: string;
  jwt: string;
  userId: string;
}

async function loginAsWallet(page: Page, walletAddress: string): Promise<TestSession> {
  const response = await page.request.post(`${BACKEND}/api/auth/wallet/test-login`, {
    data: { walletAddress },
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  const jwt: string = body?.data?.accessToken ?? body?.accessToken;
  expect(jwt).toBeTruthy();

  const meRes = await fetch(`${BACKEND}/api/user/me`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!meRes.ok) throw new Error(`/api/user/me ${meRes.status}`);
  const meBody = (await meRes.json()) as { data?: BackendUser; id?: string };
  const userId = meBody.data?.id ?? meBody.id ?? "";
  expect(userId).toBeTruthy();

  await page.addInitScript(
    ({ walletAddress, jwt }) => {
      (window as Window & { __WALLET_MOCK__?: unknown }).__WALLET_MOCK__ = {
        isConnected: true,
        address: walletAddress,
        displayAddress: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
        isAuthenticating: false,
      };
      localStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            isAuthenticated: true,
            accessToken: jwt,
            user: {
              id: walletAddress,
              walletAddress,
              type: "regular",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            isLoading: false,
            expiresAt: Date.now() + 60 * 60 * 1000,
          },
          version: 0,
        })
      );
      localStorage.setItem(
        "wallet-storage",
        JSON.stringify({ state: { account: walletAddress }, version: 0 })
      );
    },
    { walletAddress, jwt }
  );

  return { walletAddress, jwt, userId };
}

async function readSnapshot(jwt: string): Promise<SnapshotShape> {
  const res = await fetch(`${BACKEND}/api/chat-usage/me`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) throw new Error(`/api/chat-usage/me ${res.status}`);
  const body = (await res.json()) as { data?: SnapshotShape };
  if (!body.data) throw new Error("missing data envelope");
  return body.data;
}

async function applyCreditDelta(args: {
  userId: string;
  reason: string;
  deltaCredits: number;
  idempotencyKey: string;
}): Promise<void> {
  const res = await fetch(`${BACKEND}/api/internal/credit/apply`, {
    method: "POST",
    headers: { "x-service-key": SERVICE_KEY, "content-type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`apply failed ${res.status}: ${await res.text()}`);
}

function setCommittedTurnsViaDb(userId: string, committedTurns: number): void {
  // The chat-usage row is created lazily on first snapshot read. Use UPSERT-like
  // semantics so the test works whether or not the row already exists.
  const sql = `
    INSERT INTO user_chat_usage (id, user_id, base_turns, committed_turns, created_at, updated_at, last_reset_at)
    VALUES ('e2e_' || substring(md5(random()::text), 1, 24), '${userId}', 10, ${committedTurns}, NOW(), NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE
      SET committed_turns = EXCLUDED.committed_turns,
          updated_at = NOW(),
          last_reset_at = NOW();
  `;
  execSync(
    `docker exec mainnet-db psql -U postgres -d tasmilfinance -c "${sql.replace(/"/g, '\\"').replace(/\n/g, " ")}"`,
    { stdio: "pipe" }
  );
}

function attachConsoleAndNetworkAsserts(page: Page): {
  errors: string[];
  badResponses: string[];
} {
  const errors: string[] = [];
  const badResponses: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("response", (resp) => {
    const url = resp.url();
    const status = resp.status();
    if (status >= 400 && status !== 401 && url.startsWith(BACKEND)) {
      badResponses.push(`${status} ${url}`);
    }
  });
  return { errors, badResponses };
}

test.describe("Phase 3 — Chat overflow (in-scope scenarios)", () => {
  test.describe.configure({ mode: "serial" });

  test("Scenario 1: snapshot endpoint returns full shape with daily defaults", async ({ page }) => {
    const session = await loginAsWallet(page, SCENARIO_1_WALLET);
    const probes = attachConsoleAndNetworkAsserts(page);

    const snap = await readSnapshot(session.jwt);

    expect(snap.baseTurns).toBe(10);
    expect(snap.remainingTurns).toBe(snap.baseTurns - snap.committedTurns);
    expect(typeof snap.committedTurns).toBe("number");
    expect(typeof snap.credits).toBe("number");
    expect(typeof snap.creditPending).toBe("number");
    expect(snap.creditPending).toBe(0);

    // Smoke-load the topup route to assert the CTA target the badge points at.
    await page.goto("/topup");
    await expect(page.getByTestId("topup-page-title")).toBeVisible();

    expect(probes.errors).toEqual([]);
    expect(probes.badResponses).toEqual([]);
  });

  test("Scenario 2: PROMO_GRANT +50 surfaces credits=50 in snapshot", async ({ page }) => {
    const session = await loginAsWallet(page, SCENARIO_2_WALLET);

    await applyCreditDelta({
      userId: session.userId,
      reason: "PROMO_GRANT",
      deltaCredits: 50,
      idempotencyKey: `e2e:chat-overflow:scenario2:${session.userId}`,
    });

    const probes = attachConsoleAndNetworkAsserts(page);
    const snap = await readSnapshot(session.jwt);

    expect(snap.credits).toBe(50);
    expect(snap.creditPending).toBe(0);
    expect(snap.baseTurns).toBe(10);

    expect(probes.errors).toEqual([]);
    expect(probes.badResponses).toEqual([]);
  });

  test("Scenario 3: committedTurns=10 + credits=0 → remainingTurns=0 (both exhausted)", async ({
    page,
  }) => {
    const session = await loginAsWallet(page, SCENARIO_3_WALLET);

    // Force the snapshot row into existence (lazy create) before nudging it.
    await readSnapshot(session.jwt);
    setCommittedTurnsViaDb(session.userId, 10);

    const probes = attachConsoleAndNetworkAsserts(page);
    const snap = await readSnapshot(session.jwt);

    expect(snap.committedTurns).toBe(10);
    expect(snap.remainingTurns).toBe(0);
    expect(snap.credits).toBe(0);
    expect(snap.creditPending).toBe(0);

    // Assert /topup still serves as the topup CTA target the FE badge would
    // navigate to in this state.
    await page.goto("/topup");
    await expect(page.getByTestId("topup-page-title")).toBeVisible();

    expect(probes.errors).toEqual([]);
    expect(probes.badResponses).toEqual([]);
  });
});
