"use client";

import { useState } from "react";
import { useSendTransaction, usePublicClient } from "wagmi";
import { type Address, parseEther } from "viem";
import { SmartAccountService } from "@/services/smart-account";

// Hook for EOA deposit to Smart Wallet
export function useDepositToSmartWallet() {
  const [lastTxHash, setLastTxHash] = useState<string>("");
  const [isWaiting, setIsWaiting] = useState(false);
  const publicClient = usePublicClient();
  
  const {
    isPending,
    error,
    isError,
    sendTransactionAsync,
  } = useSendTransaction();

  const deposit = async (smartWalletAddress: Address, amount: string) => {
    setIsWaiting(true);
    try {
      // Send transaction
      const hash = await sendTransactionAsync({
        to: smartWalletAddress,
        value: parseEther(amount),
      });
      
      setLastTxHash(hash);
      
      // Wait for confirmation
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
      
      return hash;
    } catch (error) {
      throw error;
    } finally {
      setIsWaiting(false);
    }
  };

  return {
    deposit,
    isLoading: isPending || isWaiting,
    lastTxHash,
    error,
    isError,
  };
}

// Hook for Smart Wallet withdraw to EOA
export function useWithdrawFromSmartWallet() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string>("");
  const [error, setError] = useState<Error | null>(null);

  const withdraw = async (
    smartWalletClient: any,
    eoaAddress: Address,
    amount: string
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const hash = await SmartAccountService.withdrawFromSmartWallet(
        smartWalletClient,
        eoaAddress,
        amount
      );
      
      setLastTxHash(hash);
      return hash;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Withdrawal failed");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    withdraw,
    isLoading,
    lastTxHash,
    error,
    isError: !!error,
  };
}