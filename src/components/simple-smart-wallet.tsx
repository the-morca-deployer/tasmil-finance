"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useSimpleSmartWallet } from "@/hooks/use-simple-smart-wallet";
import { SimpleSmartWalletActions } from "./simple-smart-wallet-actions";
import { SmartAccountService } from "@/services/smart-account";
import { formatEther } from "viem";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";

export function SimpleSmartWallet() {
  const { address, isConnected } = useAccount();
  const {
    smartAccount,
    isCreating,
    isDeploying,
    error,
    deployAccount,
    reset,
    isWalletClientLoading
  } = useSimpleSmartWallet();

  const [showActions, setShowActions] = useState(false);
  const [eoaBalance, setEoaBalance] = useState<string>("0");
  const [smartWalletBalance, setSmartWalletBalance] = useState<string>("0");

  // Load balances
  const loadBalances = async () => {
    try {
      if (address) {
        const eoaBal = await SmartAccountService.getBalance(address);
        setEoaBalance(formatEther(eoaBal));
      }
      
      if (smartAccount) {
        const smartBal = await SmartAccountService.getBalance(smartAccount.address);
        setSmartWalletBalance(formatEther(smartBal));
      }
    } catch (error) {
      console.error("Error loading balances:", error);
    }
  };

  useEffect(() => {
    loadBalances();
  }, [address, smartAccount?.address]);

  if (!isConnected) {
    return (
      <Card className="max-w-md mx-auto bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4">
        <p className="text-yellow-800 dark:text-yellow-200 text-center">Please connect your wallet first</p>
      </Card>
    );
  }

  if (isWalletClientLoading) {
    return (
      <Card className="max-w-md mx-auto p-4">
        <p className="text-center">Loading wallet...</p>
      </Card>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-center">Smart Account Wallet</h2>
      
      {/* Connected Wallet */}
      <Card className="mb-4 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">Connected Wallet (EOA)</h3>
          <Button
            onClick={loadBalances}
            variant="ghost"
            size="sm"
            className="text-sm text-blue-500 hover:text-blue-600"
          >
            🔄 Refresh
          </Button>
        </div>
        <div className="text-sm font-mono break-all text-gray-600 dark:text-gray-400 mb-2">
          {address}
        </div>
        <div className="text-lg font-semibold">
          Balance: {parseFloat(eoaBalance).toFixed(4)} ETH
        </div>
      </Card>

      {/* Creating State */}
      {isCreating && (
        <Card className="mb-4 p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            <span>Creating smart account...</span>
          </div>
        </Card>
      )}

      {/* Smart Account */}
      {smartAccount && (
        <div className="mb-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Smart Wallet</span>
              <Badge variant={smartAccount.isDeployed ? "default" : "secondary"}>
                {smartAccount.isDeployed ? "Active" : "Not Active"}
              </Badge>
            </div>
            <div className="text-sm font-mono break-all text-gray-600 dark:text-gray-400 mb-2">
              {smartAccount.address}
            </div>
            <div className="text-lg font-semibold mb-3">
              Balance: {parseFloat(smartWalletBalance).toFixed(4)} ETH
            </div>

            {/* Activate Button */}
            {!smartAccount.isDeployed && (
              <Button
                onClick={deployAccount}
                disabled={isDeploying}
                className="w-full mb-3"
              >
                {isDeploying ? "Activating..." : "Activate Smart Wallet"}
              </Button>
            )}

            {/* Actions */}
            {smartAccount.isDeployed && (
              <div className="space-y-2">
                <Button
                  onClick={() => setShowActions(!showActions)}
                  className="w-full"
                >
                  {showActions ? "Hide Actions" : "Show Deposit/Withdraw"}
                </Button>
                
                {showActions && (
                  <div className="mt-4">
                    <SimpleSmartWalletActions 
                      smartAccountClient={smartAccount.client}
                      smartAccountAddress={smartAccount.address}
                    />
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
        </Card>
      )}

      {/* Reset */}
      {smartAccount && (
        <Button
          onClick={reset}
          variant="outline"
          className="w-full"
        >
          Reset
        </Button>
      )}

      {/* Quick Info */}
      <Card className="mt-4 bg-gray-100 dark:bg-gray-700 p-4">
        <h4 className="font-medium mb-2">💡 How it works:</h4>
        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
          <li>• <strong>Deposit:</strong> Send ETH from your EOA to Smart Wallet (pays gas)</li>
          <li>• <strong>Withdraw:</strong> Send ETH from Smart Wallet to EOA (free gas!)</li>
          <li>• <strong>Smart Wallet:</strong> Uses sponsored gas for all transactions</li>
        </ul>
      </Card>
    </div>
  );
}