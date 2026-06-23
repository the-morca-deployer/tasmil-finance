import { expect, test } from "@playwright/test";

// Quest claim happy-path. The quest backend (`:5555`) is stubbed via `page.route`
// so the flow is deterministic without a live backend. Quest auth is seeded into
// localStorage (`quest-auth-storage`, the quest-auth store's persist key) so the
// campaign-detail screen renders the joined task list instead of the connect-wallet
// gate.
const TASK_ID = "t1";
const CAMPAIGN_ID = "c1";

const json = (data: unknown) => ({ json: { success: true, data, error: null } });

// DEFERRED: reaching the joined campaign-detail task view end-to-end requires quest
// auth + wallet E2E fixtures (the wallet-context performs a real sign/verify roundtrip
// against the live quest backend on :5555; seeding `quest-auth-storage` alone is not
// enough, and the legacy quest Navbar/route shell is still wired). The claim
// state-machine transition is already covered deterministically by the Jest component
// test `src/features/quest/components/CampaignDetail.test.tsx`. This spec is kept as the
// executable happy-path blueprint; un-skip once quest E2E auth fixtures exist.
test.fixme(true, "Needs quest E2E auth/wallet fixtures + running quest backend");

// Restrict to chromium to avoid fanning out across all browser projects.
test.skip(
  ({ browserName }) => browserName !== "chromium",
  "Quest claim happy-path runs on chromium only"
);

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "quest-auth-storage",
      JSON.stringify({
        state: {
          accessToken: "test-token",
          refreshToken: "test-refresh",
          isAuthenticated: true,
          user: {
            id: "u1",
            username: "tester",
            walletAddress: "GTESTWALLETADDRESS000000000000000000000000000000000000",
            tier: "Bronze",
            totalPoints: 0,
            loginStreak: 0,
            role: "user",
          },
        },
        version: 0,
      })
    );
    localStorage.setItem(
      "quest-wallet-storage",
      JSON.stringify({ state: { connected: true, account: "GTEST" }, version: 0 })
    );
  });
});

test("claim a task happy path", async ({ page }) => {
  // Mutable claim state so the claim flips the task to claimed.
  let claimed = false;

  await page.route(`**/api/campaigns/${CAMPAIGN_ID}`, (r) =>
    r.fulfill(
      json({
        campaign: {
          id: CAMPAIGN_ID,
          title: "Claim Quest",
          description: "Do an onchain action.",
          status: "ongoing",
          rewardPoints: 100,
          questersCount: 3,
          tasks: [
            {
              id: TASK_ID,
              title: "Onchain Swap",
              description: "Swap to earn points.",
              type: "onchain",
              pointReward: 50,
            },
          ],
        },
        participation: { id: "p1" },
        meta: { avatars: [] },
      })
    )
  );

  await page.route(`**/api/tasks/${TASK_ID}/status`, (r) =>
    r.fulfill(json({ status: "COMPLETED", pointsEarned: 50 }))
  );
  await page.route(`**/api/tasks/${TASK_ID}/claim-status`, (r) => r.fulfill(json({ claimed })));
  await page.route(`**/api/tasks/${TASK_ID}/claim`, (r) => {
    claimed = true;
    return r.fulfill(json({ claimed: true, pointsEarned: 50 }));
  });
  // Catch-all for any other quest backend call so nothing hangs.
  await page.route("**/api/**", (r) => r.fulfill(json(null)));

  await page.goto(`/quest/campaign/${CAMPAIGN_ID}`);

  // Expand the task to reveal its action button.
  const taskRow = page.getByText("Onchain Swap");
  await expect(taskRow).toBeVisible({ timeout: 20000 });
  await taskRow.click();

  const claim = page.getByRole("button", { name: /Claim 50 PTS/i });
  await expect(claim).toBeVisible({ timeout: 20000 });
  await claim.click();

  await expect(page.getByRole("button", { name: /Claimed/i })).toBeVisible({ timeout: 20000 });
});
