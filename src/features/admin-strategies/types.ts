export type StrategyStatus = "PENDING" | "PUBLISHED" | "PAUSED" | "REJECTED" | "INACTIVE";

export interface AdminStrategy {
  id: string;
  name: string;
  slug: string;
  status: StrategyStatus;
  publisherName: string | null;
  publisherAddress: string | null;
  baseAsset: string;
  riskTier: string;
  perfFeeBps: number;
  keeperWalletAddress: string | null;
  publishTxHash: string | null;
  tvlUsd: number;
  userCount: number;
  publishedAt: string;
}

export interface MarketplaceOverview {
  totalTvlUsd: number;
  totalDepositors: number;
  publisherCount: number;
  statusCounts: Record<StrategyStatus, number>;
}

export interface AdminPublisher {
  id: string;
  name: string;
  stellarAddress: string;
  commissionBps: number;
  strategyCount: number;
  createdAt: string;
}

export interface StrategyParticipant {
  wallet: string;
  joined: string;
  deposited: number;
  sharePct: number;
}

export interface LeaderboardEntry {
  rank: number;
  strategyId: string;
  slug: string;
  name: string;
  publisherName: string;
  apy: number;
  tvlUsd: number;
  userCount: number;
  riskTier: string;
}
