// Tasmil Vault Feature - Best-in-Class UI/UX Design System
// Apple-level simplicity meets DeFi sophistication

export {
  ActivityFeed,
  AIStatus,
  AIStatusCompact,
  AllocationDisplay,
  DepositInput,
  DepositModal,
  MobileVaultDashboard,
  PerformanceComparison,
  UserPositionCard,
  VaultActivityPage,
  VaultDailyChange,
  VaultDemo,
  VaultLandingPage,
  VaultPortfolioPage,
  VaultStatsCard,
  VaultStrategiesPage,
  WithdrawModal,
} from "./components";

export { useDeposit, useVault, useWithdraw } from "./hooks";

export type {
  ActivityItem,
  AllocationStrategy,
  DepositModalState,
  QuickAmount,
  UserVaultPosition,
  VaultConfig,
  VaultStats,
  WithdrawModalState,
  WithdrawOptions,
} from "./types";

export {
  DEFAULT_ALLOCATIONS,
  DEFAULT_VAULT_STATS,
  PERFORMANCE_BENCHMARK,
  QUICK_AMOUNTS,
  VAULT_CONFIG,
  WITHDRAW_CONFIG,
} from "./constants";
