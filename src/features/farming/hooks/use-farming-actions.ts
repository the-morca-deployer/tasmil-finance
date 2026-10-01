import { useCallback, useState } from "react";
import type { RiskPreset } from "@/features/account/types";
import { signOwnerWithdrawAuth } from "@/features/farming/utils/owner-withdraw-auth";
import { activeNetwork } from "@/shared/config/stellar";
import {
  useFinalizeOwnerWithdraw,
  useFundAccount,
  useReactivate,
  useRevoke,
  useSubmitTx,
  useUpdatePreset,
  useWithdraw,
} from "@/shared/hooks/use-account-mutations";

async function signXdr(xdr: string, publicKey: string): Promise<string> {
  const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
    address: publicKey,
    networkPassphrase: activeNetwork.networkPassphrase,
  });
  return signedTxXdr;
}

export function useFarmingActions(publicKey: string | undefined) {
  const fundAccount = useFundAccount();
  const withdrawMutation = useWithdraw();
  const finalizeOwnerWithdraw = useFinalizeOwnerWithdraw();
  const revokeMutation = useRevoke();
  const reactivateMutation = useReactivate();
  const submitTx = useSubmitTx();
  const updatePreset = useUpdatePreset();
  const [actionError, setActionError] = useState<string | null>(null);

  const isPending =
    fundAccount.isPending ||
    withdrawMutation.isPending ||
    finalizeOwnerWithdraw.isPending ||
    revokeMutation.isPending ||
    reactivateMutation.isPending ||
    submitTx.isPending ||
    updatePreset.isPending;

  const fund = useCallback(
    async (amount: number, token: "USDC" | "XLM"): Promise<boolean> => {
      if (!publicKey) return false;
      try {
        setActionError(null);
        const result = await fundAccount.mutateAsync({ publicKey, amount, token });
        if (!result?.xdr) throw new Error("No fund transaction returned from server");
        const signedXdr = await signXdr(result.xdr, publicKey);
        await submitTx.mutateAsync({ signedXdr, publicKey, txType: "fund", amount, token });
        return true;
      } catch (err) {
        console.warn("Fund failed:", err);
        setActionError(err instanceof Error ? err.message : "Operation failed. Please try again.");
        return false;
      }
    },
    [publicKey, fundAccount, submitTx]
  );

  const withdraw = useCallback(
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: faithful extraction from useMemo; refactor deferred
    async (amount: number): Promise<boolean> => {
      if (!publicKey) return false;
      try {
        setActionError(null);
        const result = await withdrawMutation.mutateAsync({ publicKey, amount });
        const xdrs: string[] = result?.xdrs ?? (result?.xdr ? [result.xdr] : []);
        const signedXdrs: string[] = result?.signedXdrs ?? [];
        const serverSubmitted = (result?.submittedTxHashes ?? []) as string[];
        if (xdrs.length === 0 && signedXdrs.length === 0 && serverSubmitted.length === 0) {
          throw new Error("No withdrawal transaction returned from server");
        }
        for (const xdr of xdrs) {
          const authSignedXdr = await signOwnerWithdrawAuth(xdr, publicKey);
          const finalized = await finalizeOwnerWithdraw.mutateAsync({
            publicKey,
            authSignedXdr,
          });
          if (!finalized?.xdr) throw new Error("No finalized withdrawal transaction returned");
          const signedXdr = await signXdr(finalized.xdr, publicKey);
          await submitTx.mutateAsync({
            signedXdr,
            publicKey,
            txType: "withdraw" as const,
            amount: finalized.payoutAmount,
            token: finalized.payoutToken,
          });
        }
        for (const [i, signedXdr] of signedXdrs.entries()) {
          const isLast = xdrs.length === 0 && i === signedXdrs.length - 1;
          await submitTx.mutateAsync({
            signedXdr,
            publicKey,
            ...(isLast ? { txType: "withdraw" as const, amount } : {}),
          });
        }
        return true;
      } catch (err) {
        console.warn("Withdraw failed:", err);
        setActionError(err instanceof Error ? err.message : "Operation failed. Please try again.");
        return false;
      }
    },
    [publicKey, withdrawMutation, finalizeOwnerWithdraw, submitTx]
  );

  const revoke = useCallback(async (): Promise<boolean> => {
    if (!publicKey) return false;
    try {
      setActionError(null);
      const result = await revokeMutation.mutateAsync(publicKey);
      if (!result?.xdr) throw new Error("No revoke transaction returned from server");
      const signedXdr = await signXdr(result.xdr, publicKey);
      await submitTx.mutateAsync({ signedXdr, publicKey, txType: "revoke" });
      return true;
    } catch (err) {
      console.warn("Revoke failed:", err);
      setActionError(err instanceof Error ? err.message : "Operation failed. Please try again.");
      return false;
    }
  }, [publicKey, revokeMutation, submitTx]);

  const reactivate = useCallback(async (): Promise<boolean> => {
    if (!publicKey) return false;
    try {
      setActionError(null);
      const result = await reactivateMutation.mutateAsync(publicKey);
      const setupXdrs = result?.setupTxs ?? [];
      if (setupXdrs.length === 0) {
        throw new Error("No reactivation transaction returned from server");
      }
      for (const [i, xdr] of setupXdrs.entries()) {
        const signedXdr = await signXdr(xdr, publicKey);
        const isLast = i === setupXdrs.length - 1;
        await submitTx.mutateAsync({
          signedXdr,
          publicKey,
          ...(isLast ? { txType: "reactivate" as const } : {}),
        });
      }
      return true;
    } catch (err) {
      console.warn("Reactivate failed:", err);
      setActionError(err instanceof Error ? err.message : "Operation failed. Please try again.");
      return false;
    }
  }, [publicKey, reactivateMutation, submitTx]);

  const applyPreset = useCallback(
    async (preset: RiskPreset): Promise<boolean> => {
      if (!publicKey) return false;
      try {
        setActionError(null);
        await updatePreset.mutateAsync({ publicKey, preset });
        return true;
      } catch (err) {
        console.warn("Update preset failed:", err);
        setActionError(err instanceof Error ? err.message : "Operation failed. Please try again.");
        return false;
      }
    },
    [publicKey, updatePreset]
  );

  return {
    actionError,
    setActionError,
    isPending,
    isUpdatingPreset: updatePreset.isPending,
    fund,
    withdraw,
    revoke,
    reactivate,
    applyPreset,
  };
}
