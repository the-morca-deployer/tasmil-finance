import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/** All card data-testid values that can appear in AI responses. */
export type CardType =
  | "card-clarify"
  | "card-plan-preview"
  | "card-execution"
  | "card-swap-execute"
  | "card-stellar-execute"
  | "card-trustline"
  | "card-bridge-execute"
  | "card-account-setup"
  | "card-account-strategy"
  | "card-strategy-preset"
  | "card-earn-discovery"
  | "card-pool-info"
  | "card-account-info"
  | "card-swap-quote"
  | "card-bridge-discovery"
  | "card-blend-tx"
  | "card-blend-pools"
  | "card-blend-pool-detail"
  | "card-blend-positions"
  | "card-blend-reserve"
  | "card-blend-backstop-info"
  | "card-blend-backstop-balance"
  | "card-aqua-pools"
  | "card-aqua-pool-detail"
  | "card-aqua-positions"
  | "card-aqua-tx"
  | "card-action-search"
  | "card-soroswap-pools";

export class ChatPage {
  readonly page: Page;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly messageList: Locator;

  constructor(page: Page) {
    this.page = page;
    // The chat input — try multiple selectors to match the app's actual markup
    this.messageInput = page.locator(
      'textarea, [contenteditable="true"], input[placeholder*="message" i], [role="textbox"]'
    ).first();
    this.sendButton = page.locator(
      'button[type="submit"], button:has(svg[class*="send" i]), button[aria-label*="send" i]'
    ).first();
    this.messageList = page.locator('[data-testid="agent-response"], [class*="message"]');
  }

  /** Navigate to a chat thread. */
  async goto(threadId?: string) {
    const path = threadId ? `/chat/${threadId}` : "/chat/new";
    await this.page.goto(path, { waitUntil: "networkidle" });
  }

  /** Get the current thread ID from the URL. */
  get threadId(): string {
    const url = this.page.url();
    const match = url.match(/\/chat\/([a-f0-9-]+)/);
    return match?.[1] ?? "";
  }

  /** Send a message in the chat. */
  async sendMessage(text: string) {
    await this.messageInput.fill(text);
    // Press Enter to send (common pattern in chat UIs)
    await this.messageInput.press("Enter");
  }

  /**
   * Wait for the AI to finish responding.
   * Detects streaming completion by waiting for the loading/typing indicator to disappear.
   */
  async waitForResponse(timeout = 90_000) {
    // Wait for streaming indicator to appear (AI is processing)
    try {
      await this.page.waitForSelector(
        '[data-testid="streaming-indicator"], [class*="typing"], [class*="loading"], [class*="animate-pulse"]',
        { timeout: 15_000 }
      );
    } catch {
      // Indicator might have already appeared and disappeared
    }

    // Wait for streaming to finish (indicator disappears)
    await this.page.waitForFunction(
      () => {
        const indicators = document.querySelectorAll(
          '[data-testid="streaming-indicator"], [class*="typing-indicator"], [class*="streaming"]'
        );
        return indicators.length === 0;
      },
      { timeout }
    );

    // Extra settle time for card rendering
    await this.page.waitForTimeout(2000);
  }

  /** Wait for a specific card type to appear in the chat. */
  async waitForCard(cardType: CardType, timeout = 90_000): Promise<Locator> {
    const selector = `[data-testid="${cardType}"]`;
    await this.page.waitForSelector(selector, { timeout });
    return this.page.locator(selector).last();
  }

  /** Wait for any card to appear (returns the last one). */
  async waitForAnyCard(timeout = 90_000): Promise<{ type: CardType; locator: Locator }> {
    const cardSelector = '[data-testid^="card-"]';
    await this.page.waitForSelector(cardSelector, { timeout });
    const lastCard = this.page.locator(cardSelector).last();
    const testId = await lastCard.getAttribute("data-testid");
    return { type: testId as CardType, locator: lastCard };
  }

  /** Get all cards currently visible in the chat. */
  async getAllCards(): Promise<Array<{ type: string; locator: Locator }>> {
    const cards = this.page.locator('[data-testid^="card-"]');
    const count = await cards.count();
    const result: Array<{ type: string; locator: Locator }> = [];
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const testId = await card.getAttribute("data-testid");
      if (testId) result.push({ type: testId, locator: card });
    }
    return result;
  }

  /** Select an option in a ClarifyCard by its label text. */
  async selectClarifyOption(label: string) {
    const clarifyCard = this.page.locator('[data-testid="card-clarify"]').last();
    // ClarifyCard options have aria-label="Select {label}"
    const option = clarifyCard.locator(`[aria-label*="${label}"], button:has-text("${label}")`).first();
    await option.click();
  }

  /** Click confirm/approve on a PlanPreviewCard. */
  async confirmPlan() {
    const planCard = this.page.locator('[data-testid="card-plan-preview"]').last();
    const confirmBtn = planCard.locator('button:has-text("Confirm"), button:has-text("Approve"), button:has-text("Execute")').first();
    await confirmBtn.click();
  }

  /** Click the sign/submit button on a TX execute card. */
  async signTransaction() {
    const txCard = this.page.locator(
      '[data-testid="card-stellar-execute"], [data-testid="card-swap-execute"], [data-testid="card-bridge-execute"], [data-testid="card-blend-tx"], [data-testid="card-aqua-tx"]'
    ).last();
    const signBtn = txCard.locator('button:has-text("Sign"), button:has-text("Submit"), button:has-text("Confirm")').first();
    await signBtn.click();
  }

  /** Get text content of the last AI message. */
  async getLastResponseText(): Promise<string> {
    const responses = this.page.locator('[data-testid="agent-response"]');
    const count = await responses.count();
    if (count === 0) return "";
    return (await responses.last().textContent()) ?? "";
  }

  /** Take a screenshot of the last card for visual review. */
  async screenshotLastCard(name: string) {
    const card = this.page.locator('[data-testid^="card-"]').last();
    await card.screenshot({ path: `test-results/cards/${name}.png` });
  }
}
