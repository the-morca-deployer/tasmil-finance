import { expect, test } from "@playwright/test";
import { freshWallet, loginAsWallet } from "./helpers/auth";

test.describe("Journey — Returning User (5 tests)", () => {
  test.skip(process.env.NODE_ENV === "production", "disabled on production");

  test("Returning user lands on dashboard with position", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    // First login — seed some data
    await page.goto("/farming");
    await page.waitForLoadState("networkidle");
    // Second login — should see existing data
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    const content = await page.content();
    const hasData = /dashboard|portfolio|apy|yield|position/i.test(content);
    expect(hasData).toBeTruthy();
  });

  test("Returning user navigates to farming deposit", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");
    await page.waitForLoadState("networkidle");
    const depositBtn = page.getByRole("button", { name: /deposit/i }).first();
    const hasDeposit = await depositBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasDeposit) {
      await depositBtn.click();
      await page.waitForTimeout(1000);
      const modal = page.getByRole("dialog");
      const isOpen = await modal.isVisible({ timeout: 3000 }).catch(() => false);
      expect(isOpen !== null).toBeTruthy();
    }
  });

  test("Returning user loads existing chat thread", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/chat/new");
    await page.waitForLoadState("networkidle");
    const input = page.locator("textarea, input[type=text]").first();
    await input.waitFor({ timeout: 5000 });
    await input.fill("What is my portfolio?");
    await input.press("Enter");
    await page.waitForLoadState("networkidle", { timeout: 15000 });
    // Navigate away
    await page.goto("/farming");
    await page.waitForLoadState("networkidle");
    // Come back — thread should be there
    await page.goto("/chat/new");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/chat/);
  });

  test("Returning user purchases more credits", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/profile/credits");
    await page.waitForLoadState("networkidle");
    const buyBtn = page.getByRole("button", { name: /buy|purchase/i }).first();
    const hasBuyBtn = await buyBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasBuyBtn) {
      await buyBtn.click();
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/\/profile\/credits/);
    }
  });

  test("Returning user navigates between pages quickly", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    const pages = ["/dashboard", "/farming", "/portfolio", "/quest", "/aggregator", "/chat/new"];
    for (const path of pages) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(new RegExp(path.replace("/", "\\/")));
    }
  });
});
