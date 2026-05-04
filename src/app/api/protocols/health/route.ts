import { getClient, getNetwork, VALID_PROTOCOLS } from "../_sdk";

export async function GET() {
  const sdk = getClient();
  const network = getNetwork();

  const checks = VALID_PROTOCOLS.map(async (protocol) => {
    const start = Date.now();
    try {
      const adapter = sdk[protocol];
      // Use the lightest possible call per protocol
      if (
        "getYieldOpportunities" in adapter &&
        typeof adapter.getYieldOpportunities === "function"
      ) {
        await Promise.race([
          adapter.getYieldOpportunities(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000)),
        ]);
      }
      return { protocol, status: "ok" as const, latencyMs: Date.now() - start };
    } catch (err) {
      return {
        protocol,
        status: "error" as const,
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });

  const results = await Promise.allSettled(checks);
  const health = results.map((r) =>
    r.status === "fulfilled"
      ? r.value
      : { protocol: "unknown", status: "error" as const, latencyMs: 0, error: "Promise rejected" }
  );

  return Response.json({ success: true, network, health });
}
