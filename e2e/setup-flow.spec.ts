import { expect, test } from "@playwright/test";
import { freshWallet, loginAsWallet } from "./helpers/auth";

/**
 * 8 end-to-end tests covering the multi-step setup wizard rendered as a
 * Dialog over /farming.
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

const openWizard = async (page: import("@playwright/test").Page) => {
  await page.goto("/farming");
  const cta = page.getByTestId("setup-cta");
  await expect(cta).toBeVisible({ timeout: 10000 });
  await cta.click();
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
  await expect(
    page.getByRole("dialog").getByRole("heading", { name: /Choose deposit asset/i })
  ).toBeVisible();
};

test.describe("Setup wizard — entry CTA", () => {
  test("S1 — Get started CTA visible on /farming with no Position", async ({ page, context }) => {
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
    await page.goto("/farming");
    const cta = page.getByTestId("setup-cta");
    await expect(cta).toBeVisible({ timeout: 10000 });
    await expect(cta).toHaveText(/Get started|Resume setup/i);
  });

  test("S2 — clicking Get started opens the wizard Dialog (URL stays /farming)", async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
    await openWizard(page);
    await expect(page).toHaveURL(/\/farming(\?|$)/, { timeout: 5000 });
  });
});

test.describe("Setup wizard — step transitions inside Dialog", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
  });

  test("S3 — step 1 → step 2 (asset → strategy)", async ({ page }) => {
    await openWizard(page);
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: /^Continue$/i }).click();
    await expect(dialog.getByRole("heading", { name: /Agent strategy/i })).toBeVisible({
      timeout: 5000,
    });
  });

  test("S4 — step 2 → step 3 (strategy → preset)", async ({ page }) => {
    await openWizard(page);
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: /^Continue$/i }).click();
    await dialog.getByRole("button", { name: /^Continue$/i }).click();
    await expect(dialog.getByRole("heading", { name: /Pick risk preset/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test("S5 — step 3 → step 4 (preset → review)", async ({ page }) => {
    await openWizard(page);
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: /^Continue$/i }).click();
    await dialog.getByRole("button", { name: /^Continue$/i }).click();
    await dialog.getByRole("button", { name: /^Continue$/i }).click();
    await expect(
      dialog.getByRole("heading", { name: /Create your smart account/i })
    ).toBeVisible({ timeout: 5000 });
  });

  test("S6 — step 4 review shows USDC / Auto / Balanced + Create CTA", async ({ page }) => {
    await openWizard(page);
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: /^Continue$/i }).click();
    await dialog.getByRole("button", { name: /^Continue$/i }).click();
    await dialog.getByRole("button", { name: /^Continue$/i }).click();
    await expect(
      dialog.getByRole("heading", { name: /Create your smart account/i })
    ).toBeVisible({ timeout: 10000 });
    await expect(dialog.getByText(/^USDC$/).first()).toBeVisible();
    await expect(dialog.getByText(/^Auto$/).first()).toBeVisible();
    await expect(dialog.getByText(/^Balanced$/).first()).toBeVisible();
    await expect(dialog.getByRole("button", { name: /Create smart account/i })).toBeVisible();
  });
});

test.describe("Setup wizard — back nav + close", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
  });

  test("S7 — Back button on step 2 returns to step 1", async ({ page }) => {
    await openWizard(page);
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: /^Continue$/i }).click();
    await expect(dialog.getByRole("heading", { name: /Agent strategy/i })).toBeVisible();
    await dialog.getByRole("button", { name: /Back/i }).click();
    await expect(dialog.getByRole("heading", { name: /Choose deposit asset/i })).toBeVisible();
  });

  test("S8 — Escape closes the wizard Dialog", async ({ page }) => {
    await openWizard(page);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 5000 });
  });
});
