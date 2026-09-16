import { expect, type Page, test } from "@playwright/test";
import { Keypair } from "@stellar/stellar-sdk";
import { freshWallet, loginAsWallet } from "./helpers/auth";

/**
 * `/farming` as it exists today.
 *
 * The tabs this file used to drive - Overview / Pools / Strategy / Activity,
 * and later Performance / Manage with its pool rows - were deleted on purpose
 * in f6ba8027 ("replace tabs+modals body with FarmingDashboard ... Tabs/
 * manage-tab UI removed"). Those tests were rewritten or dropped rather than
 * repaired: a test that asserts a screen the product no longer has is not a
 * failing test, it is a stale one, and keeping it green would have meant
 * putting the screen back.
 *
 * What the route is now:
 *   - no managed account  → client redirect to the /farming/setup wizard
 *   - a managed account   → FarmingDashboard: PositionValueCard (balance,
 *                           deposited, lifetime earnings, chart) +
 *                           AgentHistoryCard, with AprSummaryCard alongside
 *   - `?tab=activity`     → the Activity Timeline drawer over the dashboard
 *   - "Add funds"         → the fund dialog
 */

/** Shaped exactly like `GET /api/account/position/:publicKey` on mainnet. */
const ACTIVE_POSITION = {
  success: true,
  data: {
    totalValueUsd: 12.34,
    totalDepositedUsd: 10,
    totalWithdrawnUsd: 0,
    netDepositsUsd: 10,
    profitUsd: 2.34,
    profitPercent: 23.4,
    currentApy: 0.067031,
    preset: "BALANCED",
    status: "ACTIVE",
    baseAsset: "USDC",
    activeAssets: ["USDC"],
    positions: [
      {
        poolName: "USDC",
        poolType: "lending",
        protocol: "BLEND",
        allocationPercent: 100,
        valueUsd: 12.34,
        apy: 0.067031,
      },
    ],
    gasReserveUsd: 0,
    balanceStale: false,
    sessionKeyStale: false,
    createdAt: "2026-08-16T21:36:07.767Z",
    keeperWalletAddress: "CDALQPJ4IPYKEM52ZB7QKCUAOIOFNVQ2V4AXPNWERJS565WTSSZPQSL4",
  },
};

/**
 * Two things `loginAsWallet` does not cover on this route:
 *
 *  - `__TASMIL_E2E_WALLET__`. WalletContext's auto-restore effect only trusts
 *    that global; the `__TASMIL_E2E_BYPASS_KIT__` flag the shared helper sets
 *    is no longer read there, so without this the effect asks the real
 *    StellarWalletsKit, fails headless, and calls `reset()` - leaving the page
 *    genuinely disconnected. Same global the loop's farming runner injects.
 *  - the "You're in the Top 100" gas-sponsorship modal, which enrols on first
 *    visit and then covers the page for every brand-new wallet. Suppressed
 *    with the same session key the app's own `useSponsorshipVisit` writes.
 */
async function primeWallet(page: Page, wallet: string): Promise<void> {
  await page.addInitScript((walletAddress: string) => {
    (window as unknown as { __TASMIL_E2E_WALLET__?: unknown }).__TASMIL_E2E_WALLET__ = {
      connected: true,
      publicKey: walletAddress,
    };
    for (const route of ["chat", "dashboard", "farming"]) {
      sessionStorage.setItem(`tasmil:sponsorship:visited:${route}:${walletAddress}`, "1");
    }
  }, wallet);
}

/**
 * Serve a position for whatever wallet the test logged in as. Fresh wallets
 * have no account on the backend, and the dashboard is only reachable with
 * one; `delayMs` lets a test hold the response open to prove the page waits
 * for it instead of guessing.
 */
async function mockPosition(page: Page, delayMs = 0): Promise<void> {
  await page.route("**/api/account/position/**", async (route) => {
    if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(ACTIVE_POSITION),
    });
  });
}

test.describe("Farming route", () => {
  test.skip(process.env.NODE_ENV === "production", "test-login is disabled on production");

  // The dev server compiles /farming on first hit and one test deliberately
  // stalls its position read; 30s is not enough headroom for either.
  test.beforeEach(({}, testInfo) => {
    testInfo.setTimeout(90_000);
  });

  test("a wallet with no managed account lands on the setup wizard", async ({ page }) => {
    // A real Stellar key, not `freshWallet()`'s padded placeholder: the
    // backend rejects a malformed address with 400, and 400 is "the read
    // failed", not "no account". Only a well-formed unknown key gets the 404
    // that means there is genuinely nothing to show.
    const wallet = Keypair.random().publicKey();
    await loginAsWallet(page, wallet);
    await primeWallet(page, wallet);
    await page.goto("/farming", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/farming\/setup/, { timeout: 15_000 });
  });

  test("a wallet with an account renders the dashboard instead of onboarding", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await primeWallet(page, wallet);
    await mockPosition(page);
    await page.goto("/farming", { waitUntil: "domcontentloaded" });

    await expect(page.getByText("Total balance", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/farming(\?|$)/);
    // The setup CTA belongs to the empty state; it must not be on a dashboard.
    await expect(page.getByTestId("setup-cta")).toHaveCount(0);
  });

  test("dashboard figures come from the position payload", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await primeWallet(page, wallet);
    await mockPosition(page);
    await page.goto("/farming", { waitUntil: "domcontentloaded" });

    await expect(page.getByText("12.34 USDC")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Total deposited")).toBeVisible();
    // Deposits appear twice - PositionValueCard and AprSummaryCard both read
    // `totalDepositedUsd` - so assert the value is on screen, not that it is
    // on screen exactly once.
    await expect(page.getByText("10.00 USDC").first()).toBeVisible();
    await expect(page.getByText("2.34 USDC (23.40%)")).toBeVisible();
  });

  /**
   * Regression guard for the redirect race: the guard effect used to fire
   * `router.replace("/farming/setup")` while the position read was still in
   * flight, so a live account was bounced through onboarding and only walked
   * back once the response landed. Holding the response open for three
   * seconds reproduces exactly that window.
   */
  test("a slow position read never bounces a real account into onboarding", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await primeWallet(page, wallet);
    await mockPosition(page, 3000);

    const visited: string[] = [];
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) visited.push(frame.url());
    });

    await page.goto("/farming", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Total balance", { exact: true })).toBeVisible({ timeout: 20_000 });
    expect(visited.filter((url) => url.includes("/farming/setup"))).toHaveLength(0);
  });

  test("a failed position read says so instead of offering setup", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await primeWallet(page, wallet);
    await page.route("**/api/account/position/**", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ success: false, statusCode: 503, message: "upstream down" }),
      })
    );

    await page.goto("/farming", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/couldn't read your account/i)).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(/\/farming(\?|$)/);
  });

  test("Add funds opens the deposit dialog", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await primeWallet(page, wallet);
    await mockPosition(page);
    await page.goto("/farming", { waitUntil: "domcontentloaded" });

    await page.getByRole("button", { name: /add funds/i }).click({ timeout: 15_000 });
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/deposit more/i)).toBeVisible();
  });

  test("?tab=activity opens the activity drawer with its category filters", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await primeWallet(page, wallet);
    await mockPosition(page);
    await page.goto("/farming?tab=activity", { waitUntil: "domcontentloaded" });

    await expect(page.getByText(/activity timeline/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("tab", { name: /^All$/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /^Protocol$/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /^Reward$/ })).toBeVisible();
  });

  // NOTE: the old "No error overlay on success" test asserted that no
  // `role="alert"` element was visible. It is not a usable signal here - the
  // sonner toaster mounts a permanently visible empty `role="alert"` region on
  // every page - so it was dropped rather than rewritten into something that
  // passes without meaning anything. The happy-path render is covered above.

  test("mobile viewport - dashboard fits without horizontal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await primeWallet(page, wallet);
    await mockPosition(page);
    await page.goto("/farming", { waitUntil: "domcontentloaded" });

    await expect(page.getByText("Total balance", { exact: true })).toBeVisible({ timeout: 15_000 });
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
});
