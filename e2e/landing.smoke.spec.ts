import { expect, test } from "@playwright/test";

// The "/" route renders the redesigned landing for anonymous visitors, but preserves the
// existing guard that redirects already-authenticated (non-gated) users straight to /chat.
// In environments with a dev/auto-auth session this redirect fires; in an anonymous context
// the landing renders with its waitlist CTA. The smoke accepts either correct outcome.
test("landing route renders for anon or redirects authed users to the app", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Tasmil Finance/);

  const redirectedToApp = page.waitForURL(/\/chat/, { timeout: 20000 }).then(() => "app");
  const landingShown = page
    .locator('a[href="/waitlist"]')
    .first()
    .waitFor({ state: "visible", timeout: 20000 })
    .then(() => "landing");

  const outcome = await Promise.race([redirectedToApp, landingShown]);
  expect(["app", "landing"]).toContain(outcome);
});

test("access page renders the connect step", async ({ page }) => {
  await page.goto("/access");
  await expect(page.getByRole("button", { name: /connect/i }).first()).toBeVisible();
});

test("waitlist route renders", async ({ page }) => {
  await page.goto("/waitlist");
  await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 });
});
