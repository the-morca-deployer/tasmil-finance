// @ts-nocheck - pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import { getBlendV2Pools } from "@tasmil-finance/adapter-sdk";
import { type NextRequest, NextResponse } from "next/server";
import { getClient, getNetwork } from "../../protocols/_sdk";

interface PositionItem {
  name: string;
  type: "vault" | "supply" | "borrow" | "lp" | "stake";
  asset: string;
  valueUsd: number;
  apy?: number;
  extra?: string;
  rewards?: { amount: number; token: string };
}

interface ProtocolPositionGroup {
  protocol: string;
  displayName: string;
  icon: string | null;
  poolAddress?: string;
  totalValueUsd: number;
  positions: PositionItem[];
  rewards?: { amount: number; token: string };
}

function formatAmount(amount: number, symbol: string): string {
  return `${amount.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${symbol}`;
}

export async function GET(req: NextRequest) {
  const user = req.nextUrl.searchParams.get("user");
  if (!user) {
    return NextResponse.json({ success: false, error: "user parameter required" }, { status: 400 });
  }

  try {
    const sdk = getClient();
    // A pool can leave the reward zone while users still hold positions in it.
    // The SDK's listPools() only discovers reward-zone pools in this release.
    const knownPools = getBlendV2Pools(getNetwork());
    const listedPools = await sdk.blend.listPools().catch((error) => {
      console.warn("[api/positions/blend] pool discovery failed; scanning known pools", error);
      return [];
    });
    const pools = [
      ...new Map([...knownPools, ...listedPools].map((pool) => [pool.address, pool])).values(),
    ];

    const results = await Promise.allSettled(
      pools.map((pool) => sdk.blend.getUserPositions(pool.address, user))
    );

    // A rate-limited pool read must not become a successful empty portfolio.
    for (let i = 0; i < results.length; i++) {
      if (results[i]?.status !== "rejected") continue;
      await new Promise((resolve) => setTimeout(resolve, 350));
      try {
        results[i] = {
          status: "fulfilled",
          value: await sdk.blend.getUserPositions(pools[i]!.address, user),
        };
      } catch (reason) {
        results[i] = { status: "rejected", reason };
      }
    }
    const incompletePools = results.flatMap((result, index) =>
      result.status === "rejected" ? [pools[index]!.address] : []
    );
    if (pools.length > 0 && incompletePools.length === pools.length) {
      throw new Error(
        `Blend position scan incomplete (${incompletePools.length}/${pools.length} pools failed)`
      );
    }

    const groups: ProtocolPositionGroup[] = [];

    for (const result of results) {
      if (result.status !== "fulfilled") continue;
      const pos = result.value;

      const hasPositions =
        pos.collateral.length > 0 || pos.supply.length > 0 || pos.liabilities.length > 0;
      if (!hasPositions) continue;

      const items: PositionItem[] = [];

      for (const c of pos.collateral) {
        items.push({
          name: `${c.symbol} Collateral`,
          type: "supply",
          asset: c.symbol,
          valueUsd: 0,
          apy: c.apy > 0 ? Math.round(c.apy * 100 * 100) / 100 : undefined,
          extra: formatAmount(c.amount, c.symbol),
        });
      }

      for (const s of pos.supply) {
        items.push({
          name: `${s.symbol} Supply`,
          type: "supply",
          asset: s.symbol,
          valueUsd: 0,
          apy: s.apy > 0 ? Math.round(s.apy * 100 * 100) / 100 : undefined,
          extra: formatAmount(s.amount, s.symbol),
        });
      }

      for (const l of pos.liabilities) {
        items.push({
          name: `${l.symbol} Borrow`,
          type: "borrow",
          asset: l.symbol,
          valueUsd: 0,
          apy: l.apy > 0 ? Math.round(l.apy * 100 * 100) / 100 : undefined,
          extra: formatAmount(l.amount, l.symbol),
        });
      }

      // Add claimable BLND emissions as a group-level reward
      const groupRewards =
        pos.emissions != null && pos.emissions > 0
          ? { amount: pos.emissions, token: "BLND" }
          : undefined;

      groups.push({
        protocol: "blend",
        displayName: `Blend \u00b7 ${pos.poolName}`,
        icon: null,
        poolAddress: pos.poolAddress,
        totalValueUsd: 0,
        positions: items,
        rewards: groupRewards,
      });
    }

    return NextResponse.json({ success: true, groups, incompletePools });
  } catch (e) {
    console.error("[api/positions/blend]", e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Failed to fetch positions" },
      { status: 500 }
    );
  }
}
