/**
 * Mock data for pools, portfolio, and DeFi position endpoints.
 */

export const MOCK_POOLS = {
  success: true,
  data: [
    {
      id: "pool-blend-usdc-lend",
      protocol: "blend",
      name: "USDC Lending Pool",
      type: "lending",
      apy: 8.4,
      tvl: 24500000,
      baseAsset: "USDC",
      rewardTokens: ["BLND"],
      utilization: 72.5,
      depositCap: 50000000,
      risk: "SAFE",
    },
    {
      id: "pool-blend-xlm-lend",
      protocol: "blend",
      name: "XLM Lending Pool",
      type: "lending",
      apy: 6.2,
      tvl: 18700000,
      baseAsset: "XLM",
      rewardTokens: ["BLND"],
      utilization: 58.3,
      depositCap: 40000000,
      risk: "SAFE",
    },
    {
      id: "pool-soroswap-xlm-usdc",
      protocol: "soroswap",
      name: "XLM/USDC LP",
      type: "liquidity",
      apy: 15.2,
      tvl: 12300000,
      baseAsset: "USDC",
      pair: ["XLM", "USDC"],
      rewardTokens: ["SORO"],
      feeTier: 0.3,
      volume24h: 890000,
      risk: "BALANCED",
    },
    {
      id: "pool-soroswap-usdc-blnd",
      protocol: "soroswap",
      name: "USDC/BLND LP",
      type: "liquidity",
      apy: 22.1,
      tvl: 7800000,
      baseAsset: "USDC",
      pair: ["USDC", "BLND"],
      rewardTokens: ["SORO", "BLND"],
      feeTier: 0.3,
      volume24h: 340000,
      risk: "AGGRESSIVE",
    },
    {
      id: "pool-aquarius-aqua-usdc",
      protocol: "aquarius",
      name: "AQUA/USDC LP",
      type: "liquidity",
      apy: 24.7,
      tvl: 5400000,
      baseAsset: "USDC",
      pair: ["AQUA", "USDC"],
      rewardTokens: ["AQUA"],
      feeTier: 0.25,
      volume24h: 210000,
      risk: "AGGRESSIVE",
    },
    {
      id: "pool-phoenix-xlm-usdc",
      protocol: "phoenix",
      name: "XLM/USDC Concentrated",
      type: "concentrated",
      apy: 18.9,
      tvl: 9200000,
      baseAsset: "USDC",
      pair: ["XLM", "USDC"],
      rewardTokens: ["PHO"],
      feeTier: 0.05,
      volume24h: 1560000,
      risk: "BALANCED",
    },
    {
      id: "pool-defindex-vault",
      protocol: "defindex",
      name: "DeFindex Yield Vault",
      type: "vault",
      apy: 11.3,
      tvl: 3200000,
      baseAsset: "USDC",
      rewardTokens: ["INDEX"],
      risk: "BALANCED",
    },
    {
      id: "pool-sdex-orderbook",
      protocol: "sdex",
      name: "XLM/USDC Orderbook",
      type: "orderbook",
      apy: 9.8,
      tvl: 15600000,
      baseAsset: "USDC",
      pair: ["XLM", "USDC"],
      rewardTokens: [],
      risk: "SAFE",
    },
  ],
};

export const MOCK_PORTFOLIO_HISTORY = {
  success: true,
  data: Array.from({ length: 30 }, (_, i) => {
    const daysAgo = 29 - i;
    const baseValue = 12000 + Math.sin(i * 0.3) * 800 + i * 15;
    return {
      date: new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10),
      value: Number.parseFloat(baseValue.toFixed(2)),
      pnl: Number.parseFloat((baseValue - 12000).toFixed(2)),
      pnlPercent: Number.parseFloat((((baseValue - 12000) / 12000) * 100).toFixed(2)),
    };
  }),
};

export const MOCK_BLEND_POSITIONS = {
  success: true,
  data: [
    {
      id: "blend-pos-001",
      poolId: "pool-blend-usdc-lend",
      protocol: "blend",
      type: "supply",
      token: "USDC",
      amount: 5602.85,
      valueUsd: 5602.85,
      apy: 8.4,
      accruedRewards: 12.45,
      rewardTokens: ["BLND"],
      healthFactor: 2.8,
    },
  ],
};

export const MOCK_AQUARIUS_POSITIONS = {
  success: true,
  data: [
    {
      id: "aqua-pos-001",
      poolId: "pool-aquarius-aqua-usdc",
      protocol: "aquarius",
      type: "liquidity",
      token0: "AQUA",
      token1: "USDC",
      amount0: 12450,
      amount1: 2490.16,
      valueUsd: 4980.32,
      apy: 24.7,
      accruedRewards: 45.2,
      rewardTokens: ["AQUA"],
      share: 0.092,
    },
  ],
};

/**
 * Build a snapshot response.
 */
export const MOCK_SNAPSHOT_RESPONSE = {
  success: true,
  data: { ok: true },
};
