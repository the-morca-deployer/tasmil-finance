import { expect, test } from "../fixtures/phase-mock.fixture";
import { mockAccount } from "../helpers/mock-account";
import { mockAgUiStream } from "../helpers/mock-sse";

test.describe("Phase-aware flow — integration over mocked SSE", () => {
  test("mainnet + hasPositions shows Phase 3 SuggestedPrompts", async ({ page }) => {
    await mockAccount(page, { phase: "mainnet", hasPositions: true, isFirstLogin: false });
    await mockAgUiStream(page, []);
    await page.goto("/chat/new");
    await expect(page.getByText("What did my portfolio earn this week?")).toBeVisible();
    await expect(page.getByText("Show my referral earnings")).toBeVisible();
    await expect(page.getByText("Start with $5")).not.toBeVisible();
  });

  test("Reinvest button injects a chat message", async ({ page }) => {
    await mockAccount(page, {
      phase: "mainnet",
      isFirstLogin: false,
      daysSinceLastStake: 10,
      lastPoolEarnings: 22.5,
    });
    await mockAgUiStream(page, []);
    await page.goto("/chat/new");
    await page.getByRole("button", { name: /reinvest now/i }).click();
    await expect(page.getByText(/reinvest/i)).toBeVisible({ timeout: 5000 });
  });

  test("Beta first-login Claim CTA targets /claim", async ({ page }) => {
    await mockAccount(page, { phase: "beta", isFirstLogin: true });
    await mockAgUiStream(page, []);
    await page.goto("/chat/new");
    const link = page.getByRole("link", { name: /claim reward/i });
    await expect(link).toHaveAttribute("href", "/claim");
    await expect(link).toHaveAttribute("target", "_blank");
  });

  test("Phase switch beta -> mainnet refreshes Greeting card", async ({ page }) => {
    await mockAccount(page, { phase: "beta", isFirstLogin: true });
    await mockAgUiStream(page, []);
    await page.goto("/chat/new");
    await expect(page.getByText(/earliest users/i)).toBeVisible();
    await mockAccount(page, { phase: "mainnet", isFirstLogin: true });
    await page.reload();
    await expect(page.getByText(/real funds, real yield/i)).toBeVisible();
  });
});
