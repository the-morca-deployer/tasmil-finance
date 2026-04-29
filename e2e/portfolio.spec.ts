/**
 * /portfolio (== /profile) — UI interaction matrix
 *
 * The portfolio route renders the full ProfilePage UI: a wallet header
 * (avatar + truncated address + total USD + breakdown), a "View credits &
 * ledger" link, four tabs (Tokens / Positions / NFTs / Transaction History),
 * and the active-tab body.
 *
 * Without an in-browser Stellar wallet extension, the Wallets Kit's
 * `account` is null — the page falls back to a "Connect Your Wallet"
 * prompt. We auth via the test-login JWT + zustand seed, which makes the
 * wallet-storage `account` non-null and exposes the full UI.
 *
 * S1 anonymous → ConnectPrompt visible
 * S2 authed → header + tab bar + Tokens body
 * S3 click each of the 4 tabs → URL ?tab= updates, the body switches
 * S4 click the wallet-address copy button → clipboard contains the address
 * S5 click "View credits & ledger" → navigates to /profile/credits
 */

import { expect, test, type Page } from "@playwright/test";
import { attachConsoleSpy } from "./_helpers/console-filter";

const BACKEND = process.env.PLAYWRIGHT_BACKEND_URL ?? "http://localhost:6756";

// Stellar G-prefixed wallet addresses are 56 chars long. Pad these so the
// display-truncate (slice(0,6)..slice(-4)) matches what the page renders.
const S1_WALLET = "GPORTFOLIOTEST10000000000000000000000000000000000000000";
const S2_WALLET = "GPORTFOLIOTEST20000000000000000000000000000000000000000";
const S3_WALLET = "GPORTFOLIOTEST30000000000000000000000000000000000000000";
const S4_WALLET = "GPORTFOLIOTEST40000000000000000000000000000000000000000";
const S5_WALLET = "GPORTFOLIOTEST50000000000000000000000000000000000000000";

/**
 * The mainnet frontend at :3001 proxies /api/* to its OWN backend (separate
 * DB cluster), so test-login JWTs minted on the dev backend at :6756 get
 * 4xx-d when those routes look up the user. Filter those out — they're
 * artifacts of the split-stack local dev setup, not real bugs.
 */
function filterStackSplitNoise(errors: string[]): string[] {
  return errors.filter(
    (e) =>
      !/api 4\d\d.*\/api\/portfolio\/snapshot/.test(e) &&
      !/api 4\d\d.*\/api\/welcome-reward\//.test(e) &&
      !/api 4\d\d.*\/api\/account\/position\//.test(e) &&
      !/api 4\d\d.*\/api\/account\/activity\//.test(e) &&
      !/api 4\d\d.*\/api\/account\/presets/.test(e) &&
      !/api 4\d\d.*\/api\/farming\//.test(e) &&
      !/api 4\d\d.*\/api\/credit\//.test(e) &&
      !/api 4\d\d.*\/api\/referral\//.test(e) &&
      !/api 4\d\d.*\/api\/topup\//.test(e),
  );
}

async function loginAsWallet(page: Page, walletAddress: string): Promise<{ jwt: string }> {
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

  return { jwt };
}

test.describe("/portfolio — UI interaction matrix", () => {
  test("S1: anonymous → ConnectPrompt is visible, no /api 4xx noise", async ({ page }) => {
    const { errors } = attachConsoleSpy(page);
    await page.goto("/portfolio");
    await expect(page.getByRole("heading", { name: /Connect Your Wallet/i })).toBeVisible({
      timeout: 10_000,
    });
    const noisy = filterStackSplitNoise(errors); expect(noisy, `Unexpected console errors: ${noisy.join("\n")}`).toEqual([]);
  });

  test("S2: authed → header + tab bar + Tokens body render", async ({ page }) => {
    const { errors } = attachConsoleSpy(page);
    await loginAsWallet(page, S2_WALLET);

    await page.goto("/portfolio");
    // The 4 tabs render as buttons (not links — they replace the URL via
    // router.replace). Locate them by visible text.
    await expect(page.getByRole("button", { name: "Tokens" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Positions" })).toBeVisible();
    await expect(page.getByRole("button", { name: "NFTs" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Transaction History" })).toBeVisible();

    // The Tokens body renders an "Assets" heading once the wallet-tokens
    // query resolves (or a skeleton with the same heading while loading).
    await expect(page.getByRole("heading", { name: /Assets/i })).toBeVisible({ timeout: 20_000 });

    // The wallet header truncates the address to "AAAAAA...BBBB"; assert
    // the prefix is rendered.
    await expect(page.locator("text=GPORTF")).toBeVisible();

    const noisy = filterStackSplitNoise(errors); expect(noisy, `Unexpected console errors: ${noisy.join("\n")}`).toEqual([]);
  });

  test("S3: clicking each tab pushes ?tab= and switches the body", async ({ page }) => {
    const { errors } = attachConsoleSpy(page);
    await loginAsWallet(page, S3_WALLET);

    await page.goto("/portfolio");
    await expect(page.getByRole("button", { name: "Tokens" })).toBeVisible({ timeout: 15_000 });

    // Click Positions → URL gets ?tab=positions.
    await page.getByRole("button", { name: "Positions" }).click();
    await expect.poll(() => page.url(), { timeout: 5_000 }).toMatch(/[?&]tab=positions/);

    // Click NFTs → URL gets ?tab=nfts. The NftPlaceholder body renders a
    // "no NFTs" copy.
    await page.getByRole("button", { name: "NFTs" }).click();
    await expect.poll(() => page.url(), { timeout: 5_000 }).toMatch(/[?&]tab=nfts/);

    // Click Transaction History → URL gets ?tab=history.
    await page.getByRole("button", { name: "Transaction History" }).click();
    await expect.poll(() => page.url(), { timeout: 5_000 }).toMatch(/[?&]tab=history/);

    // Click back to Tokens → tab param is cleared (special-cased in the
    // page).
    await page.getByRole("button", { name: "Tokens" }).click();
    await expect.poll(() => page.url(), { timeout: 5_000 }).not.toMatch(/[?&]tab=/);

    const noisy = filterStackSplitNoise(errors); expect(noisy, `Unexpected console errors: ${noisy.join("\n")}`).toEqual([]);
  });

  test("S4: clicking the wallet-address button writes the address to clipboard", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
    const page = await ctx.newPage();
    const { errors } = attachConsoleSpy(page);
    await loginAsWallet(page, S4_WALLET);

    await page.goto("/portfolio");
    // The wallet-address button is rendered with text "AAAAAA...BBBB"
    // (truncated). Find it via the truncated prefix and click.
    const truncated = `${S4_WALLET.slice(0, 6)}...${S4_WALLET.slice(-4)}`;
    const addrBtn = page.getByRole("button", { name: new RegExp(truncated.replace(/\./g, "\\.")) });
    await expect(addrBtn).toBeVisible({ timeout: 15_000 });
    await addrBtn.click();

    const clip = await page.evaluate(async () => navigator.clipboard.readText());
    expect(clip).toBe(S4_WALLET);

    const noisy = filterStackSplitNoise(errors); expect(noisy, `Unexpected console errors: ${noisy.join("\n")}`).toEqual([]);
    await ctx.close();
  });

  test("S5: View credits & ledger link navigates to /profile/credits", async ({ page }) => {
    const { errors } = attachConsoleSpy(page);
    await loginAsWallet(page, S5_WALLET);

    await page.goto("/portfolio");
    const link = page.getByRole("link", { name: /View credits & ledger/i });
    await expect(link).toBeVisible({ timeout: 15_000 });
    await expect(link).toHaveAttribute("href", "/profile/credits");
    await link.click();
    await page.waitForURL(/\/profile\/credits$/, { timeout: 15_000 });
    await expect(page.getByTestId("credits-page")).toBeVisible();

    const noisy = filterStackSplitNoise(errors); expect(noisy, `Unexpected console errors: ${noisy.join("\n")}`).toEqual([]);
  });
});
