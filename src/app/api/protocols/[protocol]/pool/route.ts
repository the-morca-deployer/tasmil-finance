import type { NextRequest } from "next/server";
import { getClient, getExplorerUrl, getNetwork, isValidProtocol, jsonError } from "../../_sdk";

const SUPPORTS_POOL = new Set(["blend", "aquarius", "phoenix", "defindex"]);

export async function GET(req: NextRequest, { params }: { params: Promise<{ protocol: string }> }) {
  const { protocol } = await params;
  if (!isValidProtocol(protocol)) return jsonError(`Unknown protocol: ${protocol}`, 404);
  if (!SUPPORTS_POOL.has(protocol))
    return jsonError(`${protocol} does not support single pool query`);

  const address = req.nextUrl.searchParams.get("address");
  if (!address) return jsonError("address parameter required");

  try {
    const sdk = getClient();
    const network = getNetwork();

    if (protocol === "blend") {
      const pool = await sdk.blend.getPool(address);
      if (!pool) return jsonError(`Pool not found: ${address}`, 404);
      return Response.json({
        success: true,
        network,
        protocol,
        pool: {
          address: pool.address,
          name: pool.name,
          status: pool.status,
          backstopRate: pool.backstopRate,
          explorerUrl: getExplorerUrl(pool.address),
          reserves: pool.reserves.map((r) => ({
            assetAddress: r.assetAddress,
            symbol: r.symbol,
            supplyApy: r.supplyApy,
            borrowApy: r.borrowApy,
            totalSupplied: r.totalSupplied,
            totalBorrowed: r.totalBorrowed,
            utilization: r.utilization,
            collateralFactor: r.collateralFactor,
            liabilityFactor: r.liabilityFactor,
            decimals: r.decimals,
            explorerUrl: getExplorerUrl(r.assetAddress),
          })),
        },
      });
    }

    if (protocol === "aquarius") {
      const pool = await sdk.aquarius.getPool(address);
      return Response.json({
        success: true,
        network,
        protocol,
        pool: {
          address: pool.address,
          poolType: pool.pool_type,
          tokens: pool.tokens,
          tokensStr: pool.tokens_str,
          fee: pool.fee,
          tvl: pool.total_value_locked,
          volume24h: pool.volume_24h,
          feeApy: pool.fee_apy,
          rewardApy: pool.reward_apy,
        },
      });
    }

    if (protocol === "phoenix") {
      const pool = await sdk.phoenix.getPool(address);
      if (!pool) return jsonError(`Pool not found: ${address}`, 404);
      return Response.json({ success: true, network, protocol, pool });
    }

    if (protocol === "defindex") {
      const vault = await sdk.defindex.getVault(address);
      return Response.json({
        success: true,
        network,
        protocol,
        pool: {
          address: vault.address,
          name: vault.name,
          asset: vault.asset,
          assetAddress: vault.assetAddress,
          totalSupply: vault.totalSupply,
          tvl: vault.tvl,
          apy: vault.apy,
          status: vault.status,
        },
      });
    }

    return jsonError(`${protocol} does not support single pool query`);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to fetch pool", 500);
  }
}
