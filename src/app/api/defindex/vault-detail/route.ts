import type { NextRequest } from "next/server";
import { getDefindexClient, getNetwork, jsonError } from "../_sdk";

/**
 * GET /api/defindex/vault-detail?address=C...
 *
 * Returns full vault detail including strategies, roles, fees, fund breakdown, and APY.
 */
export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address) return jsonError("address parameter required");

  try {
    const sdk = getDefindexClient();
    const vault = await sdk.defindex.getVaultDetail(address);
    return Response.json({
      success: true,
      network: getNetwork(),
      vault,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to fetch vault detail", 500);
  }
}
