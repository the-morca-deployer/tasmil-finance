"use client";

/**
 * Drives the three-signature onboarding chain and keeps the pure machine in
 * `utils/journey.ts` in sync with what actually happened.
 *
 * This hook owns no rendering decisions. It dispatches events; `buildJourneyView`
 * turns the resulting state into steps. That split is what makes the state
 * machine testable without a funded mainnet wallet.
 */

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { activeNetwork } from "@/shared/config/stellar";
import {
  useDeployAccount,
  useFundAccount,
  useSetupAccount,
  useSubmitTx,
  useUpdatePreset,
} from "@/shared/hooks/use-account-mutations";
import type {
  ConsoleActivityItem,
  ConsolePosition,
  DepositToken,
  JourneyStepId,
  JourneyStepView,
  RiskPreset,
} from "../types";
import {
  buildJourneyView,
  completionFromAccountStatus,
  currentJourneyStepId,
  initialJourneyProgress,
  isJourneyComplete,
  JOURNEY_STEPS,
  journeyConfirmedCount,
  journeyReducer,
  txHashesFromActivity,
} from "../utils/journey";

async function signXdr(xdr: string, publicKey: string): Promise<string> {
  const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
    address: publicKey,
    networkPassphrase: activeNetwork.networkPassphrase,
  });
  if (typeof signedTxXdr !== "string" || signedTxXdr.length === 0) {
    const err = new Error("Signing was cancelled in your wallet.");
    (err as Error & { userRejected?: boolean }).userRejected = true;
    throw err;
  }
  return signedTxXdr;
}

/** `useSubmitTx` is typed `unknown` at its boundary; the backend's
 *  `POST /api/account/submit` resolves to `{ txHash }`. Narrow, don't cast. */
function readTxHash(result: unknown): string | undefined {
  const hash = (result as { txHash?: unknown } | null)?.txHash;
  return typeof hash === "string" && hash.length > 0 ? hash : undefined;
}

function describeError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (
    (err as { userRejected?: boolean })?.userRejected === true ||
    /user (rejected|denied)|declined|cancelled/i.test(message)
  ) {
    return "Signing was cancelled in your wallet. Nothing was submitted — press Retry when ready.";
  }
  if (/insufficient/i.test(message)) {
    return "Insufficient XLM to cover the network fee. Top the wallet up and retry.";
  }
  if (/timed out/i.test(message)) {
    return "The network did not confirm in time. Retry — already-confirmed steps are skipped.";
  }
  return message;
}

export interface UseSigningJourneyArgs {
  publicKey: string | undefined;
  /** Authoritative server view. Seeds completion so a reload mid-flow does not
   *  redeploy a keeper wallet that already exists. */
  position: ConsolePosition | null | undefined;
  /** Backfills the real tx hashes for a chain signed in an earlier session. */
  activity: ConsoleActivityItem[] | undefined;
  amount: number | null;
  token: DepositToken;
  preset: RiskPreset;
}

export interface UseSigningJourneyResult {
  steps: JourneyStepView[];
  currentStepId: JourneyStepId | null;
  confirmedCount: number;
  totalSteps: number;
  complete: boolean;
  running: boolean;
  error: string | null;
  run: () => Promise<void>;
  retry: () => Promise<void>;
  clearError: () => void;
}

export function useSigningJourney({
  publicKey,
  position,
  activity,
  amount,
  token,
  preset,
}: UseSigningJourneyArgs): UseSigningJourneyResult {
  const [progress, dispatch] = useReducer(journeyReducer, undefined, initialJourneyProgress);

  const deployAccount = useDeployAccount();
  const setupAccount = useSetupAccount();
  const fundAccount = useFundAccount();
  const submitTx = useSubmitTx();
  const updatePreset = useUpdatePreset();

  const inFlight = useRef(false);

  const serverStatus = position?.status;
  useEffect(() => {
    const confirmed = completionFromAccountStatus(serverStatus);
    if (Object.keys(confirmed).length > 0) dispatch({ type: "seed", confirmed });
  }, [serverStatus]);

  // Hashes are seeded per-step so an in-session hash is never overwritten by a
  // slower activity refetch that has not caught up yet.
  useEffect(() => {
    const hashes = txHashesFromActivity(activity);
    for (const [stepId, hash] of Object.entries(hashes)) {
      dispatch({ type: "tx", stepId: stepId as JourneyStepId, hash });
    }
  }, [activity]);

  const runDeploy = useCallback(async () => {
    if (!publicKey) return;
    dispatch({ type: "start", stepId: "deploy" });
    const result = await deployAccount.mutateAsync({ publicKey });

    // The server already has a keeper wallet for this pubkey. Nothing to sign,
    // and no hash to claim: this session did not produce one.
    if (result?.alreadyDeployed) {
      dispatch({ type: "confirm", stepId: "deploy" });
      if (result.status && result.status !== "DEPLOYING") {
        dispatch({ type: "confirm", stepId: "configure_session_key" });
      }
      return;
    }
    if (!result?.xdr) throw new Error("No deploy transaction returned from server");

    dispatch({ type: "phase", phase: "signing" });
    const signed = await signXdr(result.xdr, publicKey);
    dispatch({ type: "phase", phase: "submitting" });
    const submitted = await submitTx.mutateAsync({
      signedXdr: signed,
      publicKey,
      txType: "deploy",
    });
    dispatch({ type: "confirm", stepId: "deploy", hash: readTxHash(submitted) });
  }, [publicKey, deployAccount, submitTx]);

  const runConfigureSessionKey = useCallback(async () => {
    if (!publicKey) return;
    dispatch({ type: "start", stepId: "configure_session_key" });
    const result = await setupAccount.mutateAsync(publicKey);
    const xdr = result?.setupTxs?.[0];
    if (!xdr) throw new Error("No session-key transaction returned from server");

    dispatch({ type: "phase", phase: "signing" });
    const signed = await signXdr(xdr, publicKey);
    dispatch({ type: "phase", phase: "submitting" });
    const submitted = await submitTx.mutateAsync({ signedXdr: signed, publicKey, txType: "setup" });
    dispatch({ type: "confirm", stepId: "configure_session_key", hash: readTxHash(submitted) });
  }, [publicKey, setupAccount, submitTx]);

  const runFund = useCallback(async () => {
    if (!publicKey) return;
    if (amount === null || !(amount > 0)) {
      throw new Error("Enter a deposit amount before funding the vault.");
    }
    dispatch({ type: "start", stepId: "fund" });
    const result = await fundAccount.mutateAsync({ publicKey, amount, token });
    if (!result?.xdr) throw new Error("No funding transaction returned from server");

    dispatch({ type: "phase", phase: "signing" });
    const signed = await signXdr(result.xdr, publicKey);
    dispatch({ type: "phase", phase: "submitting" });
    const submitted = await submitTx.mutateAsync({
      signedXdr: signed,
      publicKey,
      txType: "fund",
      amount,
      token,
    });
    dispatch({ type: "confirm", stepId: "fund", hash: readTxHash(submitted) });
  }, [publicKey, amount, token, fundAccount, submitTx]);

  const runners: Record<JourneyStepId, () => Promise<void>> = useMemo(
    () => ({
      deploy: runDeploy,
      configure_session_key: runConfigureSessionKey,
      fund: runFund,
    }),
    [runDeploy, runConfigureSessionKey, runFund]
  );

  /** Best-effort and deliberately outside the signed chain: a preset that fails
   *  to apply leaves the account on the backend default (BALANCED) and must not
   *  fail a journey whose transactions all landed. */
  const applyPreset = useCallback(async () => {
    if (!publicKey || preset === "Balanced") return;
    try {
      await updatePreset.mutateAsync({ publicKey, preset: preset.toUpperCase() });
    } catch (presetErr) {
      console.warn("farming-3: preset not applied, account stays on BALANCED", presetErr);
    }
  }, [publicKey, preset, updatePreset]);

  const run = useCallback(async () => {
    if (!publicKey || inFlight.current) return;
    inFlight.current = true;
    dispatch({ type: "clearError" });
    try {
      // `progress` cannot be re-read through the reducer mid-loop, so the chain
      // is walked in config order and each runner is a self-contained unit.
      // Steps already confirmed at entry are skipped here; a step confirmed
      // *during* the loop (the `alreadyDeployed` short-circuit) is skipped by
      // its own runner's server call returning that same short-circuit.
      for (const step of JOURNEY_STEPS) {
        if (progress.confirmed[step.id]) continue;
        await runners[step.id]();
      }
      await applyPreset();
    } catch (err) {
      dispatch({ type: "fail", message: describeError(err) });
    } finally {
      inFlight.current = false;
    }
  }, [publicKey, progress.confirmed, runners, applyPreset]);

  const retry = useCallback(async () => {
    dispatch({ type: "clearError" });
    await run();
  }, [run]);

  const steps = useMemo(
    () => buildJourneyView(JOURNEY_STEPS, progress, activeNetwork.explorerUrl),
    [progress]
  );

  return {
    steps,
    currentStepId: currentJourneyStepId(JOURNEY_STEPS, progress),
    confirmedCount: journeyConfirmedCount(JOURNEY_STEPS, progress),
    totalSteps: JOURNEY_STEPS.length,
    complete: isJourneyComplete(JOURNEY_STEPS, progress),
    running:
      progress.activeStepId !== null &&
      (progress.phase === "building" ||
        progress.phase === "signing" ||
        progress.phase === "submitting"),
    error: progress.error,
    run,
    retry,
    clearError: useCallback(() => dispatch({ type: "clearError" }), []),
  };
}
