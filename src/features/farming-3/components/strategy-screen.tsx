"use client";

/**
 * Step 1 — pick a strategy.
 *
 * Heron's `pages/pools.tsx` shape: a large left-aligned headline, the choice on
 * the left, the live market table on the right, and a single Continue affordance.
 *
 * What is being chosen differs from heron, and this is the whole design problem
 * of the screen. Tasmil's allocation engine takes a RISK PRESET, not a
 * hand-picked venue list — `PUT /api/account/preset/:publicKey` is the only
 * write, and no endpoint accepts pools. Porting heron's per-pool checkboxes
 * would let a user make a selection the agent never reads.
 *
 * So the preset stays the control, and the CONSEQUENCE is made legible instead:
 * each preset card carries the size of the candidate set the server says that
 * preset can draw from, and the table on the right lists that set for whichever
 * preset is selected. Those numbers come from `GET /api/pools?riskPreset=…`,
 * which is the backend's own `getFilteredPools` — the risk ceiling, TVL floor,
 * asset compatibility and "a strategy is actually deployed" gate, applied
 * server-side. Nothing here restates a threshold the UI could get wrong.
 *
 * The distinction the copy holds to: a candidate set is what the preset CAN pick
 * from. The engine then scores that set and keeps only its top few. "Can pick
 * from" is true; "will hold" would not be.
 */

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import type { PresetCandidates } from "../hooks/use-console-api";
import type { ConsolePool, DepositToken, RiskPreset } from "../types";
import { formatApy, titleCase } from "../utils/format";
import { Eyebrow, Num, Panel, StepIndicator } from "./console-ui";
import { MarketTable, maxApyFraction } from "./market-table";

interface PresetOption {
  name: RiskPreset;
  headline: string;
  detail: string;
}

const PRESETS: readonly PresetOption[] = [
  {
    name: "Safe",
    headline: "Lowest risk scores only, half held as cash",
    detail:
      "Takes only the safest end of the registry and leaves a large cash buffer, so the effective rate sits below the other two by design.",
  },
  {
    name: "Balanced",
    headline: "The default — spread, and rotated on rate",
    detail:
      "Deploys fully across a wider set and moves when a better rate clears the cost of moving. Caps any one protocol at half the position.",
  },
  {
    name: "Aggressive",
    headline: "Widest set, concentrated on the best rate",
    detail:
      "Accepts every risk score the registry carries and concentrates hard on the top rate, which can mean most of the position in one venue.",
  },
] as const;

/** Protocols present in a candidate set, in the order the server listed them. */
function protocolsOf(pools: ConsolePool[]): string[] {
  const seen: string[] = [];
  for (const pool of pools) {
    const name = titleCase(pool.protocol);
    if (!seen.includes(name)) seen.push(name);
  }
  return seen;
}

/**
 * The one line on a preset card that states what choosing it does.
 *
 * Four states and no collapsing between them: still reading, could not read,
 * read and the set is empty, read and here is its size. An unreadable set must
 * never render as "0 markets".
 */
function CandidateSummary({ set, token }: { set: PresetCandidates; token: DepositToken }) {
  if (set.isLoading) {
    return <Skeleton className="h-4 w-40" />;
  }
  if (set.error || !set.pools) {
    return (
      <span className="text-[12px] text-muted-foreground/70">
        Couldn&apos;t read this preset&apos;s market set
      </span>
    );
  }
  if (set.pools.length === 0) {
    return (
      <span className="text-[12px] text-amber-400/90">
        No {token} market currently clears this preset
      </span>
    );
  }
  const best = maxApyFraction(set.pools);
  const protocols = protocolsOf(set.pools);
  return (
    <span className="text-[12px] text-muted-foreground">
      <Num className="font-medium text-foreground">{set.pools.length}</Num>{" "}
      {set.pools.length === 1 ? "market" : "markets"} · best{" "}
      <Num className="text-emerald-400">{formatApy(best)}</Num> · {protocols.join(", ")}
    </span>
  );
}

export interface StrategyScreenProps {
  /** Candidate set per preset, straight from the server's own preset filter. */
  candidates: Record<RiskPreset, PresetCandidates>;
  token: DepositToken;
  onTokenChange: (token: DepositToken) => void;
  preset: RiskPreset;
  onPresetChange: (preset: RiskPreset) => void;
  onContinue: () => void;
  stepIndex: number;
  stepTotal: number;
}

export function StrategyScreen({
  candidates,
  token,
  onTokenChange,
  preset,
  onPresetChange,
  onContinue,
  stepIndex,
  stepTotal,
}: StrategyScreenProps) {
  const selected = candidates[preset];
  // `null` when nothing could be read. Never coerced to 0 — an unreadable rate
  // and a zero rate must not look the same.
  const bestApy = maxApyFraction(selected.pools);

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
              const isSelected = option.name === preset;
              return (
                <button
                  key={option.name}
                  type="button"
                  data-preset={option.name}
                  data-preset-selected={isSelected}
                  onClick={() => onPresetChange(option.name)}
                  className={cn(
                    "rounded-2xl border p-5 text-left transition-colors",
                    isSelected
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
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/40"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                  </div>
                  <p className="mt-3 text-[12.5px] text-muted-foreground leading-relaxed">
                    {option.detail}
                  </p>
                  <div className="mt-3" data-testid={`farming3-candidates-${option.name}`}>
                    <CandidateSummary set={candidates[option.name]} token={token} />
                  </div>
                </button>
              );
            })}
          </div>

          <Panel className="mt-7 p-5">
            <Eyebrow>
              Best {token} rate {preset} can reach
            </Eyebrow>
            <div className="mt-2 font-semibold text-[32px] leading-none tracking-tight">
              {bestApy === null ? (
                <span className="text-[20px] text-muted-foreground/60">
                  {selected.isLoading ? "Reading the registry…" : "Not readable right now"}
                </span>
              ) : (
                <Num className="text-emerald-400">{formatApy(bestApy)}</Num>
              )}
            </div>
            <p className="mt-3 text-[12px] text-muted-foreground leading-relaxed">
              The highest rate in the set {preset} is allowed to touch — not a return the agent
              promises, and not what the whole position will earn. It drifts, the agent spreads
              across several of these markets, and it only moves when the gain clears the cost of
              moving.
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

        {/* The consequence of the choice on the left, listed. No `assetFilter`:
            the server already filtered this set, and filtering again on
            `assetSymbol` would drop LP pools that hold the deposit asset on the
            paired side. */}
        <div>
          <MarketTable
            pools={selected.pools}
            isLoading={selected.isLoading}
            error={selected.error}
            title={`What ${preset} can pick from`}
            note={`Server-side filter for ${preset} · ${token}`}
            emptyNote={`No ${token} market clears the ${preset} preset right now. Nothing would be deployed until one does.`}
          />
          <p className="mt-3 px-1 text-[11.5px] text-muted-foreground/70 leading-relaxed">
            An LP market is listed under its own asset even when your {token} sits on the paired
            side, which is why a row here can read XLM. The agent picks a few of these and weights
            them; it does not hold all of them.
          </p>
        </div>
      </div>
    </div>
  );
}
