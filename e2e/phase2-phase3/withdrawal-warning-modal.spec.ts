import { expect, test } from "../fixtures/phase-mock.fixture";
import { mockAccount } from "../helpers/mock-account";

const VESTING = {
  currentWeek: 2,
  totalWeeks: 4,
  lockedPercent: 50,
  lockedAmount: 12.5,
  unlockDate: "May 4, 2025",
};

async function openModal(
  page: import("@playwright/test").Page,
  phase: "beta" | "mainnet",
  reinvest: { amount: number; byDate: string } | null,
) {
  await mockAccount(page, { phase, hasPositions: true, isFirstLogin: false });
  await page.addInitScript(
    (payload) => {
      (window as unknown as { __TASMIL_OPEN_WITHDRAWAL_MODAL__: unknown }).__TASMIL_OPEN_WITHDRAWAL_MODAL__ =
        payload;
    },
    { vesting: VESTING, reinvestProjection: reinvest },
  );
  await page.goto("/chat/new");
}

test.describe("WithdrawalWarningModal", () => {
  test("shows locked amount, percent, unlock date", async ({ page }) => {
    await openModal(page, "beta", null);
    await expect(page.getByText(/50% of your reward/i)).toBeVisible();
    await expect(page.getByText(/\$12\.5/)).toBeVisible();
    await expect(page.getByText(/May 4, 2025/)).toBeVisible();
  });

  test("Phase 3 with reinvestProjection shows compound line", async ({ page }) => {
    await openModal(page, "mainnet", { amount: 8.3, byDate: "Jun 4, 2025" });
    await expect(page.getByText(/\+\$8\.3 more by Jun 4, 2025/)).toBeVisible();
  });

  test("Phase 2 with reinvestProjection hides compound line", async ({ page }) => {
    await openModal(page, "beta", { amount: 8.3, byDate: "Jun 4, 2025" });
    await expect(page.getByText(/\+\$8\.3/)).not.toBeVisible();
  });

  test("Keep earning closes the modal", async ({ page }) => {
    await openModal(page, "beta", null);
    await page.getByRole("button", { name: /keep earning/i }).click();
    await expect(page.getByText(/50% of your reward/i)).not.toBeVisible();
  });

  test("Withdraw anyway dismisses modal and emits intent", async ({ page }) => {
    await openModal(page, "beta", null);
    await page.getByRole("button", { name: /withdraw anyway/i }).click();
    await expect(page.getByText(/50% of your reward/i)).not.toBeVisible();
    await expect(page.getByText(/withdraw/i)).toBeVisible({ timeout: 5000 });
  });
});
