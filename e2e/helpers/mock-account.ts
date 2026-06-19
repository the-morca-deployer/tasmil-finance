// tasmil-finance/e2e/helpers/mock-account.ts
import type { Page } from "@playwright/test";

export interface MockAccountOptions {
  phase: "beta" | "mainnet";
  hasPositions?: boolean;
  isFirstLogin?: boolean;
  daysSinceLastStake?: number;
  lastPoolEarnings?: number | null;
}

const DEFAULTS: Required<Omit<MockAccountOptions, "phase">> = {
  hasPositions: false,
  isFirstLogin: true,
  daysSinceLastStake: 0,
  lastPoolEarnings: null,
};

export async function mockAccount(page: Page, opts: MockAccountOptions): Promise<void> {
  const merged = { ...DEFAULTS, ...opts };
  await page.route("**/accounts/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: merged }),
    })
  );
  await page.addInitScript((state) => {
    window.localStorage.setItem("tasmil-auth", JSON.stringify(state));
  }, merged);
}
