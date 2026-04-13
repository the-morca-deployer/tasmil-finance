import { expect, test } from "@playwright/test";

function seedAdminAuth(page: import("@playwright/test").Page) {
  return page.addInitScript(() => {
    const state = {
      state: {
        token: "test-token",
        admin: { id: "1", email: "admin@test.local", role: "admin" },
        isAuthenticated: true,
        hasHydrated: true,
      },
      version: 0,
    };
    localStorage.setItem("admin-auth-storage", JSON.stringify(state));
  });
}

function seedAdminUnauth(page: import("@playwright/test").Page) {
  return page.addInitScript(() => {
    localStorage.setItem("admin-auth-storage", JSON.stringify({
      state: {
        token: null,
        admin: null,
        isAuthenticated: false,
        hasHydrated: true,
      },
      version: 0,
    }));
  });
}

test.describe("Admin Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await seedAdminUnauth(page);
  });

  test("renders as standalone page without sidebar or footer chrome", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByRole("heading", { name: "Admin Portal" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Dashboard" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Agents" })).toHaveCount(0);
    await expect(page.getByText("Connect Wallet", { exact: false })).toHaveCount(0);
    await expect(page.getByText("Complete Quests", { exact: false })).toHaveCount(0);
  });

  test("login form has accessible labels", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("unauthenticated /admin/dashboard redirects to /admin/login", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});

test.describe("Admin Shell (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await seedAdminAuth(page);
  });

  test("dashboard renders only admin navigation items", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page.getByRole("heading", { name: "Whitelist Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    // Campaigns nav item removed — waitlist is now wallet-native
    await expect(page.getByRole("link", { name: "Campaigns" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Agents" })).toHaveCount(0);
    await expect(page.getByText("Connect Wallet", { exact: false })).toHaveCount(0);
    await expect(page.getByText("Complete Quests", { exact: false })).toHaveCount(0);
  });

  test("logout navigates to login", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});

test.describe("Admin Mobile Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await seedAdminAuth(page);
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test("mobile menu contains only Dashboard (Campaigns retired)", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await page.getByRole("button", { name: /open admin navigation/i }).click();
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    // Campaigns nav item removed — waitlist is now wallet-native
    await expect(page.getByRole("link", { name: "Campaigns" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Agents" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Portfolio" })).toHaveCount(0);
  });

  test("mobile header shows sign out button", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible();
  });
});

test.describe("Admin Theme Behavior", () => {
  test("renders dark when browser preference is dark regardless of legacy theme key", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem("theme", "light");
    });
    await page.emulateMedia({ colorScheme: "dark" });
    await seedAdminAuth(page);
    await page.goto("/admin/login");
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("renders light when browser preference is light", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await seedAdminAuth(page);
    await page.goto("/admin/dashboard");
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });
});
