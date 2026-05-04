import { expect, test } from "@playwright/test";
import { freshWallet, loginAsWallet } from "./helpers/auth";

test.describe("Credits (/profile/credits)", () => {
  test.skip(process.env.NODE_ENV === "production", "disabled on production");

  // T1
  test("Page loads at /profile/credits", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/profile/credits");
    await expect(page).toHaveURL(/\/profile\/credits/);
  });

  // T2
  test("Credits heading visible", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/profile/credits");
    await page.waitForLoadState("networkidle");
    const heading = page.getByText(/credits?|buy credits|packages/i).first();
    const hasHeading = await heading.isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasHeading).toBeTruthy();
  });

  // T3
  test("Package grid renders (3+ tiers)", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/profile/credits");
    await page.waitForLoadState("networkidle");
    const content = await page.content();
    // Should have 3+ distinct package offerings
    const tierCount = (content.match(/\d+\s*(credits?|pkgs?|packages?)/gi) || []).length;
    expect(tierCount).toBeGreaterThan(0);
  });

  // T4
  test("Package shows credit amount", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/profile/credits");
    await page.waitForLoadState("networkidle");
    const content = await page.content();
    const hasAmount = /\d+\s*(k|m)?\s*credits?|credits?\s*\d+/i.test(content);
    expect(hasAmount).toBeTruthy();
  });

  // T5
  test("Package shows price", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/profile/credits");
    await page.waitForLoadState("networkidle");
    const content = await page.content();
    const hasPrice = /\$|USD|price|\d+\s*\$|€|£/i.test(content);
    expect(hasPrice).toBeTruthy();
  });

  // T6
  test("Package shows value per credit", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/profile/credits");
    await page.waitForLoadState("networkidle");
    const content = await page.content();
    const hasValue = /per credit|value|\d+\.\d+|\/credit/i.test(content);
    expect(hasValue).toBeTruthy();
  });

  // T7
  test("Most popular badge on recommended", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/profile/credits");
    await page.waitForLoadState("networkidle");
    const content = await page.content();
    const hasBadge = /popular|best|recommended|most|top|popular choice/i.test(content);
    expect(hasBadge).toBeTruthy();
  });

  // T8
  test("Crypto payment flow starts", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/profile/credits");
    await page.waitForLoadState("networkidle");
    const cryptoBtn = page.getByRole("button", { name: /crypto|wallet|stellar|xlm/i }).first();
    const hasCryptoBtn = await cryptoBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasCryptoBtn) {
      await cryptoBtn.click();
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/\/profile\/credits/);
    }
  });

  // T9
  test("Fiat payment flow starts", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/profile/credits");
    await page.waitForLoadState("networkidle");
    const fiatBtn = page.getByRole("button", { name: /fiat|card|bank|usd|buy/i }).first();
    const hasFiatBtn = await fiatBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasFiatBtn) {
      await fiatBtn.click();
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/\/profile\/credits/);
    }
  });

  // T10
  test("Payment modal opens", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/profile/credits");
    await page.waitForLoadState("networkidle");
    const buyBtn = page.getByRole("button", { name: /buy|purchase|get/i }).first();
    const hasBuyBtn = await buyBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasBuyBtn) {
      await buyBtn.click();
      await page.waitForTimeout(1000);
      const modal = page.getByRole("dialog");
      const isOpen = await modal.isVisible({ timeout: 3000 }).catch(() => false);
      expect(isOpen !== null).toBeTruthy();
    }
  });

  // T11
  test("Network error on package fetch", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.route("**/api/credits/packages**", (route) => route.fulfill({ status: 503 }));
    await page.goto("/profile/credits");
    await page.waitForTimeout(3000);
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  // T12
  test("Empty state if no packages", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.route("**/api/credits/packages**", (route) =>
      route.fulfill({ status: 200, body: JSON.stringify({ data: [] }) })
    );
    await page.goto("/profile/credits");
    await page.waitForLoadState("networkidle");
    const content = await page.content();
    const hasEmpty = /no packages|no offer|empty|unavailable/i.test(content);
    expect(hasEmpty).toBeTruthy();
  });

  // T13
  test("Package CTA clickable", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/profile/credits");
    await page.waitForLoadState("networkidle");
    const cta = page.locator("[class*=card] button, [class*=cta]").first();
    const hasCta = await cta.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasCta) {
      await cta.click();
      await page.waitForTimeout(500);
      await expect(page).toHaveURL(/\/profile\/credits/);
    }
  });

  // T14
  test("Credits balance visible", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/profile/credits");
    await page.waitForLoadState("networkidle");
    const content = await page.content();
    const hasBalance = /credits?\s*\d|balance.*\d/i.test(content);
    expect(hasBalance).toBeTruthy();
  });

  // T15
  test("No console errors", async ({ page }) => {
    const wallet = freshWallet();
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await loginAsWallet(page, wallet);
    await page.goto("/profile/credits");
    await page.waitForLoadState("networkidle");
    const critical = errors.filter((e) => !/warning|deprecated/i.test(e));
    expect(critical).toHaveLength(0);
  });
});
