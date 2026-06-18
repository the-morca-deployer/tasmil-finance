// REAL-AI suite — requires `ai/` running on http://localhost:8001 (or AI_HEALTH_URL).
import { expect, test } from "../fixtures/real-ai.fixture";
import { freshWallet, loginAsWallet } from "../helpers/auth";
import { ChatPage } from "../page-objects/chat.page";

const AMOUNT_VARIANTS = [
  "deposit $10",
  "stake 10 dollars",
  "put in ten bucks",
  "I'd like to deposit 10 usd",
];

async function go(page: import("@playwright/test").Page): Promise<ChatPage> {
  const wallet = freshWallet();
  await loginAsWallet(page, wallet);
  await page.goto("/chat/new");
  return new ChatPage(page);
}

test.describe.configure({ mode: "serial" });

test.describe("Deposit intent extraction — real AI", () => {
  test("'I wanna deposit 10$' triggers asset clarify with USDC and XLM", async ({ page }) => {
    const chat = await go(page);
    await chat.sendMessage("I wanna deposit 10$");
    await chat.waitForResponse();
    const card = await chat.waitForCard("card-clarify", { timeout: 30000 });
    await expect(card).toBeVisible();
    const text = (await card.textContent()) ?? "";
    expect(text).toMatch(/USDC/i);
    expect(text).toMatch(/XLM/i);
    const transcript = await chat.transcriptText();
    expect(transcript).toMatch(/\b10\b/);
  });

  test("'deposit 10 USDC' skips asset clarify, goes to pool", async ({ page }) => {
    const chat = await go(page);
    await chat.sendMessage("deposit 10 USDC");
    await chat.waitForResponse();
    const card = await chat.waitForCard("card-clarify", { timeout: 30000 });
    const text = (await card.textContent()) ?? "";
    expect(text).toMatch(/Blend|Soroswap|Aquarius|Phoenix|DeFindex/i);
    expect(text).not.toMatch(/which (asset|token)/i);
  });

  test("full path: $10 -> USDC -> Blend -> ExecutionCard", async ({ page }) => {
    const chat = await go(page);
    await chat.sendMessage("I wanna deposit 10$");
    await chat.waitForResponse();
    const assetCard = await chat.waitForCard("card-clarify", { timeout: 30000 });
    await assetCard.getByRole("button", { name: /USDC/i }).click();
    await chat.waitForResponse();
    const poolCard = await chat.waitForCard("card-clarify", { timeout: 30000 });
    await poolCard.getByRole("button", { name: /Blend/i }).click();
    await chat.waitForResponse();
    const exec = await chat.waitForCard(/card-(stellar|swap)-execute/, { timeout: 30000 });
    const execText = (await exec.textContent()) ?? "";
    expect(execText).toMatch(/\b10\b/);
    expect(execText).toMatch(/USDC/i);
    expect(execText).toMatch(/Blend/i);
  });

  for (const phrase of AMOUNT_VARIANTS) {
    test(`amount variant: "${phrase}" surfaces clarify referencing 10`, async ({ page }) => {
      const chat = await go(page);
      await chat.sendMessage(phrase);
      await chat.waitForResponse();
      const card = await chat.waitForCard("card-clarify", { timeout: 30000 });
      await expect(card).toBeVisible();
      const transcript = await chat.transcriptText();
      expect(transcript).toMatch(/\b(10|ten)\b/i);
    });
  }

  test("typo: 'I wanna depóit 10$' still triggers clarify", async ({ page }) => {
    const chat = await go(page);
    await chat.sendMessage("I wanna depóit 10$");
    await chat.waitForResponse();
    const card = await chat.waitForCard("card-clarify", { timeout: 30000 });
    await expect(card).toBeVisible();
  });

  test("regression guard: amount given MUST surface a card", async ({ page }) => {
    const chat = await go(page);
    await chat.sendMessage("I wanna deposit 10$");
    await chat.waitForResponse();
    const { type } = await chat.waitForAnyCard({ timeout: 30000 });
    expect(type).toMatch(/card-clarify|card-(stellar|swap)-execute/);
  });
});
