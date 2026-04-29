/**
 * Phase 5 — Service Worker cache verification.
 *
 * These tests exercise the actual SW registered at /sw-images.js. They:
 *   1. addInitScript injects window.__NEXT_PUBLIC_ENABLE_SW_CACHE_OVERRIDE__='true'
 *      so the Registrar fires even though dev defaults the build-time flag off.
 *   2. context.route() intercepts every CDN request and returns a synthetic
 *      1x1 PNG. The Playwright sandbox has no internet egress, so without
 *      this the SW prewarm fetches all fail with "Failed to fetch" and the
 *      cache stays empty. With it, behavior matches production: SW install
 *      prewarms, fetch handler intercepts subsequent requests, cache-first
 *      strategy delivers warm-visit hits without network.
 *   3. Drive cold + warm visits, asserting via cache.keys() that the cache
 *      populates and via route-call counters that warm visits skip the
 *      network entirely.
 *
 * The runtime override is read by service-worker-registrar.tsx — see
 * apps/frontend/src/shared/components/service-worker-registrar.tsx.
 */

import { expect, test } from "@playwright/test";
import { attachConsoleSpy } from "./_helpers/console-filter";

const CDN_HOST = "tasmil-assets.sgp1.cdn.digitaloceanspaces.com";

// 1x1 transparent PNG so the SW prewarm + Next image optimizer always get a
// valid image response regardless of network egress. Base64 of the smallest
// possible PNG.
const ONE_BY_ONE_PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkAAIAAAoAAv/lxKUAAAAASUVORK5CYII=";
const ONE_BY_ONE_PNG = Buffer.from(ONE_BY_ONE_PNG_B64, "base64");

// /topup renders without auth, so it's a stable target for the cold/warm
// visit scenarios. The page itself doesn't render TokenImages — the SW's
// install-time prewarm reads the manifest and fetches every entry, which
// is what populates tasmil-token-icons-v1.
const TARGET_PATH = "/topup";

type CdnRouteCounter = { count: number; urls: string[] };

/**
 * Install a context-level route handler that responds to every CDN GET with
 * a 1x1 PNG. Returns a counter tracking how many times the handler fired,
 * which is the reliable way to detect "did this fetch hit the network" —
 * SW-cache hits never reach the route handler. Counts only token-icon paths
 * to keep the assertions precise.
 */
async function installCdnRouteCounter(
  page: import("@playwright/test").Page,
): Promise<CdnRouteCounter> {
  const counter: CdnRouteCounter = { count: 0, urls: [] };
  await page.context().route(`https://${CDN_HOST}/**`, async (route, request) => {
    if (request.method() === "GET") {
      const url = request.url();
      if (url.includes("/static/tokens/")) {
        counter.count += 1;
        counter.urls.push(url);
      }
    }
    await route.fulfill({
      status: 200,
      contentType: "image/png",
      headers: { "cache-control": "public, max-age=31536000, immutable" },
      body: ONE_BY_ONE_PNG,
    });
  });
  return counter;
}

test.beforeEach(async ({ context }) => {
  // Force SW enabled regardless of dev default.
  await context.addInitScript(() => {
    Object.defineProperty(window, "__NEXT_PUBLIC_ENABLE_SW_CACHE_OVERRIDE__", {
      value: "true",
      writable: false,
      configurable: false,
    });
  });
});

test.describe("Phase 5 — Service Worker image cache", () => {
  test("S1: cold visit — SW install prewarm fetches token icons from CDN", async ({ page }) => {
    const { errors } = attachConsoleSpy(page);
    const cdn = await installCdnRouteCounter(page);

    await page.goto(TARGET_PATH);
    await page.waitForLoadState("networkidle");

    // Wait for the SW to take control + install handler to finish prewarming.
    // skipWaiting() is awaited *after* the prewarm in sw-images.js, so once
    // navigator.serviceWorker.controller is non-null, prewarm has at least
    // begun populating the cache.
    await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, undefined, {
      timeout: 10_000,
    });

    // Give the prewarm Promise.all 5s to land. With 163 manifest entries this
    // is comfortable when the route handler returns synchronously.
    await page.waitForFunction(
      async () => {
        const cache = await caches.open("tasmil-token-icons-v1");
        const requests = await cache.keys();
        return requests.length > 0;
      },
      undefined,
      { timeout: 10_000 },
    );

    expect(
      cdn.count,
      `cold visit should issue >= 1 token-icon CDN GET via SW prewarm; saw ${cdn.count}`,
    ).toBeGreaterThan(0);

    expect(errors).toEqual([]);
  });

  test("S2: SW registers + token-icons cache populates from manifest prewarm", async ({ page }) => {
    const { errors } = attachConsoleSpy(page);
    await installCdnRouteCounter(page);

    await page.goto(TARGET_PATH);
    await page.waitForLoadState("networkidle");

    await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, undefined, {
      timeout: 10_000,
    });

    const cacheKeys = await page.evaluate(async () => {
      const keys = await caches.keys();
      return keys.sort();
    });

    expect(cacheKeys, `caches present: ${cacheKeys.join(",")}`).toContain("tasmil-token-icons-v1");

    // The token cache prewarms at install from manifest.tokens. Give it
    // up to 10s to finish populating.
    await page.waitForFunction(
      async () => {
        const cache = await caches.open("tasmil-token-icons-v1");
        const requests = await cache.keys();
        return requests.length > 0;
      },
      undefined,
      { timeout: 10_000 },
    );

    const tokenCacheUrls = await page.evaluate(async () => {
      const cache = await caches.open("tasmil-token-icons-v1");
      const requests = await cache.keys();
      return requests.map((r) => r.url);
    });

    expect(
      tokenCacheUrls.length,
      "token cache empty after install — manifest prewarm should populate >= 1 entry",
    ).toBeGreaterThan(0);

    // All cached URLs should point at the CDN.
    for (const url of tokenCacheUrls) {
      expect(url).toContain(CDN_HOST);
    }

    expect(errors).toEqual([]);
  });

  test("S3: warm visit — zero CDN token-icon requests on reload", async ({ page }) => {
    const { errors } = attachConsoleSpy(page);
    const cdn = await installCdnRouteCounter(page);

    // Cold visit primes the SW + cache.
    await page.goto(TARGET_PATH);
    await page.waitForLoadState("networkidle");
    await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, undefined, {
      timeout: 10_000,
    });
    await page.waitForFunction(
      async () => {
        const cache = await caches.open("tasmil-token-icons-v1");
        const requests = await cache.keys();
        return requests.length > 0;
      },
      undefined,
      { timeout: 10_000 },
    );

    // Wait for prewarm to settle. Without this small grace period the
    // counter can keep ticking after we reset it because the 163 in-flight
    // manifest fetches haven't all landed.
    await page.waitForTimeout(2000);

    // Snapshot the warm baseline: how many fetches we've seen so far.
    const warmBaseline = cdn.count;

    await page.reload();
    await page.waitForLoadState("networkidle");
    // Give the page a moment to render any token icons it would render.
    await page.waitForTimeout(1500);

    const warmDelta = cdn.count - warmBaseline;
    expect(
      warmDelta,
      `warm reload still hit CDN ${warmDelta} times beyond baseline. Recent URLs: ${cdn.urls
        .slice(-3)
        .join(", ")}`,
    ).toBe(0);

    expect(errors).toEqual([]);
  });

  test("S4: cross-page navigation — token cache survives /portfolio → /topup walk", async ({
    page,
  }) => {
    const { errors } = attachConsoleSpy(page);
    await installCdnRouteCounter(page);

    await page.goto(TARGET_PATH);
    await page.waitForLoadState("networkidle");
    await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, undefined, {
      timeout: 10_000,
    });
    await page.waitForFunction(
      async () => {
        const cache = await caches.open("tasmil-token-icons-v1");
        const requests = await cache.keys();
        return requests.length > 0;
      },
      undefined,
      { timeout: 10_000 },
    );

    const sizeBefore = await page.evaluate(async () => {
      const cache = await caches.open("tasmil-token-icons-v1");
      const r = await cache.keys();
      return r.length;
    });

    // Navigate away and back. The cache must remain non-shrinking and
    // ideally identical (no eviction).
    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");
    await page.goto(TARGET_PATH);
    await page.waitForLoadState("networkidle");

    const sizeAfter = await page.evaluate(async () => {
      const cache = await caches.open("tasmil-token-icons-v1");
      const r = await cache.keys();
      return r.length;
    });

    expect(
      sizeAfter,
      `cache shrank from ${sizeBefore} to ${sizeAfter} during cross-page walk`,
    ).toBeGreaterThanOrEqual(sizeBefore);

    expect(errors).toEqual([]);
  });
});
