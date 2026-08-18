/*
 * PRE-REQ RUNBOOK
 * ---------------
 * These specs require a running, seeded quest backend + the finance dev server
 * with dev-bypass auth wired up.  Run them like this:
 *
 * # Terminal 1 - seeded quest backend (see Plan 1 for TEST_DB_URL setup)
 * cd tasmil-quest-folder/backend && QUEST_DEV_LOGIN=true DATABASE_URL=$TEST_DB_URL pnpm dev
 *
 * # Terminal 2 - Playwright (starts finance dev itself via webServer)
 * cd tasmil-finance && NEXT_PUBLIC_DEV_BYPASS_AUTH=true pnpm test:e2e --project=quest
 *
 * The specs are written test-first.  They will be RED until:
 *   - Plan 1: seeded quest backend on :5555 is running with QUEST_DEV_LOGIN=true
 *   - Plan 2: quest UI screens are ported to tasmil-finance
 *   - Plan 3 Task 1: dev-bypass bridge (NEXT_PUBLIC_DEV_BYPASS_AUTH=true) is in place
 *   - Plan 3 Tasks 2-4: quest header badges + wallet dropdown rank slot are wired up
 */

import { expect, test } from "@playwright/test";

test.describe("quest screens render seeded data", () => {
  test("Explore shows featured campaigns", async ({ page }) => {
    await page.goto("/quest");
    await expect(page.getByText("Index Builder")).toBeVisible();
  });

  test("Campaigns lists seeded campaigns with filter", async ({ page }) => {
    await page.goto("/quest/campaigns");
    await expect(page.getByRole("tab", { name: /all/i })).toBeVisible();
    await expect(page.getByText("Vault Guardian")).toBeVisible();
  });

  test("Leaderboard shows the podium and points/streak toggle", async ({ page }) => {
    await page.goto("/quest/leaderboard");
    await expect(page.getByText("stellar_nomad")).toBeVisible();
    await expect(page.getByRole("tab", { name: /streak/i })).toBeVisible();
  });

  test("Profile shows the four tabs and seeded points", async ({ page }) => {
    await page.goto("/quest/profile");
    await expect(page.getByRole("tab", { name: /my quests/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /referrals/i })).toBeVisible();
  });

  test("chat header shows the quest points + streak badges", async ({ page }) => {
    await page.goto("/chat/new");
    await expect(page.getByTestId("quest-points-badge")).toBeVisible();
    await expect(page.getByTestId("quest-streak-badge")).toBeVisible();
  });
});
