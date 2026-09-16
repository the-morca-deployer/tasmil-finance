"use client";

/**
 * The signing journey, rendered from a list.
 *
 * Ported from heron's `journey.tsx`: same idea (every step's state is read from
 * where the system actually knows it, and a step that cannot be read stays
 * unknown rather than green), rebuilt on `src/shared/ui` and on tasmil's
 * three-signature mainnet chain.
 *
 * This component walks `steps` and knows nothing about how many there are.
 * Collapsing deploy + configure into one signature changes `JOURNEY_STEPS`
 * only; nothing here moves.
 */

import { AlertTriangle, ArrowUpRight, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";
import type { JourneyStepView } from "../types";
import { shortHash } from "../utils/format";
import { Eyebrow, Hairline, Num, Panel, Rail } from "./console-ui";

function StepGlyph({ step }: { step: JourneyStepView }) {
  const base =
    "grid h-7 w-7 shrink-0 place-items-center rounded-full font-semibold text-[11px] tabular-nums";
  if (step.state === "confirmed") {
    return (
      <span className={cn(base, "bg-emerald-500/15 text-emerald-400")}>
        <Check className="h-3.5 w-3.5" strokeWidth={2.6} />
      </span>
    );
  }
  if (step.state === "signing") {
    return (
      <span className={cn(base, "bg-primary/15 text-primary")}>
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      </span>
    );
  }
  if (step.state === "failed") {
    return (
      <span className={cn(base, "bg-destructive/15 text-destructive")}>
        <AlertTriangle className="h-3.5 w-3.5" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        base,
        step.isCurrent
          ? "bg-primary text-primary-foreground"
          : "border border-border text-muted-foreground"
      )}
    >
      {step.index + 1}
    </span>
  );
}

const STATE_LABEL: Record<JourneyStepView["state"], string> = {
  pending: "Pending",
  signing: "Awaiting signature",
  confirmed: "Confirmed",
  failed: "Failed",
};

const STATE_CLASS: Record<JourneyStepView["state"], string> = {
  pending: "text-muted-foreground/70",
  signing: "text-primary",
  confirmed: "text-emerald-400",
  failed: "text-destructive",
};

export function JourneyStepRow({ step }: { step: JourneyStepView }) {
  return (
    <li
      data-journey-step={step.id}
      data-journey-state={step.state}
      className={cn(
        "rounded-xl border p-4 transition-colors",
        step.isCurrent ? "border-primary/40 bg-primary/[0.04]" : "border-border"
      )}
    >
      <div className="flex items-start gap-3">
        <StepGlyph step={step} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-medium text-[14px] text-foreground">{step.title}</span>
            <span className={cn("text-[11.5px]", STATE_CLASS[step.state])}>
              {STATE_LABEL[step.state]}
            </span>
          </div>
          <p className="mt-1.5 text-[12.5px] text-muted-foreground leading-relaxed">
            {step.detail}
          </p>

          {/* A hash is shown only once it exists. No hash means "not known
              yet", which is why there is no link and no placeholder hash. */}
          {step.txHash && step.explorerUrl ? (
            <a
              href={step.explorerUrl}
              target="_blank"
              rel="noreferrer"
              data-journey-tx={step.txHash}
              className="mt-2.5 inline-flex items-center gap-1 font-mono text-[12px] text-primary hover:underline"
            >
              <Num>{shortHash(step.txHash)}</Num>
              <ArrowUpRight className="h-3 w-3" />
            </a>
          ) : (
            <p className="mt-2.5 text-[11.5px] text-muted-foreground/60">
              {step.state === "confirmed"
                ? "Signed in an earlier session — no hash recorded"
                : "No transaction yet"}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

export interface JourneyPanelProps {
  steps: JourneyStepView[];
  confirmedCount: number;
  totalSteps: number;
  complete: boolean;
  running: boolean;
  error: string | null;
  onRun: () => void;
  onRetry: () => void;
  onDone?: () => void;
  /** Disables the primary action with a reason (e.g. no amount entered). */
  blockedReason?: string | null;
}

/** The action row. Split out so `JourneyPanel` stays a layout function. */
function JourneyActions({
  totalSteps,
  complete,
  running,
  error,
  started,
  onRun,
  onRetry,
  onDone,
  blockedReason,
}: Pick<
  JourneyPanelProps,
  "totalSteps" | "complete" | "running" | "error" | "onRun" | "onRetry" | "onDone" | "blockedReason"
> & { started: boolean }) {
  if (complete) {
    return (
      <Button variant="gradient" size="lg" onClick={onDone} data-testid="farming3-journey-done">
        Open the dashboard
      </Button>
    );
  }

  const label = error ? "Retry" : started ? "Continue signing" : `Sign ${totalSteps} transactions`;

  return (
    <>
      <Button
        variant="gradient"
        size="lg"
        onClick={error ? onRetry : onRun}
        disabled={running || Boolean(blockedReason)}
        data-testid="farming3-journey-run"
      >
        {running && <Loader2 className="h-4 w-4 animate-spin" />}
        {label}
      </Button>
      <span className="text-[12px] text-muted-foreground">
        {blockedReason ?? "Confirmed steps are skipped on retry."}
      </span>
    </>
  );
}

export function JourneyPanel({
  steps,
  confirmedCount,
  totalSteps,
  complete,
  running,
  error,
  onRun,
  onRetry,
  onDone,
  blockedReason,
}: JourneyPanelProps) {
  const started = confirmedCount > 0 || running || error !== null;

  return (
    <Panel data-testid="farming3-journey">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <Eyebrow>Signing</Eyebrow>
          <h2 className="mt-1.5 font-semibold text-[19px] text-foreground tracking-tight">
            {complete ? "Your vault is live" : "Sign the setup chain"}
          </h2>
        </div>
        <span className="text-[12.5px] text-muted-foreground tabular-nums">
          {confirmedCount} of {totalSteps} confirmed
        </span>
      </div>

      <Rail className="mt-3" value={totalSteps === 0 ? 0 : confirmedCount / totalSteps} />

      <p className="mt-3 text-[12.5px] text-muted-foreground leading-relaxed">
        Mainnet needs {totalSteps} signatures today. The pinned keeper-wallet contract takes only an
        owner in its constructor, so deploying the wallet and registering the agent&apos;s session
        key cannot share one transaction.
      </p>

      <ol className="mt-4 flex flex-col gap-2.5">
        {steps.map((step) => (
          <JourneyStepRow key={step.id} step={step} />
        ))}
      </ol>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-[12.5px] text-destructive leading-relaxed"
        >
          {error}
        </div>
      )}

      <Hairline className="mt-5" />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <JourneyActions
          totalSteps={totalSteps}
          complete={complete}
          running={running}
          error={error}
          started={started}
          onRun={onRun}
          onRetry={onRetry}
          onDone={onDone}
          blockedReason={blockedReason}
        />
      </div>
    </Panel>
  );
}
