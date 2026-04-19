import { NextRequest } from "next/server";
import { getClient, isValidProtocol, jsonError, getNetwork } from "../../_sdk";

const SUPPORTS_MARKETS = new Set(["blend", "templar"]);

export async function GET(_req: NextRequest, { params }: { params: Promise<{ protocol: string }> }) {
  const { protocol } = await params;
  if (!isValidProtocol(protocol)) return jsonError(`Unknown protocol: ${protocol}`, 404);
  if (!SUPPORTS_MARKETS.has(protocol)) return jsonError(`${protocol} does not support lending markets`);

  try {
    const sdk = getClient();
    const network = getNetwork();

    if (protocol === "blend") {
      const markets = await sdk.blend.getLendingMarkets();
      return Response.json({ success: true, network, protocol, markets });
    }

    if (protocol === "templar") {
      const markets = await sdk.templar.getLendingMarkets();
      return Response.json({ success: true, network, protocol, markets });
    }

    return jsonError(`${protocol} does not support lending markets`);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to fetch markets", 500);
  }
}
