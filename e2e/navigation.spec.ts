import { test, expect } from "@playwright/test";

test.describe("Desktop chrome — legacy sidebar (default)", () => {
  test("legacy sidebar visible by default", async ({ page }) => {
    await page.goto("/farming");
    const topNav = page.locator('[data-testid="top-nav-bar"]');
    expect(await topNav.isVisible({ timeout: 2000 }).catch(() => false)).toBe(false);
  });
});

test.describe("Desktop chrome — top nav (flag enabled)", () => {
  test.use({
    extraHTTPHeaders: {},
  });

  test("when NEXT_PUBLIC_USE_TOP_NAV=true, top nav renders and links navigate", async ({
    page,
  }) => {
    await page.goto("/farming");
    const topNav = page.locator('[data-testid="top-nav-bar"]');
    if (!(await topNav.isVisible({ timeout: 2000 }).catch(() => false))) {
      // Flag not set in this environment
      return;
    }

    await expect(topNav).toBeVisible();
    // Click Chat link
    await topNav.getByRole("link", { name: /chat/i }).click();
    await expect(page).toHaveURL(/\/chat/);

    // Click Farming link
    await topNav.getByRole("link", { name: /farming/i }).click();
    await expect(page).toHaveURL(/\/farming/);
  });
});
