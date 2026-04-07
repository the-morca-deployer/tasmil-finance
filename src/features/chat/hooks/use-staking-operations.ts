"use client";

/**
 * Staking operations hooks — placeholder after EVM removal.
 * These were previously EVM/wagmi-based SFC contract hooks for U2U staking.
 * Stellar staking will be implemented separately.
 */

import { useState } from "react";

/**
 * Format wei to U2U with proper decimals — kept for display compatibility
 */
export function formatU2U(weiAmount: string | bigint): string {
  try {
    const wei = typeof weiAmount === "string" ? BigInt(weiAmount) : weiAmount;
    // Simple wei to ether conversion (18 decimals)
    const ether = Number(wei) / 1e18;
    return ether.toString();
  } catch {
    return "0";
  }
}

function createStubHook(operationName: string) {
  return () => {
    const [isConfirmed] = useState(false);
    const [isPending] = useState(false);

    const execute = async (..._args: unknown[]) => {
      throw new Error(
        `EVM ${operationName} is not available. Stellar staking not yet implemented.`
      );
    };

    return {
      isConfirmed,
      isPending,
      hash: undefined as string | undefined,
      errorMessage: "",
      isError: false,
      [operationName]: execute,
    };
  };
}

export const useDelegateStake = () => {
  const base = createStubHook("delegateStake")();
  return { ...base, delegateStake: base["delegateStake"] as (validatorID: number, amountWei: string) => Promise<{ hash: string; isConfirmed: boolean }> };
};

export const useUndelegateStake = () => {
  const base = createStubHook("undelegateStake")();
  return { ...base, undelegateStake: base["undelegateStake"] as (validatorID: number, wrID: number, amountWei: string) => Promise<{ hash: string; isConfirmed: boolean }> };
};

export const useClaimRewards = () => {
  const base = createStubHook("claimRewards")();
  return { ...base, claimRewards: base["claimRewards"] as (validatorID: number) => Promise<{ hash: string; isConfirmed: boolean }> };
};

export const useRestakeRewards = () => {
  const base = createStubHook("restakeRewards")();
  return { ...base, restakeRewards: base["restakeRewards"] as (validatorID: number) => Promise<{ hash: string; isConfirmed: boolean }> };
};

export const useLockStake = () => {
  const base = createStubHook("lockStake")();
  return { ...base, lockStake: base["lockStake"] as (validatorID: number, lockupDuration: number, amountWei: string) => Promise<{ hash: string; isConfirmed: boolean }> };
};
