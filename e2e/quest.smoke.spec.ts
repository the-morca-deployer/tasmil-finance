import { expect, test } from "@playwright/test";

// Quest is now native under /quest/* (no iframe). These routes render the quest shell
// (nav/footer + view). Data fetches hit the separate quest backend; in environments
// without it the shell still renders. The smoke only asserts the shell mounts.
test("quest home renders the native quest shell", async ({ page }) => {
  await page.goto("/quest");
  await expect(page.locator("nav, header").first()).toBeVisible({ timeout: 20000 });
});

test("quest campaigns route renders", async ({ page }) => {
  await page.goto("/quest/campaigns");
  await expect(page.locator("main").first()).toBeVisible({ timeout: 20000 });
});

test("quest leaderboard route renders", async ({ page }) => {
  await page.goto("/quest/leaderboard");
  await expect(page.locator("main").first()).toBeVisible({ timeout: 20000 });
});
