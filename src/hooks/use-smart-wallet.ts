import { useState, useCallback } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { SmartWalletService, createSmartWalletFromWallet, type SmartWalletResult } from "@/lib/smart-wallet";
import { toast } from "sonner";

export interface UseSmartWalletReturn {
  isCreating: boolean;
  smartWalletAddress: string | null;
  createSmartWallet: (paymasterType?: 'sponsor' | 'erc20' | 'none') => Promise<SmartWalletResult | null>;
  sendInitialTransaction: () => Promise<SmartWalletResult | null>;
  approveTokenForPaymaster: () => Promise<string | null>;
  sendGaslessTransaction: (to: `0x${string}`, value?: bigint, data?: `0x${string}`) => Promise<string | null>;
  error: string | null;
  paymasterType: 'sponsor' | 'erc20' | 'none' | null;
}

export function useSmartWallet(): UseSmartWalletReturn {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [isCreating, setIsCreating] = useState(false);
  const [smartWalletAddress, setSmartWalletAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [walletService, setWalletService] = useState<SmartWalletService | null>(null);
  const [paymasterType, setPaymasterType] = useState<'sponsor' | 'erc20' | 'none' | null>(null);

  const createSmartWallet = useCallback(async (paymasterType: 'sponsor' | 'erc20' | 'none' = 'sponsor'): Promise<SmartWalletResult | null> => {
    if (!isConnected || !address) {
      const errorMsg = "Please connect your wallet first";
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    }

    if (!walletClient || !walletClient.account) {
      const errorMsg = "Wallet client with account not available";
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    }

    setIsCreating(true);
    setError(null);

    try {
      const service = await createSmartWalletFromWallet(walletClient as any, paymasterType);
      const result = await service.createSmartWallet();
      
      setWalletService(service);
      setSmartWalletAddress(result.address);
      setPaymasterType(paymasterType);
      
      const paymasterInfo = paymasterType === 'none' ? '' : ` with ${paymasterType} paymaster`;
      toast.success(`Smart wallet created${paymasterInfo}: ${result.address.slice(0, 6)}...${result.address.slice(-4)}`);
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create smart wallet";
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [isConnected, address, walletClient]);

  const approveTokenForPaymaster = useCallback(async (): Promise<string | null> => {
    if (!walletService) {
      const errorMsg = "Smart wallet not initialized";
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    }

    setIsCreating(true);
    setError(null);

    try {
      const txHash = await walletService.approveTokenForPaymaster();
      toast.success("Token approved for paymaster!");
      return txHash;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to approve token";
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [walletService]);

  const sendGaslessTransaction = useCallback(async (
    to: `0x${string}`, 
    value: bigint = BigInt(0), 
    data: `0x${string}` = "0x"
  ): Promise<string | null> => {
    if (!walletService) {
      const errorMsg = "Smart wallet not initialized";
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    }

    setIsCreating(true);
    setError(null);

    try {
      const txHash = await walletService.sendGaslessTransaction(to, value, data);
      toast.success("Gasless transaction sent successfully!");
      return txHash;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to send gasless transaction";
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [walletService]);

  const sendInitialTransaction = useCallback(async (): Promise<SmartWalletResult | null> => {
    if (!walletService) {
      const errorMsg = "Smart wallet not initialized";
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    }

    setIsCreating(true);
    setError(null);

    try {
      const result = await walletService.sendInitialTransaction();
      toast.success("Initial transaction sent successfully!");
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to send initial transaction";
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [walletService]);

  return {
    isCreating,
    smartWalletAddress,
    createSmartWallet,
    sendInitialTransaction,
    approveTokenForPaymaster,
    sendGaslessTransaction,
    error,
    paymasterType,
  };
}