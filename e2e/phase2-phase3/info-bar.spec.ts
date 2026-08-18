// tasmil-finance/e2e/phase2-phase3/info-bar.spec.ts
import { expect, test } from "../fixtures/phase-mock.fixture";
import { mockAccount } from "../helpers/mock-account";

test.describe("InfoBar - Phase 2/3 static APY banner", () => {
  test("renders APY text", async ({ page }) => {
    await mockAccount(page, { phase: "beta", isFirstLogin: true });
    await page.goto("/chat/new");
    await expect(page.getByText(/8\.2% APY on Tasmil/i)).toBeVisible();
    await expect(page.getByText(/market average of 6\.5%/i)).toBeVisible();
  });

  test("APY span uses brand green #00C278", async ({ page }) => {
    await mockAccount(page, { phase: "beta", isFirstLogin: true });
    await page.goto("/chat/new");
    const span = page.getByText(/8\.2% APY on Tasmil/i);
    await expect(span).toBeVisible();
    const color = await span.evaluate((el) => getComputedStyle(el).color);
    expect(color.replace(/\s+/g, "")).toMatch(/rgb\(0,194,120\)|rgba\(0,194,120/);
  });
});
