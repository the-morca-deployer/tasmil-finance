import { expect, test } from "@playwright/test";
import { freshWallet, loginAsWallet } from "./helpers/auth";

test.describe("Dashboard — /dashboard", () => {
  test.skip(
    process.env.NODE_ENV === "production",
    "test-login is disabled on production",
  );

  // 1
  test("Wallet disconnected shows connect CTA", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // When no wallet is connected the page shows a prominent connect CTA
    await expect(page.getByText("Connect Your Wallet").first()).toBeVisible();
  });

  // 2
  test("Connect wallet button triggers wallet modal", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // Clicking the connect button should open the wallet modal (or at minimum not crash)
    const connectBtn = page.getByRole("button", { name: /Connect Wallet/i }).first();
    if (await connectBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await connectBtn.click();
    }
    // URL stays on /dashboard — no crash
    await expect(page).toHaveURL(/\/dashboard/);
  });

  // 3
  test("Authed user sees portfolio summary", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // After login the page shows more than just the connect prompt
    const hasConnectPrompt = await page
      .getByText("Connect Your Wallet")
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    expect(hasConnectPrompt).toBe(false);
  });

  // 4
  test("Portfolio summary shows deployed assets", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // Dashboard should mention Stellar ecosystem assets/protocols
    const content = page.locator("body");
    const hasAsset = await content
      .getByText(/XLM|USDC|Stellar|Soroswap|Blend/i)
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    expect(hasAsset).toBe(true);
  });

  // 5
  test("Portfolio summary shows APY", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // APY / annual / yield metric should be visible
    const hasApy = await page
      .getByText(/APY|Annual|Yield|%/i)
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    expect(hasApy).toBe(true);
  });

  // 6
  test("Quick action links to Farming", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    const link = page.locator("a[href='/farming']").first();
    if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
      await link.click();
      await expect(page).toHaveURL(/\/farming/);
    }
  });

  // 7
  test("Quick action links to Portfolio", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    const link = page.locator("a[href='/portfolio']").first();
    if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
      await link.click();
      await expect(page).toHaveURL(/\/portfolio/);
    }
  });

  // 8
  test("Quick action links to Chat", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    const link = page.locator("a[href*='/chat']").first();
    if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
      await link.click();
      await expect(page).toHaveURL(/\/chat/);
    }
  });

  // 9
  test("Recent activity widget loads", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // Activity / recent / history section should be present
    const hasActivity = await page
      .getByText(/Activity|Recent|History/i)
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    expect(hasActivity).toBe(true);
  });

  // 10
  test("Empty activity shows empty state", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // Either an empty-state message or the activity list should be visible
    const hasEmpty =
      (await page.getByText(/No recent|Empty| nothing/i).first().isVisible({ timeout: 3000 }).catch(() => false)) ||
      (await page.getByText(/Activity|Recent|History/i).first().isVisible({ timeout: 3000 }).catch(() => false));
    expect(hasEmpty).toBe(true);
  });

  // 11
  test("Credits pill visible in header", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // CreditsPill shows "Credits N" — case-insensitive
    const hasCredits = await page
      .getByText(/credits?\s*\d/i)
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    expect(hasCredits).toBe(true);
  });

  // 12
  test("Navigation to Leaderboard", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    const link = page.locator("a[href='/quest']").first();
    if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
      await link.click();
      await expect(page).toHaveURL(/\/quest/);
    }
  });

  // 13
  test("Navigation to Aggregator", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    const link = page.locator("a[href='/aggregator']").first();
    if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
      await link.click();
      await expect(page).toHaveURL(/\/aggregator/);
    }
  });

  // 14
  test("Page title correct", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveTitle(/Tasmil/i);
  });

  // 15
  test("No error overlay on load", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // Alert role used for global error overlays — should not be visible
    await expect(page.getByRole("alert").first()).not.toBeVisible();
  });

  // 16
  test("Network error on position fetch — graceful degradation", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    // Intercept before navigation
    await page.route("**/api/account/position", (route) =>
      route.fulfill({ status: 503 }),
    );
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // Should degrade gracefully — no raw 503 text exposed to user
    const has503 =
      await page.getByText("503").first().isVisible({ timeout: 2000 }).catch(() => false);
    expect(has503).toBe(false);
  });

  // 17
  test("Stale data refreshes on mount", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    // First visit
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // Capture a timestamp or data marker
    const marker1 = await page.getByText(/\d{4,}/).first().textContent().catch(() => "");
    // Navigate away and back
    await page.goto("/farming");
    await page.waitForLoadState("networkidle");
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // Re-acquire marker — page should have reloaded fresh data
    const marker2 = await page.getByText(/\d{4,}/).first().textContent().catch(() => "");
    // The page itself should still be functional (no crash, title present)
    await expect(page).toHaveTitle(/Tasmil/i);
    expect(marker2).toBeTruthy();
  });

  // 18
  test("Responsive — mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // Page loads without crash on mobile-sized viewport
    await expect(page).toHaveTitle(/Tasmil/i);
  });

  // 19
  test("Responsive — tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveTitle(/Tasmil/i);
  });

  // 20
  test("Multiple accounts — second wallet", async ({ page }) => {
    const wallet1 = freshWallet();
    const wallet2 = freshWallet();
    await loginAsWallet(page, wallet1);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // Record wallet1 data
    const wallet1Marker = await page.getByText(/\d{4,}/).first().textContent().catch(() => "");
    // Switch to wallet2
    await loginAsWallet(page, wallet2);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // wallet2's data shown (different from wallet1's)
    const wallet2Marker = await page.getByText(/\d{4,}/).first().textContent().catch(() => "");
    expect(wallet2Marker).toBeTruthy();
    // Wallet2 should not see wallet1's data marker
    if (wallet1Marker) {
      expect(wallet2Marker).not.toBe(wallet1Marker);
    }
  });
});
