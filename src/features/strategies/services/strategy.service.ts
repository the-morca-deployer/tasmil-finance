import type { FeaturedStrategy, Strategy, StrategyListItem } from "../types";

/**
 * Mock data service for strategies
 * In production, this would fetch from an API
 */

// Mock strategy data - Yield Katana Stablecoins Strategy
const mockStrategyData: Strategy = {
  id: "yield-katana-stablecoins",
  strategy_metadata: {
    title: "Yield - Katana - Stablecoins",
    status: "Active",
    creator: {
      name: "INFINIT",
      handle: "@Infinit_Labs",
      created_at: "14/11/2025",
    },
    current_apy: "65.86%",
    expiry_date: "Feb 13, 2026",
    tags: ["Stablecoins"],
  },
  execution_panel: {
    input_token: "vbUSDC",
    available_balance: 0,
    input_amount: 12,
    status_message: "Insufficient balance",
    network_details: {
      est_network_cost: "0.00000111 ETH",
      slippage_tolerance: "1%",
    },
    actions: ["Simulate", "Prepare Gas", "Zap"],
  },
  tabs: {
    overview: {
      disclaimer: "INFINIT is not holding custody over users' assets.",
      description: "Maximize Katana rewards through diversified Spectra LP stablecoin positions.",
      agents: ["Sushi", "Spectra"],
      assets_pools: ["LP-vbUSDC (Spectra)", "LP-vbUSDT (Spectra)"],
      rewards: ["KAT Rewards", "Spectra LP Yield"],
      risks: ["Depeg", "Underlying Protocol"],
      strategy_flow_summary: {
        total_steps: 4,
        actions: [
          { type: "Starting Token", count: 1 },
          { type: "Swap", count: 1 },
          { type: "Add Liquidity", count: 2 },
        ],
      },
    },
    strategy_prompt: {
      info: {
        chains: ["Katana"],
        assets_involved: ["vbUSDC", "vbUSDT", "SPT-PT/IBT"],
      },
      execution_steps: [
        {
          step: 1,
          chain: "Katana",
          protocol: "Default",
          action: "Start with vbUSDC",
        },
        {
          step: 2,
          chain: "Katana",
          protocol: "Sushiswap",
          action: "Swap 50% of vbUSDC to vbUSDT",
        },
        {
          step: 3,
          chain: "Katana",
          protocol: "Spectra",
          action: "Add liquidity from vbUSDC to LP-vbUSDC",
        },
        {
          step: 4,
          chain: "Katana",
          protocol: "Spectra",
          action: "Add liquidity from vbUSDT to LP-vbUSDT",
        },
      ],
      constants: {
        vbUSDC: "0x203A662b0BD271A6ed5a60EdFbd04bFce608FD36",
        vbUSDT: "0x2DCa96907fde857dd3D816880A0df407eeB2D2F2",
        "LP-vbUSDC": "0x5acee9417301c521e366653bccd656bdd153a0af",
        "LP-vbUSDT": "0xb669ef4992e5f8d8d204aff7423c75ba307df88f",
      },
    },
    my_activities: {
      status: "Empty",
      message: "You have no activities in this strategy",
    },
    all_activities: {
      recent_transactions: [
        { time: "30/12/2025 00:31:32", wallet: "0xe9ce...9943" },
        { time: "28/12/2025 09:57:25", wallet: "0xA644...903f" },
        { time: "27/12/2025 19:16:30", wallet: "0x2eAb...e604" },
        { time: "26/12/2025 18:02:16", wallet: "0x4E93...7200" },
        { time: "26/12/2025 17:47:12", wallet: "0x4E93...7200" },
        { time: "21/12/2025 03:52:37", wallet: "0x209b...53EA" },
        { time: "19/12/2025 20:48:06", wallet: "0x665F...Bd7e" },
        { time: "15/12/2025 20:43:33", wallet: "0x1F8e...6b9f" },
        { time: "09/12/2025 18:17:59", wallet: "0x93EA...F5e5" },
        { time: "05/12/2025 13:44:07", wallet: "0x2a1F...9415" },
      ],
      pagination: {
        current_page: 1,
        total_pages: 3,
      },
    },
  },
};

// Mock list of strategies
const mockStrategiesList: StrategyListItem[] = [
  {
    id: "yield-katana-stablecoins",
    title: "Yield - Katana - Stablecoins",
    status: "Active",
    current_apy: "65.86%",
    creator: {
      name: "INFINIT",
      handle: "@Infinit_Labs",
      created_at: "14/11/2025",
    },
    tags: ["Stablecoins"],
    category: "Stablecoins",
    assets: [
      { src: "/token/usdc.svg", alt: "USDC" },
      { src: "/token/usdt.svg", alt: "USDT" },
    ],
    agents: [
      { src: "/agents/sushi.svg", alt: "Sushi" },
      { src: "/agents/spectra.svg", alt: "Spectra" },
    ],
    chain: { src: "/token/katana.svg", alt: "Katana" },
  },
  {
    id: "delta-neutral-kaito",
    title: "Delta -Neutral - KAITO",
    status: "Active",
    current_apy: "23.08%",
    creator: {
      name: "INFINIT",
      handle: "@Infinit_Labs",
      created_at: "10/11/2025",
    },
    tags: ["Delta Neutral"],
    category: "Delta Neutral",
    assets: [{ src: "/token/kaito.svg", alt: "KAITO" }],
    agents: [
      { src: "/agents/hyperliquid.svg", alt: "Hyperliquid" },
      { src: "/agents/aave.svg", alt: "Aave" },
    ],
    chain: { src: "/token/eth.svg", alt: "Ethereum" },
  },
  {
    id: "yield-katana-delta-neutral-eth",
    title: "Yield - Katana - Delta-Neutral ETH",
    status: "Active",
    current_apy: "19.45%",
    creator: {
      name: "INFINIT",
      handle: "@Infinit_Labs",
      created_at: "05/11/2025",
    },
    tags: ["Stables"],
    category: "Stables",
    assets: [
      { src: "/token/eth.svg", alt: "ETH" },
      { src: "/token/weth.svg", alt: "WETH" },
    ],
    agents: [
      { src: "/agents/morpho.svg", alt: "Morpho" },
      { src: "/agents/spectra.svg", alt: "Spectra" },
    ],
    chain: { src: "/token/katana.svg", alt: "Katana" },
  },
  {
    id: "leverage-looping-synpusdc",
    title: "Leverage Looping - SynpUSDC",
    status: "Active",
    current_apy: "15.67%",
    creator: {
      name: "INFINIT",
      handle: "@Infinit_Labs",
      created_at: "01/11/2025",
    },
    tags: ["Looping"],
    category: "Looping",
    assets: [{ src: "/token/usdc.svg", alt: "USDC" }],
    agents: [{ src: "/agents/morpho.svg", alt: "Morpho" }],
    chain: { src: "/token/eth.svg", alt: "Ethereum" },
  },
  {
    id: "delta-neutral-kaito-lp",
    title: "Delta -Neutral - KAITO - LP",
    status: "Active",
    current_apy: "14.09%",
    creator: {
      name: "INFINIT",
      handle: "@Infinit_Labs",
      created_at: "28/10/2025",
    },
    tags: ["Delta Neutral"],
    category: "Delta Neutral",
    assets: [{ src: "/token/kaito.svg", alt: "KAITO" }],
    agents: [
      { src: "/agents/hyperliquid.svg", alt: "Hyperliquid" },
      { src: "/agents/aave.svg", alt: "Aave" },
    ],
    chain: { src: "/token/eth.svg", alt: "Ethereum" },
  },
  {
    id: "multi-lp-usdai-equal-50",
    title: "Multi -LP - USDai - Equal 50%",
    status: "Active",
    current_apy: "9.58%",
    creator: {
      name: "INFINIT",
      handle: "@Infinit_Labs",
      created_at: "25/10/2025",
    },
    tags: ["Stables"],
    category: "Stables",
    hasPoints: true,
    assets: [{ src: "/token/dai.svg", alt: "DAI" }],
    agents: [{ src: "/agents/fluid.svg", alt: "Fluid" }],
    chain: { src: "/token/eth.svg", alt: "Ethereum" },
  },
  {
    id: "airdrop-base-morpho-lending",
    title: "Airdrop - Base - Morpho Lending",
    status: "Active",
    current_apy: "5.4%",
    creator: {
      name: "INFINIT",
      handle: "@Infinit_Labs",
      created_at: "20/10/2025",
    },
    tags: ["Stables", "Airdrop"],
    category: "Airdrop",
    assets: [{ src: "/token/usdc.svg", alt: "USDC" }],
    agents: [{ src: "/agents/morpho.svg", alt: "Morpho" }],
    chain: { src: "/token/base.svg", alt: "Base" },
  },
  {
    id: "airdrop-hyperevm",
    title: "Airdrop - HyperEVM",
    status: "Active",
    current_apy: "3.39%",
    creator: {
      name: "INFINIT",
      handle: "@Infinit_Labs",
      created_at: "15/10/2025",
    },
    tags: ["Airdrop"],
    category: "Airdrop",
    hasPoints: true,
    assets: [{ src: "/token/eth.svg", alt: "ETH" }],
    agents: [{ src: "/agents/hyperliquid.svg", alt: "Hyperliquid" }],
    chain: { src: "/token/hyperevm.svg", alt: "HyperEVM" },
  },
  {
    id: "multi-lp-ethena-stablecoins",
    title: "Multi- LP - Ethena Stablecoins - Equal 50%",
    status: "Active",
    current_apy: "3.21%",
    creator: {
      name: "INFINIT",
      handle: "@Infinit_Labs",
      created_at: "10/10/2025",
    },
    tags: ["Stables", "Airdrop"],
    category: "Stables",
    hasPoints: true,
    assets: [{ src: "/token/usde.svg", alt: "USDe" }],
    agents: [{ src: "/agents/ethena.svg", alt: "Ethena" }],
    chain: { src: "/token/eth.svg", alt: "Ethereum" },
  },
  {
    id: "leverage-looping-weeth",
    title: "Leverage Looping - weETH",
    status: "Active",
    current_apy: "2.95%",
    creator: {
      name: "INFINIT",
      handle: "@Infinit_Labs",
      created_at: "05/10/2025",
    },
    tags: ["Looping"],
    category: "Looping",
    hasPoints: true,
    assets: [
      { src: "/token/weeth.svg", alt: "weETH" },
      { src: "/token/eth.svg", alt: "ETH" },
    ],
    agents: [{ src: "/agents/morpho.svg", alt: "Morpho" }],
    chain: { src: "/token/eth.svg", alt: "Ethereum" },
  },
  {
    id: "leverage-looping-weth",
    title: "Leverage Looping - wETH",
    status: "Active",
    current_apy: "2.24%",
    creator: {
      name: "INFINIT",
      handle: "@Infinit_Labs",
      created_at: "01/10/2025",
    },
    tags: ["Looping"],
    category: "Looping",
    hasPoints: true,
    assets: [
      { src: "/token/weth.svg", alt: "WETH" },
      { src: "/token/eth.svg", alt: "ETH" },
    ],
    agents: [{ src: "/agents/morpho.svg", alt: "Morpho" }],
    chain: { src: "/token/eth.svg", alt: "Ethereum" },
  },
  {
    id: "leverage-looping-ethena-liquid",
    title: "Leverage Looping - Ethena Liquid Leverage",
    status: "Active",
    current_apy: "1.39%",
    creator: {
      name: "INFINIT",
      handle: "@Infinit_Labs",
      created_at: "28/09/2025",
    },
    tags: ["Stables", "Looping"],
    category: "Looping",
    hasPoints: true,
    assets: [
      { src: "/token/usde.svg", alt: "USDe" },
      { src: "/token/eth.svg", alt: "ETH" },
    ],
    agents: [{ src: "/agents/ethena.svg", alt: "Ethena" }],
    chain: { src: "/token/eth.svg", alt: "Ethereum" },
  },
  {
    id: "leverage-looping-cmeth",
    title: "Leverage Looping - cmETH",
    status: "Active",
    current_apy: "0.67%",
    creator: {
      name: "INFINIT",
      handle: "@Infinit_Labs",
      created_at: "25/09/2025",
    },
    tags: ["Looping"],
    category: "Looping",
    hasPoints: true,
    assets: [{ src: "/token/cmeth.svg", alt: "cmETH" }],
    agents: [{ src: "/agents/morpho.svg", alt: "Morpho" }],
    chain: { src: "/token/eth.svg", alt: "Ethereum" },
  },
  {
    id: "airdrop-base-hyperevm",
    title: "Airdrop - Base x HyperEVM",
    status: "Active",
    current_apy: "-",
    creator: {
      name: "INFINIT",
      handle: "@Infinit_Labs",
      created_at: "20/09/2025",
    },
    tags: ["Airdrop", "Stables"],
    category: "Airdrop",
    assets: [{ src: "/token/eth.svg", alt: "ETH" }],
    agents: [{ src: "/agents/hyperliquid.svg", alt: "Hyperliquid" }],
    chain: { src: "/token/base.svg", alt: "Base" },
  },
  {
    id: "airdrop-base-dex-swap",
    title: "Airdrop - Base - DEX Swap Volume",
    status: "Active",
    current_apy: "-",
    creator: {
      name: "INFINIT",
      handle: "@Infinit_Labs",
      created_at: "15/09/2025",
    },
    tags: ["Airdrop"],
    category: "Airdrop",
    assets: [{ src: "/token/usdc.svg", alt: "USDC" }],
    agents: [{ src: "/agents/uniswap.svg", alt: "Uniswap" }],
    chain: { src: "/token/base.svg", alt: "Base" },
  },
  {
    id: "pair-trading-perps",
    title: "Pair Trading - Perps",
    status: "Active",
    current_apy: "-",
    creator: {
      name: "INFINIT",
      handle: "@Infinit_Labs",
      created_at: "10/09/2025",
    },
    tags: ["Pair Trading"],
    category: "Pair Trading",
    assets: [
      { src: "/token/eth.svg", alt: "ETH" },
      { src: "/token/btc.svg", alt: "BTC" },
    ],
    agents: [{ src: "/agents/hyperliquid.svg", alt: "Hyperliquid" }],
    chain: { src: "/token/eth.svg", alt: "Ethereum" },
  },
  {
    id: "leverage-looping-susds",
    title: "Leverage Looping - sUSDS",
    status: "Active",
    current_apy: "-2.34%",
    creator: {
      name: "INFINIT",
      handle: "@Infinit_Labs",
      created_at: "05/09/2025",
    },
    tags: ["Looping", "Stables"],
    category: "Looping",
    assets: [{ src: "/token/usds.svg", alt: "sUSDS" }],
    agents: [{ src: "/agents/morpho.svg", alt: "Morpho" }],
    chain: { src: "/token/eth.svg", alt: "Ethereum" },
  },
  {
    id: "leverage-looping-mbasis",
    title: "Leverage Looping - mBASIS",
    status: "Active",
    current_apy: "-26.8%",
    creator: {
      name: "INFINIT",
      handle: "@Infinit_Labs",
      created_at: "01/09/2025",
    },
    tags: ["Looping"],
    category: "Looping",
    assets: [{ src: "/token/mbasis.svg", alt: "mBASIS" }],
    agents: [{ src: "/agents/morpho.svg", alt: "Morpho" }],
    chain: { src: "/token/eth.svg", alt: "Ethereum" },
  },
];

// Featured strategies
const mockFeaturedStrategies: FeaturedStrategy[] = [
  {
    id: "katana",
    name: "Katana Strategies",
    description: "Explore trending strategies on the Katana chain",
    image: "/images/featured-katana.png",
    chain: "katana",
  },
  {
    id: "base",
    name: "Base Strategies",
    description: "Explore trending strategies on the Base chain",
    image: "/images/featured-base.png",
    chain: "base",
  },
  {
    id: "plasma",
    name: "Plasma Strategies",
    description: "Explore trending strategies on the Plasma chain",
    image: "/images/featured-plasma.png",
    chain: "plasma",
  },
];

/**
 * Fetch a single strategy by ID
 */
export async function getStrategy(strategyId: string): Promise<Strategy> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // In production, this would be: return apiClient.get(`/strategies/${strategyId}`)
  if (strategyId === "yield-katana-stablecoins") {
    return mockStrategyData;
  }

  // Return a modified version for other IDs
  return {
    ...mockStrategyData,
    id: strategyId,
    strategy_metadata: {
      ...mockStrategyData.strategy_metadata,
      title: `Strategy ${strategyId}`,
    },
  };
}

/**
 * Fetch list of all strategies
 */
export async function getStrategies(): Promise<StrategyListItem[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  // In production, this would be: return apiClient.get("/strategies")
  return mockStrategiesList;
}

/**
 * Fetch featured strategies
 */
export async function getFeaturedStrategies(): Promise<FeaturedStrategy[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  return mockFeaturedStrategies;
}
