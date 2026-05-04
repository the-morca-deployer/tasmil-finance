import { expect, test } from "@playwright/test";

test.describe("Desktop chrome — top nav (now default)", () => {
  test("top nav visible by default", async ({ page }) => {
    await page.goto("/farming");
    await expect(page.locator('[data-testid="top-nav-bar"]')).toBeVisible({
      timeout: 5000,
    });
  });

  test("nav links navigate between routes", async ({ page }) => {
    await page.goto("/farming");
    const topNav = page.locator('[data-testid="top-nav-bar"]');

    await topNav.getByRole("link", { name: /chat/i }).click();
    await expect(page).toHaveURL(/\/chat/);

    await topNav.getByRole("link", { name: /farming/i }).click();
    await expect(page).toHaveURL(/\/farming/);
  });
});
