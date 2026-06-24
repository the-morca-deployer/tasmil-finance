/**
 * Mock data for backend account API endpoints.
 */

export const MOCK_POSITION = {
  success: true,
  data: {
    accountId: "GDQI7LOGDRQRM5OXEIEY7TDHUYEHGQ7RX3KOJU3FNUP6HBDHUGWA3I6R",
    vaultAddress: "GCKZLW2GFO4WMXFF3OICHXELSB75HOZS2YT5PKHLBWRZ2EQMH5FNNHTB",
    status: "active",
    preset: "BALANCED",
    baseAsset: "USDC",
    rebalanceCount: 42,
    rebalanceLimit: 48,
    lastRebalance: new Date().toISOString(),
    cooldownUntil: null,
    tvl: 12450.78,
    pnl: 324.15,
    pnlPercent: 2.67,
    allocations: [
      {
        protocol: "blend",
        share: 45,
        tvl: 5602.85,
        apy: 8.4,
        supplyApy: 5.2,
        borrowApy: 12.1,
        assets: ["USDC", "XLM"],
      },
      {
        protocol: "soroswap",
        share: 35,
        tvl: 4357.77,
        apy: 15.2,
        assets: ["USDC", "XLM"],
      },
      {
        protocol: "aquarius",
        share: 20,
        tvl: 2490.16,
        apy: 22.7,
        assets: ["AQUA", "USDC"],
      },
    ],
    circuitBreaker: {
      triggered: false,
      consecutiveFailures: 0,
      maxFailures: 3,
    },
  },
};

export const MOCK_ACTIVITY = {
  success: true,
  data: [
    {
      id: "tx-001",
      type: "deposit",
      amount: 500,
      token: "USDC",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      txHash: "3a7b9c...f1e2",
      status: "confirmed",
    },
    {
      id: "tx-002",
      type: "rebalance",
      amount: 0,
      token: null,
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      txHash: "9f2a1b...c8d4",
      status: "confirmed",
      details: "Shifted 10% from Blend to Soroswap",
    },
    {
      id: "tx-003",
      type: "harvest",
      amount: 12.45,
      token: "USDC",
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      txHash: "5e1d8f...3a7b",
      status: "confirmed",
    },
    {
      id: "tx-004",
      type: "deposit",
      amount: 1500,
      token: "USDC",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      txHash: "2b6c4e...9d1f",
      status: "confirmed",
    },
    {
      id: "tx-005",
      type: "withdraw",
      amount: 200,
      token: "USDC",
      timestamp: new Date(Date.now() - 108000000).toISOString(),
      txHash: "8c3d5a...e7b9",
      status: "confirmed",
    },
    {
      id: "tx-006",
      type: "rebalance",
      amount: 0,
      token: null,
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      txHash: "4f0a2d...6c8e",
      status: "failed",
      details: "Aquarius pool: insufficient liquidity",
    },
    {
      id: "tx-007",
      type: "harvest",
      amount: 8.32,
      token: "USDC",
      timestamp: new Date(Date.now() - 259200000).toISOString(),
      txHash: "7d9e1c...5b4a",
      status: "confirmed",
    },
    {
      id: "tx-008",
      type: "deploy",
      amount: 0,
      token: null,
      timestamp: new Date(Date.now() - 345600000).toISOString(),
      txHash: "1a3f7b...2d9e",
      status: "confirmed",
    },
  ],
};

export const MOCK_PRESETS = {
  success: true,
  data: [
    {
      id: "preset-safe",
      name: "Conservative",
      icon: "🛡️",
      risk: "SAFE",
      description: "USDC lending on Blend. Stable, low-risk yield.",
      apy: 5.2,
      protocols: ["blend"],
      baseAsset: "USDC",
    },
    {
      id: "preset-balanced",
      name: "Balanced",
      icon: "⚖️",
      risk: "BALANCED",
      description: "Spread across Blend lending + Soroswap liquidity.",
      apy: 12.8,
      protocols: ["blend", "soroswap"],
      baseAsset: "USDC",
    },
    {
      id: "preset-aggressive",
      name: "Aggressive",
      icon: "🚀",
      risk: "AGGRESSIVE",
      description: "Max yield via Aquarius LP + Phoenix arbitrage.",
      apy: 24.5,
      protocols: ["aquarius", "phoenix", "soroswap"],
      baseAsset: "USDC",
    },
  ],
};

export const MOCK_REBALANCE_STATUS = {
  success: true,
  data: {
    running: true,
    lastRun: new Date(Date.now() - 300000).toISOString(),
    nextRun: new Date(Date.now() + 300000).toISOString(),
    allocations: [
      { protocol: "blend", share: 45, apy: 8.4 },
      { protocol: "soroswap", share: 35, apy: 15.2 },
      { protocol: "aquarius", share: 20, apy: 22.7 },
    ],
    circuitOk: true,
    tvlDelta24h: 2.3,
  },
};
