import { expect, test } from "@playwright/test";
import { freshWallet, loginAsWallet } from "./helpers/auth";

/**
 * 8 end-to-end tests covering the multi-step setup wizard.
 *
 * Run against the local mainnet stack:
 *   PLAYWRIGHT_BASE_URL=http://localhost:3001 \
 *   PLAYWRIGHT_BACKEND_URL=http://localhost:6856 \
 *   pnpm exec playwright test setup-flow.spec.ts
 *
 * The wizard's deploy step actually signs Stellar transactions, which
 * requires a real wallet — these tests verify everything UP TO the click
 * but never actually sign. The `step-deploy.test.tsx` Jest suite covers
 * the click→mocked-mutation happy path at the unit level.
 */

// Playwright creates a fresh BrowserContext per test by default, so
// sessionStorage is already isolated. No manual reset needed.

test.describe("Setup wizard — entry redirect", () => {
  test("S1 — disconnected user visiting /farming/setup is not redirected mid-flow", async ({
    page,
  }) => {
    // The setup route doesn't auth-gate by itself (it's a presentation page);
    // farming-page.tsx is what redirects. Visiting /farming/setup directly as
    // a disconnected user just renders the wizard (no Position to gate on).
    await page.goto("/farming/setup");
    await expect(page.getByRole("heading", { name: /Choose deposit asset/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test("S2 — connected user with no Position sees Get started CTA, click navigates to /farming/setup", async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
    await page.goto("/farming");
    const cta = page.getByTestId("setup-cta");
    await expect(cta).toBeVisible({ timeout: 10000 });
    await expect(cta).toHaveText(/Get started|Resume setup/i);
    await cta.click();
    await expect(page).toHaveURL(/\/farming\/setup/, { timeout: 5000 });
    await expect(page.getByRole("heading", { name: /Choose deposit asset/i })).toBeVisible();
  });
});

test.describe("Setup wizard — step transitions", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
  });

  test("S3 — step 1 → step 2 (asset → strategy)", async ({ page }) => {
    await page.goto("/farming/setup");
    await expect(page.getByRole("heading", { name: /Choose deposit asset/i })).toBeVisible();
    // USDC is preselected; click Continue
    await page.getByRole("button", { name: /^Continue$/i }).click();
    await expect(page.getByRole("heading", { name: /Agent strategy/i })).toBeVisible({
      timeout: 5000,
    });
  });

  test("S4 — step 2 → step 3 (strategy → preset)", async ({ page }) => {
    await page.goto("/farming/setup");
    await page.getByRole("button", { name: /^Continue$/i }).click(); // 1 → 2
    await expect(page.getByRole("heading", { name: /Agent strategy/i })).toBeVisible();
    // Auto is preselected; Custom is disabled (customComingSoon). Continue.
    await page.getByRole("button", { name: /^Continue$/i }).click();
    await expect(page.getByRole("heading", { name: /Pick risk preset/i })).toBeVisible({
      timeout: 5000,
    });
  });

  test("S5 — step 3 → step 4 (preset → review)", async ({ page }) => {
    await page.goto("/farming/setup");
    await page.getByRole("button", { name: /^Continue$/i }).click(); // 1 → 2
    await page.getByRole("button", { name: /^Continue$/i }).click(); // 2 → 3
    await expect(page.getByRole("heading", { name: /Pick risk preset/i })).toBeVisible({
      timeout: 10000,
    });
    // Balanced is preselected by default. Click Continue.
    await page.getByRole("button", { name: /^Continue$/i }).click();
    await expect(
      page.getByRole("heading", { name: /Create your smart account/i })
    ).toBeVisible({ timeout: 5000 });
  });

  test("S6 — step 4 review block shows USDC / Auto / Balanced + Create CTA", async ({
    page,
  }) => {
    await page.goto("/farming/setup");
    await page.getByRole("button", { name: /^Continue$/i }).click();
    await page.getByRole("button", { name: /^Continue$/i }).click();
    await page.getByRole("button", { name: /^Continue$/i }).click();
    await expect(page.getByRole("heading", { name: /Create your smart account/i })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/^USDC$/i).first()).toBeVisible();
    await expect(page.getByText(/^Auto$/i).first()).toBeVisible();
    await expect(page.getByText(/^Balanced$/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Create smart account/i })).toBeVisible();
  });
});

test.describe("Setup wizard — back navigation + persistence", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
  });

  test("S7 — Back button on step 2 returns to step 1", async ({ page }) => {
    await page.goto("/farming/setup");
    await page.getByRole("button", { name: /^Continue$/i }).click();
    await expect(page.getByRole("heading", { name: /Agent strategy/i })).toBeVisible();
    await page.getByRole("button", { name: /Back/i }).click();
    await expect(page.getByRole("heading", { name: /Choose deposit asset/i })).toBeVisible();
  });

  test("S8 — sessionStorage persistence: reload at step 2 keeps state", async ({ page }) => {
    await page.goto("/farming/setup");
    await page.getByRole("button", { name: /^Continue$/i }).click();
    await expect(page.getByRole("heading", { name: /Agent strategy/i })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: /Agent strategy/i })).toBeVisible({
      timeout: 5000,
    });
  });
});
