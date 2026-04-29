import type { ConsoleMessage, Page } from "@playwright/test";

/**
 * Attaches a console + page-error + response listener to the page and returns
 * a mutable `errors` array. Filters generic resource-load 404 noise. Allows
 * /api/* 401 (bootstrap auth pattern). Errors on:
 *   - any JS console.error()
 *   - any `pageerror` event
 *   - any /api/* response with status >= 400 except 401.
 *
 * Shared across e2e specs to keep the noise floor consistent. Replaces the
 * previously duplicated inline `attachConsoleSpy` / `attachConsoleAndNetworkAsserts`
 * helpers across credits/topup-catalog/chat-overflow.
 */
export function attachConsoleSpy(page: Page): { errors: string[] } {
  const errors: string[] = [];
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    // Ignore generic "Failed to load resource" 404s on static assets — these
    // are repo-wide pre-existing noise (image quality config warnings, etc).
    // We assert real JS errors and unexpected /api/* failures separately.
    if (text.startsWith("Failed to load resource:")) return;
    errors.push(text);
  });
  page.on("pageerror", (err) => {
    errors.push(`pageerror: ${err.message}`);
  });
  page.on("response", (resp) => {
    const url = resp.url();
    const status = resp.status();
    if (!url.includes("/api/")) return;
    // Allow 401 on bootstrap (existing auth flow expectation).
    if (status >= 400 && status !== 401) {
      errors.push(`api ${status} ${url}`);
    }
  });
  return { errors };
}
