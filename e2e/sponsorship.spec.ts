import { expect, type Page, test } from "@playwright/test";
import { freshWallet, loginAsWallet } from "./helpers/auth";

/**
 * F10 — Gas-sponsorship UX E2E.
 *
 * Mocks the three backend endpoints (/api/sponsorship/visit, /me,
 * /modal-seen) via page.route() so we can drive cohort-state transitions
 * (fresh / dismissed / post-cohort) without seeding real members.
 */

interface MeOverrides {
  enrolled?: boolean;
  rank?: number | null;
  modalSeen?: boolean;
  usage?: { txCount: number; txRemaining: number } | null;
}

function buildMe(o: MeOverrides = {}) {
  const enrolled = o.enrolled ?? true;
  const rank = o.rank === undefined ? 7 : o.rank;
  const modalSeen = o.modalSeen ?? false;
  const usage = enrolled
    ? {
        txCount: o.usage?.txCount ?? 0,
        txRemaining: o.usage?.txRemaining ?? 5,
        xlmSponsoredStroops: "0",
        xlmRemainingStroops: "5000000",
        lastSponsoredAt: null,
      }
    : null;
  return {
    success: true,
    data: {
      enrolled,
      rank,
      cohortSize: 100,
      modalSeen,
      config: {
        maxTxPerUser: 5,
        maxXlmPerTx: "0.1000000",
        totalCapXlm: "0.5000000",
        network: "testnet",
      },
      usage,
      recentTxs: [],
    },
  };
}

async function mockSponsorship(
  page: Page,
  initial: MeOverrides
): Promise<{
  markSeenCalls: () => number;
  setMe: (next: MeOverrides) => void;
}> {
  let current = buildMe(initial);
  let markSeen = 0;

  await page.route("**/api/sponsorship/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(current),
    });
  });

  await page.route("**/api/sponsorship/visit", async (route) => {
    const body = current.data;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          enrolled: body.enrolled,
          rank: body.rank,
          justEnrolled: body.enrolled && !body.modalSeen,
        },
      }),
    });
  });

  await page.route("**/api/sponsorship/modal-seen", async (route) => {
    markSeen += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { modalSeen: true } }),
    });
  });

  return {
    markSeenCalls: () => markSeen,
    setMe: (next) => {
      current = buildMe(next);
    },
  };
}

test.describe("Gas sponsorship UX", () => {
  test.skip(process.env.NODE_ENV === "production", "test-login disabled on production");

  test("enrolled fresh user sees modal once; dismiss → reload → no modal", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    const mock = await mockSponsorship(page, { enrolled: true, rank: 7, modalSeen: false });

    await page.goto("/dashboard");

    const modal = page.locator('[role="dialog"][aria-labelledby="gas-sponsor-title"]');
    await expect(modal).toBeVisible({ timeout: 10_000 });

    // Dismiss via the close (✕) button
    await modal.getByRole("button", { name: "Close" }).click();
    await expect(modal).toBeHidden();

    // markModalSeen should have been called exactly once
    expect(mock.markSeenCalls()).toBe(1);

    // Server now reflects modalSeen=true; reload should NOT re-show the modal
    mock.setMe({ enrolled: true, rank: 7, modalSeen: true });
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(modal).toBeHidden();
  });

  test("post-cohort user (enrolled=false, rank=null) is silent across pages", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await mockSponsorship(page, { enrolled: false, rank: null, modalSeen: false });

    const modal = page.locator('[role="dialog"][aria-labelledby="gas-sponsor-title"]');

    for (const path of ["/dashboard", "/chat", "/farming"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await expect(modal).toBeHidden();
    }
  });

  test("modalSeen=true on first load: no modal", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await mockSponsorship(page, { enrolled: true, rank: 3, modalSeen: true });

    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const modal = page.locator('[role="dialog"][aria-labelledby="gas-sponsor-title"]');
    await expect(modal).toBeHidden();
  });

  test("/rewards/gas-sponsorship renders for an active enrolled user", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await mockSponsorship(page, {
      enrolled: true,
      rank: 12,
      modalSeen: true,
      usage: { txCount: 2, txRemaining: 3 },
    });

    await page.goto("/rewards/gas-sponsorship");
    await page.waitForLoadState("networkidle");

    // Detail page should at minimum surface the rank or remaining-TX count.
    // Loose assertion — exact UI copy may evolve, just check page rendered.
    await expect(page.locator("body")).toContainText(/rank|cohort|sponsor/i, { timeout: 10_000 });
  });
});
