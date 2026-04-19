import { NextRequest } from "next/server";
import { getClient, isValidProtocol, jsonError, getNetwork } from "../../_sdk";

const SUPPORTS_POSITIONS = new Set(["blend", "templar"]);

export async function GET(req: NextRequest, { params }: { params: Promise<{ protocol: string }> }) {
  const { protocol } = await params;
  if (!isValidProtocol(protocol)) return jsonError(`Unknown protocol: ${protocol}`, 404);
  if (!SUPPORTS_POSITIONS.has(protocol)) return jsonError(`${protocol} does not support positions`);

  const pool = req.nextUrl.searchParams.get("pool");
  const user = req.nextUrl.searchParams.get("user");
  const market = req.nextUrl.searchParams.get("market");

  try {
    const sdk = getClient();
    const network = getNetwork();

    if (protocol === "blend") {
      if (!pool || !user) return jsonError("pool and user parameters required");
      const pos = await sdk.blend.getUserPositions(pool, user);
      return Response.json({
        success: true, network, protocol,
        hasPosition: pos.collateral.length + pos.supply.length + pos.liabilities.length > 0,
        poolAddress: pos.poolAddress,
        poolName: pos.poolName,
        collateral: pos.collateral,
        supply: pos.supply,
        liabilities: pos.liabilities,
        positionsUsed: pos.positionsUsed,
        summary: {
          totalSuppliedUsd: pos.totalSuppliedUsd,
          totalBorrowedUsd: pos.totalBorrowedUsd,
          borrowCapacityUsd: pos.borrowCapacityUsd,
          borrowLimitRatio: pos.borrowLimitRatio,
          netApy: pos.netApy,
        },
      });
    }

    if (protocol === "templar") {
      if (!market) return jsonError("market parameter required");
      const account = user ?? "";
      const pos = await sdk.templar.getPosition(market, account);
      return Response.json({
        success: true, network, protocol: "templar",
        market, account,
        position: pos,
      });
    }

    return jsonError(`${protocol} does not support positions`);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to fetch positions", 500);
  }
}
