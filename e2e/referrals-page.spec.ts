/**
 * Referrals page — UI interaction matrix
 *
 * Drives /profile/referrals via the UI:
 *   S1 empty state for wallets with no waitlist row.
 *   S2 organic signup (no inviter): Copy-link button writes to clipboard,
 *      label flips to "Copied", Link-X button opens the disabled dialog,
 *      dialog dismiss is clean (no zombie state on re-open).
 *   S3 referred signup: Claimed badge + +20 credits + JOIN events row.
 *   S4 keyboard nav: Tab→Enter on Copy + Link-X buttons; Esc closes the
 *      dialog.
 *   S5 redirect-on-logout: clearing localStorage forces the page back to
 *      anonymous state on reload.
 *
 * Each scenario uses a unique wallet so they can run in parallel without
 * stepping on each other (the existing referral-join.spec.ts already proves
 * the JOIN-credit replay behaviour, so we focus on UI surfaces here).
 */

import { execSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";
import { attachConsoleSpy } from "./_helpers/console-filter";

const BACKEND = process.env.PLAYWRIGHT_BACKEND_URL ?? "http://localhost:6756";
const DB_CONTAINER = process.env.PLAYWRIGHT_DB_CONTAINER ?? "backend-db-1";
const DB_NAME = process.env.PLAYWRIGHT_DB_NAME ?? "tasmilfinance";

const S1_WALLET = "GREFERRALMATRIX1000000000000000000000000000000000000000";
const S2_WALLET = "GREFERRALMATRIX2000000000000000000000000000000000000000";
const S3_INVITER_WALLET = "GREFERRALMATRIX3I00000000000000000000000000000000000000";
const S3_INVITEE_WALLET = "GREFERRALMATRIX3E00000000000000000000000000000000000000";
const S4_WALLET = "GREFERRALMATRIX4000000000000000000000000000000000000000";
const S5_WALLET = "GREFERRALMATRIX5000000000000000000000000000000000000000";

const S2_REFCODE = "MTX2E2E";
const S3_INVITER_REFCODE = "MTX3IE2";
const S3_INVITEE_REFCODE = "MTX3EE2";
const S4_REFCODE = "MTX4E2E";
const S5_REFCODE = "MTX5E2E";

interface Session {
  jwt: string;
  walletAddress: string;
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
  execPsql(`DELETE FROM waitlist_entries WHERE wallet_address = '${walletAddress}'`);
}

function seedWaitlistEntry(opts: {
  walletAddress: string;
  referralCode: string;
  referredById?: string | null;
}): string {
  const id = `wl_e2e_${Math.random().toString(36).slice(2, 12)}`;
  const referredByLit = opts.referredById ? `'${opts.referredById}'` : "NULL";
  execPsql(
    `INSERT INTO waitlist_entries
       (id, email, wallet_address, status, referral_code, referred_by_id, created_at, updated_at)
     VALUES ('${id}', '${id}@e2e.test', '${opts.walletAddress}', 'CONFIRMED',
             '${opts.referralCode}', ${referredByLit}, NOW(), NOW())`,
  );
  return id;
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

  return { jwt, walletAddress };
}

/**
 * Zustand v5 `persist` rehydrates from localStorage in an async setState()
 * AFTER the store is created. The very first React render of any page
 * always sees `accessToken: null`. /profile/referrals (commit 9a106063)
 * redirects unauth → /login on first render, so a single page.goto races
 * the store hydration and lands on /login.
 *
 * Workaround: navigate to a public route first (/topup), let the auth
 * store hydrate while the public page renders, then click the sidebar
 * Referrals <Link> to navigate client-side. Client routing keeps the same
 * React tree and store, so the protected page sees `accessToken` set on
 * its first render.
 */
async function gotoAuthed(page: Page, path: string): Promise<void> {
  await page.goto("/topup");
  await page
    .waitForFunction(
      () => {
        const raw = window.localStorage.getItem("auth-storage");
        if (!raw) return false;
        try {
          const parsed = JSON.parse(raw);
          return Boolean(parsed?.state?.accessToken);
        } catch {
          return false;
        }
      },
      undefined,
      { timeout: 10_000 },
    )
    .catch(() => {});
  await page.waitForTimeout(400);
  if (path === "/profile/referrals") {
    const referralsLink = page
      .getByRole("link", { name: /^Referrals$/i })
      .first();
    if (await referralsLink.count()) {
      await referralsLink.click();
      await page
        .waitForURL((url) => url.pathname === path, { timeout: 10_000 })
        .catch(() => {});
    } else {
      await page.goto(path);
    }
  } else {
    await page.goto(path);
  }
  if (!page.url().endsWith(path) && !page.url().includes(`${path}?`)) {
    await page.goto(path);
  }
}

test.describe("Referrals page — UI interaction matrix", () => {
  test.beforeAll(() => {
    [
      S1_WALLET,
      S2_WALLET,
      S3_INVITER_WALLET,
      S3_INVITEE_WALLET,
      S4_WALLET,
      S5_WALLET,
    ].forEach(dbCleanWallet);
  });

  test("S1: no waitlist entry → empty-state CTA, no copy/share buttons", async ({ page }) => {
    // No seed — wallet only exists once login fires.
    const { errors } = attachConsoleSpy(page);
    await loginAsWallet(page, S1_WALLET);

    await gotoAuthed(page, "/profile/referrals");
    await expect(page.getByTestId("referrals-root")).toBeVisible({ timeout: 10_000 });
    // Empty state visible because backend snapshot resolves to no code.
    await expect(page.getByTestId("referrals-empty")).toBeVisible();
    await expect(page.getByTestId("referrals-copy-link")).toHaveCount(0);
    await expect(page.getByTestId("referrals-share-x")).toHaveCount(0);
    await expect(page.getByTestId("referrals-link-x")).toHaveCount(0);
    // Stats card still renders with zeros.
    await expect(page.getByTestId("referrals-total-credits")).toContainText("0");
    await expect(page.getByTestId("referrals-events-empty")).toBeVisible();

    expect(errors, `Console errors: ${errors.join("\n")}`).toEqual([]);
  });

  test("S2: organic signup → code visible, Copy writes clipboard, Link-X dialog opens/closes", async ({
    browser,
  }) => {
    seedWaitlistEntry({
      walletAddress: S2_WALLET,
      referralCode: S2_REFCODE,
      referredById: null,
    });

    // Need clipboard perms for the readText() assertion below.
    const ctx = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
    const page = await ctx.newPage();
    const { errors } = attachConsoleSpy(page);
    await loginAsWallet(page, S2_WALLET);

    await gotoAuthed(page, "/profile/referrals");
    await expect(page.getByTestId("referrals-root")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("referrals-code")).toContainText(S2_REFCODE);

    // ── Copy-link UI flow ──
    const copyBtn = page.getByTestId("referrals-copy-link");
    await expect(copyBtn).toContainText("Copy link");
    await copyBtn.click();
    // Button label flips to "Copied" for ~2s before reverting.
    await expect(copyBtn).toContainText("Copied");
    const clip = await page.evaluate(async () => navigator.clipboard.readText());
    expect(clip).toBe(`https://tasmil.finance/r/${S2_REFCODE}`);
    // Wait the 2s flip-back window so we see the button settle, but don't
    // strictly assert the label revert (the timeout is implementation-detail).

    // ── Link-X dialog ──
    // xLinked starts false → button is the Link-X variant (not share-x).
    await expect(page.getByTestId("referrals-share-x")).toHaveCount(0);
    const linkX = page.getByTestId("referrals-link-x");
    await expect(linkX).toBeVisible();
    await linkX.click();
    // Backend returns 501 because X linking is not yet wired up; the dialog
    // shows the disabled message. Allow a short window for the network call.
    await expect(page.getByTestId("link-x-dialog-root")).toBeVisible();
    await expect(page.getByTestId("link-x-dialog-disabled-message")).toBeVisible({
      timeout: 10_000,
    });

    // Dismiss via Close button → dialog detaches.
    await page.getByTestId("link-x-dialog-close").click();
    await expect(page.getByTestId("link-x-dialog-root")).toHaveCount(0);

    // Re-open: previous state must not stick.
    await linkX.click();
    await expect(page.getByTestId("link-x-dialog-root")).toBeVisible();
    await expect(page.getByTestId("link-x-dialog-disabled-message")).toBeVisible({
      timeout: 10_000,
    });
    await page.getByTestId("link-x-dialog-close").click();
    await expect(page.getByTestId("link-x-dialog-root")).toHaveCount(0);

    // The link-x/start endpoint returns 501 by design (X linking is unwired
    // pre-launch); the dialog handles it cleanly. Filter that single
    // expected status out of the console-error noise.
    const unexpected = errors.filter((e) => !/501.*\/api\/referral\/link-x\/start/.test(e));
    expect(unexpected, `Console errors: ${unexpected.join("\n")}`).toEqual([]);
    await ctx.close();
  });

  test("S3: referred signup → JOIN row, +20 credits, Claimed badge, well-formed When cell", async ({
    page,
  }) => {
    const inviterEntryId = seedWaitlistEntry({
      walletAddress: S3_INVITER_WALLET,
      referralCode: S3_INVITER_REFCODE,
      referredById: null,
    });
    seedWaitlistEntry({
      walletAddress: S3_INVITEE_WALLET,
      referralCode: S3_INVITEE_REFCODE,
      referredById: inviterEntryId,
    });

    const { errors } = attachConsoleSpy(page);
    await loginAsWallet(page, S3_INVITEE_WALLET);

    await gotoAuthed(page, "/profile/referrals");
    await expect(page.getByTestId("referrals-root")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("referrals-code")).toContainText(S3_INVITEE_REFCODE);
    await expect(page.getByTestId("referrals-join-badge")).toContainText(/claimed/i);
    await expect(page.getByTestId("referrals-total-credits")).toContainText("20");

    const joinRow = page.getByTestId("referrals-events-row-JOIN");
    await expect(joinRow).toBeVisible();
    // Row has 3 cells: kind, credits, when. Verify each renders a string.
    const cells = joinRow.locator("td");
    await expect(cells).toHaveCount(3);
    await expect(cells.nth(0)).toContainText(/join/i);
    await expect(cells.nth(1)).toContainText("+20");
    // The "When" cell is a relative timestamp like "5s ago" / "1m ago" — not
    // empty, ends with " ago".
    const whenText = (await cells.nth(2).textContent())?.trim() ?? "";
    expect(whenText.length).toBeGreaterThan(0);
    expect(whenText).toMatch(/ago$/);

    expect(errors, `Console errors: ${errors.join("\n")}`).toEqual([]);
  });

  test("S4: keyboard nav — Tab→Enter on Copy, Tab→Enter on Link-X, Escape dismisses", async ({
    browser,
  }) => {
    seedWaitlistEntry({
      walletAddress: S4_WALLET,
      referralCode: S4_REFCODE,
      referredById: null,
    });

    const ctx = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
    const page = await ctx.newPage();
    const { errors } = attachConsoleSpy(page);
    await loginAsWallet(page, S4_WALLET);

    await gotoAuthed(page, "/profile/referrals");
    await expect(page.getByTestId("referrals-root")).toBeVisible({ timeout: 10_000 });
    const copyBtn = page.getByTestId("referrals-copy-link");
    const linkX = page.getByTestId("referrals-link-x");
    await expect(copyBtn).toBeVisible();

    // Programmatically focus copy button — Tab order across the dashboard
    // shell can vary (depends on sidebar collapse state, theme toggle, etc.)
    // so we land on the right control via .focus(), then drive Enter.
    await copyBtn.focus();
    await page.keyboard.press("Enter");
    // Clipboard should now hold the share URL.
    const clip = await page.evaluate(async () => navigator.clipboard.readText());
    expect(clip).toBe(`https://tasmil.finance/r/${S4_REFCODE}`);

    // Move focus to Link-X via Tab and fire Enter.
    await page.keyboard.press("Tab");
    // Either we're already on Link-X or the next focusable; assert it via a
    // direct focus() to be deterministic, then press Enter.
    await linkX.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("link-x-dialog-root")).toBeVisible();

    // Escape closes the dialog (Radix-shadcn default behaviour).
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("link-x-dialog-root")).toHaveCount(0);

    // 501 from /api/referral/link-x/start is expected (see S2 comment).
    const unexpected = errors.filter((e) => !/501.*\/api\/referral\/link-x\/start/.test(e));
    expect(unexpected, `Console errors: ${unexpected.join("\n")}`).toEqual([]);
    await ctx.close();
  });

  test("S5: an anonymous browser context cannot see the referral page", async ({
    browser,
  }) => {
    seedWaitlistEntry({
      walletAddress: S5_WALLET,
      referralCode: S5_REFCODE,
      referredById: null,
    });

    // First context: authenticated, sees the code.
    const authCtx = await browser.newContext();
    const authPage = await authCtx.newPage();
    await loginAsWallet(authPage, S5_WALLET);
    await gotoAuthed(authPage, "/profile/referrals");
    await expect(authPage.getByTestId("referrals-root")).toBeVisible({ timeout: 10_000 });
    await expect(authPage.getByTestId("referrals-code")).toContainText(S5_REFCODE);
    await authCtx.close();

    // Second context: brand-new browser session — no cookies, no
    // localStorage, no addInitScript. The referrals page now renders an
    // unauthed prompt (with `referrals-unauthed` testid) instead of
    // redirecting to /login (which 404s — there is no public login route;
    // /login only exists under /admin/(auth)). Wallet connect is handled
    // by the sidebar's <ConnectWalletButton />.
    const anonCtx = await browser.newContext();
    const anonPage = await anonCtx.newPage();
    const { errors } = attachConsoleSpy(anonPage);

    await anonPage.goto("/profile/referrals");
    await expect(anonPage.getByTestId("referrals-unauthed")).toBeVisible({ timeout: 15_000 });
    // No redirect should have fired.
    expect(anonPage.url()).toContain("/profile/referrals");

    // Authed wallet's referral code must NOT have leaked into this anon context.
    const codeCount = await anonPage.getByTestId("referrals-code").count();
    expect(codeCount).toBe(0);

    expect(errors, `Console errors: ${errors.join("\n")}`).toEqual([]);
    await anonCtx.close();
  });
});
