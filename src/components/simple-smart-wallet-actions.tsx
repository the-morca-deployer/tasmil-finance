"use client";

/**
 * Simple Smart Wallet Actions — placeholder after EVM removal.
 * EVM smart account deposit/withdraw is not applicable to Stellar.
 */

export function SimpleSmartWalletActions() {
  return (
    <div className="p-4 text-center text-muted-foreground">
      <p>Smart wallet actions are not available on Stellar.</p>
      <p className="text-sm mt-2">Use the vault deposit/withdraw flow instead.</p>
    </div>
  );
}
