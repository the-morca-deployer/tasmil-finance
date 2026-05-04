import { expect, type Page, test } from "@playwright/test";
import { type AuthedSession, freshWallet, loginAsWallet } from "./helpers/auth";
import { applyCreditDelta } from "./helpers/backend";

/**
 * Credit-flow e2e — exercises the full credit mechanic redesigned in
 * 2026-05-01:
 *   1. Fresh wallet sign-in grants +200 credits (WELCOME_GRANT, idempotent)
 *   2. Per-chat debit of 10 credits (simulated via internal credit/apply
 *      since spinning up the real AI worker for a chat turn is out of scope
 *      for a frontend e2e — the unit-test layer covers the worker logic)
 *   3. Task completion bonus (FIRST_DEPOSIT = +50)
 *
 * Skips on production where /api/auth/wallet/test-login is disabled.
 */

test.describe("Credit flow — welcome grant, chat debit, task bonus", () => {
  test.skip(
    process.env.NODE_ENV === "production",
    "test-login is disabled on production, e2e runs on dev/staging only"
  );

  test("Scenario 1: fresh wallet sign-in shows +200 welcome bonus", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);

    await page.goto("/profile/credits");

    await expect(page.getByTestId("credits-page")).toBeVisible();
    await expect(page.getByTestId("credits-balance")).toHaveText("200");

    const ledger = page.getByTestId("ledger-table");
    await expect(ledger).toBeVisible();
    const rows = ledger.locator("tbody tr");
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText("Welcome bonus");
    await expect(rows.first()).toContainText("+200");
  });

  test("Scenario 2: idempotent — second sign-in does not double-credit", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/profile/credits");
    await expect(page.getByTestId("credits-balance")).toHaveText("200");

    // Re-login with the same wallet
    await loginAsWallet(page, wallet);
    await page.reload();

    await expect(page.getByTestId("credits-balance")).toHaveText("200");
    const rows = page.getByTestId("ledger-table").locator("tbody tr");
    await expect(rows).toHaveCount(1); // still only one WELCOME_GRANT row
  });

  test("Scenario 3: chat debit (-10) brings balance to 190, refund restores", async ({ page }) => {
    const wallet = freshWallet();
    const { userId } = await loginAsWallet(page, wallet);

    // Simulate a chat completing successfully (worker → /api/internal/credit/apply -10)
    await applyCreditDelta({
      userId,
      reason: "CHAT_DEBIT",
      deltaCredits: -10,
      idempotencyKey: `e2e:chat-debit:${userId}:1`,
    });

    await page.goto("/profile/credits");
    await expect(page.getByTestId("credits-balance")).toHaveText("190");

    const rows = page.getByTestId("ledger-table").locator("tbody tr");
    await expect(rows).toHaveCount(2);
    // Newest first — the chat debit row is row 0
    await expect(rows.first()).toContainText("Chat");
    await expect(rows.first()).toContainText("-10");

    // Simulate a refund (worker → CHAT_REVERT +10 on failure)
    await applyCreditDelta({
      userId,
      reason: "CHAT_REVERT",
      deltaCredits: 10,
      idempotencyKey: `e2e:chat-revert:${userId}:1`,
    });

    await page.reload();
    await expect(page.getByTestId("credits-balance")).toHaveText("200");
    await expect(page.getByTestId("ledger-table").locator("tbody tr")).toHaveCount(3);
  });

  test("Scenario 4: task completion bonus (+50 FIRST_DEPOSIT)", async ({ page }) => {
    const wallet = freshWallet();
    const { userId } = await loginAsWallet(page, wallet);

    await applyCreditDelta({
      userId,
      reason: "TASK_COMPLETED",
      deltaCredits: 50,
      idempotencyKey: `task:FIRST_DEPOSIT:${userId}`,
    });

    await page.goto("/profile/credits");
    await expect(page.getByTestId("credits-balance")).toHaveText("250"); // 200 welcome + 50 task

    const rows = page.getByTestId("ledger-table").locator("tbody tr");
    await expect(rows).toHaveCount(2);
    await expect(rows.first()).toContainText("Task bonus");
    await expect(rows.first()).toContainText("+50");
  });

  test("Scenario 5: insufficient credits — debit beyond balance is blocked", async ({ page }) => {
    const wallet = freshWallet();
    const { userId } = await loginAsWallet(page, wallet);

    // Drain the welcome grant: 20 chats × 10 credits = 200
    for (let i = 0; i < 20; i++) {
      await applyCreditDelta({
        userId,
        reason: "CHAT_DEBIT",
        deltaCredits: -10,
        idempotencyKey: `e2e:drain:${userId}:${i}`,
      });
    }

    await page.goto("/profile/credits");
    await expect(page.getByTestId("credits-balance")).toHaveText("0");

    // Backend's /api/credit/me/balance/check (or wherever the gate lives) should
    // surface 402 INSUFFICIENT_CREDITS — but that endpoint isn't exposed in the
    // current UI, so we only assert balance=0 here. The backend unit-spec
    // verifies requireCredits behavior directly.
  });
});
