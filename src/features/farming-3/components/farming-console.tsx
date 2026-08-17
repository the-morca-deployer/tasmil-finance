"use client";

/**
 * `/farming-3` — the whole flow, in order: pick a strategy → set the deposit →
 * sign the chain → land on the dashboard and watch the APY.
 *
 * Stage routing is derived from the server's account status first and local
 * intent second, so a reload mid-flow lands where the chain actually is rather
 * than back at step one. A wallet whose account is already ACTIVE opens on the
 * dashboard; a wallet with no account opens on strategy selection.
 */

import { Loader2, Wallet } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { isNotFoundError } from "@/lib/query-error";
import { Button } from "@/shared/ui/button";
import { useWalletHydrated, useWalletStore } from "@/store/use-wallet";
import {
  useConsoleActivity,
  useConsolePools,
  useConsolePosition,
  useConsoleRebalanceStatus,
} from "../hooks/use-console-api";
import { useSigningJourney } from "../hooks/use-signing-journey";
import type { ConsoleStage, DepositToken, RiskPreset } from "../types";
import { shortAddress } from "../utils/format";
import { ConsoleShell } from "./console-shell";
import { Panel } from "./console-ui";
import { DashboardScreen } from "./dashboard-screen";
import { DepositScreen } from "./deposit-screen";
import { JourneyPanel } from "./journey-panel";
import { StrategyScreen } from "./strategy-screen";

/** The flow's own steps, ahead of the dashboard. Kept as a list so the step
 *  counter never disagrees with what is rendered. */
const FLOW_STAGES: readonly ConsoleStage[] = ["strategy", "deposit", "journey"] as const;

function ConnectPrompt() {
  return (
    <Panel className="mx-auto mt-16 flex max-w-lg flex-col items-center py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-muted/50">
        <Wallet className="h-6 w-6 text-muted-foreground" />
      </span>
      <h2 className="mt-4 font-semibold text-[20px] text-foreground">Connect your wallet</h2>
      <p className="mt-2 max-w-sm text-[13px] text-muted-foreground leading-relaxed">
        The console reads your keeper wallet and its live positions straight off Stellar. Nothing is
        shown until there is an address to read.
      </p>
    </Panel>
  );
}

/** Header chrome: the connected address plus whichever cross-navigation is
 *  meaningful from where the user currently is. */
function ConsoleActions({
  publicKey,
  stage,
  serverStage,
  onGoStrategy,
  onGoDashboard,
}: {
  publicKey: string;
  stage: ConsoleStage;
  serverStage: ConsoleStage;
  onGoStrategy: () => void;
  onGoDashboard: () => void;
}) {
  const onDashboard = stage === "dashboard";
  return (
    <>
      <span className="rounded-full border border-border bg-muted/30 px-3.5 py-1.5 font-mono text-[12px] text-muted-foreground">
        {shortAddress(publicKey, 4)}
      </span>
      {onDashboard && (
        <Button variant="ghost" size="sm" onClick={onGoStrategy}>
          Change strategy
        </Button>
      )}
      {!onDashboard && serverStage === "dashboard" && (
        <Button variant="ghost" size="sm" onClick={onGoDashboard}>
          Back to dashboard
        </Button>
      )}
    </>
  );
}

/** Server truth first. An account with money at work belongs on the dashboard
 *  whatever the local flow state says, so a reload lands where the chain is. */
function stageFromStatus(status: string | undefined): ConsoleStage {
  if (status === "ACTIVE" || status === "HALTED" || status === "REVOKED") return "dashboard";
  if (status === "DEPLOYING" || status === "AWAITING_FUND") return "journey";
  return "strategy";
}

/** Step 3 — the signing chain, plus a way back to the amount. */
function JourneyStage({
  journey,
  amount,
  onDone,
  onChangeAmount,
}: {
  journey: ReturnType<typeof useSigningJourney>;
  amount: number | null;
  onDone: () => void;
  onChangeAmount: () => void;
}) {
  const blockedReason =
    amount === null && !journey.complete
      ? "Set a deposit amount before signing the funding transaction."
      : null;

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-6">
      <JourneyPanel
        steps={journey.steps}
        confirmedCount={journey.confirmedCount}
        totalSteps={journey.totalSteps}
        complete={journey.complete}
        running={journey.running}
        error={journey.error}
        onRun={journey.run}
        onRetry={journey.retry}
        onDone={onDone}
        blockedReason={blockedReason}
      />
      <button
        type="button"
        onClick={onChangeAmount}
        className="self-start text-[12.5px] text-muted-foreground hover:text-foreground"
      >
        ← Change the amount
      </button>
    </div>
  );
}

export function FarmingConsole() {
  const { account } = useWalletStore();
  const walletHydrated = useWalletHydrated();
  const publicKey = account ?? undefined;

  const [token, setToken] = useState<DepositToken>("USDC");
  const [preset, setPreset] = useState<RiskPreset>("Balanced");
  const [amountText, setAmountText] = useState("");
  /** Where the user has navigated to. `null` means "wherever the server says". */
  const [stageOverride, setStageOverride] = useState<ConsoleStage | null>(null);

  const positionQuery = useConsolePosition(publicKey);
  const poolsQuery = useConsolePools();
  const rebalanceQuery = useConsoleRebalanceStatus();
  const activityQuery = useConsoleActivity(publicKey);

  const position = positionQuery.data;
  const parsedAmount = Number.parseFloat(amountText);
  const amount = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : null;

  const journey = useSigningJourney({
    publicKey,
    position,
    activity: activityQuery.data,
    amount,
    token,
    preset,
  });

  const serverStage = useMemo(() => stageFromStatus(position?.status), [position?.status]);
  const stage: ConsoleStage = stageOverride ?? serverStage;

  const goToDashboard = useCallback(() => setStageOverride("dashboard"), []);
  const goToStrategy = useCallback(() => setStageOverride("strategy"), []);
  const goToDeposit = useCallback(() => setStageOverride("deposit"), []);
  const goToJourney = useCallback(() => setStageOverride("journey"), []);

  const flowIndex = FLOW_STAGES.indexOf(stage);
  const progress = stage === "dashboard" ? undefined : (flowIndex + 1) / (FLOW_STAGES.length + 1);

  const actions = publicKey ? (
    <ConsoleActions
      publicKey={publicKey}
      stage={stage}
      serverStage={serverStage}
      onGoStrategy={goToStrategy}
      onGoDashboard={goToDashboard}
    />
  ) : null;

  // "Not read back yet" is not "not connected". React renders the persisted
  // store's server snapshot during hydration, so a connected wallet reads as
  // null for one pass - long enough to flash the connect prompt at someone
  // who is already connected.
  if (!walletHydrated) {
    return (
      <ConsoleShell>
        <div className="flex items-center justify-center gap-3 py-24 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-[13px]">Reading your wallet…</span>
        </div>
      </ConsoleShell>
    );
  }

  if (!publicKey) {
    return (
      <ConsoleShell>
        <ConnectPrompt />
      </ConsoleShell>
    );
  }

  // First read of the account. Rendering "no account yet" before the query
  // settles would push an existing user through onboarding they already did.
  // `isPending`, not `isLoading`: an enabled query that has not begun
  // fetching yet reports `isLoading === false` with no data, and that empty
  // hand would route straight to stage "strategy" - onboarding, again.
  if (positionQuery.isPending) {
    return (
      <ConsoleShell actions={actions}>
        <div className="flex items-center justify-center gap-3 py-24 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-[13px]">Reading your account from the chain…</span>
        </div>
      </ConsoleShell>
    );
  }

  // Same rule one step further: a read that failed for any reason other than
  // "no such account" (404, which is how the backend says a wallet has no
  // managed account) tells us nothing about whether one exists, so it must
  // not start the flow at step one.
  if (positionQuery.isError && !position && !isNotFoundError(positionQuery.error)) {
    return (
      <ConsoleShell actions={actions}>
        <Panel className="mx-auto mt-16 flex max-w-lg flex-col items-center py-14 text-center">
          <h2 className="font-semibold text-[20px] text-foreground">
            Couldn&apos;t read your account
          </h2>
          <p className="mt-2 max-w-sm text-[13px] text-muted-foreground leading-relaxed">
            Your funds and your keeper wallet are untouched - this is the read that failed, not the
            account.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-5"
            onClick={() => positionQuery.refetch()}
          >
            Try again
          </Button>
        </Panel>
      </ConsoleShell>
    );
  }

  return (
    <ConsoleShell actions={actions} progress={progress}>
      {stage === "strategy" && (
        <StrategyScreen
          pools={poolsQuery.data}
          poolsLoading={poolsQuery.isLoading}
          poolsError={poolsQuery.error}
          token={token}
          onTokenChange={setToken}
          preset={preset}
          onPresetChange={setPreset}
          onContinue={goToDeposit}
          stepIndex={1}
          stepTotal={FLOW_STAGES.length}
        />
      )}

      {stage === "deposit" && (
        <DepositScreen
          pools={poolsQuery.data}
          poolsLoading={poolsQuery.isLoading}
          token={token}
          preset={preset}
          amountText={amountText}
          onAmountTextChange={setAmountText}
          onBack={goToStrategy}
          onContinue={goToJourney}
          stepIndex={2}
          stepTotal={FLOW_STAGES.length}
        />
      )}

      {stage === "journey" && (
        <JourneyStage
          journey={journey}
          amount={amount}
          onDone={goToDashboard}
          onChangeAmount={goToDeposit}
        />
      )}

      {stage === "dashboard" && (
        <DashboardScreen
          position={position}
          positionLoading={positionQuery.isLoading}
          positionError={positionQuery.error}
          pools={poolsQuery.data}
          poolsLoading={poolsQuery.isLoading}
          poolsError={poolsQuery.error}
          activity={activityQuery.data}
          activityLoading={activityQuery.isLoading}
          activityError={activityQuery.error}
          // `null` where the status query has not answered: "unknown" is a
          // third state and must not render as "not ready".
          botReady={rebalanceQuery.data ? rebalanceQuery.data.ready : null}
          botHalted={rebalanceQuery.data ? rebalanceQuery.data.halted : null}
          botHaltReason={rebalanceQuery.data?.haltReason ?? null}
          journeySteps={journey.steps}
          onDeposit={goToDeposit}
        />
      )}
    </ConsoleShell>
  );
}
