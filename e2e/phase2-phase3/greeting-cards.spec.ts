import { expect, test } from "../fixtures/phase-mock.fixture";
import { mockAccount } from "../helpers/mock-account";

test.describe("Greeting - phase-aware welcome cards", () => {
  test("Phase 2 first login: welcome + Claim reward link", async ({ page }) => {
    await mockAccount(page, { phase: "beta", isFirstLogin: true });
    await page.goto("/chat/new");
    await expect(page.getByText(/earliest users/i)).toBeVisible();
    const link = page.getByRole("link", { name: /claim reward/i });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/claim");
  });

  test("Phase 3 first login: real-funds card", async ({ page }) => {
    await mockAccount(page, { phase: "mainnet", isFirstLogin: true });
    await page.goto("/chat/new");
    await expect(page.getByText(/real funds, real yield/i)).toBeVisible();
  });

  test("Phase 3 returning >=7d with earnings: reinvest card", async ({ page }) => {
    await mockAccount(page, {
      phase: "mainnet",
      isFirstLogin: false,
      daysSinceLastStake: 10,
      lastPoolEarnings: 22.5,
    });
    await page.goto("/chat/new");
    await expect(page.getByText(/\$22\.5/)).toBeVisible();
    await expect(page.getByRole("button", { name: /reinvest now/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /remind me in 7 days/i })).toBeVisible();
  });

  test("Phase 2 returning <7d: no phase card", async ({ page }) => {
    await mockAccount(page, {
      phase: "beta",
      isFirstLogin: false,
      daysSinceLastStake: 2,
      lastPoolEarnings: null,
    });
    await page.goto("/chat/new");
    await expect(page.getByText(/DeFi Assistant/i)).toBeVisible();
    await expect(page.getByText(/earliest users/i)).not.toBeVisible();
  });

  test("Phase 3 <7d: no reinvest card", async ({ page }) => {
    await mockAccount(page, {
      phase: "mainnet",
      isFirstLogin: false,
      daysSinceLastStake: 3,
      lastPoolEarnings: 5,
    });
    await page.goto("/chat/new");
    await expect(page.getByRole("button", { name: /reinvest now/i })).not.toBeVisible();
  });

  test("Phase 3 >=7d but earnings null: no reinvest card", async ({ page }) => {
    await mockAccount(page, {
      phase: "mainnet",
      isFirstLogin: false,
      daysSinceLastStake: 10,
      lastPoolEarnings: null,
    });
    await page.goto("/chat/new");
    await expect(page.getByRole("button", { name: /reinvest now/i })).not.toBeVisible();
  });
});
