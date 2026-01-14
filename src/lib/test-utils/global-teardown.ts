export default async function globalTeardown(): Promise<void> {
  // Global teardown for DeFi testing environment
  console.log("🧹 Cleaning up DeFi test environment...");

  // Calculate test duration
  const duration = Date.now() - ((global as any).__TEST_START_TIME__ || 0);
  console.log(`⏱️  Total test duration: ${duration}ms`);

  // Clean up any global test state
  delete (global as any).__TEST_START_TIME__;

  console.log("✅ DeFi test environment cleaned up");
}
