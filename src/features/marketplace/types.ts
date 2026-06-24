export type DexType = 0 | 1;
export type TemplateType = "swap" | "dca" | "blend";

export interface MarketplaceStrategy {
  id: string;
  publisherId: string;
  name: string;
  template: TemplateType;
  contractAddress: string;
  tokenIn: string;
  tokenOut: string;
  thresholdPrice?: number;
  swapPercentBps: number;
  perfFeeBps: number;
  platformFeeBps: number;
  paused: boolean;
  activatedCount: number;
  tvlUsd: number;
  currentApy: number;
  highWaterMark: number;
  publisherType: "tasmil" | "third_party";
  createdAt: string;
  updatedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  publisher: string;
  template: TemplateType;
  currentApy: number;
  tvlUsd: number;
  activatedCount: number;
  perfFeeBps: number;
}

export interface PerformancePoint {
  timestamp: string;
  nav: number;
  hwm: number;
}

export type ApyDataPoint = PerformancePoint;

export interface AllocationEntry {
  poolId: string;
  poolName: string;
  protocol: string;
  allocationPercent: number;
  apy: number;
  tvlUsd: number;
}

export interface StrategyConfig {
  template: TemplateType;
  tokenIn: string;
  tokenOut: string;
  thresholdPrice?: number;
  swapPercentBps: number;
  perfFeeBps: number;
  dexType: DexType;
  strategyName: string;
}
