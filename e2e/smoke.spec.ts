import { test, expect } from "./fixtures/chat.fixture";

/**
 * Smoke tests — one test per protocol.
 * Validates the basic happy path works for each protocol.
 * Run first to validate the E2E setup before full protocol suites.
 */
test.describe("Smoke Tests — One per Protocol", () => {
  test.describe.configure({ mode: "serial" });

  test("Blend: supply USDC", async ({ chatPage }) => {
    await chatPage.sendMessage("Supply 10 USDC to Blend");
    await chatPage.waitForResponse();
    const { type } = await chatPage.waitForAnyCard();
    expect(["card-stellar-execute", "card-clarify", "card-blend-tx"]).toContain(type);
  });

  test("Soroswap: swap XLM to USDC", async ({ chatPage }) => {
    await chatPage.sendMessage("Swap 5 XLM to USDC on Soroswap");
    await chatPage.waitForResponse();
    const { type } = await chatPage.waitForAnyCard();
    expect(["card-swap-execute", "card-stellar-execute", "card-clarify"]).toContain(type);
  });

  test("SDEX: swap", async ({ chatPage }) => {
    await chatPage.sendMessage("Buy 10 USDC with XLM on the Stellar DEX");
    await chatPage.waitForResponse();
    const { type } = await chatPage.waitForAnyCard();
    expect(["card-swap-execute", "card-stellar-execute", "card-clarify"]).toContain(type);
  });

  test("Phoenix: swap", async ({ chatPage }) => {
    await chatPage.sendMessage("Swap 5 XLM to USDC on Phoenix");
    await chatPage.waitForResponse();
    const { type } = await chatPage.waitForAnyCard();
    expect(["card-swap-execute", "card-stellar-execute", "card-clarify"]).toContain(type);
  });

  test("Aquarius: add liquidity", async ({ chatPage }) => {
    await chatPage.sendMessage("Add 10 USDC to Aquarius USDC/XLM pool");
    await chatPage.waitForResponse();
    const { type } = await chatPage.waitForAnyCard();
    expect(["card-stellar-execute", "card-aqua-tx", "card-clarify"]).toContain(type);
  });

  test("Allbridge: bridge USDC", async ({ chatPage }) => {
    await chatPage.sendMessage("Bridge 10 USDC from Stellar to Ethereum");
    await chatPage.waitForResponse();
    const { type } = await chatPage.waitForAnyCard();
    expect(["card-bridge-execute", "card-stellar-execute", "card-clarify"]).toContain(type);
  });

  test("Templar: swap", async ({ chatPage }) => {
    await chatPage.sendMessage("Swap 10 USDC to XLM on Templar");
    await chatPage.waitForResponse();
    const { type } = await chatPage.waitForAnyCard();
    expect(["card-swap-execute", "card-stellar-execute", "card-clarify"]).toContain(type);
  });

  test("DeFindex: deposit", async ({ chatPage }) => {
    await chatPage.sendMessage("Deposit 10 USDC into DeFindex vault");
    await chatPage.waitForResponse();
    const { type } = await chatPage.waitForAnyCard();
    expect(["card-stellar-execute", "card-clarify"]).toContain(type);
  });

  test("Tasmil: check strategy", async ({ chatPage }) => {
    await chatPage.sendMessage("What Tasmil strategy presets are available?");
    await chatPage.waitForResponse();
    const { type } = await chatPage.waitForAnyCard();
    expect(["card-strategy-preset", "card-account-strategy", "card-clarify"]).toContain(type);
  });

  test("Info: account balance", async ({ chatPage }) => {
    await chatPage.sendMessage("Show my account balance");
    await chatPage.waitForResponse();
    const { type } = await chatPage.waitForAnyCard();
    expect(["card-account-info", "card-pool-info", "card-clarify"]).toContain(type);
  });
});
