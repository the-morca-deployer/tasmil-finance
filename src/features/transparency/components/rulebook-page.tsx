"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TokenImage } from "@/shared/components/token-image";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { CopyButton } from "@/shared/ui/copy-button";
import type { Rulebook } from "../api/adapters";
import { useRulebook } from "../api/use-rulebook";
import {
  assetSymbol,
  formatTokenAmount,
  ledgersToDuration,
  shortAddress,
  usedPercent,
} from "./rulebook-format";

function fixed(raw: string, decimals: number): string {
  const negative = raw.startsWith("-");
  const digits = negative ? raw.slice(1) : raw;
  if (decimals === 0) return raw;
  const padded = digits.padStart(decimals + 1, "0");
  const result = `${padded.slice(0, -decimals)}.${padded.slice(-decimals)}`;
  return negative ? `-${result}` : result;
}

function usdE7(raw: string): string {
  const exact = fixed(raw, 7);
  const [whole, fraction = ""] = exact.split(".");
  return `$${whole}.${fraction.padEnd(2, "0").slice(0, 2)}`;
}

type RulebookSession = Rulebook["sessions"][number];

function sessionStatus(session: RulebookSession, readAtLedger: string): string {
  if (session.revoked) return "Revoked";
  if (BigInt(session.expiresAtLedger) <= BigInt(readAtLedger)) return "Expired";
  return "Active";
}

function StateCard({ children }: { children: ReactNode }) {
  return <Card className="border-white/10 bg-white/3 p-8 text-center">{children}</Card>;
}

const STATUS_STYLES: Record<string, string> = {
  Active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  Revoked: "border-destructive/30 bg-destructive/10 text-destructive",
  Expired: "border-white/15 bg-white/5 text-muted-foreground",
};

function AddressChip({ value, href }: { value: string; href?: string }) {
  return (
    <span className="inline-flex items-center gap-1 font-mono text-muted-foreground text-xs">
      {href ? (
        <a
          className="hover:text-foreground hover:underline"
          href={href}
          rel="noreferrer"
          target="_blank"
          title={value}
        >
          {shortAddress(value)}
        </a>
      ) : (
        <span title={value}>{shortAddress(value)}</span>
      )}
      <CopyButton text={value} iconSize="h-3 w-3" />
    </span>
  );
}

function AssetChip({ asset }: { asset: string }) {
  const symbol = assetSymbol(asset);
  if (!symbol) return <AddressChip value={asset} />;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 py-0.5 pr-2.5 pl-1 font-medium text-xs">
      <TokenImage alt={symbol} className="h-4 w-4 rounded-full" width={16} height={16} />
      {symbol}
    </span>
  );
}

function UsageBar({ percent }: { percent: number }) {
  return (
    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
      <div
        className={cn(
          "h-full rounded-full",
          percent >= 90 ? "bg-destructive" : percent >= 70 ? "bg-amber-400" : "bg-emerald-400"
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  children,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/2 p-4">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 font-semibold text-lg tabular-nums">{value}</p>
      {children}
      {hint && <p className="mt-1 text-muted-foreground text-xs tabular-nums">{hint}</p>}
    </div>
  );
}

/** Symbol shared by every rule of a session, so cumulative base units can be labelled. */
function sessionAssetSymbol(session: RulebookSession): string | null {
  const symbols = new Set(session.rules.map((rule) => assetSymbol(rule.amount.asset)));
  return symbols.size === 1 ? ([...symbols][0] ?? null) : null;
}

function amountLabel(raw: string, symbol: string | null): string {
  return symbol ? `${formatTokenAmount(raw)} ${symbol}` : `${raw} base units`;
}

function SessionCard({
  session,
  readAtLedger,
}: {
  session: RulebookSession;
  readAtLedger: string;
}) {
  const status = sessionStatus(session, readAtLedger);
  const symbol = sessionAssetSymbol(session);
  const ledgersLeft = BigInt(session.expiresAtLedger) - BigInt(readAtLedger);
  const cooldown = BigInt(session.coolDownLedgers);
  const contracts = session.allowedContracts.length;

  return (
    <Card className="border-white/10 bg-white/3 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Agent session key</p>
            <AddressChip value={session.pubkey} />
          </div>
        </div>
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 font-medium text-xs",
            STATUS_STYLES[status]
          )}
        >
          {status}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Spent in current window"
          value={`${symbol ? formatTokenAmount(session.cumulative.spent) : session.cumulative.spent} / ${amountLabel(session.cumulative.limit, symbol)}`}
          hint={`Window resets every ${ledgersToDuration(BigInt(session.cumulative.windowLedgers))}`}
        >
          <UsageBar percent={usedPercent(session.cumulative.spent, session.cumulative.limit)} />
        </Stat>
        <Stat
          label="Agent calls today"
          value={`${session.dailyCalls.used} / ${session.maxCallsPerDay}`}
        >
          <UsageBar percent={usedPercent(session.dailyCalls.used, session.maxCallsPerDay)} />
        </Stat>
        <Stat
          label="Expires in"
          value={ledgersLeft > 0n ? ledgersToDuration(ledgersLeft) : "Ended"}
          hint={`At ledger ${session.expiresAtLedger}`}
        />
        <Stat
          label="Cooldown between actions"
          value={cooldown > 0n ? ledgersToDuration(cooldown) : "None"}
          hint={`${session.coolDownLedgers} ledgers`}
        />
      </div>

      <div className="mt-6">
        <p className="mb-3 font-medium text-sm">What the agent may do</p>
        <div className="space-y-3">
          {session.rules.map((rule) => {
            const ruleSymbol = assetSymbol(rule.amount.asset);
            return (
              <div
                key={`${rule.contract}:${rule.selector}`}
                className="rounded-xl border border-white/10 bg-white/2 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {rule.allowed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span className="font-medium capitalize">{rule.selector}</span>
                    <AssetChip asset={rule.amount.asset} />
                    <span className="text-muted-foreground text-xs">on</span>
                    <AddressChip
                      value={rule.contract}
                      href={`https://stellar.expert/explorer/public/contract/${rule.contract}`}
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground text-xs">Max per transaction</p>
                    <p className="font-semibold tabular-nums">
                      {ruleSymbol
                        ? `${formatTokenAmount(rule.perTx.limit)} ${ruleSymbol}`
                        : "See base units"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      <span className="font-mono">{rule.perTx.limit}</span> base units
                    </p>
                  </div>
                </div>

                {rule.conversionEvidence ? (
                  <div className="mt-3 border-white/10 border-t pt-3 text-muted-foreground text-xs">
                    <p className="text-foreground text-sm">
                      Worth {usdE7(rule.conversionEvidence.usdValueE7)} at scope set
                    </p>
                    <p className="mt-1">
                      Rate{" "}
                      {fixed(rule.conversionEvidence.rateRaw, rule.conversionEvidence.rateDecimals)}{" "}
                      USD, set at ledger {rule.conversionEvidence.setAtLedger}, price published{" "}
                      {new Date(Number(rule.conversionEvidence.ratePublishedAtMs)).toISOString()}.
                      The contract enforces token units, not this USD figure.
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-muted-foreground text-xs">
                    No USD reference price was recorded when this limit was set; the limit is
                    enforced in token units.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-5 text-muted-foreground text-xs">
        The agent can only call {contracts} approved contract{contracts === 1 ? "" : "s"}, at most{" "}
        {session.maxCallsPerDay} times a day, within the limits above.
      </p>
    </Card>
  );
}

function RulebookContent({ rulebook }: { rulebook: Rulebook }) {
  const killed = rulebook.killSwitch;
  return (
    <div className="space-y-4">
      <Card className="border-white/10 bg-white/3 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-full",
                killed ? "bg-amber-500/15" : "bg-emerald-500/15"
              )}
            >
              {killed ? (
                <ShieldAlert className="h-5 w-5 text-amber-400" />
              ) : (
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
              )}
            </div>
            <div>
              <p className="font-semibold text-lg">
                {killed ? "Agent automation is blocked" : "Policy Guard is protecting your vault"}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 font-medium text-xs",
                    killed ? "bg-amber-500/15 text-amber-300" : "bg-white/5 text-foreground"
                  )}
                >
                  {killed ? "Kill switch is ON" : "Kill switch is off"}
                </span>
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase">
                  {rulebook.network}
                </span>
                <span>Read at ledger {rulebook.readAtLedger}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <a
              className="inline-flex items-center gap-1.5 text-blue-400 text-sm hover:underline"
              href={rulebook.explorerUrl}
              rel="noreferrer"
              target="_blank"
            >
              Open contract on Stellar.expert <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>
            <AddressChip value={rulebook.contract} />
          </div>
        </div>
        {killed && (
          <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-amber-200 text-sm">
            Automated session-key actions are blocked while the kill switch is on.
          </div>
        )}
      </Card>

      <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm">
        <LogOut className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
        <p>
          <strong>Owner can always exit.</strong> These rules only limit what the agent can do; you
          can always withdraw with your own wallet.
        </p>
      </div>

      {rulebook.sessions.length === 0 ? (
        <StateCard>No active policy sessions were found on-chain.</StateCard>
      ) : (
        rulebook.sessions.map((session) => (
          <SessionCard
            key={session.pubkey}
            session={session}
            readAtLedger={rulebook.readAtLedger}
          />
        ))
      )}
    </div>
  );
}

function RulebookBody({ state }: { state: ReturnType<typeof useRulebook> }) {
  if (!state.walletConnected) {
    return (
      <StateCard>Connect your wallet to authenticate and read your private vault policy.</StateCard>
    );
  }
  if (state.isLoading) {
    return (
      <output className="flex items-center justify-center gap-2 py-24">
        <Loader2 className="h-5 w-5 animate-spin" /> Reading live Stellar policy…
      </output>
    );
  }
  if (state.error) {
    const persistentUnavailable = /windowspend|persistent|archiv/i.test(state.error.message);
    return (
      <StateCard>
        <AlertTriangle className="mx-auto mb-3 h-7 w-7 text-amber-400" />
        <p className="font-medium">
          {persistentUnavailable
            ? "Persistent spend evidence unavailable"
            : "Could not read Stellar ledger"}
        </p>
        <p className="mt-2 text-muted-foreground text-sm">{state.error.message}</p>
        <Button className="mt-4 gap-2" onClick={state.refetch} variant="outline">
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </StateCard>
    );
  }
  if (!state.accountId) {
    return (
      <StateCard>
        No SOW2 vault account was found. Deploy a vault before viewing a rulebook.
      </StateCard>
    );
  }
  if (!state.data) return null;
  return (
    <>
      {state.isStale && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-200 text-sm">
          Ledger read may be stale. Refresh before making a policy decision.
        </div>
      )}
      <RulebookContent rulebook={state.data} />
    </>
  );
}

export function RulebookPage() {
  const state = useRulebook();
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <div className="mb-6 flex items-center gap-3">
        <ShieldCheck className="h-7 w-7 text-emerald-400" />
        <div>
          <h1 className="font-bold text-2xl">My Rulebook</h1>
          <p className="text-muted-foreground text-sm">
            Live policy state read from Stellar ledger
          </p>
        </div>
      </div>
      <RulebookBody state={state} />
    </main>
  );
}

/** Embedded Farming tab: the rulebook belongs to the user's vault, not to a
 * separate product surface. It reuses the exact same live-ledger query and
 * states as the legacy route. */
export function RulebookPanel() {
  const state = useRulebook();
  return (
    <section className="w-full pb-8" aria-label="My Rulebook">
      <p className="mb-4 text-muted-foreground text-sm">
        Live limits your vault enforces on the agent, read directly from the Stellar ledger.
      </p>
      <RulebookBody state={state} />
    </section>
  );
}
