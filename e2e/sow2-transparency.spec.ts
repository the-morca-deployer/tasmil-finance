import { expect, test } from "@playwright/test";

const wallet = `G${"A".repeat(55)}`;
const accountId = "vault-sow2-e2e";
const guard = `C${"A".repeat(55)}`;
const venue = `C${"B".repeat(55)}`;
const txHash = "ab".repeat(32);

const rulebook = {
  accountId,
  network: "testnet",
  contract: guard,
  readAtLedger: "59000000",
  instanceLiveUntilLedger: "59100000",
  killSwitch: false,
  killSwitchSource: "STORED",
  executionRouter: `C${"C".repeat(55)}`,
  interfaceRegistry: `C${"D".repeat(55)}`,
  globalDailyCalls: { used: "1", resetLedger: "59017280", max: "12" },
  sessions: [
    {
      pubkey: `G${"B".repeat(55)}`,
      revoked: false,
      expiresAtLedger: "59100000",
      allowedContracts: [venue],
      maxCallsPerDay: "4",
      coolDownLedgers: "60",
      scopeVersion: "2",
      cumulative: {
        limit: "2500000000",
        denom: "USDC:base-units",
        windowLedgers: "17280",
        spent: "10000000",
        windowStartLedger: "58990000",
      },
      position: { maxExposureBps: "2500", maxPositionUsdE7: "5000000000" },
      dailyCalls: { used: "1", resetLedger: "59017280", lastCallLedger: "59000000" },
      rules: [
        {
          contract: venue,
          selector: "deposit",
          allowed: true,
          amount: {
            argIndex: "1",
            argType: "i128",
            semantics: "TOKEN_BASE",
            asset: "USDC",
            flow: "DEPOSIT",
          },
          perTx: { limit: "250000000", denom: "USDC:base-units" },
          conversionEvidence: null,
        },
      ],
    },
  ],
  explorerUrl: `https://stellar.expert/explorer/testnet/contract/${guard}`,
};

const fees = {
  network: "testnet",
  sourceContract: guard,
  readRange: {
    requestedStartLedger: "58900000",
    effectiveStartLedger: "58950000",
    oldestLedger: "58950000",
    latestLedger: "59000000",
    partial: true,
  },
  events: [
    {
      id: "fee-1",
      type: "perf_fee",
      network: "testnet",
      sourceContract: guard,
      ledger: "59000000",
      ledgerClosedAt: "2026-09-16T00:00:00.000Z",
      wallet,
      strategy: venue,
      amount: "1234567",
      details: {},
      txHash,
      txStatus: "CONFIRMED",
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${txHash}`,
    },
  ],
  nextCursor: null,
};

const activity = {
  items: [
    {
      id: "activity-1",
      accountId,
      streamId: "policy",
      seq: "4",
      entryType: "POLICY_DECISION",
      decisionId: "decision-net-edge",
      payload: { rule: "NET_EDGE", decision: "DECLINED" },
      network: "testnet",
      latestLedger: "59000000",
      txHash: null,
      txStatus: null,
      explorerUrl: null,
      createdAt: "2026-09-16T00:00:00.000Z",
    },
  ],
  nextCursor: null,
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ({ wallet }) => {
      localStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            isAuthenticated: true,
            accessToken: "sow2-e2e-token",
            expiresAt: Date.now() + 3_600_000,
            user: { id: "sow2-user", walletAddress: wallet, type: "regular" },
          },
          version: 0,
        })
      );
      localStorage.setItem(
        "wallet-storage",
        JSON.stringify({ state: { connected: true, account: wallet }, version: 0 })
      );
      localStorage.setItem(
        "tasmil-onboarding",
        JSON.stringify({ state: { hasCompletedWelcome: true }, version: 0 })
      );
      (
        window as unknown as {
          __TASMIL_E2E_WALLET__: { connected: boolean; publicKey: string };
        }
      ).__TASMIL_E2E_WALLET__ = { connected: true, publicKey: wallet };
    },
    { wallet }
  );

  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = {};
    if (path === "/api/marketplace/my-strategies") {
      data = {
        vaults: [
          {
            accountId,
            purpose: "VAULT",
            keeperWalletAddress: guard,
            baseAsset: "USDC",
            status: "ACTIVE",
          },
        ],
      };
    } else if (path.startsWith("/api/policy/rulebook/")) data = rulebook;
    else if (path === "/api/fees/events") data = fees;
    else if (path === "/api/vdl/feed") data = activity;
    else if (path === "/api/auth/me") {
      data = { id: "sow2-user", walletAddress: wallet, type: "regular" };
    }
    await route.fulfill({ json: { data } });
  });
});

async function capture(
  page: import("@playwright/test").Page,
  testInfo: import("@playwright/test").TestInfo,
  name: string
) {
  const project = testInfo.project.name.replaceAll(" ", "-").toLowerCase();
  await page.screenshot({ path: testInfo.outputPath(`${name}-${project}.png`), fullPage: true });
}

test("Rulebook renders ledger policy and owner exit", async ({ page }, testInfo) => {
  await page.goto("/rulebook");
  await expect(page.getByRole("heading", { name: "My Rulebook" })).toBeVisible();
  await expect(page.getByText("Read at ledger 59000000 · testnet")).toBeVisible();
  await expect(page.getByText("Owner can always exit.")).toBeVisible();
  await expect(page.getByText("250000000", { exact: true })).toBeVisible();
  await capture(page, testInfo, "rulebook");
});

test("fees render exact confirmed RPC evidence", async ({ page }, testInfo) => {
  await page.goto("/fees");
  await expect(page.getByRole("heading", { name: "Protocol fee evidence" })).toBeVisible();
  await expect(page.getByText("1234567")).toBeVisible();
  await expect(page.getByText(/Partial ledger range/)).toBeVisible();
  await expect(page.getByRole("link", { name: /View transaction/ })).toHaveAttribute(
    "href",
    `https://stellar.expert/explorer/testnet/tx/${txHash}`
  );
  await capture(page, testInfo, "fees");
});

test("activity distinguishes off-chain decline from a transaction", async ({ page }, testInfo) => {
  await page.goto("/activity");
  await expect(page.getByRole("heading", { name: "Policy activity" })).toBeVisible();
  await expect(page.getByText("Net-Edge declined")).toBeVisible();
  await expect(page.getByText("No transaction submitted")).toBeVisible();
  await expect(page.getByRole("link", { name: "Replay evidence" })).toHaveAttribute(
    "href",
    "/activity/decision-net-edge"
  );
  await capture(page, testInfo, "activity");
});

test("chat decline fixture exposes exact arithmetic without signing", async ({
  page,
}, testInfo) => {
  await page.goto("/playground/chat-cards");
  const card = page.getByTestId("card-policy-decision");
  await expect(card).toBeVisible();
  await expect(card).toContainText("Net-Edge declined");
  for (const value of ["1726027", "1104600", "690411", "-68984"]) {
    await expect(card).toContainText(value);
  }
  await expect(card.getByRole("button", { name: /execute|confirm|sign/i })).toHaveCount(0);
  await capture(page, testInfo, "chat-decline");
});
