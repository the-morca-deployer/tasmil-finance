import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers/admin-auth";

/**
 * Admin cohort sponsor UI — covers the three v2 cards on /admin/sponsor:
 *   - CohortConfigCard (GET + PATCH /api/admin/sponsorship/config)
 *   - CohortMembersTable (GET /api/admin/sponsorship/members)
 *   - CohortFallbackLogTable (GET /api/admin/sponsorship/fallback-log)
 *
 * Auth is synthesized (unsigned JWT with future exp) so AdminAuthGuard
 * passes. All /api/admin/sponsorship/** calls are mocked via page.route()
 * — no real backend hit.
 */

const SAMPLE_CONFIG = {
  id: 1,
  enabled: true,
  cohortSize: 100,
  maxTxPerUser: 5,
  maxXlmPerTx: "0.1000000",
  network: "testnet" as const,
  version: 3,
  updatedAt: "2026-06-20T10:00:00.000Z",
  updatedByUserId: "admin-1",
};

const SAMPLE_MEMBERS = {
  members: [
    {
      userId: "user-aaaaaaaaaaaaaaaa",
      rank: 1,
      assignedAt: "2026-06-15T09:00:00.000Z",
      modalSeenAt: "2026-06-15T09:01:00.000Z",
      txCount: 3,
      xlmSponsoredStroops: "1500000",
      lastSponsoredAt: "2026-06-19T12:00:00.000Z",
    },
    {
      userId: "user-bbbbbbbbbbbbbbbb",
      rank: 2,
      assignedAt: "2026-06-16T11:00:00.000Z",
      modalSeenAt: null,
      txCount: 0,
      xlmSponsoredStroops: "0",
      lastSponsoredAt: null,
    },
  ],
  nextCursor: null,
};

const SAMPLE_FALLBACK = {
  rows: [
    {
      id: "fb-1",
      userId: "user-aaaaaaaaaaaaaaaa",
      txHash: "abcdef1234567890abcdef",
      reason: "sponsor_balance_low" as const,
      meta: null,
      createdAt: "2026-06-19T15:30:00.000Z",
    },
    {
      id: "fb-2",
      userId: null,
      txHash: null,
      reason: "tx_quota_exhausted" as const,
      meta: null,
      createdAt: "2026-06-19T16:00:00.000Z",
    },
  ],
  nextCursor: null,
};

test.describe("Admin — cohort sponsor v2", () => {
  test.skip(process.env.NODE_ENV === "production", "admin login disabled on production");

  test("renders all 3 cards with mocked data", async ({ page }) => {
    await loginAsAdmin(page);
    await page.route("**/api/admin/sponsorship/config", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: SAMPLE_CONFIG }),
      });
    });
    await page.route("**/api/admin/sponsorship/members**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: SAMPLE_MEMBERS }),
      });
    });
    await page.route("**/api/admin/sponsorship/fallback-log**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: SAMPLE_FALLBACK }),
      });
    });

    await page.goto("/admin/sponsor");

    const cfgCard = page.getByTestId("cohort-config-card");
    await expect(cfgCard).toBeVisible({ timeout: 10_000 });
    await expect(cfgCard.getByTestId("cohort-cohort-size")).toHaveValue("100");
    await expect(cfgCard.getByTestId("cohort-max-tx-per-user")).toHaveValue("5");
    await expect(cfgCard.getByTestId("cohort-max-xlm-per-tx")).toHaveValue("0.1000000");
    await expect(cfgCard.getByTestId("cohort-enabled")).toBeChecked();

    const membersCard = page.getByTestId("cohort-members-card");
    await expect(membersCard).toBeVisible();
    await expect(membersCard).toContainText("Cohort members (2)");
    await expect(membersCard).toContainText("#1");
    await expect(membersCard).toContainText("#2");
    await expect(membersCard).toContainText("0.1500000"); // 1_500_000 stroops → 0.15 XLM

    const fbCard = page.getByTestId("cohort-fallback-card");
    await expect(fbCard).toBeVisible();
    await expect(fbCard).toContainText("Cohort fallback log (2)");
    await expect(fbCard).toContainText("sponsor_balance_low");
    await expect(fbCard).toContainText("tx_quota_exhausted");
  });

  test("editing cohortSize + save fires PATCH with full body", async ({ page }) => {
    await loginAsAdmin(page);
    await page.route("**/api/admin/sponsorship/members**", (r) =>
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: SAMPLE_MEMBERS }),
      })
    );
    await page.route("**/api/admin/sponsorship/fallback-log**", (r) =>
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: SAMPLE_FALLBACK }),
      })
    );

    let patchBody: Record<string, unknown> | null = null;
    await page.route("**/api/admin/sponsorship/config", async (route) => {
      const req = route.request();
      if (req.method() === "PATCH") {
        patchBody = req.postDataJSON() as Record<string, unknown>;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: { ...SAMPLE_CONFIG, cohortSize: 200, version: 4 },
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: SAMPLE_CONFIG }),
      });
    });

    await page.goto("/admin/sponsor");
    const cfg = page.getByTestId("cohort-config-card");
    await expect(cfg.getByTestId("cohort-cohort-size")).toHaveValue("100");

    await cfg.getByTestId("cohort-cohort-size").fill("200");
    await cfg.getByTestId("cohort-save").click();

    await expect.poll(() => patchBody, { timeout: 5_000 }).not.toBeNull();
    expect(patchBody).toMatchObject({
      cohortSize: 200,
      maxTxPerUser: 5,
      maxXlmPerTx: "0.1000000",
      enabled: true,
    });
  });

  test("empty states render correctly", async ({ page }) => {
    await loginAsAdmin(page);
    await page.route("**/api/admin/sponsorship/config", (r) =>
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: SAMPLE_CONFIG }),
      })
    );
    await page.route("**/api/admin/sponsorship/members**", (r) =>
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { members: [], nextCursor: null } }),
      })
    );
    await page.route("**/api/admin/sponsorship/fallback-log**", (r) =>
      r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { rows: [], nextCursor: null } }),
      })
    );

    await page.goto("/admin/sponsor");

    await expect(page.getByTestId("cohort-members-card")).toContainText("No members yet");
    await expect(page.getByTestId("cohort-fallback-card")).toContainText(
      "No fallback events recorded"
    );
  });
});
