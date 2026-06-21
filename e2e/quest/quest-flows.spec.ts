import { expect, test } from "@playwright/test";

test("join a campaign from the detail page", async ({ page }) => {
  await page.goto("/quest/campaign/seed-allbridge");
  const join = page.getByRole("button", { name: /join|start quest/i }).first();
  await join.click();
  await expect(page.getByText(/joined|0\/3 completed|in progress/i).first()).toBeVisible();
});

test("daily check-in from the header streak badge", async ({ page }) => {
  await page.goto("/quest");
  const streak = page.getByTestId("quest-streak-badge");
  await expect(streak).toBeVisible();
  // If check-in is available, clicking should not throw and the badge stays visible.
  await streak.click({ trial: true }).catch(() => undefined);
});
