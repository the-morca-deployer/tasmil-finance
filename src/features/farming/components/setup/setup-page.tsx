"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePosition, usePresets } from "@/features/account/hooks/use-account-api";
import { useStellarBalances } from "@/features/account/hooks/use-stellar-balance";
import { useFarmingActions } from "@/features/farming/hooks/use-farming-actions";
import { useWalletStore } from "@/store/use-wallet";
import {
  clearSetupState,
  loadSetupState,
  type SetupState,
  saveSetupState,
} from "../../utils/setup-state";
import { SetupShell } from "./setup-shell";
import { StepConnect } from "./step-connect";
import { StepCreateAccount } from "./step-create-account";
import { StepDeposit } from "./step-deposit";
import { StepDone } from "./step-done";
import { StepStrategy } from "./step-strategy";

export function SetupPage() {
  const { account } = useWalletStore();
  const publicKey = account ?? "";

  const [state, setState] = useState<SetupState>(() => ({
    step: 1,
    asset: "USDC",
    mode: "AUTO",
    preset: "Balanced",
    customMarkets: [],
  }));
  const [hydrated, setHydrated] = useState(false);

  // Load persisted state after mount to avoid SSR/CSR hydration mismatch.
  useEffect(() => {
    setState(loadSetupState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveSetupState(state);
  }, [state, hydrated]);
  useEffect(() => {
    if (state.step === 5) clearSetupState();
  }, [state.step]);

  const balances = useStellarBalances(publicKey);
  const presets = usePresets(state.asset);
  const actions = useFarmingActions(publicKey);

  // Server-authoritative recovery: when the user lands on /farming after
  // having already deployed (e.g. signed TX 1 + 2 then reloaded), fast-forward
  // past the create-account step so they never see a "Create" CTA that could
  // accidentally trigger a destructive redeploy. Only runs once per mount.
  const position = usePosition(publicKey || undefined);
  const serverStatus = position.data?.status;
  const fastForwardedRef = useRef(false);
  useEffect(() => {
    if (!hydrated) return;
    if (fastForwardedRef.current) return;
    if (!serverStatus) return;

    let target: SetupState["step"] | null = null;
    if (serverStatus === "AWAITING_FUND") target = 4;
    else if (serverStatus === "ACTIVE" || serverStatus === "HALTED") target = 5;
    // DEPLOYING / REVOKED → no fast-forward; existing flow handles them.

    if (target !== null && state.step < target) {
      fastForwardedRef.current = true;
      setState((prev) => ({ ...prev, step: target! }));
    }
  }, [hydrated, serverStatus, state.step]);

  const set = useCallback(
    (patch: Partial<SetupState>) => setState((prev) => ({ ...prev, ...patch })),
    []
  );

  const advance = useCallback(
    () => set({ step: Math.min(state.step + 1, 5) as SetupState["step"] }),
    [state.step, set]
  );
  const back = () => set({ step: Math.max(state.step - 1, 1) as SetupState["step"] });

  const selectedPresetData = presets.data?.find((p) => p.name === state.preset);
  const reviewApy = selectedPresetData?.estimatedApy ?? 0;
  const poolCount = selectedPresetData?.poolCount ?? 0;
  const balancesByAsset = {
    USDC: balances.data?.usdc ?? 0,
    XLM: balances.data?.xlm ?? 0,
  };

  const handleFund = useCallback(
    async (amount: number, asset: "USDC" | "XLM") => {
      const ok = await actions.fund(amount, asset);
      if (ok) advance();
    },
    [actions, advance]
  );

  if (state.step === 1) {
    return <StepConnect onConnected={() => set({ step: 2 })} />;
  }

  if (state.step === 2) {
    return (
      <StepStrategy
        preset={state.preset}
        onSelect={(preset) => {
          set({ preset, mode: "AUTO" });
          advance();
        }}
        onBack={back}
      />
    );
  }

  if (state.step === 3) {
    return (
      <StepCreateAccount
        publicKey={publicKey}
        preset={state.preset}
        onComplete={advance}
        onBack={back}
      />
    );
  }

  if (state.step === 4) {
    return (
      <StepDeposit
        asset={state.asset}
        preset={state.preset}
        estimatedApy={reviewApy}
        poolCount={poolCount}
        balances={balancesByAsset}
        onAssetChange={(next) => set({ asset: next })}
        isFunding={actions.isPending}
        onFund={handleFund}
        onBack={back}
      />
    );
  }

  // step 5
  return (
    <SetupShell currentStep={5} totalSteps={5} ctaLabel="Done" onCta={() => {}} hideCta>
      <StepDone />
    </SetupShell>
  );
}
