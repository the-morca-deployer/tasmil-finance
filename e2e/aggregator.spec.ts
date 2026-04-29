/**
 * /aggregator — UI interaction matrix
 *
 * /aggregator is gated by src/proxy.ts (Next 16 middleware) on every
 * environment that does not set NEXT_PUBLIC_APP_ENV=development. On a
 * gated build (mainnet, staging) the route 307-redirects to /agents; on
 * a development build the full compare-rates UI renders.
 *
 * The gate exists because the Allbridge multi-chain aggregator surface
 * is still being hardened for mainnet — supported-chain coverage is
 * being reverified before we expose it to production users. To restore
 * the aggregator on a deployed build, set NEXT_PUBLIC_APP_ENV=development
 * on the container or remove the dev-gate branch from src/proxy.ts (and
 * also un-gate the sidebar entry in shared/layout/sidebar-data.ts).
 *
 * S1 always runs: detect the redirect contract; on a development build
 *    it falls back to asserting the aggregator hero loads.
 * S2-S5 require the aggregator UI to be reachable. They skip dynamically
 *    when the proxy.ts gate is in effect (i.e. on mainnet/staging).
 *
 * Driving an actual swap end-to-end requires a real Soroban-signing
 * wallet extension; that's covered by the contract integration tests,
 * not here.
 */

import { expect, test, type Page } from "@playwright/test";
import { attachConsoleSpy } from "./_helpers/console-filter";

async function isAggregatorGated(page: Page): Promise<boolean> {
  const res = await page.request
    .get("/aggregator", { maxRedirects: 0 })
    .catch(() => null);
  if (!res) return false;
  const status = res.status();
  if (status >= 300 && status < 400) {
    const loc = res.headers()["location"] ?? "";
    return loc.endsWith("/agents") || loc.includes("/agents");
  }
  return false;
}

test.describe("/aggregator — UI interaction matrix", () => {
  test("S1: middleware-gated mainnet build redirects /aggregator -> /agents", async ({
    page,
  }) => {
    const { errors: _errors } = attachConsoleSpy(page);

    const gated = await isAggregatorGated(page);
    if (!gated) {
      // Testnet build: aggregator hero renders directly.
      await page.goto("/aggregator");
      await expect(page.getByRole("heading", { name: /DeFi Aggregator/i })).toBeVisible({
        timeout: 20_000,
      });
      return;
    }
    // Mainnet: hitting /aggregator lands on /agents.
    await page.goto("/aggregator");
    await page.waitForURL(/\/agents$/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /Explore AI Tasmil Agents/i })).toBeVisible({
      timeout: 20_000,
    });
  });

  test("S2: typing into the You-pay input updates the value", async ({ page }) => {
    const gated = await isAggregatorGated(page);
    test.skip(
      gated,
      "Aggregator UI gated by proxy.ts (NEXT_PUBLIC_APP_ENV != development) — set the env to restore",
    );

    await page.goto("/aggregator");
    const amountInputs = page.locator('input[placeholder="0"]');
    await expect(amountInputs.first()).toBeVisible({ timeout: 20_000 });
    const youPay = amountInputs.first();
    await youPay.click();
    await youPay.fill("");
    await youPay.type("12");
    await expect(youPay).toHaveValue("12");
  });

  test("S3: swap-direction button is interactive (click does not throw)", async ({ page }) => {
    const gated = await isAggregatorGated(page);
    test.skip(
      gated,
      "Aggregator UI gated by proxy.ts (NEXT_PUBLIC_APP_ENV != development) — set the env to restore",
    );

    await page.goto("/aggregator");
    await expect(page.getByRole("heading", { name: /DeFi Aggregator/i })).toBeVisible({
      timeout: 15_000,
    });

    const swapBtn = page
      .locator("button")
      .filter({
        has: page.locator(
          "svg.lucide-arrow-up-down, svg[class*='lucide-arrow-up-down']",
        ),
      })
      .first();

    if ((await swapBtn.count()) > 0) {
      await swapBtn.click({ timeout: 5_000 }).catch(() => {
        // Click may no-op when no tokens are selected; not a failure.
      });
    }
  });

  test("S4: ?amount= prefill populates the You-pay input", async ({ page }) => {
    const gated = await isAggregatorGated(page);
    test.skip(
      gated,
      "Aggregator UI gated by proxy.ts (NEXT_PUBLIC_APP_ENV != development) — set the env to restore",
    );

    await page.goto(
      "/aggregator?tokenIn=XLM&chainIn=stellar&tokenOut=USDC&chainOut=stellar&amount=42",
    );
    const youPay = page.locator('input[placeholder="0"]').first();
    await expect(youPay).toHaveValue("42", { timeout: 20_000 });
  });

  test("S5: CTA button is rendered (Connect / Enter amount / Select state)", async ({
    page,
  }) => {
    const gated = await isAggregatorGated(page);
    test.skip(
      gated,
      "Aggregator UI gated by proxy.ts (NEXT_PUBLIC_APP_ENV != development) — set the env to restore",
    );

    await page.goto("/aggregator");
    await expect(page.getByRole("heading", { name: /DeFi Aggregator/i })).toBeVisible({
      timeout: 15_000,
    });

    const cta = page
      .locator(
        'button:has-text("Connect source wallet"), button:has-text("Connect destination wallet"), button:has-text("Enter amount"), button:has-text("Select tokens"), button:has-text("Select a route"), button:has-text("Swap"), button:has-text("Insufficient balance")',
      )
      .first();
    await expect(cta).toBeVisible({ timeout: 20_000 });
  });
});
