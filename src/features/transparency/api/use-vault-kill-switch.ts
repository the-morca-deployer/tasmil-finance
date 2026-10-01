"use client";

import { useCallback, useState } from "react";
import { activeNetwork } from "@/shared/config/stellar";
import { useBuildKillSwitch, useSubmitTx } from "@/shared/hooks/use-account-mutations";

export function useVaultKillSwitch(publicKey?: string, onConfirmed?: () => void) {
  const build = useBuildKillSwitch();
  const submit = useSubmitTx();
  const [error, setError] = useState<string | null>(null);

  const setEnabled = useCallback(
    async (enabled: boolean): Promise<boolean> => {
      if (!publicKey) return false;
      try {
        setError(null);
        const { xdr } = await build.mutateAsync({ publicKey, enabled });
        const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
        const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
          address: publicKey,
          networkPassphrase: activeNetwork.networkPassphrase,
        });
        await submit.mutateAsync({ signedXdr: signedTxXdr, publicKey });
        onConfirmed?.();
        return true;
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Operation failed. Please try again.");
        return false;
      }
    },
    [build, onConfirmed, publicKey, submit]
  );

  return {
    setEnabled,
    isPending: build.isPending || submit.isPending,
    error,
  };
}
