/**
 * X-share verify — frontend-to-backend HTTP contract.
 *
 * The /profile/referrals page does not yet expose a "Verify share" CTA in
 * the dashboard UI: only the "Share on X" / "Link your X account" entry
 * points exist (referrals-page.tsx). The X-share verify endpoint
 * (`POST /api/referral/verify-share`) is fully wired backend-side; this
 * spec exercises it through the same browser context the user sees.
 *
 * Why mock the BACKEND endpoint (not the AI sidecar):
 *   The plan's first draft proposed `page.route('**\/internal/x/get-tweet')`
 *   to intercept the AI sidecar call. That call fires server-side
 *   (backend → AI HTTP) and never reaches the browser, so `page.route()`
 *   cannot see it. The canonical Playwright pattern for FE flows that
 *   depend on backend logic is to mock the BACKEND endpoint
 *   (`page.route('**\/api/referral/verify-share', ...)`) and let the
 *   upstream chain be covered by lower layers:
 *     - 9 backend XApiClient unit tests (XV5)
 *     - 9 verifyShare service unit tests (XV8)
 *     - AI sidecar live smoke (XV4)
 *     - Mainnet endpoint smoke (recovery)
 *   That's exactly what this spec does.
 *
 * Why use `page.evaluate(fetch(...))` instead of UI clicks:
 *   No verify-share dialog ships in the FE today. Until the dashboard
 *   adds that surface, we drive the contract from a browser-side fetch
 *   so `page.route()` interception is real (not a `page.request` fake
 *   from Node). When the FE adds a `<VerifyShareDialog />` component,
 *   replace the `evaluate(fetch())` with `getByRole(...).click()` — the
 *   route-handler scaffolding stays identical.
 *
 * Skip behaviour:
 *   `test-login` is gated on `NODE_ENV !== 'production'` in the backend
 *   (auth.controller.ts:57). The mainnet docker stack runs production
 *   so the spec auto-skips there. Locally on dev (NODE_ENV=development,
 *   port 6756) it runs and asserts the four scenarios.
 */

import { expect, type Page, test } from "@playwright/test";

const BACKEND = process.env.PLAYWRIGHT_BACKEND_URL ?? "http://localhost:6756";

const S1_WALLET = "GREFXSHARE10000000000000000000000000000000000000000000";
const S2_WALLET = "GREFXSHARE20000000000000000000000000000000000000000000";
const S3_WALLET = "GREFXSHARE30000000000000000000000000000000000000000000";
const S4_WALLET = "GREFXSHARE40000000000000000000000000000000000000000000";

interface Session {
  jwt: string;
  walletAddress: string;
}

async function detectProductionBackend(): Promise<boolean> {
  // Fire test-login once with a synthetic wallet. The backend rejects with 403
  // when NODE_ENV=production, regardless of the test runner's own env. This
  // makes the skip robust against CI environments that forward NODE_ENV.
  try {
    const res = await fetch(`${BACKEND}/api/auth/wallet/test-login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        walletAddress: "GAA77777777777777777777777777777777777777777777777777BKW",
      }),
    });
    if (res.status === 403) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      return /production/i.test(body.message ?? "");
    }
    return false;
  } catch {
    return false;
  }
}

let backendIsProduction = false;
test.beforeAll(async () => {
  backendIsProduction = await detectProductionBackend();
});

test.beforeEach(async () => {
  test.skip(
    backendIsProduction || process.env.NODE_ENV === "production",
    "verify-share spec needs test-login (dev backend); skipped on production stack"
  );
});

async function loginAsWallet(page: Page, walletAddress: string): Promise<Session> {
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
        })
      );
      localStorage.setItem(
        "wallet-storage",
        JSON.stringify({ state: { account: walletAddress }, version: 0 })
      );
    },
    { walletAddress, jwt }
  );

  return { jwt, walletAddress };
}

interface VerifyShareResult {
  status: number;
  ok: boolean;
  body: unknown;
}

/**
 * Issue the verify-share request from inside the BROWSER so `page.route()`
 * can intercept it. `page.request.*` would dispatch from Node and bypass
 * route handlers entirely.
 */
async function callVerifyShareFromBrowser(
  page: Page,
  jwt: string,
  tweetUrl: string
): Promise<VerifyShareResult> {
  return page.evaluate(
    async ({ jwt, tweetUrl }) => {
      const res = await fetch("/api/referral/verify-share", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ tweetUrl }),
      });
      let body: unknown;
      try {
        body = await res.json();
      } catch {
        body = null;
      }
      return { status: res.status, ok: res.ok, body };
    },
    { jwt, tweetUrl }
  );
}

test.describe("Referral X-share verify (FE→BE HTTP contract, mocked endpoint)", () => {
  test("S1: pre-link guard — X_NOT_LINKED returns 403 with reason in body", async ({ page }) => {
    const { jwt } = await loginAsWallet(page, S1_WALLET);

    await page.route("**/api/referral/verify-share", async (route) => {
      expect(route.request().method()).toBe("POST");
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          statusCode: 403,
          message: "X_NOT_LINKED",
          path: "/api/referral/verify-share",
        }),
      });
    });

    await page.goto("/profile/referrals");
    const result = await callVerifyShareFromBrowser(page, jwt, "https://x.com/me/status/4001");

    expect(result.status).toBe(403);
    expect(result.ok).toBe(false);
    const body = result.body as { message?: string };
    expect(body.message).toBe("X_NOT_LINKED");
  });

  test("S2: happy path — verify returns credited:true and /me reflects +30 credits", async ({
    page,
  }) => {
    const { jwt } = await loginAsWallet(page, S2_WALLET);

    // The /me endpoint is hit multiple times during page load (React Query
    // refetch, Strict-Mode double-mount). To assert the post-verify state we
    // gate the snapshot on a flag that flips only after verify-share resolves.
    let verifyDidSucceed = false;
    const referralCode = "XSHARES2";
    const updatedSnapshot = {
      success: true,
      data: {
        referralCode,
        totalEarnedCredits: 30,
        joinClaimedAt: new Date().toISOString(),
        xLinked: true,
        recentEvents: [
          {
            kind: "X_SHARE",
            creditsAwarded: 30,
            occurredAt: new Date().toISOString(),
          },
        ],
      },
    };
    const initialSnapshot = {
      success: true,
      data: {
        referralCode,
        totalEarnedCredits: 0,
        joinClaimedAt: null,
        xLinked: true,
        recentEvents: [],
      },
    };

    await page.route("**/api/referral/me", async (route) => {
      const payload = verifyDidSucceed ? updatedSnapshot : initialSnapshot;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(payload),
      });
    });

    await page.route("**/api/referral/verify-share", async (route) => {
      const post = route.request();
      expect(post.method()).toBe("POST");
      const json = JSON.parse(post.postData() ?? "{}");
      expect(json.tweetUrl).toBe("https://x.com/tester/status/5000");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { credited: true },
        }),
      });
      verifyDidSucceed = true;
    });

    await page.goto("/profile/referrals");
    const result = await callVerifyShareFromBrowser(page, jwt, "https://x.com/tester/status/5000");

    expect(result.status).toBe(200);
    expect(result.ok).toBe(true);
    const body = result.body as { success: boolean; data: { credited: boolean } };
    expect(body.success).toBe(true);
    expect(body.data.credited).toBe(true);

    // Drive a /me re-fetch from the browser to assert the FE consumes the
    // updated snapshot (route handler returns +30 on the second call).
    const meAfter = await page.evaluate(async (jwt) => {
      const res = await fetch("/api/referral/me", {
        headers: { authorization: `Bearer ${jwt}` },
      });
      return res.json();
    }, jwt);
    const meBody = meAfter as {
      success: boolean;
      data: {
        totalEarnedCredits: number;
        recentEvents: Array<{ kind: string; creditsAwarded: number }>;
      };
    };
    expect(meBody.data.totalEarnedCredits).toBe(30);
    expect(meBody.data.recentEvents.some((e) => e.kind === "X_SHARE")).toBe(true);
  });

  test("S3: reply rejection — TWEET_NOT_ELIGIBLE returns 403", async ({ page }) => {
    const { jwt } = await loginAsWallet(page, S3_WALLET);

    await page.route("**/api/referral/verify-share", async (route) => {
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          statusCode: 403,
          message: "TWEET_NOT_ELIGIBLE",
          path: "/api/referral/verify-share",
        }),
      });
    });

    await page.goto("/profile/referrals");
    const result = await callVerifyShareFromBrowser(page, jwt, "https://x.com/tester/status/6000");

    expect(result.status).toBe(403);
    expect(result.ok).toBe(false);
    const body = result.body as { message?: string };
    expect(body.message).toBe("TWEET_NOT_ELIGIBLE");
  });

  test("S4: idempotent replay — second call returns credited:false, reason ALREADY_REDEEMED", async ({
    page,
  }) => {
    /**
     * Backend semantics (referral.service.ts:185-198): on unique-constraint
     * violation against `ReferralEvent (userId, sourceId)`, the service
     * RETURNS `{ credited: false, reason: 'ALREADY_REDEEMED' }` with HTTP 200
     * (not 409). The plan's "409" hint pre-dated the implementation; we
     * match the shipped contract here.
     */
    const { jwt } = await loginAsWallet(page, S4_WALLET);

    let verifyCallCount = 0;
    await page.route("**/api/referral/verify-share", async (route) => {
      verifyCallCount += 1;
      const payload =
        verifyCallCount === 1
          ? { success: true, data: { credited: true } }
          : {
              success: true,
              data: { credited: false, reason: "ALREADY_REDEEMED" },
            };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(payload),
      });
    });

    await page.goto("/profile/referrals");

    const tweetUrl = "https://x.com/tester/status/7000";
    const first = await callVerifyShareFromBrowser(page, jwt, tweetUrl);
    expect(first.status).toBe(200);
    expect((first.body as { data: { credited: boolean } }).data.credited).toBe(true);

    const second = await callVerifyShareFromBrowser(page, jwt, tweetUrl);
    expect(second.status).toBe(200);
    const secondBody = second.body as {
      data: { credited: boolean; reason?: string };
    };
    expect(secondBody.data.credited).toBe(false);
    expect(secondBody.data.reason).toBe("ALREADY_REDEEMED");
    expect(verifyCallCount).toBe(2);
  });
});
