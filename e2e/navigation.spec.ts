import { expect, test } from "@playwright/test";
import { freshWallet, loginAsWallet } from "./helpers/auth";

test.describe("Navigation — header layout (Task 11)", () => {
  test.skip(process.env.NODE_ENV === "production", "test-login is disabled on production");

  test("Desktop: TopNavBar renders all nav links", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");

    // TopNavBar is rendered inside the page — nav element with brand name
    const nav = page.locator("nav").first();
    await expect(nav).toBeVisible();

    // Nav links visible: Chat, Farming, Aggregator, Portfolio
    // These come from sidebar-data navGroups
    await expect(page.getByText("Chat").first()).toBeVisible();
    await expect(page.getByText("Farming").first()).toBeVisible();
    await expect(page.getByText("Aggregator").first()).toBeVisible();
    await expect(page.getByText("Portfolio").first()).toBeVisible();
  });

  test("Desktop: active route has bg-primary/10 highlight class", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/portfolio");

    // Active Portfolio link gets the bg-primary/10 class
    // NavLink uses usePathname().startsWith() — /portfolio should be active
    const portfolioLinks = page.getByText("Portfolio");
    const firstLink = portfolioLinks.first();
    await expect(firstLink).toBeVisible();
    // Check the parent link element has the active styling
    const linkElement = page.locator("a[href='/portfolio']").first();
    await expect(linkElement).toHaveClass(/bg-primary\/10/);
  });

  test("Desktop: credits pill and clock toggle visible in right controls", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");

    // CreditsPill — already has data-testid="credits-pill" and "credits-pill-amount"
    await expect(page.getByTestId("credits-pill")).toBeVisible();
    await expect(page.getByTestId("credits-pill-amount")).toBeVisible();

    // Clock icon in nav (MultiSidebarTrigger) — right sidebar toggle
    await expect(page.locator("nav svg.lucide-clock").first()).toBeVisible();

    // ConnectWalletButton
    await expect(page.getByRole("button", { name: /Connect Wallet|Disconnect/i })).toBeVisible();
  });

  test("Desktop: clicking nav links navigates between routes", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");

    // Click Portfolio link
    await page.locator("a[href='/portfolio']").first().click();
    await expect(page).toHaveURL(/\/portfolio/);

    // Click Aggregator link
    await page.locator("a[href='/aggregator']").first().click();
    await expect(page).toHaveURL(/\/aggregator/);

    // Click Chat link
    await page.locator("a[href*='/chat']").first().click();
    await expect(page).toHaveURL(/\/chat/);

    // Click Farming link
    await page.locator("a[href='/farming']").first().click();
    await expect(page).toHaveURL(/\/farming/);
  });

  test("Mobile: hamburger menu opens sheet drawer with navigation items", async ({ page }) => {
    // iPhone SE viewport triggers useIsMobile() breakpoint (md=768px)
    await page.setViewportSize({ width: 375, height: 812 });

    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");

    // Mobile header has PanelLeft icon button
    const hamburger = page.locator("header button svg.lucide-panel-left").first();
    await expect(hamburger).toBeVisible();
    await hamburger.click();

    // Sheet drawer opens — navigation items visible inside
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 3000 });

    // Mobile sidebar nav links
    await expect(page.getByText("Farming").first()).toBeVisible();
    await expect(page.getByText("Portfolio").first()).toBeVisible();
    await expect(page.getByText("Aggregator").first()).toBeVisible();
  });
});
