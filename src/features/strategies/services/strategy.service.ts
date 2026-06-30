import type { FeaturedStrategy, Strategy, StrategyListItem } from "../types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:6756";

function unwrapData(json: any): any {
  if (json?.data?.data) return json.data.data;
  if (json?.data) return json.data;
  return json;
}

function formatApy(value: number): string {
  return `${value.toFixed(1)}%`;
}

function mapToListItem(item: any): StrategyListItem {
  return {
    id: item.id,
    title: item.name,
    status: item.isActive ? "Active" : "Inactive",
    current_apy: formatApy(item.currentApy ?? 0),
    creator: {
      name: item.publisherName ?? "Unknown",
      handle: item.publisherAddress
        ? `${item.publisherAddress.slice(0, 4)}...${item.publisherAddress.slice(-4)}`
        : "",
      created_at: item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-GB") : "",
    },
    tags: item.tags ?? [],
    category: item.riskTier ?? item.template,
    assets: item.baseAsset
      ? [{ src: `/token/${item.baseAsset.toLowerCase()}.svg`, alt: item.baseAsset }]
      : [],
    agents: item.template ? [{ src: `/agents/${item.template}.svg`, alt: item.template }] : [],
    chain: { src: "/token/stellar.svg", alt: "Stellar" },
    tvlUsd: item.tvlUsd ?? 0,
    userCount: item.userCount ?? 0,
  };
}

function mapToDetail(item: any): Strategy {
  const apy = item.currentApy ?? 0;
  return {
    id: item.id,
    strategy_metadata: {
      title: item.name ?? "Untitled Strategy",
      status: item.isActive ? "Active" : "Inactive",
      creator: {
        name: item.publisherName ?? item.publisher?.name ?? "Unknown",
        handle: item.publisherAddress
          ? `${item.publisherAddress.slice(0, 4)}...${item.publisherAddress.slice(-4)}`
          : "",
        created_at: item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-GB") : "",
      },
      current_apy: formatApy(apy),
      expiry_date: "",
      tags: item.tags ?? [],
    },
    execution_panel: {
      input_token: item.baseAsset ?? "USDC",
      available_balance: 0,
      input_amount: 0,
      status_message: item.isActive ? "Strategy is active" : "Strategy is inactive",
      network_details: {
        est_network_cost: "0.00001 XLM",
        slippage_tolerance: "1%",
      },
      actions: ["Deposit", "Withdraw"],
    },
    tabs: {
      overview: {
        disclaimer: "Tasmil does not hold custody over users' assets.",
        description: item.description ?? "No description provided.",
        agents: item.template ? [item.template] : [],
        assets_pools: item.baseAsset ? [item.baseAsset] : [],
        rewards: ["Yield"],
        risks: [item.riskTier ?? "unknown"],
        strategy_flow_summary: {
          total_steps: 0,
          actions: [],
        },
      },
      strategy_prompt: {
        info: {
          chains: ["Stellar"],
          assets_involved: item.baseAsset ? [item.baseAsset] : [],
        },
        execution_steps: [],
        constants: {},
      },
      my_activities: {
        status: "Empty",
        message: "You have no activities in this strategy",
      },
      all_activities: {
        recent_transactions: [],
        pagination: { current_page: 1, total_pages: 0 },
      },
    },
  };
}

export async function getStrategy(strategyId: string): Promise<Strategy> {
  const res = await fetch(`${BASE_URL}/api/marketplace/strategies/${strategyId}`);
  if (!res.ok) throw new Error("Strategy not found");
  const json = await res.json();
  const data = unwrapData(json);
  return mapToDetail(data ?? json);
}

export async function getStrategies(): Promise<StrategyListItem[]> {
  const res = await fetch(`${BASE_URL}/api/marketplace/strategies?limit=50`);
  if (!res.ok) throw new Error("Failed to fetch strategies");
  const json = await res.json();
  const data = unwrapData(json);
  const items = data.items ?? data ?? [];
  return items.map(mapToListItem);
}

export async function getFeaturedStrategies(): Promise<FeaturedStrategy[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/marketplace/strategies?limit=6&sort=tvl_desc`);
    if (!res.ok) return [];
    const json = await res.json();
    const data = unwrapData(json);
    const items = data.items ?? data ?? [];
    return items.slice(0, 3).map((item: any) => ({
      id: item.id,
      name: item.name ?? "Featured Strategy",
      description: `Top-performing ${item.riskTier ?? ""} strategy on ${item.baseAsset ?? "Stellar"}`,
      image: "/images/featured-katana.png",
      chain: item.baseAsset ?? "stellar",
    }));
  } catch {
    return [];
  }
}
