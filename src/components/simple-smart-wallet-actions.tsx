"use client";

import { useState, useEffect } from "react";
import { type Address, formatEther } from "viem";
import { useAccount } from "wagmi";
import { useDepositToSmartWallet, useWithdrawFromSmartWallet } from "@/hooks/use-simple-wallet-transactions";
import { SmartAccountService } from "@/services/smart-account";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Card } from "@/shared/ui/card";

interface SimpleSmartWalletActionsProps {
  smartAccountClient: any;
  smartAccountAddress: Address;
}

export function SimpleSmartWalletActions({ 
  smartAccountClient, 
  smartAccountAddress 
}: SimpleSmartWalletActionsProps) {
  const { address: eoaAddress } = useAccount();
  
  const [depositAmount, setDepositAmount] = useState<string>("0.001");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("0.001");
  const [eoaBalance, setEoaBalance] = useState<string>("0");
  const [smartWalletBalance, setSmartWalletBalance] = useState<string>("0");

  // Transaction hooks
  const {
    deposit,
    isLoading: isDepositLoading,
    lastTxHash: depositTxHash,
    error: depositError,
  } = useDepositToSmartWallet();

  const {
    withdraw,
    isLoading: isWithdrawLoading,
    lastTxHash: withdrawTxHash,
    error: withdrawError,
  } = useWithdrawFromSmartWallet();

  const lastTxHash = depositTxHash || withdrawTxHash;

  // Load balances
  const loadBalances = async () => {
    try {
      if (eoaAddress) {
        const eoaBal = await SmartAccountService.getBalance(eoaAddress);
        setEoaBalance(formatEther(eoaBal));
      }
      
      const smartBal = await SmartAccountService.getBalance(smartAccountAddress);
      setSmartWalletBalance(formatEther(smartBal));
    } catch (error) {
      console.error("Error loading balances:", error);
    }
  };

  useEffect(() => {
    loadBalances();
  }, [eoaAddress, smartAccountAddress]);

  // Refresh balances after transactions
  useEffect(() => {
    if ((depositTxHash && !isDepositLoading) || (withdrawTxHash && !isWithdrawLoading)) {
      loadBalances();
    }
  }, [depositTxHash, isDepositLoading, withdrawTxHash, isWithdrawLoading]);

  const handleDeposit = async () => {
    if (!depositAmount) return;
    try {
      await deposit(smartAccountAddress, depositAmount);
    } catch (error) {
      console.error("Deposit failed:", error);
    }
  };

  const handleWithdraw = async () => {
    if (!eoaAddress || !withdrawAmount) return;
    try {
      await withdraw(smartAccountClient, eoaAddress, withdrawAmount);
    } catch (error) {
      console.error("Withdrawal failed:", error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Balances */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-blue-50 dark:bg-blue-900/20 p-3">
          <h4 className="font-medium text-blue-800 dark:text-blue-300 text-sm">EOA Balance</h4>
          <p className="text-lg font-mono">{parseFloat(eoaBalance).toFixed(4)} ETH</p>
          <Button
            onClick={loadBalances}
            variant="ghost"
            size="sm"
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-0 h-auto"
          >
            🔄 Refresh
          </Button>
        </Card>
        <Card className="bg-green-50 dark:bg-green-900/20 p-3">
          <h4 className="font-medium text-green-800 dark:text-green-300 text-sm">Smart Wallet Balance</h4>
          <p className="text-lg font-mono">{parseFloat(smartWalletBalance).toFixed(4)} ETH</p>
        </Card>
      </div>

      {/* Deposit */}
      <Card className="border p-4">
        <h4 className="font-medium mb-3">💰 Deposit (EOA → Smart Wallet)</h4>
        <div className="space-y-3">
          <Input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            step="0.001"
            min="0"
            placeholder="Amount (ETH)"
          />
          <Button
            onClick={handleDeposit}
            disabled={isDepositLoading || !depositAmount}
            className="w-full"
          >
            {isDepositLoading ? "Processing..." : "Deposit"}
          </Button>
          {depositError && (
            <p className="text-xs text-red-600 dark:text-red-400">
              ❌ {depositError.message}
            </p>
          )}
        </div>
      </Card>

      {/* Withdraw */}
      <Card className="border p-4">
        <h4 className="font-medium mb-3">💸 Withdraw (Smart Wallet → EOA)</h4>
        <div className="space-y-3">
          <Input
            type="number"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            step="0.001"
            min="0"
            placeholder="Amount (ETH)"
          />
          <Button
            onClick={handleWithdraw}
            disabled={isWithdrawLoading || !withdrawAmount || !eoaAddress}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isWithdrawLoading ? "Processing..." : "Withdraw"}
          </Button>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            ⚡ Free gas with sponsored transactions
          </p>
          {withdrawError && (
            <p className="text-xs text-red-600 dark:text-red-400">
              ❌ {withdrawError.message}
            </p>
          )}
        </div>
      </Card>

      {/* Transaction Result */}
      {lastTxHash && (
        <Card className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
          <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">✅ Transaction Complete</h4>
          <div className="text-sm font-mono break-all text-green-700 dark:text-green-400 mb-2">{lastTxHash}</div>
          <Button
            onClick={() => window.open(`https://sepolia.etherscan.io/tx/${lastTxHash}`, '_blank')}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            View on Etherscan
          </Button>
        </Card>
      )}
    </div>
  );
}