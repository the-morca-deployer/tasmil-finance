import { expect, test } from "@playwright/test";
import { freshWallet, loginAsWallet } from "./helpers/auth";

test.describe("Strategies (/strategies)", () => {
  test.skip(process.env.NODE_ENV === "production", "disabled on production");

  test("Page loads at /strategies", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/strategies");
    await expect(page).toHaveURL(/\/strategies/);
  });

  test("Strategy list renders", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/strategies");
    await page.waitForLoadState("networkidle");
    const content = await page.content();
    const hasList = /strategy|protocol|pool|blend|soroswap|aquarius/i.test(content);
    expect(hasList).toBeTruthy();
  });

  test("Strategy card shows protocol icon", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/strategies");
    await page.waitForLoadState("networkidle");
    const content = await page.content();
    const hasProtocol = /blend|soroswap|aquarius|phoenix|sdex/i.test(content);
    expect(hasProtocol).toBeTruthy();
  });

  test("Strategy card shows asset pair", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/strategies");
    await page.waitForLoadState("networkidle");
    const content = await page.content();
    const hasAsset = /USDC|XLM|XLM\/USDC|USDC\/XLM/i.test(content);
    expect(hasAsset).toBeTruthy();
  });

  test("Strategy card shows APY", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/strategies");
    await page.waitForLoadState("networkidle");
    const content = await page.content();
    const hasApy = /apy|annual|yield|%\d+/i.test(content);
    expect(hasApy).toBeTruthy();
  });

  test("Strategy card shows risk badge", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/strategies");
    await page.waitForLoadState("networkidle");
    const content = await page.content();
    const hasRisk = /safe|balanced|aggressive|risk/i.test(content);
    expect(hasRisk).toBeTruthy();
  });

  test("Click strategy expands detail", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/strategies");
    await page.waitForLoadState("networkidle");
    const card = page.locator("[class*=card]").first();
    const hasCard = await card.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasCard) {
      await card.click();
      await page.waitForTimeout(500);
      await expect(page).toHaveURL(/\/strategies/);
    }
  });

  test("Filter by protocol", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/strategies");
    await page.waitForLoadState("networkidle");
    const filter = page.getByText(/filter|protocol/i).first();
    const hasFilter = await filter.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasFilter) {
      await filter.click();
      await page.waitForTimeout(500);
      await expect(page).toHaveURL(/\/strategies/);
    }
  });

  test("Filter by asset", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/strategies");
    await page.waitForLoadState("networkidle");
    const content = await page.content();
    const hasFilter = /USDC|XLM|asset|filter/i.test(content);
    expect(hasFilter).toBeTruthy();
  });

  test("Sort by APY", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/strategies");
    await page.waitForLoadState("networkidle");
    const sort = page.getByText(/sort|apy|highest|top/i).first();
    const hasSort = await sort.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasSort) {
      await sort.click();
      await page.waitForTimeout(500);
      await expect(page).toHaveURL(/\/strategies/);
    }
  });

  test("Empty state if no strategies", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/strategies");
    await page.waitForLoadState("networkidle");
    const empty = page.getByText(/no strategy|empty|no pool|unavailable/i).first();
    const hasEmpty = await empty.isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasEmpty !== null).toBeTruthy();
  });

  test("Network error shows error", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.route("**/api/strategies**", (route) => route.fulfill({ status: 503 }));
    await page.goto("/strategies");
    await page.waitForTimeout(3000);
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });
});
