"use client";

/**
 * Step 1 — pick a strategy.
 *
 * Heron's `pages/pools.tsx` shape: a large left-aligned headline, the choice on
 * the left, the live market table on the right, and a single Continue affordance.
 *
 * What is being chosen differs from heron. Tasmil's allocation engine takes a
 * RISK PRESET, not a hand-picked venue list — the backend has no endpoint that
 * accepts individual pools — so the preset is the choice and the market table is
 * the evidence behind it. Presenting per-pool checkboxes here would let the user
 * make a selection the agent never reads, which is the exact defect heron's own
 * comments in that file were written to fix.
 */

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";
import type { ConsolePool, DepositToken, RiskPreset } from "../types";
import { formatApy } from "../utils/format";
import { Eyebrow, Num, Panel, Pill, StepIndicator } from "./console-ui";
import { bestApyFraction, MarketTable } from "./market-table";

interface PresetOption {
  name: RiskPreset;
  headline: string;
  detail: string;
  /** Which registry risk scores this preset is willing to touch. Used to phrase
   *  the card, never to compute a return. */
  risk: string;
}

const PRESETS: readonly PresetOption[] = [
  {
    name: "Safe",
    headline: "Lending only",
    detail:
      "Stablecoin lending markets with the lowest registry risk score. Fewest moving parts, smallest drawdown surface.",
    risk: "Low risk only",
  },
  {
    name: "Balanced",
    headline: "Lending, weighted by rate",
    detail:
      "The default. Spreads across vetted lending markets and rotates when a better rate clears the cost of moving.",
    risk: "Low to moderate risk",
  },
  {
    name: "Aggressive",
    headline: "Lending plus backstop",
    detail:
      "Adds backstop positions, which earn more and carry a queued-withdrawal delay before funds are liquid again.",
    risk: "Up to elevated risk",
  },
] as const;

export interface StrategyScreenProps {
  pools: ConsolePool[] | undefined;
  poolsLoading: boolean;
  poolsError?: unknown;
  token: DepositToken;
  onTokenChange: (token: DepositToken) => void;
  preset: RiskPreset;
  onPresetChange: (preset: RiskPreset) => void;
  onContinue: () => void;
  stepIndex: number;
  stepTotal: number;
}

export function StrategyScreen({
  pools,
  poolsLoading,
  poolsError,
  token,
  onTokenChange,
  preset,
  onPresetChange,
  onContinue,
  stepIndex,
  stepTotal,
}: StrategyScreenProps) {
  // `null` when nothing could be read. Never coerced to 0 — an unreadable rate
  // and a zero rate must not look the same.
  const bestApy = bestApyFraction(pools, token);

  return (
    <div className="flex flex-col" data-testid="farming3-strategy">
      <StepIndicator step={stepIndex} total={stepTotal} />
      <h1 className="mt-5 max-w-[660px] text-balance font-semibold text-[38px] leading-[1.04] tracking-tight sm:text-[48px]">
        Pick a strategy for
        <br />
        the agent to run
      </h1>

      <div className="mt-9 grid items-start gap-8 lg:grid-cols-[1fr_1.15fr] lg:gap-12">
        <div>
          {/* Deposit asset — decides which pool universe the presets draw on. */}
          <Eyebrow>Deposit asset</Eyebrow>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {(["USDC", "XLM"] as const).map((asset) => (
              <button
                key={asset}
                type="button"
                onClick={() => onTokenChange(asset)}
                className={cn(
                  "rounded-full border px-4 py-2 font-medium text-[13px] transition-colors",
                  token === asset
                    ? "border-primary/50 bg-primary/10 text-foreground"
                    : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
                )}
              >
                {asset}
              </button>
            ))}
          </div>

          <div className="mt-7 flex flex-col gap-3">
            {PRESETS.map((option) => {
              const selected = option.name === preset;
              return (
                <button
                  key={option.name}
                  type="button"
                  data-preset={option.name}
                  data-preset-selected={selected}
                  onClick={() => onPresetChange(option.name)}
                  className={cn(
                    "rounded-2xl border p-5 text-left transition-colors",
                    selected
                      ? "border-primary/50 bg-primary/[0.06]"
                      : "border-border bg-card/40 hover:border-border/80"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-[16px] text-foreground">{option.name}</div>
                      <div className="mt-0.5 text-[12.5px] text-muted-foreground">
                        {option.headline}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border transition-colors",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/40"
                      )}
                    >
                      {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                  </div>
                  <p className="mt-3 text-[12.5px] text-muted-foreground leading-relaxed">
                    {option.detail}
                  </p>
                  <div className="mt-3">
                    <Pill tone="neutral">{option.risk}</Pill>
                  </div>
                </button>
              );
            })}
          </div>

          <Panel className="mt-7 p-5">
            <Eyebrow>Best {token} rate available now</Eyebrow>
            <div className="mt-2 font-semibold text-[32px] leading-none tracking-tight">
              {bestApy === null ? (
                <span className="text-[20px] text-muted-foreground/60">
                  {poolsLoading ? "Reading the registry…" : "Not readable right now"}
                </span>
              ) : (
                <Num className="text-emerald-400">{formatApy(bestApy)}</Num>
              )}
            </div>
            <p className="mt-3 text-[12px] text-muted-foreground leading-relaxed">
              This is the highest rate currently published for {token} in the registry, not a return
              the agent promises. It drifts, and the agent only moves when the gain clears the cost
              of moving.
            </p>
          </Panel>

          <div className="mt-7">
            <Button
              variant="gradient"
              size="lg"
              className="px-8"
              onClick={onContinue}
              data-testid="farming3-strategy-continue"
            >
              Continue with {preset}
            </Button>
          </div>
        </div>

        <MarketTable
          pools={pools}
          isLoading={poolsLoading}
          error={poolsError}
          assetFilter={token}
          title={`${token} markets`}
        />
      </div>
    </div>
  );
}
