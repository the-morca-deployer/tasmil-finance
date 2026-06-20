// View-model types for the quest seasons + referral domain.
// The gen-quest client types these endpoints as `any` (the backend does not
// declare response schemas), so we define the real wire shapes here and unwrap
// the `{ success, data }` envelope at the call site.

export type SeasonStatus = "ACTIVE" | "ENDED" | "REVEALED";
export type PayoutStatus = "PENDING" | "PAID";

export interface SeasonRankReward {
  rankFrom: number;
  rankTo: number;
  usdc: string;
  points: number;
  badge?: string | null;
}

export interface CurrentSeason {
  id: string;
  name: string;
  status: SeasonStatus;
  startAt: string;
  endAt: string;
  prizePoolUsdc: string;
  rankRewards: SeasonRankReward[];
}

export interface SeasonLeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string | null;
  walletAddress: string;
  seasonPoints: number;
  usdcReward?: string;
  pointsReward?: number;
}

export interface SeasonMeResult {
  season: { id: string; name: string; status: SeasonStatus };
  finalRank: number;
  finalPoints: number;
  usdcReward: string;
  pointsReward: number;
  badge?: string;
  payoutStatus: PayoutStatus;
  revealed: boolean;
}

export interface ReferralRate {
  layer: number;
  rateBps: number;
}

export interface ReferralTreeNode {
  userId: string;
  name: string;
  layer: 1 | 2 | 3;
  q: number;
  e: number;
  status: "active" | "inactive";
  children: ReferralTreeNode[];
}

export interface ReferralTree {
  rates: ReferralRate[];
  totalCommissionPoints: number;
  tree: ReferralTreeNode[];
}

/** Unwrap the `{ success, data }` envelope returned by the quest backend. */
export function unwrapEnvelope<T>(raw: unknown): T | null {
  if (raw && typeof raw === "object" && "data" in raw) {
    return (raw as { data: T | null }).data;
  }
  return (raw as T | null) ?? null;
}
