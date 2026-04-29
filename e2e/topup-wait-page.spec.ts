/**
 * Topup wait page — UI behaviors
 *
 * Drives /topup/<id>/wait through every visible behaviour:
 *   - countdown ticks down monotonically every second
 *   - 3 copy buttons (destination, memo, amount) populate the clipboard
 *     with the right values
 *   - status:FULFILLED → redirect to /profile/credits?fulfilled=<id>
 *   - status:EXPIRED via DB UPDATE → redirect to /topup?error=expired
 *   - malformed snapshot (NULL destination) → fallback card renders
 */

import { execSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";
import { attachConsoleSpy } from "./_helpers/console-filter";

const BACKEND = process.env.PLAYWRIGHT_BACKEND_URL ?? "http://localhost:6756";
const SERVICE_KEY = process.env.AI_INTERNAL_SHARED_TOKEN ?? "tasmil-local-internal-token";
const DB_CONTAINER = process.env.PLAYWRIGHT_DB_CONTAINER ?? "backend-db-1";
const DB_NAME = process.env.PLAYWRIGHT_DB_NAME ?? "tasmilfinance";

const COUNTDOWN_WALLET = "GTOPUPWAIT1COUNT00000000000000000000000000000000000000";
const COPY_WALLET = "GTOPUPWAIT2COPY000000000000000000000000000000000000000";
const FULFILL_WALLET = "GTOPUPWAIT3FUL000000000000000000000000000000000000000";
const EXPIRE_WALLET = "GTOPUPWAIT4EXP000000000000000000000000000000000000000";
const MALFORMED_WALLET = "GTOPUPWAIT5BAD000000000000000000000000000000000000000";

interface Session {
  walletAddress: string;
  jwt: string;
}

function execPsql(sql: string): string {
  return execSync(
    `docker exec ${DB_CONTAINER} psql -U postgres -d ${DB_NAME} -tA -c "${sql.replace(/"/g, '\\"').replace(/\n/g, " ")}"`,
    { stdio: ["ignore", "pipe", "pipe"] },
  )
    .toString()
    .trim();
}

function dbCleanWallet(walletAddress: string): void {
  const userSelect = `(SELECT id FROM users WHERE stellar_pubkey = '${walletAddress}')`;
  execPsql(`DELETE FROM chat_usage_commits WHERE user_id IN ${userSelect}`);
  execPsql(`DELETE FROM user_chat_usage WHERE user_id IN ${userSelect}`);
  execPsql(`DELETE FROM welcome_reward_states WHERE user_id IN ${userSelect}`);
  execPsql(`DELETE FROM reward_volume_events WHERE user_id IN ${userSelect}`);
  execPsql(`DELETE FROM managed_accounts WHERE user_id IN ${userSelect}`);
  execPsql(`DELETE FROM users WHERE stellar_pubkey = '${walletAddress}'`);
}

async function loginAsWallet(page: Page, walletAddress: string): Promise<Session> {
  const response = await page.request.post(`${BACKEND}/api/auth/wallet/test-login`, {
    data: { walletAddress },
  });
  expect(response.ok(), `test-login HTTP ${response.status()}`).toBeTruthy();
  const body = await response.json();
  const jwt: string = body?.data?.accessToken ?? body?.accessToken;
  expect(jwt).toBeTruthy();

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
        }),
      );
      localStorage.setItem(
        "wallet-storage",
        JSON.stringify({ state: { account: walletAddress }, version: 0 }),
      );
    },
    { walletAddress, jwt },
  );

  return { walletAddress, jwt };
}

async function navigateToCryptoWaitPage(page: Page): Promise<{
  topupId: string;
  memo: string;
  amount: string;
  destination: string;
}> {
  await page.goto("/topup");
  await page.getByTestId("package-card-starter-buy-crypto").click();
  await page.waitForURL(/\/topup\/topup_[^/]+\/wait/, { timeout: 30_000 });
  const url = page.url();
  const match = url.match(/\/topup\/(topup_[^/?#]+)\/wait/);
  if (!match) throw new Error(`Unexpected URL after CTA: ${url}`);
  const topupId = match[1];

  await expect(page.getByTestId("crypto-pending-card")).toBeVisible();
  const destination =
    (await page.getByTestId("crypto-destination").textContent())?.trim() ?? "";
  const memo = (await page.getByTestId("crypto-memo").textContent())?.trim() ?? "";
  const amountText = (await page.getByTestId("crypto-amount").textContent())?.trim() ?? "";
  const amount = amountText.split(/\s+/)[0];
  expect(memo).toMatch(/^topup:topup_[A-Za-z0-9_-]+$/);
  expect(amount).toMatch(/^\d+\.\d{7}$/);
  expect(destination.length).toBeGreaterThan(20);
  return { topupId, memo, amount, destination };
}

function secondsFromMmSs(text: string): number {
  const m = text.match(/^(\d{2}):(\d{2})$/);
  if (!m) throw new Error(`bad countdown text: ${text}`);
  return Number.parseInt(m[1], 10) * 60 + Number.parseInt(m[2], 10);
}

test.describe("Topup wait page — UI behaviors", () => {
  test.beforeAll(() => {
    [
      COUNTDOWN_WALLET,
      COPY_WALLET,
      FULFILL_WALLET,
      EXPIRE_WALLET,
      MALFORMED_WALLET,
    ].forEach(dbCleanWallet);
  });

  test("countdown ticks down monotonically over a 3s sample", async ({ page }) => {
    const { errors } = attachConsoleSpy(page);
    await loginAsWallet(page, COUNTDOWN_WALLET);
    await navigateToCryptoWaitPage(page);

    const countdown = page.getByTestId("topup-countdown");
    const t0 = (await countdown.textContent())?.trim() ?? "";
    expect(t0).toMatch(/^\d{2}:\d{2}$/);
    const s0 = secondsFromMmSs(t0);

    await page.waitForTimeout(1_500);
    const t1 = (await countdown.textContent())?.trim() ?? "";
    const s1 = secondsFromMmSs(t1);
    expect(s1).toBeLessThan(s0);

    await page.waitForTimeout(1_500);
    const t2 = (await countdown.textContent())?.trim() ?? "";
    const s2 = secondsFromMmSs(t2);
    expect(s2).toBeLessThan(s1);

    expect(errors, `Console errors: ${errors.join("\n")}`).toEqual([]);
  });

  test("copy buttons populate clipboard with destination/memo/amount", async ({ browser }) => {
    const ctx = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
    const page = await ctx.newPage();
    const { errors } = attachConsoleSpy(page);
    await loginAsWallet(page, COPY_WALLET);
    const { destination, memo, amount } = await navigateToCryptoWaitPage(page);

    // ── Copy destination ──
    await page.getByTestId("copy-destination").click();
    const c1 = await page.evaluate(async () => navigator.clipboard.readText());
    expect(c1).toBe(destination);

    // ── Copy memo ──
    await page.getByTestId("copy-memo").click();
    const c2 = await page.evaluate(async () => navigator.clipboard.readText());
    expect(c2).toBe(memo);

    // ── Copy amount ──
    await page.getByTestId("copy-amount").click();
    const c3 = await page.evaluate(async () => navigator.clipboard.readText());
    expect(c3).toBe(amount);

    expect(errors, `Console errors: ${errors.join("\n")}`).toEqual([]);
    await ctx.close();
  });

  test("status FULFILLED → redirect to /profile/credits?fulfilled=<id>", async ({ page }) => {
    const { errors } = attachConsoleSpy(page);
    await loginAsWallet(page, FULFILL_WALLET);
    const { topupId, memo, amount } = await navigateToCryptoWaitPage(page);

    const matchRes = await page.request.post(`${BACKEND}/api/internal/topup/test/match`, {
      headers: { "x-service-key": SERVICE_KEY, "content-type": "application/json" },
      data: { memo, amount, txHash: "tx_test_match_wait_page_fulfill" },
    });
    expect(matchRes.ok(), `match HTTP ${matchRes.status()}`).toBeTruthy();
    const matchBody = (await matchRes.json()) as { data?: { status: string } };
    expect(matchBody.data?.status).toBe("FULFILLED");

    await page.waitForURL(new RegExp(`/profile/credits\\?fulfilled=${topupId}`), {
      timeout: 30_000,
    });

    expect(errors, `Console errors: ${errors.join("\n")}`).toEqual([]);
  });

  test("status EXPIRED via DB UPDATE → redirect to /topup?error=expired", async ({ page }) => {
    test.setTimeout(60_000);
    const { errors } = attachConsoleSpy(page);
    await loginAsWallet(page, EXPIRE_WALLET);
    const { topupId } = await navigateToCryptoWaitPage(page);

    // Force-expire the row. The poller cron (`*/30 * * * * *`) calls
    // expireOldRows() and flips the status to EXPIRED; the FE polls
    // /api/topup/<id> every 5s and redirects when status flips.
    execPsql(
      `UPDATE topups SET expires_at = NOW() - INTERVAL '1 hour' WHERE id = '${topupId}'`,
    );
    // The cron firing is what flips status PENDING → EXPIRED. To avoid
    // having to wait up to 30s for the next cron tick, also flip status
    // directly so the FE polling cycle observes EXPIRED on the next poll
    // (≤5s).
    execPsql(`UPDATE topups SET status = 'EXPIRED' WHERE id = '${topupId}'`);

    await page.waitForURL(
      new RegExp(`/topup\\?error=expired&topupId=${topupId}`),
      { timeout: 45_000 },
    );

    expect(errors, `Console errors: ${errors.join("\n")}`).toEqual([]);
  });

  test("malformed snapshot (NULL destination) → fallback card renders", async ({ page }) => {
    const { errors } = attachConsoleSpy(page);
    await loginAsWallet(page, MALFORMED_WALLET);
    const { topupId } = await navigateToCryptoWaitPage(page);

    // Wipe destination_address — the fallback card guards on (!destination
    // || !memo || !amount).
    execPsql(`UPDATE topups SET destination_address = NULL WHERE id = '${topupId}'`);

    // The wait page polls /api/topup/:id every 5s for PENDING rows, and on
    // each poll rerenders via React Query. Wait one polling cycle so the
    // snapshot refreshes — no full reload needed (which would trigger the
    // zustand-persist re-hydrate race that briefly looks like an unauth
    // visit and bounces to /login).
    await expect(page.getByTestId("crypto-pending-malformed")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("crypto-pending-card")).toHaveCount(0);

    expect(errors, `Console errors: ${errors.join("\n")}`).toEqual([]);
  });
});
