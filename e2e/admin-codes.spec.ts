/**
 * /admin/codes — UI interaction matrix
 *
 * The codes page renders:
 *   - Left panel: "Generate Codes" form (Quantity input 1-100 + Generate
 *     button) + optional "Last Batch" preview with a Copy-All button
 *   - Right panel: codes table with Copy + Revoke action buttons + paging
 *
 * Scenarios:
 *   S1 anonymous → /admin/codes redirects to /admin/login
 *   S2 logged in → form + table render
 *   S3 quantity input enforces 1-100 range
 *   S4 Generate button click → batch returned, "Last Batch" preview shows
 *      the new codes, Copy All button is present
 *   S5 Copy All writes the codes to clipboard
 */

import { expect, test, type Page } from "@playwright/test";
import { attachConsoleSpy } from "./_helpers/console-filter";

// Provision admins via the FE proxy at PLAYWRIGHT_BASE_URL — that talks
// to whatever backend the frontend rewrites to (mainnet container's
// backend on local dev). This way the admin row lives in the same DB
// cluster the FE auth-guard checks against.
const ADMIN_EMAIL = `admin-codes-${Date.now()}@e2e.test`;
const ADMIN_PASSWORD = "AdminCodesE2E!Pw123";

async function provisionAdmin(
  page: Page,
  opts: {
    email: string;
    password: string;
    role: "SUPER_ADMIN" | "CAMPAIGN_ADMIN";
  },
): Promise<void> {
  const res = await page.request.post(`/api/admin-auth/create`, {
    headers: { "content-type": "application/json" },
    data: opts,
  });
  if (![200, 201, 400].includes(res.status())) {
    throw new Error(`admin create ${res.status()}: ${await res.text()}`);
  }
}

async function loginAdminViaForm(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/admin/login");
  await page.locator("#admin-email").fill(email);
  await page.locator("#admin-password").fill(password);
  await Promise.all([
    page.waitForURL(/\/admin\/(dashboard|topups|codes|campaigns)/, { timeout: 15_000 }),
    page.locator('button[type="submit"]').click(),
  ]);
}

async function readAdminToken(page: Page): Promise<string | null> {
  // The admin auth store keys the token under `state.token` (not
  // accessToken — the persist middleware drops the function fields).
  for (let i = 0; i < 10; i++) {
    const token = await page.evaluate(() => {
      const raw = localStorage.getItem("admin-auth-storage");
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        return parsed?.state?.token ?? parsed?.state?.accessToken ?? null;
      } catch {
        return null;
      }
    });
    if (token) return token;
    await page.waitForTimeout(200);
  }
  return null;
}

/**
 * Returns true when the codes backend module is unavailable (5xx).
 * On the mainnet container the module is disabled — tests that mutate
 * codes should skip in that case.
 */
async function isCodesFeatureDisabled(page: Page): Promise<boolean> {
  // Probe by fetching dashboard first (which IS reachable). Don't navigate
  // to /admin/codes — that triggers AdminAuthGuard which redirects to
  // /admin/login when the codes-page useAdminCodes() query 5xx-fails.
  await page.goto("/admin/dashboard");
  const token = await readAdminToken(page);
  if (!token) return false;
  const probe = await page.request.get(`/api/admin/codes?page=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return probe.status() >= 500;
}

test.describe("/admin/codes — UI interaction matrix", () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await provisionAdmin(page, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: "SUPER_ADMIN",
    });
    await ctx.close();
  });

  test("S1: anonymous → /admin/codes redirects to /admin/login", async ({ page }) => {
    await page.goto("/admin/codes");
    await page.waitForURL(/\/admin\/login/, { timeout: 10_000 });
    await expect(page.locator("#admin-email")).toBeVisible();
  });

  test("S2: logged in → form + table render", async ({ page }) => {
    const { errors } = attachConsoleSpy(page);

    await loginAdminViaForm(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/admin/codes");

    await expect(page.getByRole("heading", { name: /Generate Codes/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("heading", { name: /^All Codes$/i })).toBeVisible();
    await expect(page.locator("#quantity")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Generate$/ })).toBeVisible();

    // /api/admin/codes can 5xx on a fresh mainnet DB cluster where the
    // codes table is empty/not-yet-migrated. Filter that out.
    const noisy = errors.filter(
      (e) => !/api 5\d\d.*\/api\/admin\//.test(e),
    );
    expect(noisy, `Unexpected console errors: ${noisy.join("\n")}`).toEqual([]);
  });

  test("S3: quantity input clamps to 1–100 range", async ({ page }) => {
    const { errors: _errors } = attachConsoleSpy(page);
    await loginAdminViaForm(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/admin/codes");

    const qty = page.locator("#quantity");
    await expect(qty).toBeVisible({ timeout: 15_000 });

    // Setting 999 → onChange clamps to 100 via Math.min(100, ...).
    await qty.fill("999");
    await expect(qty).toHaveValue("100");

    // Setting 0 → onChange clamps to 1 via Math.max(1, ...).
    await qty.fill("0");
    await expect(qty).toHaveValue("1");

    // Restore a sensible value.
    await qty.fill("5");
    await expect(qty).toHaveValue("5");
  });

  test("S4: Generate button creates a batch and shows Last Batch preview", async ({ page }) => {
    const { errors: _errors } = attachConsoleSpy(page);
    await loginAdminViaForm(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    if (await isCodesFeatureDisabled(page)) {
      test.skip(true, "Codes feature unavailable on this backend (5xx)");
      return;
    }

    await page.goto("/admin/codes");
    const qty = page.locator("#quantity");
    await expect(qty).toBeVisible({ timeout: 15_000 });
    await qty.fill("3");

    await page.getByRole("button", { name: /^Generate$/ }).click();

    // The "Last Batch (3)" header appears once the mutation resolves.
    await expect(page.getByText(/Last Batch \(3\)/i)).toBeVisible({ timeout: 15_000 });
    // The Copy All button is rendered.
    await expect(page.getByRole("button", { name: /Copy All/i })).toBeVisible();
  });

  test("S5: Copy All writes the codes to clipboard", async ({ browser }) => {
    const ctx = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
    const page = await ctx.newPage();
    const { errors: _errors } = attachConsoleSpy(page);

    await loginAdminViaForm(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    if (await isCodesFeatureDisabled(page)) {
      test.skip(true, "Codes feature unavailable on this backend (5xx)");
      await ctx.close();
      return;
    }

    await page.goto("/admin/codes");
    const qty = page.locator("#quantity");
    await expect(qty).toBeVisible({ timeout: 15_000 });
    await qty.fill("2");
    await page.getByRole("button", { name: /^Generate$/ }).click();

    await expect(page.getByText(/Last Batch \(2\)/i)).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /Copy All/i }).click();

    const clip = await page.evaluate(async () => navigator.clipboard.readText());
    // Expect 2 newline-separated alphanumeric codes.
    const lines = clip.split("\n").filter(Boolean);
    expect(lines).toHaveLength(2);
    for (const line of lines) {
      expect(line).toMatch(/^[A-Z0-9-]+$/i);
    }

    await ctx.close();
  });
});
