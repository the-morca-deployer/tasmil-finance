import { expect, test } from "@playwright/test";
import { freshWallet, loginAsWallet } from "./helpers/auth";

async function clearOnboarding(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    window.localStorage.removeItem("tasmil-onboarding");
  });
}

test.describe("Welcome onboarding modal", () => {
  test("opens on first wallet connect, closes on Get Started, persists dismissal", async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await clearOnboarding(page);
    await page.goto("/farming");

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible({ timeout: 8000 });

    for (let i = 0; i < 4; i++) {
      await page.getByRole("button", { name: /^Next$/ }).click();
    }
    await page.getByRole("button", { name: /Get Started/i }).click();

    await expect(modal).not.toBeVisible({ timeout: 3000 });

    await page.reload();
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 3000 });
  });

  test("Skip dismisses without completing all slides", async ({ page, context }) => {
    await context.clearCookies();
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await clearOnboarding(page);
    await page.goto("/farming");

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible({ timeout: 8000 });

    await page.getByRole("button", { name: /Skip/i }).click();
    await expect(modal).not.toBeVisible({ timeout: 3000 });

    await page.reload();
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 3000 });
  });

  test("Outside-click closes the modal but does NOT mark complete", async ({ page, context }) => {
    await context.clearCookies();
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await clearOnboarding(page);
    await page.goto("/farming");

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible({ timeout: 8000 });

    // Press Escape — Radix treats this as an outside-close.
    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible({ timeout: 3000 });

    // Reload: modal should reappear because Escape did not mark complete.
    await page.reload();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 8000 });
  });

  test("ArrowRight advances slides and ArrowLeft retreats", async ({ page, context }) => {
    await context.clearCookies();
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await clearOnboarding(page);
    await page.goto("/farming");

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible({ timeout: 8000 });

    // Slide 1 shows "Welcome to Tasmil".
    await expect(page.getByRole("heading", { name: /Welcome to Tasmil/i })).toBeVisible();

    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("heading", { name: /Chat With Your Agent/i })).toBeVisible();

    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("heading", { name: /Welcome to Tasmil/i })).toBeVisible();
  });

  test("Replay onboarding from the wallet dropdown reopens the modal", async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    const wallet = freshWallet();
    // loginAsWallet pre-marks onboarding complete, so the modal will not auto-open.
    await loginAsWallet(page, wallet);
    await page.goto("/farming");

    // Open the wallet dropdown. Both variants now share data-testid="wallet-connected".
    await page.getByTestId("wallet-connected").first().click();
    await page.getByTestId("replay-onboarding").click();

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("heading", { name: /Welcome to Tasmil/i })).toBeVisible();
  });
});
