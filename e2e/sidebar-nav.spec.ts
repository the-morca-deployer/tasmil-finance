/**
 * Dashboard sidebar nav — UI interaction matrix
 *
 * The MultiSidebarLayout renders a left sidebar with these nav items
 * (mainnet build, /apps/frontend/src/shared/layout/sidebar-data.ts):
 *
 *   Agents       → /agents
 *   Farming      → /farming
 *   Aggregator   → /aggregator
 *   Portfolio    → /portfolio
 *   Top up       → /topup
 *   Referrals    → /profile/referrals
 *
 * (Faucet is testnetOnly so it's hidden on a mainnet build.)
 *
 * For each link, this spec:
 *   1. Visits a known starting page (/topup) — the sidebar is always
 *      rendered there.
 *   2. Clicks the sidebar link by visible text.
 *   3. Asserts the URL matches the target.
 *
 * Each click-and-verify is a separate test so a failure in one row does
 * not mask the others.
 */

import { expect, test, type Page } from "@playwright/test";
import { attachConsoleSpy } from "./_helpers/console-filter";

const BACKEND = process.env.PLAYWRIGHT_BACKEND_URL ?? "http://localhost:6756";

const NAV_TEST_WALLET = "GSIDEBARNAVE2E000000000000000000000000000000000000000000";

async function loginAsWallet(page: Page, walletAddress: string): Promise<void> {
  const response = await page.request.post(`${BACKEND}/api/auth/wallet/test-login`, {
    data: { walletAddress },
  });
  expect(response.ok(), `test-login HTTP ${response.status()}`).toBeTruthy();
  const body = await response.json();
  const jwt: string = body?.data?.accessToken ?? body?.accessToken;
  expect(jwt).toBeTruthy();

  await page.addInitScript(
    ({ walletAddress, jwt }) => {
      (window as Window & { __WALLET_MOCK__?: unknown }).__WALLET_MOCK__ = {
        isConnected: true,
        address: walletAddress,
        displayAddress: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
        isAuthenticating: false,
      };
      localStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            isAuthenticated: true,
            accessToken: jwt,
            user: {
              id: walletAddress,
              walletAddress,
              type: "regular",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            isLoading: false,
            expiresAt: Date.now() + 60 * 60 * 1000,
          },
          version: 0,
        }),
      );
      localStorage.setItem(
        "wallet-storage",
        JSON.stringify({ state: { account: walletAddress }, version: 0 }),
      );
    },
    { walletAddress, jwt },
  );
}

// Note: on the mainnet build /aggregator and /faucet are redirected
// server-side to /agents (middleware-gated). Treat the Aggregator link
// specially — clicking it should land on either /aggregator or /agents.
const NAV_LINKS: { label: string; expectedPath: RegExp }[] = [
  { label: "Agents", expectedPath: /\/agents$/ },
  { label: "Farming", expectedPath: /\/farming(\?.*)?$/ },
  { label: "Aggregator", expectedPath: /\/(aggregator|agents)(\?.*)?$/ },
  { label: "Portfolio", expectedPath: /\/portfolio(\?.*)?$/ },
  { label: "Top up", expectedPath: /\/topup(\?.*)?$/ },
  { label: "Referrals", expectedPath: /\/profile\/referrals(\?.*)?$/ },
];

test.describe("Dashboard sidebar nav — UI interaction matrix", () => {
  for (const item of NAV_LINKS) {
    test(`clicking "${item.label}" → URL matches ${item.expectedPath}`, async ({ page }) => {
      const { errors } = attachConsoleSpy(page);
      await loginAsWallet(page, NAV_TEST_WALLET);

      // Land on /topup which has the sidebar mounted with all groups.
      await page.goto("/topup");
      await expect(page.getByTestId("topup-page-title")).toBeVisible({ timeout: 15_000 });

      // The sidebar may be collapsed to icons only; some labels render as
      // tooltip on hover. Use { exact: true } and pick the FIRST link with
      // that visible name to avoid clashing with body content (e.g. the
      // word "Portfolio" might appear in body text).
      const link = page
        .getByRole("link", { name: new RegExp(`^${item.label}$`, "i") })
        .first();
      await expect(link).toBeVisible({ timeout: 15_000 });
      await link.click();
      await page.waitForURL(item.expectedPath, { timeout: 20_000 });
      // 401 / network warns on /api/* responses are NOT fatal — most
      // dashboard surfaces query the backend with auth which may
      // throw 401 on the bootstrap before the JWT lands.
      const noisy = errors.filter(
        (e) =>
          !/api\/portfolio/.test(e) &&
          !/api\/account\/position/.test(e) &&
          !/api\/account\/activity/.test(e) &&
          !/api\/account\/presets/.test(e) &&
          !/api\/farming\/pools/.test(e) &&
          !/api\/credit/.test(e) &&
          !/api\/referral/.test(e) &&
          !/api\/topup/.test(e) &&
          !/api\/welcome-reward/.test(e) &&
          !/api\/admin\/stats/.test(e),
      );
      expect(noisy, `Unexpected console errors: ${noisy.join("\n")}`).toEqual([]);
    });
  }
});
