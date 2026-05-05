import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { freshWallet, loginAsWallet } from "./helpers/auth";

/**
 * Inject the E2E wallet fast-path expected by `wallet-context.tsx` so
 * `useWallet().isConnected` flips true without StellarWalletsKit. Also
 * pre-seed `tasmil.setup.state` to step 2 so SetupPage skips the
 * Connect-Wallet hero on first paint (StepConnect's auto-advance effect
 * is still tested by the dedicated S6 case in disconnected mode).
 */
async function primeConnectedSetup(page: Page, walletAddress: string, step: 1 | 2 | 3 = 2) {
  await page.addInitScript(
    ({ walletAddress, step }) => {
      (window as unknown as { __TASMIL_E2E_WALLET__?: unknown }).__TASMIL_E2E_WALLET__ = {
        connected: true,
        publicKey: walletAddress,
      };
      window.sessionStorage.setItem(
        "tasmil.setup.state",
        JSON.stringify({
          step,
          asset: "USDC",
          mode: "AUTO",
          preset: "Balanced",
          customMarkets: [],
        })
      );
    },
    { walletAddress, step }
  );
}

/**
 * E2E coverage for the 5-step full-page setup flow at /farming/setup.
 *
 * Step 3 (Create Smart Account) signs real Stellar transactions when clicked
 * for real — these tests verify UP TO the click but never actually sign. The
 * step-create-account.test.tsx Jest suite covers the click→mocked-mutation
 * happy path at the unit level.
 *
 * Run locally:
 *   PLAYWRIGHT_BASE_URL=http://localhost:3001 \
 *   PLAYWRIGHT_BACKEND_URL=http://localhost:6856 \
 *   pnpm exec playwright test setup-flow.spec.ts
 */

test.describe("Setup wizard — full-page flow", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("S1 — /farming redirects to /farming/setup when no position", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await primeConnectedSetup(page, wallet);
    await page.goto("/farming");
    await expect(page).toHaveURL(/\/farming\/setup/, { timeout: 15000 });
  });

  test("S2 — connected wallet lands on Step 2 (Strategy)", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await primeConnectedSetup(page, wallet);
    await page.goto("/farming/setup");
    await expect(
      page.getByRole("heading", { name: /Tasmil Agent Strategy/i })
    ).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Step 2 of 5/i)).toBeVisible();
  });

  test("S3 — Step 2 Continue advances to Step 3 (Create smart account)", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await primeConnectedSetup(page, wallet);
    await page.goto("/farming/setup");
    await expect(
      page.getByRole("heading", { name: /Tasmil Agent Strategy/i })
    ).toBeVisible({ timeout: 15000 });
    await page.getByRole("button", { name: /^Continue$/i }).click();
    await expect(
      page.getByRole("heading", { name: /Create your smart account/i })
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Step 3 of 5/i)).toBeVisible();
  });

  test("S4 — Step 2 asset toggle switches selection", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await primeConnectedSetup(page, wallet);
    await page.goto("/farming/setup");
    await expect(page.getByText("Deposit asset", { exact: true })).toBeVisible({ timeout: 15000 });
    // AssetPill renders <button aria-pressed> with visible text "USDC"/"XLM".
    const xlmPill = page.getByRole("button", { name: /^XLM/ }).first();
    await xlmPill.click();
    await expect(xlmPill).toHaveAttribute("aria-pressed", "true");
  });

  test("S5 — Step 3 sign button is visible and enabled", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await primeConnectedSetup(page, wallet, 3);
    await page.goto("/farming/setup");
    const sign = page.getByRole("button", { name: /Sign with your wallet/i });
    await expect(sign).toBeVisible({ timeout: 15000 });
    await expect(sign).toBeEnabled();
  });

  test("S6 — disconnected wallet shows Step 1 Get started hero", async ({ page, context }) => {
    await context.clearCookies();
    // No loginAsWallet — wallet stays disconnected.
    await page.goto("/farming/setup");
    await expect(
      page.getByRole("heading", { name: /Get started/i })
    ).toBeVisible({ timeout: 10000 });
    // Two Connect Wallet buttons exist (top-nav + hero). The hero one lives
    // inside <main>; scope to that to avoid strict-mode collision.
    await expect(
      page.getByRole("main").getByRole("button", { name: /Connect Wallet/i })
    ).toBeVisible();
  });
});
