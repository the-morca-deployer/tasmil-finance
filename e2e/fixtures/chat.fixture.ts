import { test as base } from "@playwright/test";
import { ChatPage } from "../page-objects/chat.page";
import { FUNDED_WALLET, EMPTY_WALLET, injectMockWallet } from "./test-wallet";
import { authenticateWallet } from "./auth";

/**
 * Handles the dev tunnel "Continue" interstitial if it appears.
 */
async function dismissTunnelWarning(page: import("@playwright/test").Page) {
  try {
    const continueBtn = page.locator('button:has-text("Continue")');
    await continueBtn.click({ timeout: 5_000 });
    await page.waitForLoadState("networkidle");
  } catch {
    // No tunnel warning
  }
}

async function setupWallet(page: import("@playwright/test").Page, wallet: typeof FUNDED_WALLET) {
  // 1. Inject mock Freighter (runs before page JS on every navigation)
  await injectMockWallet(page, wallet);

  // 2. Navigate to app — triggers tunnel auth via cookies from storageState
  await authenticateWallet(page, wallet);
  // At this point: localStorage has wallet-storage + auth-storage set via page.evaluate

  // 3. Navigate to /chat/new — this time the page JS reads our localStorage on hydration
  await page.goto("/chat/new", { waitUntil: "domcontentloaded" });
  await dismissTunnelWarning(page);
  await page.waitForLoadState("networkidle");
}

export const test = base.extend<{
  chatPage: ChatPage;
  chatPageEmpty: ChatPage;
}>({
  chatPage: async ({ page }, use) => {
    await setupWallet(page, FUNDED_WALLET);

    const chatPage = new ChatPage(page);
    await page.waitForSelector(
      'textarea, [contenteditable="true"], input[placeholder*="message" i], [role="textbox"]',
      { timeout: 30_000 }
    );

    await use(chatPage);
  },

  chatPageEmpty: async ({ page }, use) => {
    await setupWallet(page, EMPTY_WALLET);

    const chatPage = new ChatPage(page);
    await page.waitForSelector(
      'textarea, [contenteditable="true"], input[placeholder*="message" i], [role="textbox"]',
      { timeout: 30_000 }
    );

    await use(chatPage);
  },
});

export { expect } from "@playwright/test";
