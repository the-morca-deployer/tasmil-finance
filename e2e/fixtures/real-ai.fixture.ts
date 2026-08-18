// tasmil-finance/e2e/fixtures/real-ai.fixture.ts
import { test as baseChatTest } from "./chat.fixture";

const AI_HEALTH_URL = process.env.AI_HEALTH_URL ?? "http://localhost:8001/health";

async function aiHealthy(): Promise<boolean> {
  try {
    const res = await fetch(AI_HEALTH_URL, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

export const test = baseChatTest.extend({
  page: async ({ page }, use, testInfo) => {
    const healthy = await aiHealthy();
    testInfo.skip(!healthy, `AI agent unavailable at ${AI_HEALTH_URL} - skipping real-AI suite`);
    await use(page);
  },
});

export { expect } from "@playwright/test";
