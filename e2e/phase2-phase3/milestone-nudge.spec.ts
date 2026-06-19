import { expect, test } from "../fixtures/phase-mock.fixture";
import { mockAccount } from "../helpers/mock-account";
import { milestoneNudgeEvent, mockAgUiStream } from "../helpers/mock-sse";

async function bootMainnetWithNudge(
  page: import("@playwright/test").Page,
  event: ReturnType<typeof milestoneNudgeEvent>
) {
  await mockAccount(page, { phase: "mainnet", hasPositions: true, isFirstLogin: false });
  await mockAgUiStream(page, [event]);
  await page.goto("/chat/new");
  const input = page.getByPlaceholder(/message/i).first();
  await input.fill("status");
  await input.press("Enter");
}

test.describe("MilestoneNudge — Phase 3 inline cards", () => {
  test("five-dollar variant", async ({ page }) => {
    await bootMainnetWithNudge(page, milestoneNudgeEvent("five-dollar", { topPercent: 15 }));
    await expect(page.getByText(/\$5/)).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/top 15%/i)).toBeVisible();
  });

  test("day-30 variant + Compound now click", async ({ page }) => {
    await bootMainnetWithNudge(page, milestoneNudgeEvent("day-30"));
    await expect(page.getByText(/fully unlocked/i)).toBeVisible({ timeout: 8000 });
    await page.getByRole("button", { name: /compound now/i }).click();
    await expect(page.getByText(/reinvest|compound/i)).toBeVisible();
  });

  test("pool-full variant", async ({ page }) => {
    await bootMainnetWithNudge(page, milestoneNudgeEvent("pool-full", { spotsLeft: 3 }));
    await expect(page.getByText(/3 spots left/i)).toBeVisible({ timeout: 8000 });
  });

  test("nudge renders inline (testid present)", async ({ page }) => {
    await bootMainnetWithNudge(page, milestoneNudgeEvent("five-dollar", { topPercent: 10 }));
    const nudge = page.getByTestId("milestone-nudge");
    await expect(nudge).toBeVisible({ timeout: 8000 });
    await expect(nudge).toContainText(/\$5/);
  });
});
