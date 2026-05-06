"use client";

import { useEffect, useRef, useState } from "react";
import { activeNetwork } from "@/shared/config/stellar";
import type { DeploySubStep, RiskPreset } from "../types";
import {
  useDeployAccount,
  usePosition,
  useSetupAccount,
  useSubmitTx,
  useUpdatePreset,
} from "./use-account-api";

const DEFAULT_PRESET: RiskPreset = "Balanced";

interface SignResult {
  signedTxXdr?: string;
}

function assertSigned(signResult: SignResult | null | undefined): string {
  const xdr = signResult?.signedTxXdr;
  if (typeof xdr !== "string" || xdr.length === 0) {
    const err = new Error("User rejected transaction signing");
    (err as Error & { userRejected?: boolean }).userRejected = true;
    throw err;
  }
  return xdr;
}

export interface UseOnboardingDeployArgs {
  publicKey: string | null;
  selectedPreset: RiskPreset;
}

export interface UseOnboardingDeployResult {
  deploy: () => Promise<void>;
  retry: () => Promise<void>;
  clearError: () => void;
  isDeploying: boolean;
  deploySubStep: DeploySubStep;
  deployCompleted: boolean;
  setupCompleted: boolean;
  deployError: string | null;
  deployErrorWasRejection: boolean;
  /** True after the full deploy → setup → preset chain finished successfully. */
  allDone: boolean;
}

/**
 * Encapsulates the multi-TX onboarding flow:
 *   1. Deploy keeper-wallet contract (sign + submit)
 *   2. Configure session key (sign + submit)
 *   3. Apply chosen risk preset (best-effort)
 *
 * Surfaces sub-step state, classified errors, and a single deploy() entry.
 * Caller decides post-success routing (e.g. router.push("/farming")).
 */
export function useOnboardingDeploy({
  publicKey,
  selectedPreset,
}: UseOnboardingDeployArgs): UseOnboardingDeployResult {
  const deployAccount = useDeployAccount();
  const setupAccount = useSetupAccount();
  const submitTx = useSubmitTx();
  const updatePreset = useUpdatePreset();

  // Authoritative server view of the account. Used to seed completion flags
  // on hydration so a page reload mid-flow doesn't lose progress and trigger
  // a destructive redeploy. Refetches on the existing usePosition cadence —
  // no extra network traffic.
  const position = usePosition(publicKey ?? undefined);
  const serverStatus = position.data?.status;

  const [deploySubStep, setDeploySubStep] = useState<DeploySubStep>("idle");
  const [deployCompleted, setDeployCompleted] = useState(false);
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deployErrorWasRejection, setDeployErrorWasRejection] = useState(false);
  const [allDone, setAllDone] = useState(false);

  const flowInProgressRef = useRef(false);

  // Seed completion flags from server. We never *unset* a flag from server
  // state — only flip false → true — so an in-flight local mutation that
  // hasn't landed in the DB yet won't be clobbered by a stale fetch.
  useEffect(() => {
    if (!serverStatus) return;
    if (flowInProgressRef.current) return;

    if (
      serverStatus === "DEPLOYING" ||
      serverStatus === "AWAITING_FUND" ||
      serverStatus === "ACTIVE" ||
      serverStatus === "HALTED" ||
      serverStatus === "REVOKED"
    ) {
      // TX 1 (deploy) confirmed in DB — keeper wallet exists on-chain.
      setDeployCompleted((prev) => prev || true);
    }

    if (
      serverStatus === "AWAITING_FUND" ||
      serverStatus === "ACTIVE" ||
      serverStatus === "HALTED"
    ) {
      // TX 2 (setup) confirmed in DB — session key registered & valid.
      // REVOKED is excluded: the on-chain session key has been revoked, so
      // the keeper can't act until the user re-signs setup via the separate
      // reactivate flow. Don't pretend the flow is done.
      setSetupCompleted((prev) => prev || true);
      setAllDone((prev) => prev || true);
    }
  }, [serverStatus]);

  const getStellarKit = async () => {
    const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
    const passphrase = activeNetwork.networkPassphrase;
    return { StellarWalletsKit, passphrase };
  };

  const handleDeployTx = async (): Promise<boolean> => {
    if (!publicKey) return false;
    await buildSignSubmitDeploy(false);
    return true;
  };

  const isKeeperNotDeployedError = (err: unknown): boolean => {
    const e = err as {
      response?: { data?: { message?: unknown; code?: string } };
      message?: string;
    };
    const data = e?.response?.data;
    if (data?.code === "KEEPER_NOT_DEPLOYED") return true;
    const detail =
      typeof data?.message === "object" &&
      data?.message !== null &&
      "code" in (data.message as object)
        ? (data.message as { code?: string }).code
        : undefined;
    if (detail === "KEEPER_NOT_DEPLOYED") return true;
    const text = String(e?.message ?? "");
    return (
      text.includes("KEEPER_NOT_DEPLOYED") ||
      text.includes("not fully deployed on-chain")
    );
  };

  /** Build, sign, and submit the deploy TX. Optionally pass `recover: true`
   *  to opt into the destructive cleanup path on the server. */
  const buildSignSubmitDeploy = async (recover: boolean): Promise<void> => {
    if (!publicKey) return;
    setDeploySubStep("building_deploy");
    const result = await deployAccount.mutateAsync({ publicKey, recover });

    // With recover=true, the server always returns a fresh XDR (no
    // alreadyDeployed short-circuit). The non-recover path may short-circuit
    // when a valid deployed account already exists.
    if (!recover && result?.alreadyDeployed) {
      setDeployCompleted(true);
      if (result.status && result.status !== "DEPLOYING") {
        setSetupCompleted(true);
      }
      return;
    }

    if (!result?.xdr) {
      throw new Error("No deploy transaction returned from server");
    }

    setDeploySubStep("signing_deploy");
    const { StellarWalletsKit, passphrase } = await getStellarKit();
    const signed = await StellarWalletsKit.signTransaction(result.xdr, {
      address: publicKey,
      networkPassphrase: passphrase,
    });
    const signedTxXdr = assertSigned(signed);

    setDeploySubStep("submitting_deploy");
    await submitTx.mutateAsync({
      signedXdr: signedTxXdr,
      publicKey,
      txType: "deploy",
    });

    setDeployCompleted(true);
  };

  const handleSetupTx = async (): Promise<boolean> => {
    if (!publicKey) return false;

    let setupResult;
    setDeploySubStep("building_setup");
    try {
      setupResult = await setupAccount.mutateAsync(publicKey);
    } catch (err) {
      // Backend reports the keeper contract has no on-chain instance state.
      // This is the legacy-bug stuck state — DB row references a keeper
      // address that was never properly deployed. Auto-recover: run an
      // explicit redeploy (recover=true wipes the stale row + returns a
      // fresh deploy XDR), then rebuild the setup TX against the new keeper.
      if (!isKeeperNotDeployedError(err)) throw err;

      // Reset local flag — we're about to re-sign deploy TX 1.
      setDeployCompleted(false);
      await buildSignSubmitDeploy(true);

      setDeploySubStep("building_setup");
      setupResult = await setupAccount.mutateAsync(publicKey);
    }

    const setupXdrs = setupResult?.setupTxs ?? [];
    if (setupXdrs.length === 0) {
      throw new Error("No setup transaction returned from server");
    }

    const setupXdr = setupXdrs[0];
    if (!setupXdr) {
      throw new Error("Invalid setup transaction payload");
    }

    setDeploySubStep("signing_setup");
    const { StellarWalletsKit, passphrase } = await getStellarKit();
    const signed = await StellarWalletsKit.signTransaction(setupXdr, {
      address: publicKey,
      networkPassphrase: passphrase,
    });
    const signedTxXdr = assertSigned(signed);

    setDeploySubStep("submitting_setup");
    await submitTx.mutateAsync({
      signedXdr: signedTxXdr,
      publicKey,
      txType: "setup",
    });

    setSetupCompleted(true);
    return true;
  };

  const applyChosenPreset = async (): Promise<boolean> => {
    if (!publicKey) return false;
    if (selectedPreset === DEFAULT_PRESET) return true;

    setDeploySubStep("applying_preset");
    await updatePreset.mutateAsync({
      publicKey,
      preset: selectedPreset.toUpperCase(),
    });
    return true;
  };

  const deploy = async () => {
    if (!publicKey || flowInProgressRef.current) return;

    flowInProgressRef.current = true;
    setDeployError(null);
    setDeployErrorWasRejection(false);

    let succeeded = false;
    try {
      if (!deployCompleted) await handleDeployTx();
      if (!setupCompleted) await handleSetupTx();
      try {
        await applyChosenPreset();
      } catch (presetErr: unknown) {
        const m = presetErr instanceof Error ? presetErr.message : String(presetErr);
        console.warn("Preset application failed; leaving account on default BALANCED:", m);
      }
      setDeploySubStep("done");
      succeeded = true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Account creation failed:", message);

      const rejected =
        (err as { userRejected?: boolean })?.userRejected === true ||
        message.includes("User rejected") ||
        message.includes("user rejected") ||
        message.includes("User denied") ||
        message.includes("declined") ||
        message.includes("cancelled");
      if (rejected) {
        setDeployErrorWasRejection(true);
        setDeployError(
          deployCompleted && !setupCompleted
            ? "Signing was cancelled. Your account was deployed but session-key setup didn't complete — click Retry to finish."
            : "Signing was cancelled in your wallet. Click Retry to try again."
        );
      } else if (message.includes("insufficient") || message.includes("Insufficient")) {
        setDeployErrorWasRejection(false);
        setDeployError("Insufficient XLM balance. Please fund your wallet and try again.");
      } else if (message.includes("timed out")) {
        setDeployErrorWasRejection(false);
        setDeployError("Transaction confirmation timed out. Please try again.");
      } else {
        setDeployErrorWasRejection(false);
        setDeployError(message);
      }
      setDeploySubStep("idle");
    } finally {
      flowInProgressRef.current = false;
      if (succeeded) setAllDone(true);
    }
  };

  const clearError = () => {
    setDeployError(null);
    setDeployErrorWasRejection(false);
  };

  const retry = async () => {
    clearError();
    await deploy();
  };

  const isDeploying = deploySubStep !== "idle" && deploySubStep !== "done";

  return {
    deploy,
    retry,
    clearError,
    isDeploying,
    deploySubStep,
    deployCompleted,
    setupCompleted,
    deployError,
    deployErrorWasRejection,
    allDone,
  };
}
