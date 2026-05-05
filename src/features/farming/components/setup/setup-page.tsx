"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { usePresets } from "@/features/account/hooks/use-account-api";
import { useStellarBalances } from "@/features/account/hooks/use-stellar-balance";
import type { RiskPreset } from "@/features/account/types";
import { useWalletStore } from "@/store/use-wallet";
import {
  type SetupState,
  clearSetupState,
  loadSetupState,
  saveSetupState,
} from "../../utils/setup-state";
import type { Asset } from "../shared/asset-pill";
import type { Mode } from "../shared/mode-toggle";
import { StepAsset } from "./step-asset";
import { StepDeploy } from "./step-deploy";
import { StepFrame } from "./step-frame";
import { StepPoolPicker } from "./step-pool-picker";
import { StepPreset } from "./step-preset";
import { StepStrategy } from "./step-strategy";

export function SetupPage() {
  const router = useRouter();
  const search = useSearchParams();
  const reconfigure = search.get("reconfigure") === "1";
  const { account } = useWalletStore();
  const publicKey = account ?? "";

  const [state, setState] = useState<SetupState>(() => loadSetupState());
  useEffect(() => saveSetupState(state), [state]);

  const balances = useStellarBalances(publicKey);
  const presets = usePresets(state.asset);

  const set = useCallback(
    (patch: Partial<SetupState>) => setState((prev) => ({ ...prev, ...patch })),
    []
  );

  const advance = () => set({ step: Math.min(state.step + 1, 4) as SetupState["step"] });
  const back = () => set({ step: Math.max(state.step - 1, 1) as SetupState["step"] });

  const goHome = useCallback(() => {
    clearSetupState();
    router.push("/farming/deposit");
  }, [router]);

  const reviewApy =
    presets.data?.find((p) => p.name === state.preset)?.estimatedApy ?? 0;

  if (state.step === 1) {
    return (
      <StepFrame
        currentStep={1}
        totalSteps={reconfigure ? 3 : 4}
        title="Choose deposit asset"
        ctaLabel="Continue"
        onCta={advance}
      >
        <StepAsset
          value={state.asset}
          balances={balances.data ?? { usdc: 0, xlm: 0 }}
          onSelect={(asset: Asset) => set({ asset })}
          reconfigure={reconfigure}
        />
      </StepFrame>
    );
  }

  if (state.step === 2) {
    return (
      <StepFrame
        currentStep={2}
        totalSteps={reconfigure ? 3 : 4}
        title="Agent strategy"
        ctaLabel="Continue"
        onCta={advance}
        onBack={back}
      >
        <StepStrategy
          value={state.mode}
          onChange={(mode: Mode) => set({ mode })}
          customComingSoon
        />
      </StepFrame>
    );
  }

  if (state.step === 3) {
    return (
      <StepFrame
        currentStep={3}
        totalSteps={reconfigure ? 3 : 4}
        title={state.mode === "AUTO" ? "Pick risk preset" : "Pick markets"}
        ctaLabel={reconfigure ? "Save changes" : "Continue"}
        ctaDisabled={state.mode === "CUSTOM" && state.customMarkets.length === 0}
        onCta={() => {
          if (reconfigure) {
            // TODO Phase 3 - call applyPreset / applyMode then router.push("/farming")
            router.push("/farming");
            return;
          }
          advance();
        }}
        onBack={back}
      >
        {state.mode === "AUTO" ? (
          <StepPreset
            presets={presets.data}
            value={state.preset}
            baseAsset={state.asset}
            onSelect={(preset: RiskPreset) => set({ preset })}
          />
        ) : (
          <StepPoolPicker
            value={state.customMarkets}
            onChange={(customMarkets) => set({ customMarkets })}
          />
        )}
      </StepFrame>
    );
  }

  // step 4
  return (
    <StepFrame
      currentStep={4}
      totalSteps={4}
      title="Create your smart account"
      ctaLabel="Sign with your wallet"
      onCta={() => {
        /* CTA wired by StepDeploy itself */
      }}
      ctaDisabled
      onBack={back}
    >
      <StepDeploy
        publicKey={publicKey}
        asset={state.asset}
        mode={state.mode}
        preset={state.preset}
        estimatedApy={reviewApy}
        customMarkets={state.customMarkets}
        onComplete={goHome}
      />
    </StepFrame>
  );
}
