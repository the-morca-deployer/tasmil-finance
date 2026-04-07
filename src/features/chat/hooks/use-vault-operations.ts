"use client";

/**
 * Vault operations hooks — placeholder after EVM removal.
 * These were previously EVM/wagmi-based contract interaction hooks.
 * On Stellar, vault deposit/withdraw goes through the backend API
 * (see use-vault-api.ts in the vault feature).
 */

import { useState } from "react";

interface TransactionResult {
  hash: string;
  isConfirmed: boolean;
}

export function useVaultDeposit() {
  const [isPending] = useState(false);

  const deposit = async (
    _vaultAddress: string,
    _amountUSDC: string,
    _receiverAddress?: string
  ): Promise<TransactionResult> => {
    throw new Error(
      "EVM vault deposit is not available. Use the Stellar vault API instead."
    );
  };

  return { deposit, isPending };
}

export function useVaultWithdraw() {
  const [isPending] = useState(false);

  const withdraw = async (
    _vaultAddress: string,
    _amountUSDC: string
  ): Promise<TransactionResult> => {
    throw new Error(
      "EVM vault withdraw is not available. Use the Stellar vault API instead."
    );
  };

  return { withdraw, isPending };
}

export function useVaultRedeem() {
  const [isPending] = useState(false);

  const redeem = async (
    _vaultAddress: string,
    _sharesAmount: string
  ): Promise<TransactionResult> => {
    throw new Error(
      "EVM vault redeem is not available. Use the Stellar vault API instead."
    );
  };

  return { redeem, isPending };
}

export function useVaultApprove() {
  const [isPending] = useState(false);

  const approve = async (
    _spender: string,
    _amountUSDC: string
  ): Promise<TransactionResult> => {
    throw new Error(
      "EVM vault approve is not available. Use the Stellar vault API instead."
    );
  };

  return { approve, isPending };
}
