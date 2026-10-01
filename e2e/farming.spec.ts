import { expect, type Page, test } from "@playwright/test";
import { Keypair } from "@stellar/stellar-sdk";
import { freshWallet, loginAsWallet } from "./helpers/auth";

/** `/farming` keeps the SOW2 controller while presenting the farming-2 layout. */

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
    displayAsset: "USDC",
    assetPriceUsd: 1,
    totalValueAsset: 12.34,
    totalDepositedAsset: 10,
    totalWithdrawnAsset: 0,
    netDepositsAsset: 10,
    profitAsset: 2.34,
    profitPercentAsset: 23.4,
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

const POOLS = {
  success: true,
  data: [
    {
      id: "blend-usdc",
      protocol: "BLEND",
      poolAddress: `C${"B".repeat(55)}`,
      poolType: "lending",
      asset: "USDC",
      assetSymbol: "USDC",
      currentApy: 0.067031,
      tvlUsd: 1_000_000,
      riskScore: 3,
      strategyContractAddress: `C${"S".repeat(55)}`,
      enabled: true,
      lastUpdated: "2026-10-01T00:00:00.000Z",
    },
  ],
};

const PRESETS = {
  data: [
    {
      name: "Balanced",
      estimatedApy: 6.7,
      poolCount: 1,
      poolTypes: ["lending"],
      risks: ["Smart contract risk"],
      topPools: [{ name: "Blend USDC", apy: 6.7, weight: 100 }],
    },
  ],
};

const RULEBOOK = {
  accountId: "vault-e2e",
  network: "mainnet",
  contract: `C${"P".repeat(55)}`,
  readAtLedger: "60000000",
  instanceLiveUntilLedger: "60100000",
  killSwitch: false,
  killSwitchSource: "STORED",
  executionRouter: null,
  interfaceRegistry: null,
  globalDailyCalls: { used: "0", resetLedger: null, max: "48" },
  sessions: [],
  explorerUrl: `https://stellar.expert/explorer/public/contract/C${"P".repeat(55)}`,
};

const PORTFOLIO_HISTORY = {
  success: true,
  data: [
    {
      timestamp: "2026-10-01T17:40:00.000Z",
      totalValueUsd: 10,
      walletUsd: 10,
      defiUsd: 0,
      totalValueAsset: 10,
      walletAsset: 10,
      defiAsset: 0,
      assetSymbol: "USDC",
      assetPriceUsd: 1,
    },
    {
      timestamp: "2026-10-01T17:45:00.000Z",
      totalValueUsd: 12.34,
      walletUsd: 0,
      defiUsd: 12.34,
      totalValueAsset: 12.34,
      walletAsset: 0,
      defiAsset: 12.34,
      assetSymbol: "USDC",
      assetPriceUsd: 1,
    },
  ],
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
  await page.route("**/api/pools*", (route) => route.fulfill({ json: POOLS }));
  await page.route("**/api/account/presets*", (route) => route.fulfill({ json: PRESETS }));
  await page.route("**/api/account/activity/**", (route) =>
    route.fulfill({ json: { success: true, data: { items: [], nextCursor: null } } })
  );
  await page.route("**/api/portfolio/snapshot", (route) =>
    route.fulfill({ json: { success: true, data: { registered: false } } })
  );
  await page.route("**/api/portfolio/history/**", (route) =>
    route.fulfill({ json: PORTFOLIO_HISTORY })
  );
  await page.route(/\/api\/quest\/users\/me(?:\?.*)?$/, (route) =>
    route.fulfill({
      json: {
        success: true,
        data: { id: "quest-user-e2e", points: 0, streak: 0 },
      },
    })
  );
  await page.route("**/api/quest/users/me/check-in-status", (route) =>
    route.fulfill({
      json: { success: true, data: { hasCheckedIn: false, streak: 0 } },
    })
  );
  await page.route("**/api/marketplace/my-strategies*", (route) =>
    route.fulfill({
      json: {
        data: {
          vaults: [
            {
              accountId: "vault-e2e",
              purpose: "VAULT",
              keeperWalletAddress: ACTIVE_POSITION.data.keeperWalletAddress,
              baseAsset: "USDC",
              status: "ACTIVE",
            },
          ],
        },
      },
    })
  );
  await page.route("**/api/policy/rulebook/**", (route) =>
    route.fulfill({ json: { data: RULEBOOK } })
  );
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

  test("a wallet with an account renders the dashboard instead of onboarding", async ({
    page,
  }, testInfo) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await primeWallet(page, wallet);
    await mockPosition(page);
    const pageErrors: string[] = [];
    const serverErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("response", (response) => {
      if (response.url().includes("/api/") && response.status() >= 500) {
        serverErrors.push(`${response.status()} ${response.url()}`);
      }
    });
    await page.goto("/farming", { waitUntil: "domcontentloaded" });

    await expect(page.getByText("USDC portfolio value", { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("heading", { name: "Farming", exact: true })).toBeVisible();
    await expect(
      page.getByText("Manage your automated vault and on-chain positions.")
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: "Overview" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await expect(page.getByRole("button", { name: "Deposit", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Portfolio Value" })).toBeVisible();
    await expect(page.getByTestId("portfolio-value-chart")).toBeVisible();
    await expect(
      page.getByTestId("portfolio-value-chart").locator(".recharts-area-curve")
    ).toBeVisible();
    await expect(page).toHaveURL(/\/farming(\?|$)/);
    // The setup CTA belongs to the empty state; it must not be on a dashboard.
    await expect(page.getByTestId("setup-cta")).toHaveCount(0);
    // Let the intentional 650ms chart entrance animation settle before the
    // visual artifact is captured; assertions above already prove rendering.
    await page.waitForTimeout(700);
    await page.screenshot({
      path: testInfo.outputPath(`farming-overview-${testInfo.project.name}.png`),
      fullPage: true,
    });
    expect(pageErrors).toEqual([]);
    expect(serverErrors).toEqual([]);
  });

  test("dashboard figures come from the position payload", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await primeWallet(page, wallet);
    await mockPosition(page);
    await page.goto("/farming", { waitUntil: "domcontentloaded" });

    const header = page.locator('[data-onborda="farming-header"]');
    await expect(header.getByText("12.34 USDC", { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(header.getByText("≈ $12.34", { exact: true })).toBeVisible();
    await expect(page.getByText("6.70% APY")).toBeVisible();
    await expect(page.getByText("+2.34 USDC (+23.40%) all time")).toBeVisible();
    await expect(page.getByText("≈ +$2.34 (+23.40% USD)", { exact: true })).toBeVisible();
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
    await expect(page.getByText("USDC portfolio value", { exact: true })).toBeVisible({
      timeout: 20_000,
    });
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

  test("Deposit opens the current deposit dialog", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await primeWallet(page, wallet);
    await mockPosition(page);
    await page.goto("/farming", { waitUntil: "domcontentloaded" });

    await page.getByRole("button", { name: "Deposit", exact: true }).click({ timeout: 15_000 });
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/deposit more/i)).toBeVisible();
  });

  test("?tab=activity renders the activity tab with its category filters", async ({ page }) => {
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

  test("all farming sections are directly linkable", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await primeWallet(page, wallet);
    await mockPosition(page);

    for (const [query, label] of [
      ["", "Overview"],
      ["?tab=pools", "Pools"],
      ["?tab=strategy", "Strategy"],
      ["?tab=activity", "Activity"],
      ["?tab=rulebook", "My Rulebook"],
    ] as const) {
      await page.goto(`/farming${query}`, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("tab", { name: label })).toHaveAttribute("aria-selected", "true");
    }

    await expect(page.getByRole("heading", { name: "My Rulebook" })).toBeVisible();
    await expect(page.getByText("Kill switch is off")).toBeVisible();
  });

  test("an unknown tab falls back to Overview", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await primeWallet(page, wallet);
    await mockPosition(page);
    await page.goto("/farming?tab=unknown", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("tab", { name: "Overview" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  // NOTE: the old "No error overlay on success" test asserted that no
  // `role="alert"` element was visible. It is not a usable signal here - the
  // sonner toaster mounts a permanently visible empty `role="alert"` region on
  // every page - so it was dropped rather than rewritten into something that
  // passes without meaning anything. The happy-path render is covered above.

  test("mobile viewport - dashboard fits without horizontal scroll", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await primeWallet(page, wallet);
    await mockPosition(page);
    await page.goto("/farming", { waitUntil: "domcontentloaded" });

    await expect(page.getByText("USDC portfolio value", { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    await page.screenshot({
      path: testInfo.outputPath(`farming-mobile-${testInfo.project.name}.png`),
      fullPage: true,
    });
  });
});
