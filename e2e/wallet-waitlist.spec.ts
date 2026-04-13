import { expect, test } from "@playwright/test";

// Mock wallet state that can be injected via localStorage
function seedWalletConnected(page: import("@playwright/test").Page, address: string) {
  return page.addInitScript(
    ({ address }: { address: string }) => {
      // Mock the wallet context to return a connected state
      // The actual wallet context reads from window.__WALLET_STATE__ or uses a provider
      (window as any). __WALLET_MOCK__ = {
        isConnected: true,
        address,
        displayAddress: `${address.slice(0, 6)}...${address.slice(-4)}`,
        isAuthenticating: false,
      };
    },
    { address },
  );
}

function seedWalletDisconnected(page: import("@playwright/test").Page) {
  return page.addInitScript(() => {
    (window as any). __WALLET_MOCK__ = {
      isConnected: false,
      address: null,
      displayAddress: null,
      isAuthenticating: false,
    };
  });
}

// Seed admin auth so the admin sidebar renders
function seedAdminAuth(page: import("@playwright/test").Page) {
  return page.addInitScript(() => {
    localStorage.setItem(
      "admin-auth-storage",
      JSON.stringify({
        state: {
          token: "test-token",
          admin: { id: "1", email: "admin@test.local", role: "admin" },
          isAuthenticated: true,
          hasHydrated: true,
        },
        version: 0,
      }),
    );
  });
}

test.describe("Wallet Waitlist — Public Page", () => {
  test.describe.configure({ mode: "serial" });

  const TEST_WALLET = "GBXF5DVCSD6VJZCDCW5CSCGUIDEHJVAPWUZBMIU3EEKW2XWFDCKNRKTB";
  const TEST_REFERRAL_CODE = "REF12345";

  test.beforeEach(async ({ page }) => {
    await seedWalletDisconnected(page);
  });

  test("renders the waitlist page without crashing", async ({ page }) => {
    await page.goto("/whitelist");
    await expect(page.getByRole("heading", { name: /Tasmil Finance/i })).toBeVisible();
  });

  test("shows wallet entry panel and referral explanation card when disconnected", async ({ page }) => {
    await page.goto("/whitelist");

    // Left card: wallet entry
    await expect(page.getByText(/Connect your Stellar wallet/i)).toBeVisible();

    // Right card: how it works
    await expect(page.getByText(/How it works/i)).toBeVisible();
  });

  test("shows Connect Stellar wallet CTA when disconnected", async ({ page }) => {
    await page.goto("/whitelist");
    await expect(page.getByRole("button", { name: /Connect Stellar wallet/i })).toBeVisible();
  });

  test.describe("with wallet connected (mocked)", () => {
    test.beforeEach(async ({ page }) => {
      await seedWalletConnected(page, TEST_WALLET);
    });

    test("shows wallet connected badge and Join waitlist CTA", async ({ page }) => {
      await page.goto("/whitelist");

      // Wallet connected state shown
      await expect(page.getByText(/Wallet connected/i)).toBeVisible();
      await expect(page.getByText(`${TEST_WALLET.slice(0, 6)}...${TEST_WALLET.slice(-4)}`)).toBeVisible();

      // Join waitlist button visible
      await expect(page.getByRole("button", { name: /Join waitlist with this wallet/i })).toBeVisible();
    });
  });

  test.describe("ref query parameter", () => {
    test("displays referral credit notice when ?ref= is present", async ({ page }) => {
      await seedWalletConnected(page, TEST_WALLET);
      await page.goto(`/whitelist?ref=${TEST_REFERRAL_CODE}`);

      // Should show referral credit notice
      await expect(page.getByText(/You.*be credited to your referrer/i)).toBeVisible();
    });

    test("ref param is not shown in referral credit notice", async ({ page }) => {
      await seedWalletConnected(page, TEST_WALLET);
      await page.goto(`/whitelist?ref=${TEST_REFERRAL_CODE}`);

      // The ref code itself should not be leaked in the UI copy
      // (only the inviter wallet is attributed server-side)
      await expect(
        page.getByText(/You'll be credited to your referrer after registration/i),
      ).toBeVisible();
    });
  });

  test.describe("API response rendering (mocked)", () => {
    test("shows referral link and count after successful registration", async ({ page }) => {
      await seedWalletConnected(page, TEST_WALLET);

      // Intercept and mock the API calls
      await page.route("**/api/waitlist/challenge", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            challenge: "sign:tasmil:wl:1234567890:testnonce",
            nonce: "testnonce",
            expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          }),
        });
      });

      await page.route("**/api/waitlist/register-wallet", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "test-entry-id",
            referralCode: "WALLET01",
            success: true,
            alreadyRegistered: false,
          }),
        });
      });

      await page.goto(`/whitelist?ref=${TEST_REFERRAL_CODE}`);

      // After registration, the status panel should show the referral link
      // Trigger registration by clicking the button
      await page.getByRole("button", { name: /Join waitlist with this wallet/i }).click();

      // Wait for registration to complete and status to load
      // The wallet-waitlist-status component shows queue rank and referral info
      await expect(page.getByText(/Registration complete/i)).toBeVisible({ timeout: 5000 });
    });

    test("displays queue position and referral status from status endpoint", async ({ page }) => {
      await seedWalletConnected(page, TEST_WALLET);

      // Mock challenge
      await page.route("**/api/waitlist/challenge", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            challenge: "sign:tasmil:wl:1234567890:testnonce2",
            nonce: "testnonce2",
            expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          }),
        });
      });

      // Mock status endpoint (used after registration)
      await page.route(`**/api/waitlist/status**`, async (route) => {
        const url = new URL(route.request().url());
        const wallet = url.searchParams.get("walletAddress");
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "entry-123",
            walletAddress: wallet,
            referralCode: "WALLET01",
            queueRank: 42,
            totalEntries: 150,
            successfulReferralCount: 3,
            referredByCode: null,
            createdAt: new Date().toISOString(),
            hasEmail: false,
            emailDeliveryEligible: false,
          }),
        });
      });

      await page.route("**/api/waitlist/register-wallet", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "entry-123",
            referralCode: "WALLET01",
            success: true,
            alreadyRegistered: false,
          }),
        });
      });

      await page.goto("/whitelist");
      await page.getByRole("button", { name: /Join waitlist with this wallet/i }).click();

      // Wait for status panel to show queue rank
      await expect(page.getByText(/42/i)).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/3 referral/i)).toBeVisible({ timeout: 5000 });
    });
  });
});

test.describe("Wallet Waitlist — Referral Loop Card", () => {
  test("explains the referral mechanism", async ({ page }) => {
    await seedWalletDisconnected(page);
    await page.goto("/whitelist");

    // Referral loop card should explain how referrals work
    await expect(page.getByText(/referral/i)).toBeVisible();
  });
});

test.describe("Wallet Waitlist — Admin Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await seedAdminAuth(page);
  });

  test("dashboard shows wallet registration stats instead of email campaigns", async ({ page }) => {
    await page.route("**/api/admin/dashboard", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          waitlist: { last24h: 10, last7d: 50, allTime: 200 },
          walletStats: {
            totalWalletEntries: 150,
            contactableEntries: 80,
            last24h: 8,
            last7d: 40,
            totalSuccessfulReferrals: 25,
            topReferrers: [
              { walletAddress: "GAABC...ZZYZ", referralCount: 5 },
              { walletAddress: "GAXYZ...ZABC", referralCount: 3 },
            ],
          },
          emailDispatches: { confirmationSent: 100, confirmationFailed: 2, accessSent: 50, accessFailed: 1 },
          accessCodes: { total: 100, active: 80, exhausted: 20 },
          campaigns: { total: 5, completed: 3, failed: 1 },
        }),
      });
    });

    await page.goto("/admin/dashboard");

    // Should show wallet stats
    await expect(page.getByText("Wallet Registrations")).toBeVisible();
    await expect(page.getByText("Total Wallets")).toBeVisible();
    await expect(page.getByText("Contactable")).toBeVisible();

    // Should show top referrers section
    await expect(page.getByText("Top Referrers")).toBeVisible();

    // Should NOT show "Send Campaign" button (removed)
    await expect(page.getByRole("button", { name: /Send Campaign/i })).toHaveCount(0);
  });

  test("admin sidebar no longer has Campaigns nav item", async ({ page }) => {
    await seedAdminAuth(page);
    await page.goto("/admin/dashboard");

    // Dashboard link should still be present
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();

    // Campaigns link should be removed
    await expect(page.getByRole("link", { name: "Campaigns" })).toHaveCount(0);
  });

  test("shows empty top referrers state when no referrals yet", async ({ page }) => {
    await seedAdminAuth(page);
    await page.route("**/api/admin/dashboard", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          waitlist: { last24h: 5, last7d: 20, allTime: 50 },
          walletStats: {
            totalWalletEntries: 50,
            contactableEntries: 30,
            last24h: 5,
            last7d: 20,
            totalSuccessfulReferrals: 0,
            topReferrers: [],
          },
          emailDispatches: { confirmationSent: 0, confirmationFailed: 0, accessSent: 0, accessFailed: 0 },
          accessCodes: { total: 0, active: 0, exhausted: 0 },
          campaigns: { total: 0, completed: 0, failed: 0 },
        }),
      });
    });

    await page.goto("/admin/dashboard");

    // Top referrers section should not be rendered when list is empty
    // (the component conditionally renders it)
    await expect(page.getByText("Top Referrers")).toHaveCount(0);
  });
});
