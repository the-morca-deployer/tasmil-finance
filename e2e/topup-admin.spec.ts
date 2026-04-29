/**
 * Topup admin reconcile — UI flow
 *
 * Drives the admin shell end-to-end:
 *   1. Provision a SUPER_ADMIN via /api/admin-auth/create.
 *   2. Visit /admin/login, fill the form, submit, and follow the redirect.
 *   3. Empty queue → admin-topups-empty visible.
 *   4. A separate user creates a fiat topup (via API; the user-side UI flow
 *      is exercised by topup-fiat.spec.ts already). Reload /admin/topups
 *      and observe the row.
 *   5. Click Fulfill WITHOUT a bank tx ref → `alert()` fires (intercepted via
 *      a dialog handler).
 *   6. Fill bank tx ref → click Fulfill → row disappears.
 *   7. Cancel flow on a fresh topup: confirm() prompt → row disappears.
 *   8. CAMPAIGN_ADMIN can list pending topups but fulfill returns 403 →
 *      surface a non-fatal failure (UI either stays put or shows a console
 *      warn; either way no JS error).
 */

import { execSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";
import { attachConsoleSpy } from "./_helpers/console-filter";

const BACKEND = process.env.PLAYWRIGHT_BACKEND_URL ?? "http://localhost:6756";
const DB_CONTAINER = process.env.PLAYWRIGHT_DB_CONTAINER ?? "backend-db-1";
const DB_NAME = process.env.PLAYWRIGHT_DB_NAME ?? "tasmilfinance";

const FULFILL_USER_WALLET = "GTOPUPADMIN1FUL000000000000000000000000000000000000000";
const CANCEL_USER_WALLET = "GTOPUPADMIN2CAN000000000000000000000000000000000000000";
const CAMPAIGN_USER_WALLET = "GTOPUPADMIN3CAM000000000000000000000000000000000000000";

const SUPER_ADMIN_EMAIL = `topup-admin-super-${Date.now()}@e2e.test`;
const SUPER_ADMIN_PASSWORD = "TopupAdminE2E!Pw123";
const CAMPAIGN_ADMIN_EMAIL = `topup-admin-camp-${Date.now()}@e2e.test`;
const CAMPAIGN_ADMIN_PASSWORD = "TopupAdminE2E!Pw123";

interface UserSession {
  jwt: string;
  walletAddress: string;
  topupId: string;
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

async function createUserFiatTopup(walletAddress: string): Promise<UserSession> {
  // Mint a wallet JWT.
  const loginRes = await fetch(`${BACKEND}/api/auth/wallet/test-login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ walletAddress }),
  });
  if (!loginRes.ok) throw new Error(`test-login ${loginRes.status}`);
  const loginBody = (await loginRes.json()) as { data?: { accessToken: string } };
  const jwt = loginBody.data?.accessToken;
  if (!jwt) throw new Error("no jwt in test-login response");

  // POST /api/topup/quote with rail=FIAT to mint the row.
  const quoteRes = await fetch(`${BACKEND}/api/topup/quote`, {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ packageId: "plus", rail: "FIAT" }),
  });
  if (!quoteRes.ok) throw new Error(`quote ${quoteRes.status}: ${await quoteRes.text()}`);
  const body = (await quoteRes.json()) as {
    data?: { topupId: string };
    topupId?: string;
  };
  const topupId = body.data?.topupId ?? body.topupId;
  if (!topupId) throw new Error("no topupId from quote");
  return { jwt, walletAddress, topupId };
}

async function provisionAdmin(opts: {
  email: string;
  password: string;
  role: "SUPER_ADMIN" | "CAMPAIGN_ADMIN";
}): Promise<void> {
  const res = await fetch(`${BACKEND}/api/admin-auth/create`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(opts),
  });
  // 201 = created; 400 = already exists. Both fine for an idempotent setup.
  if (![200, 201, 400].includes(res.status)) {
    throw new Error(`admin create ${res.status}: ${await res.text()}`);
  }
}

async function loginAdminViaForm(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  // Hit the login page directly. Don't pre-seed admin-auth-storage — let
  // the form walk through the auth flow so the spec exercises real UX.
  await page.goto("/admin/login");
  await page.locator("#admin-email").fill(email);
  await page.locator("#admin-password").fill(password);
  await Promise.all([
    page.waitForURL(/\/admin\/(dashboard|topups|codes|campaigns)/, { timeout: 15_000 }),
    page.locator('button[type="submit"]').click(),
  ]);
}

test.describe("Topup admin reconcile — UI flow", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    [FULFILL_USER_WALLET, CANCEL_USER_WALLET, CAMPAIGN_USER_WALLET].forEach(dbCleanWallet);
    // Drop any stale PENDING fiat topups from previous test runs so the
    // empty-state assertion in test #1 is deterministic. CASCADE on
    // user_id keeps this safe for any non-test row that happens to be
    // FIAT/PENDING in dev.
    execPsql(`UPDATE topups SET status = 'CANCELLED', cancelled_at = NOW() WHERE rail = 'FIAT' AND status = 'PENDING'`);
    await provisionAdmin({
      email: SUPER_ADMIN_EMAIL,
      password: SUPER_ADMIN_PASSWORD,
      role: "SUPER_ADMIN",
    });
    await provisionAdmin({
      email: CAMPAIGN_ADMIN_EMAIL,
      password: CAMPAIGN_ADMIN_PASSWORD,
      role: "CAMPAIGN_ADMIN",
    });
  });

  test("super-admin login → empty queue → 1 row → alert if no banktxref → fulfill via UI", async ({
    page,
  }) => {
    const { errors } = attachConsoleSpy(page);

    // Login first (no topup pending yet) → land in the admin shell.
    await loginAdminViaForm(page, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD);

    // Navigate to topups and assert empty state.
    await page.goto("/admin/topups");
    await expect(page.getByTestId("admin-topups-root")).toBeVisible();
    await expect(page.getByTestId("admin-topups-empty")).toBeVisible();

    // Background: a separate user creates a fiat topup. We use the API
    // directly since the user-rail UX is covered by topup-fiat.spec.ts.
    const user = await createUserFiatTopup(FULFILL_USER_WALLET);

    // Reload (the UI does poll, but waiting on the polling cadence makes
    // tests flaky — a hard reload is faster and equally valid).
    await page.reload();
    const row = page.getByTestId(`admin-topup-row-${user.topupId}`);
    await expect(row).toBeVisible({ timeout: 10_000 });

    // ── Fulfill without bank tx ref → alert() ──
    // alert() blocks the click() resolution until accepted; install a
    // one-shot dialog handler before the click so we don't deadlock.
    page.once("dialog", async (dlg) => {
      expect(dlg.type()).toBe("alert");
      expect(dlg.message().toLowerCase()).toContain("bank tx ref");
      await dlg.accept();
    });
    await page.getByTestId(`admin-topup-fulfill-${user.topupId}`).click();

    // Row should still be present (no fulfill happened).
    await expect(row).toBeVisible();

    // ── Fill bank tx ref → fulfill → row vanishes ──
    await page.getByTestId(`admin-topup-banktxref-${user.topupId}`).fill("BNK-E2E-FULFILL-001");
    await page.getByTestId(`admin-topup-fulfill-${user.topupId}`).click();
    await expect(row).toHaveCount(0, { timeout: 10_000 });

    expect(errors, `Console errors: ${errors.join("\n")}`).toEqual([]);
  });

  test("admin cancel flow — confirm() prompt → row disappears, status flips to CANCELLED", async ({
    page,
  }) => {
    const { errors } = attachConsoleSpy(page);

    await loginAdminViaForm(page, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD);

    const user = await createUserFiatTopup(CANCEL_USER_WALLET);

    await page.goto("/admin/topups");
    const row = page.getByTestId(`admin-topup-row-${user.topupId}`);
    await expect(row).toBeVisible({ timeout: 10_000 });

    // Cancel triggers a confirm() prompt — install a one-shot accept
    // handler before the click so click() doesn't deadlock.
    let dialogObserved = false;
    page.once("dialog", async (dlg) => {
      dialogObserved = true;
      expect(dlg.type()).toBe("confirm");
      await dlg.accept();
    });
    await page.getByTestId(`admin-topup-cancel-${user.topupId}`).click();
    expect(dialogObserved).toBe(true);
    await expect(row).toHaveCount(0, { timeout: 10_000 });

    // Backend snapshot must be CANCELLED.
    const snap = await fetch(`${BACKEND}/api/topup/${user.topupId}`, {
      headers: { Authorization: `Bearer ${user.jwt}` },
    });
    expect(snap.ok).toBe(true);
    const snapBody = (await snap.json()) as { data?: { status: string } };
    expect(snapBody.data?.status).toBe("CANCELLED");

    expect(errors, `Console errors: ${errors.join("\n")}`).toEqual([]);
  });

  test("CAMPAIGN_ADMIN cannot fulfill a topup — backend returns 403, row stays", async ({
    page,
  }) => {
    const { errors } = attachConsoleSpy(page);

    await loginAdminViaForm(page, CAMPAIGN_ADMIN_EMAIL, CAMPAIGN_ADMIN_PASSWORD);

    const user = await createUserFiatTopup(CAMPAIGN_USER_WALLET);

    await page.goto("/admin/topups");
    const row = page.getByTestId(`admin-topup-row-${user.topupId}`);
    await expect(row).toBeVisible({ timeout: 10_000 });

    await page
      .getByTestId(`admin-topup-banktxref-${user.topupId}`)
      .fill("BNK-E2E-CAMPAIGN-FORBIDDEN");

    // Capture the network response of the fulfill POST so we can assert 403.
    const fulfillResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/api/admin/topup/${user.topupId}/fulfill`) &&
        resp.request().method() === "POST",
      { timeout: 10_000 },
    );

    await page.getByTestId(`admin-topup-fulfill-${user.topupId}`).click();
    const resp = await fulfillResponse;
    expect(resp.status(), "fulfill must be 403 for CAMPAIGN_ADMIN").toBe(403);

    // Row must still be visible — no fulfill side-effect.
    await expect(row).toBeVisible({ timeout: 5_000 });

    // Console: a documented 403 from /api/admin/topup/.../fulfill is the
    // expected error for this test. attachConsoleSpy logs `/api/* >= 400`
    // unless 401, so 403 will appear in `errors`. Filter it explicitly.
    const unexpected = errors.filter((line) => !line.includes(`/api/admin/topup/${user.topupId}/fulfill`));
    expect(unexpected, `Unexpected console errors: ${unexpected.join("\n")}`).toEqual([]);
  });
});
