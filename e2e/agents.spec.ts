/**
 * /agents — UI interaction matrix
 *
 * The agents page renders:
 *   - HeroSection: "Explore AI Tasmil Agents" + a "{N}+ Agents" counter
 *   - FilterBar: a search input ("Search agent" placeholder) + filter pills
 *     ("All" + dynamic groups: "Protocol Agents", "Common Agents")
 *   - A grid of agent cards. Each card carries data-testid="agent-card-{graph_id}".
 *     Available agents (currently: blend) are clickable; the rest are
 *     coming-soon and rendered as `disabled` buttons.
 *
 * Scenarios:
 *   S1 hero + filter pills + search render
 *   S2 search input accepts typing
 *   S3 the "All" filter pill is interactive
 *   S4 clicking the (live) blend agent card routes to /chat/blend_agent/new.
 *      If the AI assistants backend isn't running, this test skips.
 */

import { expect, test } from "@playwright/test";
import { attachConsoleSpy } from "./_helpers/console-filter";

test.describe("/agents — UI interaction matrix", () => {
  test("S1: hero + filter bar render", async ({ page }) => {
    const { errors } = attachConsoleSpy(page);
    await page.goto("/agents");

    await expect(page.getByRole("heading", { name: /Explore AI Tasmil Agents/i })).toBeVisible({
      timeout: 20_000,
    });
    // Filter pill "All" is always rendered. Use exact:true to disambiguate
    // from the wallet "Connect" pill and the disabled agent-card buttons.
    await expect(page.getByRole("button", { name: "All", exact: true })).toBeVisible();
    await expect(page.getByPlaceholder("Search agent")).toBeVisible();

    const unexpected = errors.filter(
      (e) =>
        !/assistants\/search/.test(e) &&
        !/Failed to load resource/.test(e) &&
        !/Error loading agents/.test(e),
    );
    expect(unexpected, `Console errors: ${unexpected.join("\n")}`).toEqual([]);
  });

  test("S2: search input accepts typing and updates value", async ({ page }) => {
    const { errors: _errors } = attachConsoleSpy(page);
    await page.goto("/agents");
    const search = page.getByPlaceholder("Search agent");
    await expect(search).toBeVisible({ timeout: 20_000 });

    await search.click();
    await search.fill("blend");
    await expect(search).toHaveValue("blend");
  });

  test("S3: the 'All' filter pill is interactive", async ({ page }) => {
    const { errors: _errors } = attachConsoleSpy(page);
    await page.goto("/agents");
    const allBtn = page.getByRole("button", { name: "All", exact: true });
    await expect(allBtn).toBeVisible({ timeout: 20_000 });

    await allBtn.click();
    // The button stays mounted after click — assert it's still there.
    await expect(allBtn).toBeVisible();
  });

  test("S4: clicking the live blend agent card routes to /chat/blend_agent/new", async ({
    page,
  }) => {
    const { errors: _errors } = attachConsoleSpy(page);
    await page.goto("/agents");

    // The agent grid renders cards keyed by graph_id; the blend agent is
    // currently the only AVAILABLE one (others are coming-soon and disabled).
    // The grid is wrapped in AnimatePresence so cards can detach/remount
    // mid-mount; wait for the count to settle before grabbing the locator.
    const blendCardSel = "[data-testid='agent-card-blend_agent']";
    const settled = await page
      .waitForSelector(`${blendCardSel}:not([disabled])`, { timeout: 25_000 })
      .catch(() => null);
    if (!settled) {
      test.skip(
        true,
        "blend agent card not rendered as enabled — AI assistants backend likely unavailable",
      );
      return;
    }

    // Re-locate after settle to avoid stale-handle detach errors.
    const blendCard = page.locator(blendCardSel).first();
    await blendCard.scrollIntoViewIfNeeded({ timeout: 5_000 }).catch(() => {});
    await blendCard.click({ force: true, timeout: 5_000 });
    await page.waitForURL(/\/chat\/blend_agent\/new/, { timeout: 15_000 });
    expect(page.url()).toMatch(/\/chat\/blend_agent\/new$/);
  });
});
