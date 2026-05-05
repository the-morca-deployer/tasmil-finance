import { mkdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Global setup for E2E tests.
 * Creates directories needed for screenshots and artifacts.
 */
export default function globalSetup() {
  const cardsDir = join(process.cwd(), "e2e", "test-results", "cards");
  mkdirSync(cardsDir, { recursive: true });
}
