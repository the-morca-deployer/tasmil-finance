import { NextRequest } from "next/server";
import { getClient, isValidProtocol, jsonError, getNetwork } from "../../_sdk";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ protocol: string }> }) {
  const { protocol } = await params;
  if (!isValidProtocol(protocol)) return jsonError(`Unknown protocol: ${protocol}`, 404);

  try {
    const sdk = getClient();
    const adapter = sdk[protocol];
    if (!adapter || typeof adapter.getYieldOpportunities !== "function") {
      return jsonError(`${protocol} does not support yield opportunities`);
    }
    const opportunities = await adapter.getYieldOpportunities();
    return Response.json({
      success: true,
      network: getNetwork(),
      protocol,
      count: opportunities.length,
      opportunities,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to fetch yield", 500);
  }
}
