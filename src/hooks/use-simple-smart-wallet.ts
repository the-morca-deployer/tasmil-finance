"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { SmartAccountService, type SmartAccountResult } from "@/services/smart-account";

export interface UseSimpleSmartWalletReturn {
  smartAccount: SmartAccountResult | null;
  isCreating: boolean;
  isDeploying: boolean;
  error: string | null;
  deployAccount: () => Promise<void>;
  reset: () => void;
  isWalletClientLoading: boolean;
}

export function useSimpleSmartWallet(): UseSimpleSmartWalletReturn {
  const { address } = useAccount();
  const { data: walletClient, isLoading: isWalletClientLoading } = useWalletClient();
  
  const [smartAccount, setSmartAccount] = useState<SmartAccountResult | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSmartAccount = useCallback(async () => {
    if (!walletClient?.account || !address) return;

    setIsCreating(true);
    setError(null);

    try {
      const result = await SmartAccountService.createSmartAccount({
        walletClient: walletClient as any,
      });
      setSmartAccount(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create smart account");
    } finally {
      setIsCreating(false);
    }
  }, [walletClient, address]);

  const deployAccount = useCallback(async () => {
    if (!smartAccount?.client || smartAccount.isDeployed) return;

    setIsDeploying(true);
    setError(null);

    try {
      await SmartAccountService.deployAccount(smartAccount.client, smartAccount.address);
      setSmartAccount(prev => prev ? { 
        ...prev, 
        isDeployed: true,
        isWhitelisted: true 
      } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to activate account");
    } finally {
      setIsDeploying(false);
    }
  }, [smartAccount]);

  const reset = useCallback(() => {
    setSmartAccount(null);
    setError(null);
    setIsCreating(false);
    setIsDeploying(false);
  }, []);

  // Reset when address changes
  useEffect(() => {
    reset();
  }, [address, reset]);

  // Auto-create smart account
  useEffect(() => {
    if (address && walletClient && !smartAccount && !isCreating) {
      createSmartAccount();
    }
  }, [address, walletClient, smartAccount, isCreating, createSmartAccount]);

  return {
    smartAccount,
    isCreating,
    isDeploying,
    error,
    deployAccount,
    reset,
    isWalletClientLoading,
  };
}