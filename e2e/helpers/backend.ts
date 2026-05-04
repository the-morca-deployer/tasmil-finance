const BACKEND = process.env.PLAYWRIGHT_BACKEND_URL ?? "http://localhost:6756";
const SERVICE_KEY = process.env.AI_INTERNAL_SHARED_TOKEN ?? "test-shared-token";

/**
 * Directly apply a credit delta via the backend internal API.
 * Used by credit-flow.spec.ts to simulate chat debits and task
 * bonuses without spinning up the real AI worker.
 */
export async function applyCreditDelta(args: {
  userId: string;
  reason: string;
  deltaCredits: number;
  idempotencyKey: string;
}): Promise<void> {
  const res = await fetch(`${BACKEND}/api/internal/credit/apply`, {
    method: "POST",
    headers: {
      "x-service-key": SERVICE_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    throw new Error(`credit/apply failed ${res.status}: ${await res.text()}`);
  }
}
