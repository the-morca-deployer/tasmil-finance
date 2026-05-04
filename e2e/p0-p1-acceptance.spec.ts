/**
 * P0/P1 Acceptance Suite
 *
 * One-stop ship-readiness gate covering the six tasks in the May 2026
 * P0/P1 list. Each describe block maps to one task; each test names
 * the acceptance criterion verbatim.
 *
 * Discipline:
 * - Every test calls loginAsWallet(page, freshWallet()) BEFORE goto.
 * - No silent skips — strict expect().toBeVisible({ timeout }).
 * - localStorage cleared via addInitScript when test depends on
 *   per-device state.
 * - Run: pnpm test:e2e -- p0-p1-acceptance.spec.ts
 *
 * Spec: docs/superpowers/specs/2026-05-04-p0-p1-acceptance-design.md
 */
import { expect, test } from "@playwright/test";
import { freshWallet, loginAsWallet } from "./helpers/auth";
import { applyCreditDelta } from "./helpers/backend";
import { clearOnboardingState, clearWatchlistState } from "./helpers/state";

test.describe("T1 — Onboarding guide (P0)", () => {
  test("modal opens on first wallet connect", async ({ page, context }) => {
    await context.clearCookies();
    await clearOnboardingState(page);
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 8000 });
  });

  test("5 slides advance via Next button", async ({ page, context }) => {
    await context.clearCookies();
    await clearOnboardingState(page);
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible({ timeout: 8000 });

    // 5 slides → Next clicked 4 times to reach slide 5; then "Get Started" appears
    for (let i = 0; i < 4; i++) {
      await page.getByRole("button", { name: /^Next$/ }).click();
    }
    await expect(page.getByRole("button", { name: /Get Started/i })).toBeVisible();
  });

  test("slide 1 renders video placeholder (Watch intro caption)", async ({ page, context }) => {
    await context.clearCookies();
    await clearOnboardingState(page);
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible({ timeout: 8000 });

    // Slide 1 has a videoUrl placeholder — caption text is the locator
    await expect(page.getByText(/Watch intro/i)).toBeVisible();
  });

  test("every slide has icon + heading + description", async ({ page, context }) => {
    await context.clearCookies();
    await clearOnboardingState(page);
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible({ timeout: 8000 });

    // Each slide: icon (svg in the hero circle), <h2> heading, paragraph description.
    // Across 5 slides we should always see exactly one h2 + at least one svg + a long paragraph.
    for (let slide = 0; slide < 5; slide++) {
      const h2 = modal.locator("h2").first();
      await expect(h2).toBeVisible();
      const heading = await h2.textContent();
      expect(heading?.length ?? 0).toBeGreaterThan(2);
      // Slide hero icon is an svg child of the gradient circle
      const heroSvg = modal.locator("svg").first();
      await expect(heroSvg).toBeVisible();
      // Description paragraph (non-button, non-h2 text)
      await expect(modal.locator("p").first()).toBeVisible();

      if (slide < 4) {
        await page.getByRole("button", { name: /^Next$/ }).click();
        await page.waitForTimeout(150); // carousel animation settle
      }
    }
  });

  test("Get Started dismisses and persists across reload", async ({ page, context }) => {
    await context.clearCookies();
    await clearOnboardingState(page);
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible({ timeout: 8000 });

    for (let i = 0; i < 4; i++) {
      await page.getByRole("button", { name: /^Next$/ }).click();
    }
    await page.getByRole("button", { name: /Get Started/i }).click();
    await expect(modal).not.toBeVisible({ timeout: 3000 });

    await page.reload();
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe("T2 — Farming UI (P0)", () => {
  // tests added in Task 7
});

test.describe("T3 — Credit mechanic (P1)", () => {
  // tests added in Task 8
});

test.describe("T4 — Protocol/Reward split (P1)", () => {
  // tests added in Task 9
});

test.describe("T5 — History display Freighter-style (P1)", () => {
  // tests added in Task 10
});

test.describe("T6 — Asset selector (P1)", () => {
  // tests added in Task 11
});
