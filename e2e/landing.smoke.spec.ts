import { expect, test } from "@playwright/test";

test("landing page renders and exposes a launch entry point", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Tasmil Finance/);
  // The landing nav/hero exposes a CTA — "Join Waitlist" is the primary entry point.
  await expect(
    page.getByRole("link", { name: /join waitlist|launch|app|get started/i }).first()
  ).toBeVisible();
});
