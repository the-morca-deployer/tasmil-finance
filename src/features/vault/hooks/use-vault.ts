"use client";

import { useCallback, useState } from "react";

import {
  DEFAULT_ALLOCATIONS,
  DEFAULT_VAULT_STATS,
  VAULT_CONFIG,
  WITHDRAW_CONFIG,
} from "../constants";
import type {
  ActivityItem,
  AllocationStrategy,
  DepositModalState,
  UserVaultPosition,
  VaultStats,
  WithdrawModalState,
} from "../types";

// Mock activity data
const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: "1",
    type: "yield",
    amount: 0.43,
    timestamp: new Date().toISOString(),
    source: "auto",
  },
  {
    id: "2",
    type: "rebalance",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    source: "ai",
    description: "Morpho APY +3.2%",
  },
  {
    id: "3",
    type: "yield",
    amount: 0.41,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    source: "auto",
  },
  {
    id: "4",
    type: "deposit",
    amount: 1000,
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    source: "user",
  },
];

export function useVault() {
  const [isLoading, setIsLoading] = useState(false);

  // Vault stats
  const [vaultStats] = useState<VaultStats>(DEFAULT_VAULT_STATS);

  // User position (mock data - would come from wallet/contract)
  const [userPosition] = useState<UserVaultPosition | null>({
    balance: 1012.3,
    shares: 1012,
    unrealizedYield: 12.3,
    weeklyChange: 1.23,
    depositedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  });

  // Allocations
  const [allocations] = useState<AllocationStrategy[]>(DEFAULT_ALLOCATIONS);

  // Activities
  const [activities] = useState<ActivityItem[]>(MOCK_ACTIVITIES);

  // Last rebalance info
  const lastRebalance = {
    timeAgo: "2h 15m",
    apyBoost: 0.3,
  };

  return {
    config: VAULT_CONFIG,
    vaultStats,
    userPosition,
    allocations,
    activities,
    lastRebalance,
    withdrawConfig: WITHDRAW_CONFIG,
    isLoading,
    setIsLoading,
  };
}

export function useDeposit() {
  const [modalState, setModalState] = useState<DepositModalState>({
    amount: 0,
    estimatedShares: 0,
    estimatedApy: DEFAULT_VAULT_STATS.apy,
    gasEstimate: 0.15,
    status: "ready",
  });

  const setAmount = useCallback((amount: number) => {
    setModalState((prev) => ({
      ...prev,
      amount,
      estimatedShares: amount, // 1:1 for simplicity
    }));
  }, []);

  const deposit = useCallback(async () => {
    setModalState((prev) => ({ ...prev, status: "pending" }));

    // Simulate wallet confirmation
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setModalState((prev) => ({ ...prev, status: "confirming" }));

    // Simulate transaction
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setModalState((prev) => ({ ...prev, status: "success" }));
  }, []);

  const reset = useCallback(() => {
    setModalState({
      amount: 0,
      estimatedShares: 0,
      estimatedApy: DEFAULT_VAULT_STATS.apy,
      gasEstimate: 0.15,
      status: "ready",
    });
  }, []);

  return {
    modalState,
    setAmount,
    deposit,
    reset,
  };
}

export function useWithdraw() {
  const [modalState, setModalState] = useState<WithdrawModalState>({
    amount: 0,
    receiveAmount: 0,
    remaining: 0,
    isEmergency: false,
    unwindTime: WITHDRAW_CONFIG.standardUnwindTime,
    fee: 0,
    status: "ready",
  });

  const setAmount = useCallback(
    (amount: number, userBalance: number) => {
      const isEmergency = modalState.isEmergency;
      const fee = isEmergency ? amount * (WITHDRAW_CONFIG.emergencyFee / 100) : 0;

      setModalState((prev) => ({
        ...prev,
        amount,
        receiveAmount: amount - fee,
        remaining: userBalance - amount,
        fee,
      }));
    },
    [modalState.isEmergency]
  );

  const setEmergency = useCallback((isEmergency: boolean, amount: number) => {
    const fee = isEmergency ? amount * (WITHDRAW_CONFIG.emergencyFee / 100) : 0;

    setModalState((prev) => ({
      ...prev,
      isEmergency,
      unwindTime: isEmergency ? "Instant" : WITHDRAW_CONFIG.standardUnwindTime,
      fee,
      receiveAmount: amount - fee,
    }));
  }, []);

  const withdraw = useCallback(async () => {
    setModalState((prev) => ({ ...prev, status: "pending" }));

    await new Promise((resolve) => setTimeout(resolve, 1000));
    setModalState((prev) => ({ ...prev, status: "confirming" }));

    await new Promise((resolve) => setTimeout(resolve, 2000));
    setModalState((prev) => ({ ...prev, status: "success" }));
  }, []);

  const reset = useCallback(() => {
    setModalState({
      amount: 0,
      receiveAmount: 0,
      remaining: 0,
      isEmergency: false,
      unwindTime: WITHDRAW_CONFIG.standardUnwindTime,
      fee: 0,
      status: "ready",
    });
  }, []);

  return {
    modalState,
    setAmount,
    setEmergency,
    withdraw,
    reset,
  };
}
