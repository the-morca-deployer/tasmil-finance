"use client";

/**
 * Simple Smart Wallet component — placeholder after EVM removal.
 * EVM smart accounts are not applicable to Stellar.
 */
import { useWallet } from "@/shared/context/wallet-context";
import { Card } from "@/shared/ui/card";

export function SimpleSmartWallet() {
  const { isConnected, address } = useWallet();

  if (!isConnected) {
    return (
      <Card className="max-w-md mx-auto bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4">
        <p className="text-yellow-800 dark:text-yellow-200 text-center">
          Please connect your Stellar wallet first
        </p>
      </Card>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-center">Stellar Wallet</h2>
      <Card className="p-4">
        <div className="text-sm font-mono break-all text-gray-600 dark:text-gray-400 mb-2">
          {address}
        </div>
        <p className="text-sm text-muted-foreground">
          Connected to Stellar network. Smart account features are handled by the vault contracts.
        </p>
      </Card>
    </div>
  );
}
