// Vault Types - Tasmil Vault UI/UX Design System

export interface VaultStats {
  apy: number;
  tvl: number;
  tvlChange24h: number;
  dailyChange: number;
}

export interface UserVaultPosition {
  balance: number;
  shares: number;
  unrealizedYield: number;
  weeklyChange: number;
  depositedAt?: string;
}

export interface AllocationStrategy {
  name: string;
  protocol: string;
  allocation: number;
  apy: number;
  tvl: number;
  icon?: string;
}

export interface ActivityItem {
  id: string;
  type: "yield" | "deposit" | "withdraw" | "rebalance";
  amount?: number;
  timestamp: string;
  source: "auto" | "user" | "ai";
  description?: string;
}

export interface WithdrawOptions {
  standardTime: string;
  emergencyFee: number;
}

export interface VaultConfig {
  name: string;
  token: string;
  shareToken: string;
  network: string;
  contractAddress?: string;
}

export type QuickAmount = 100 | 1000 | 5000 | "MAX";

export interface DepositModalState {
  amount: number;
  estimatedShares: number;
  estimatedApy: number;
  gasEstimate: number;
  status: "ready" | "pending" | "confirming" | "success" | "error";
}

export interface WithdrawModalState {
  amount: number;
  receiveAmount: number;
  remaining: number;
  isEmergency: boolean;
  unwindTime: string;
  fee: number;
  status: "ready" | "pending" | "confirming" | "success" | "error";
}
