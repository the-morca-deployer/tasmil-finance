"use client";

/**
 * The dashboard — step 4, and where a returning user lands.
 *
 * Only the yield-relevant cards from heron's `pages/dashboard.tsx` are lifted:
 * the hero value band with its KPI strip, the allocation breakdown, the activity
 * list, and the market table. Everything else in that 1760-line file is EVM/
 * Solana chain plumbing with no Stellar counterpart.
 *
 * APY units: `position.currentApy` and every `positions[].apy` are decimal
 * fractions. They reach the screen only through `formatApy`.
 */

import { AlertTriangle, PauseCircle, ShieldCheck } from "lucide-react";
import { activeNetwork } from "@/shared/config/stellar";
import { Button } from "@/shared/ui/button";
import type { ConsoleActivityItem, ConsolePool, ConsolePosition, JourneyStepView } from "../types";
import {
  formatApy,
  formatPercentPoints,
  formatSignedUsd,
  formatUsd,
  shortAddress,
  titleCase,
} from "../utils/format";
import { ActivityList } from "./activity-list";
import { AllocationPanel } from "./allocation-panel";
import { Eyebrow, Hairline, Num, Panel, Pill, SectionRule, Stat, StatStrip } from "./console-ui";
import { JourneyStepRow } from "./journey-panel";
import { MarketTable } from "./market-table";

/** Money in the keeper wallet not yet deployed. `null` when the balance read is
 *  stale or the position is missing — an unreadable idle balance is not zero. */
function idleUsdOf(position: ConsolePosition | null | undefined): number | null {
  if (!position) return null;
  if (position.balanceStale) return null;
  const deployed = position.positions.reduce((sum, leg) => sum + leg.valueUsd, 0);
  return Math.max(position.totalValueUsd - deployed, 0);
}

/** The agent's own state, as three claims that must stay distinguishable:
 *  halted, ready, not-ready, and — when the status query has not answered —
 *  unknown. `null` is the unknown case and never collapses into "not ready". */
function AgentPill({ ready, halted }: { ready: boolean | null; halted: boolean | null }) {
  if (halted === true) {
    return (
      <Pill tone="negative">
        <AlertTriangle className="h-3 w-3" /> Agent halted
      </Pill>
    );
  }
  if (ready === true) {
    return (
      <Pill tone="positive">
        <ShieldCheck className="h-3 w-3" /> Agent ready
      </Pill>
    );
  }
  if (ready === false) {
    return (
      <Pill tone="warn">
        <PauseCircle className="h-3 w-3" /> Agent not ready
      </Pill>
    );
  }
  return <Pill tone="neutral">Agent status unknown</Pill>;
}

function pnlToneClass(profitUsd: number): string {
  if (profitUsd > 0) return "font-medium text-emerald-400";
  if (profitUsd < 0) return "font-medium text-destructive";
  return "font-medium text-muted-foreground";
}

/** The hero band: one big number, the P&L line under it, state pills, CTA. */
function DashboardHero({
  position,
  positionLoading,
  positionError,
  missing,
  botReady,
  botHalted,
  onDeposit,
}: {
  position: ConsolePosition | null | undefined;
  positionLoading: boolean;
  positionError?: unknown;
  missing: boolean;
  botReady: boolean | null;
  botHalted: boolean | null;
  onDeposit: () => void;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-6">
      <div>
        <Eyebrow>Managed balance</Eyebrow>
        <div
          className="mt-2 font-semibold text-[44px] text-foreground leading-none tracking-tight sm:text-[52px]"
          data-testid="farming3-total-value"
        >
          {positionLoading ? (
            <span className="text-[24px] text-muted-foreground/60">Reading on-chain…</span>
          ) : missing || positionError ? (
            <span className="text-[24px] text-muted-foreground/60">
              {positionError ? "Position not readable" : "No managed account yet"}
            </span>
          ) : (
            <Num>{formatUsd(position?.totalValueUsd)}</Num>
          )}
        </div>

        {position && !positionLoading && (
          <div className="mt-2.5 flex flex-wrap items-baseline gap-2 text-[13.5px]">
            <Num className={pnlToneClass(position.profitUsd)}>
              {formatSignedUsd(position.profitUsd)} ({formatPercentPoints(position.profitPercent)})
            </Num>
            <span className="text-[11.5px] text-muted-foreground/70">since you deposited</span>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {position && <Pill tone="accent">{titleCase(position.preset)}</Pill>}
          {position && (
            <Pill tone={position.status === "ACTIVE" ? "positive" : "warn"}>
              {titleCase(position.status)}
            </Pill>
          )}
          <AgentPill ready={botReady} halted={botHalted} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="gradient" size="lg" className="px-6" onClick={onDeposit}>
          Deposit more
        </Button>
      </div>
    </div>
  );
}

export interface DashboardScreenProps {
  position: ConsolePosition | null | undefined;
  positionLoading: boolean;
  positionError?: unknown;
  pools: ConsolePool[] | undefined;
  poolsLoading: boolean;
  poolsError?: unknown;
  activity: ConsoleActivityItem[] | undefined;
  activityLoading: boolean;
  activityError?: unknown;
  botReady: boolean | null;
  botHalted: boolean | null;
  botHaltReason: string | null;
  /** The completed signing chain, so the dashboard can show what was signed. */
  journeySteps: JourneyStepView[];
  onDeposit: () => void;
}

export function DashboardScreen({
  position,
  positionLoading,
  positionError,
  pools,
  poolsLoading,
  poolsError,
  activity,
  activityLoading,
  activityError,
  botReady,
  botHalted,
  botHaltReason,
  journeySteps,
  onDeposit,
}: DashboardScreenProps) {
  const idleUsd = idleUsdOf(position);
  const missing = !positionLoading && !position;
  const deployedUsd = position
    ? position.positions.reduce((sum, leg) => sum + leg.valueUsd, 0)
    : undefined;

  return (
    <div className="flex flex-col gap-6" data-testid="farming3-dashboard">
      <DashboardHero
        position={position}
        positionLoading={positionLoading}
        positionError={positionError}
        missing={missing}
        botReady={botReady}
        botHalted={botHalted}
        onDeposit={onDeposit}
      />

      {botHalted === true && botHaltReason && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-[12.5px] text-destructive"
        >
          The allocation engine is halted: {botHaltReason}
        </div>
      )}

      {position?.sessionKeyStale && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-[12.5px] text-amber-300">
          Your session key predates some currently deployed strategies. Refreshing it lets the agent
          use them. Funds stay in your keeper wallet either way.
        </div>
      )}

      {/* ── KPI strip ──────────────────────────────────────────────────── */}
      <StatStrip>
        <Stat
          label="Portfolio APY"
          value={formatApy(position?.currentApy)}
          tone="positive"
          size="lg"
          loading={positionLoading}
          absent={!positionLoading && (position?.currentApy === undefined || !position)}
          absentNote="No rate reported"
          sub="Weighted across live positions"
        />
        <Stat
          label="Deployed"
          value={formatUsd(deployedUsd)}
          size="lg"
          loading={positionLoading}
          absent={!positionLoading && deployedUsd === undefined}
          absentNote="Position not readable"
          sub={`${position?.positions.length ?? 0} strategy ${
            (position?.positions.length ?? 0) === 1 ? "leg" : "legs"
          }`}
        />
        <Stat
          label="Idle"
          value={formatUsd(idleUsd)}
          size="lg"
          loading={positionLoading}
          absent={!positionLoading && idleUsd === null}
          absentNote={position?.balanceStale ? "Balance read is stale" : "Not readable"}
          sub="Awaiting the next allocation cycle"
        />
        <Stat
          label="Net deposited"
          value={formatUsd(position?.netDepositsUsd)}
          size="lg"
          loading={positionLoading}
          absent={!positionLoading && position?.netDepositsUsd === undefined}
          absentNote="Not reported"
          sub="Funded minus withdrawn"
        />
      </StatStrip>

      {/* ── allocation + activity ──────────────────────────────────────── */}
      <div className="grid items-start gap-6 lg:grid-cols-[1.2fr_1fr]">
        <AllocationPanel
          legs={position?.positions}
          totalValueUsd={position?.totalValueUsd}
          idleUsd={idleUsd}
          isLoading={positionLoading}
          balanceStale={position?.balanceStale}
        />
        <ActivityList
          items={activity}
          isLoading={activityLoading}
          error={activityError}
          limit={6}
        />
      </div>

      {/* ── the signed chain, kept visible ─────────────────────────────── */}
      {journeySteps.length > 0 && (
        <Panel>
          <SectionRule label="Setup signatures" />
          <ol className="mt-3.5 grid gap-2.5 md:grid-cols-3">
            {journeySteps.map((step) => (
              <JourneyStepRow key={step.id} step={step} />
            ))}
          </ol>
          {position?.keeperWalletAddress && (
            <>
              <Hairline className="mt-5" />
              <div className="mt-3.5 flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-[12px] text-muted-foreground">Keeper wallet</span>
                <a
                  href={`${activeNetwork.explorerUrl}/contract/${position.keeperWalletAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[12px] text-primary hover:underline"
                >
                  {shortAddress(position.keeperWalletAddress, 6)} ↗
                </a>
              </div>
            </>
          )}
        </Panel>
      )}

      <MarketTable pools={pools} isLoading={poolsLoading} error={poolsError} />
    </div>
  );
}
