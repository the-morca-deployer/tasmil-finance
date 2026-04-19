import { NextRequest } from "next/server";
import { getClient, isValidProtocol, jsonError, getNetwork } from "../../_sdk";

export async function GET(req: NextRequest, { params }: { params: Promise<{ protocol: string }> }) {
  const { protocol } = await params;
  if (!isValidProtocol(protocol)) return jsonError(`Unknown protocol: ${protocol}`, 404);
  if (protocol !== "sdex") return jsonError(`Only SDEX supports orderbook`);

  const selling = req.nextUrl.searchParams.get("selling") ?? "";
  const buying = req.nextUrl.searchParams.get("buying") ?? "";
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? "20");

  if (!selling || !buying) return jsonError("selling and buying parameters required");

  try {
    const sdk = getClient();
    const orderbook = await sdk.sdex.getOrderbook(selling, buying, limit);
    return Response.json({
      success: true,
      network: getNetwork(),
      protocol: "sdex",
      orderbook,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to fetch orderbook", 500);
  }
}
