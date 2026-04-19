import { test, expect } from "@playwright/test";

test.describe("Protocol Playground", () => {
  test.beforeEach(async ({ page }) => {
    // Mock health API to avoid hitting real blockchain
    await page.route("**/api/protocols/health", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          network: "testnet",
          health: [
            { protocol: "blend", status: "ok", latencyMs: 120 },
            { protocol: "aquarius", status: "ok", latencyMs: 200 },
            { protocol: "soroswap", status: "ok", latencyMs: 150 },
            { protocol: "phoenix", status: "ok", latencyMs: 300 },
            { protocol: "sdex", status: "ok", latencyMs: 80 },
            { protocol: "allbridge", status: "error", latencyMs: 8000, error: "Timeout" },
            { protocol: "defindex", status: "ok", latencyMs: 250 },
            { protocol: "templar", status: "ok", latencyMs: 400 },
          ],
        }),
      }),
    );
  });

  test("page loads and shows sidebar with all 8 protocols", async ({ page }) => {
    await page.goto("/dev/protocols");
    await page.waitForLoadState("networkidle");

    // Sidebar should show all protocols
    const sidebar = page.locator("text=Blend Protocol");
    await expect(sidebar).toBeVisible();
    await expect(page.locator("text=Aquarius")).toBeVisible();
    await expect(page.locator("text=Soroswap")).toBeVisible();
    await expect(page.locator("text=Phoenix")).toBeVisible();
    await expect(page.locator("text=Stellar DEX")).toBeVisible();
    await expect(page.locator("text=Allbridge")).toBeVisible();
    await expect(page.locator("text=DeFindex")).toBeVisible();
    await expect(page.locator("text=Templar")).toBeVisible();
  });

  test("default selection is Blend with correct panels", async ({ page }) => {
    await page.goto("/dev/protocols?protocol=blend");
    await page.waitForLoadState("networkidle");

    // Should show Blend panels
    await expect(page.locator("text=List Pools")).toBeVisible();
    await expect(page.locator("text=Pool Detail")).toBeVisible();
    await expect(page.locator("text=Yield Opportunities")).toBeVisible();
    await expect(page.locator("text=User Positions")).toBeVisible();
    await expect(page.locator("text=Lending Markets")).toBeVisible();
  });

  test("clicking protocol in sidebar switches panels", async ({ page }) => {
    await page.goto("/dev/protocols?protocol=blend");
    await page.waitForLoadState("networkidle");

    // Click SDEX
    await page.locator("text=Stellar DEX").click();

    // Should show SDEX panels (no pools panel)
    await expect(page.locator("text=Yield Opportunities")).toBeVisible();
    await expect(page.locator("text=Swap Quote")).toBeVisible();
    await expect(page.locator("text=Order Book")).toBeVisible();

    // URL should update
    await expect(page).toHaveURL(/protocol=sdex/);
  });

  test("fetch button triggers loading and shows result", async ({ page }) => {
    // Mock the yield API
    await page.route("**/api/protocols/blend/yield", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          network: "testnet",
          protocol: "blend",
          count: 1,
          opportunities: [
            {
              protocol: "blend",
              type: "lending",
              name: "Blend XLM Supply",
              assets: ["XLM"],
              apy: { base: 0.05, reward: 0.02, total: 0.07 },
              tvl: "1000000",
              risk: "low",
              status: "ok",
            },
          ],
        }),
      }),
    );

    await page.goto("/dev/protocols?protocol=blend");
    await page.waitForLoadState("networkidle");

    // Find and click the Fetch button in the Yield panel
    const yieldPanel = page.locator("text=Yield Opportunities").locator("..").locator("..");
    const fetchBtn = yieldPanel.locator("button", { hasText: "Fetch" });
    await fetchBtn.click();

    // Should show the result
    await expect(page.locator("text=Blend XLM Supply")).toBeVisible({ timeout: 10000 });
  });

  test("JSON toggle shows raw response", async ({ page }) => {
    await page.route("**/api/protocols/blend/yield", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true, network: "testnet", protocol: "blend", count: 0, opportunities: [],
        }),
      }),
    );

    await page.goto("/dev/protocols?protocol=blend");
    await page.waitForLoadState("networkidle");

    // Fetch yield data
    const yieldPanel = page.locator("text=Yield Opportunities").locator("..").locator("..");
    await yieldPanel.locator("button", { hasText: "Fetch" }).click();

    // Click JSON toggle
    await yieldPanel.locator("button", { hasText: "JSON" }).click();

    // Should show raw JSON
    await expect(page.locator("text=\"success\"")).toBeVisible({ timeout: 5000 });
  });

  test("error state renders correctly", async ({ page }) => {
    await page.route("**/api/protocols/blend/pools", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ success: false, error: "Soroban RPC unavailable" }),
      }),
    );

    await page.goto("/dev/protocols?protocol=blend");
    await page.waitForLoadState("networkidle");

    // Fetch pools
    const poolsPanel = page.locator("text=List Pools").locator("..").locator("..");
    await poolsPanel.locator("button", { hasText: "Fetch" }).click();

    // Should show error
    await expect(page.locator("text=Soroban RPC unavailable")).toBeVisible({ timeout: 5000 });
  });

  test("health indicators show in sidebar", async ({ page }) => {
    await page.goto("/dev/protocols");
    await page.waitForLoadState("networkidle");

    // Health dots should be visible (green for ok, red for error)
    // Check that at least some health indicators rendered
    const healthDots = page.locator(".rounded-full.h-2.w-2");
    const count = await healthDots.count();
    expect(count).toBeGreaterThan(0);
  });
});
