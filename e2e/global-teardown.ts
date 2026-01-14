import type { FullConfig } from "@playwright/test";

async function globalTeardown(config: FullConfig) {
  console.log("🧹 Cleaning up E2E test environment...");

  // Perform any cleanup needed after all E2E tests
  // For example, clear test data, reset state, etc.

  console.log("✅ E2E test environment cleaned up");
}

export default globalTeardown;
