// Vault Constants - Tasmil Vault UI/UX Design System

import type { AllocationStrategy, QuickAmount, VaultConfig, VaultStats } from "./types";

export const VAULT_CONFIG: VaultConfig = {
  name: "Tasmil Vault",
  token: "USDC",
  shareToken: "tUSDC",
  network: "Base",
};

export const QUICK_AMOUNTS: QuickAmount[] = [100, 1000, 5000, "MAX"];

export const DEFAULT_VAULT_STATS: VaultStats = {
  apy: 14.7,
  tvl: 1200000,
  tvlChange24h: 4820,
  dailyChange: 0.04,
};

export const DEFAULT_ALLOCATIONS: AllocationStrategy[] = [
  {
    name: "Morpho Blue",
    protocol: "Morpho",
    allocation: 60,
    apy: 15.2,
    tvl: 720000,
    icon: "/icons/morpho.svg",
  },
  {
    name: "Pendle PTs",
    protocol: "Pendle",
    allocation: 25,
    apy: 13.8,
    tvl: 300000,
    icon: "/icons/pendle.svg",
  },
  {
    name: "GMX GLP",
    protocol: "GMX",
    allocation: 15,
    apy: 22.1,
    tvl: 180000,
    icon: "/icons/gmx.svg",
  },
];

export const WITHDRAW_CONFIG = {
  standardUnwindTime: "~15 minutes",
  emergencyFee: 0.5,
};

export const PERFORMANCE_BENCHMARK = {
  vaultReturn: 18.7,
  buyAndHold: 12.3,
};
