import type { Page } from "@playwright/test";

/**
 * Clear the persisted onboarding store so the welcome modal opens
 * on the next wallet connect. Must be called BEFORE page.goto().
 */
export async function clearOnboardingState(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.removeItem("tasmil-onboarding");
  });
}

/**
 * Clear the persisted watchlist store so add/remove/persist tests
 * start from a clean slate. Must be called BEFORE page.goto().
 */
export async function clearWatchlistState(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.removeItem("tasmil.watchlist");
  });
}
