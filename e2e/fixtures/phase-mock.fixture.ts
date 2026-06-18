// tasmil-finance/e2e/fixtures/phase-mock.fixture.ts
import { test as baseChatTest } from "./chat.fixture";
import { mockAccount } from "../helpers/mock-account";
import { mockAgUiStream } from "../helpers/mock-sse";
import { ChatPage } from "../page-objects/chat.page";

export const test = baseChatTest.extend<{ mockedChat: ChatPage }>({
  mockedChat: async ({ page }, use) => {
    await mockAccount(page, { phase: "beta", isFirstLogin: true });
    await mockAgUiStream(page, []);
    await use(new ChatPage(page));
  },
});

export { expect } from "@playwright/test";
