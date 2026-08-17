"use client";

/**
 * Step 2 — how much.
 *
 * The projection block is the part worth being careful about. It is shown ONLY
 * when both an amount and a readable rate exist; with either missing it says so
 * instead of printing "$0.00 / year", which would read as a measured forecast of
 * nothing. And it is labelled as the current rate held flat, because that is all
 * it is — the rate drifts and the agent rotates.
 */

import { Loader2 } from "lucide-react";
import { useId } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";
import type { ConsolePool, DepositToken, RiskPreset } from "../types";
import { formatApy, formatUsd } from "../utils/format";
import { Eyebrow, Hairline, Num, Panel, StepIndicator } from "./console-ui";
import { bestApyFraction } from "./market-table";

const QUICK_AMOUNTS = [10, 50, 100, 500];

export interface DepositScreenProps {
  pools: ConsolePool[] | undefined;
  poolsLoading: boolean;
  token: DepositToken;
  preset: RiskPreset;
  amountText: string;
  onAmountTextChange: (value: string) => void;
  onBack: () => void;
  onContinue: () => void;
  busy?: boolean;
  stepIndex: number;
  stepTotal: number;
}

export function DepositScreen({
  pools,
  poolsLoading,
  token,
  preset,
  amountText,
  onAmountTextChange,
  onBack,
  onContinue,
  busy,
  stepIndex,
  stepTotal,
}: DepositScreenProps) {
  const inputId = useId();
  const parsed = Number.parseFloat(amountText);
  const amount = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  const apy = bestApyFraction(pools, token);

  // Both inputs must be real. A missing rate is not zero yield; a missing
  // amount is not a zero deposit.
  const projectedYearly = amount !== null && apy !== null ? amount * apy : null;

  return (
    <div className="flex flex-col" data-testid="farming3-deposit">
      <StepIndicator step={stepIndex} total={stepTotal} />
      <h1 className="mt-5 max-w-[660px] text-balance font-semibold text-[38px] leading-[1.04] tracking-tight sm:text-[48px]">
        How much {token} should
        <br />
        the agent manage?
      </h1>

      <div className="mt-9 grid max-w-[900px] gap-8 lg:grid-cols-[1.1fr_1fr]">
        <Panel>
          <label htmlFor={inputId} className="block">
            <Eyebrow>Deposit amount</Eyebrow>
          </label>
          <div className="mt-3 flex items-baseline gap-3 border-border border-b pb-3">
            <input
              id={inputId}
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              placeholder="0.00"
              value={amountText}
              onChange={(event) => onAmountTextChange(event.target.value)}
              disabled={busy}
              data-testid="farming3-amount-input"
              className="w-full bg-transparent font-semibold text-[34px] text-foreground tabular-nums outline-none placeholder:text-muted-foreground/40 disabled:opacity-60"
            />
            <span className="shrink-0 font-medium text-[16px] text-muted-foreground">{token}</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onAmountTextChange(String(value))}
                disabled={busy}
                className={cn(
                  "rounded-full border border-border bg-muted/30 px-3.5 py-1.5 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                )}
              >
                {value} {token}
              </button>
            ))}
          </div>

          <Hairline className="mt-6" />

          <div className="mt-4 flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13px] text-muted-foreground">Strategy</span>
              <span className="font-medium text-[13px] text-foreground">{preset}</span>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13px] text-muted-foreground">Current best {token} rate</span>
              <span className="font-medium text-[13px]">
                {apy === null ? (
                  <span className="text-muted-foreground/60">
                    {poolsLoading ? "reading…" : "not readable"}
                  </span>
                ) : (
                  <Num className="text-emerald-400">{formatApy(apy)}</Num>
                )}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13px] text-muted-foreground">
                At that rate, held flat, one year
              </span>
              <span className="font-medium text-[13px]">
                {projectedYearly === null ? (
                  <span className="text-muted-foreground/60">
                    {amount === null ? "enter an amount" : "rate not readable"}
                  </span>
                ) : (
                  <Num className="text-foreground">{formatUsd(projectedYearly)}</Num>
                )}
              </span>
            </div>
          </div>

          <p className="mt-4 text-[11.5px] text-muted-foreground/80 leading-relaxed">
            An arithmetic projection of today&apos;s published rate, not a forecast and not a
            promise. Rates move, and the agent rotates between markets when the gain clears the cost
            of moving.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button variant="ghost" size="lg" onClick={onBack} disabled={busy}>
              Back
            </Button>
            <Button
              variant="gradient"
              size="lg"
              className="px-8"
              onClick={onContinue}
              disabled={amount === null || busy}
              data-testid="farming3-deposit-continue"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Review signatures
            </Button>
            {amount === null && (
              <span className="text-[12px] text-muted-foreground">
                Enter an amount above zero to continue.
              </span>
            )}
          </div>
        </Panel>

        <Panel>
          <Eyebrow>What happens to this money</Eyebrow>
          <ol className="mt-4 flex flex-col gap-4">
            {[
              {
                title: "It moves into a wallet you own",
                body: "The keeper wallet is a contract account controlled by your key. Tasmil cannot withdraw from it.",
              },
              {
                title: "The agent gets a scoped session key",
                body: "Rate-limited, whitelisted to strategy contracts, and revocable from the dashboard at any time.",
              },
              {
                title: "The allocation engine deploys it",
                body: "Runs every ten minutes. It only rebalances when the rate gain clears the transaction cost.",
              },
            ].map((item, index) => (
              <li key={item.title} className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-muted/60 font-semibold text-[11px] text-muted-foreground tabular-nums">
                  {index + 1}
                </span>
                <div>
                  <div className="font-medium text-[13.5px] text-foreground">{item.title}</div>
                  <p className="mt-1 text-[12.5px] text-muted-foreground leading-relaxed">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </div>
  );
}
