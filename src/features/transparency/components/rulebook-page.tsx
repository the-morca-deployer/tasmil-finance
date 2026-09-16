"use client";

import { AlertTriangle, ExternalLink, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import type { Rulebook } from "../api/adapters";
import { useRulebook } from "../api/use-rulebook";

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

function RulebookContent({ rulebook }: { rulebook: Rulebook }) {
  return (
    <>
      <Card className="border-white/10 bg-white/3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider">Policy guard</p>
            <p className="mt-1 font-medium text-lg">
              {rulebook.killSwitch ? "Kill switch is ON" : "Kill switch is off"}
            </p>
            <p className="mt-1 text-muted-foreground text-sm">
              Read at ledger {rulebook.readAtLedger} · {rulebook.network}
            </p>
          </div>
          <a
            className="inline-flex max-w-full items-center gap-2 break-all font-mono text-blue-400 text-xs hover:underline"
            href={rulebook.explorerUrl}
            rel="noreferrer"
            target="_blank"
          >
            Open contract on Stellar.expert <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          </a>
        </div>
        <p className="mt-4 break-all font-mono text-muted-foreground text-xs">
          Contract {rulebook.contract}
        </p>
        {rulebook.killSwitch && (
          <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-amber-200 text-sm">
            Automated session-key actions are blocked while the kill switch is on.
          </div>
        )}
      </Card>

      <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm">
        <strong>Owner can always exit.</strong> Session policies restrict automation; they do not
        remove the owner-authorized withdrawal path.
      </div>

      {rulebook.sessions.length === 0 ? (
        <StateCard>No active policy sessions were found on-chain.</StateCard>
      ) : (
        <div className="mt-6 space-y-4">
          {rulebook.sessions.map((session) => {
            const status = sessionStatus(session, rulebook.readAtLedger);
            return (
              <Card key={session.pubkey} className="border-white/10 bg-white/3 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">Session key</p>
                    <p className="mt-1 break-all font-mono text-muted-foreground text-xs">
                      {session.pubkey}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/15 px-2.5 py-1 text-xs">
                    {status}
                  </span>
                </div>

                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-muted-foreground">Expires at ledger</dt>
                    <dd className="font-mono">{session.expiresAtLedger}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Daily calls</dt>
                    <dd>
                      {session.dailyCalls.used} / {session.maxCallsPerDay}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Cumulative spend</dt>
                    <dd className="font-mono">
                      {session.cumulative.spent} / {session.cumulative.limit}
                    </dd>
                  </div>
                </dl>

                <div className="mt-5 space-y-3">
                  {session.rules.map((rule) => (
                    <div
                      key={`${rule.contract}:${rule.selector}`}
                      className="rounded-lg border border-white/10 p-4"
                    >
                      <div className="flex flex-wrap justify-between gap-2">
                        <p className="font-medium">
                          {rule.selector} · {rule.amount.asset}
                        </p>
                        <span className="text-muted-foreground text-xs">
                          {rule.allowed ? "Allowed" : "Blocked"}
                        </span>
                      </div>
                      <p className="mt-2 text-muted-foreground text-xs">
                        Token-base per-tx ceiling
                      </p>
                      <p className="break-all font-mono text-lg">{rule.perTx.limit}</p>
                      <p className="text-muted-foreground text-xs">{rule.perTx.denom}</p>

                      {rule.conversionEvidence ? (
                        <div className="mt-3 border-white/10 border-t pt-3 text-sm">
                          <p>{usdE7(rule.conversionEvidence.usdValueE7)} at scope set</p>
                          <p className="mt-1 text-muted-foreground text-xs">
                            Rate{" "}
                            {fixed(
                              rule.conversionEvidence.rateRaw,
                              rule.conversionEvidence.rateDecimals
                            )}{" "}
                            USD · ledger {rule.conversionEvidence.setAtLedger} · published{" "}
                            {new Date(
                              Number(rule.conversionEvidence.ratePublishedAtMs)
                            ).toISOString()}
                          </p>
                          <p className="mt-1 text-amber-200/80 text-xs">
                            Informational conversion captured at scope set; the contract
                            continuously enforces token base units, not this USD figure.
                          </p>
                        </div>
                      ) : (
                        <p className="mt-3 text-amber-200/80 text-xs">
                          Scope-set USD conversion evidence unavailable. No current price was
                          substituted.
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-muted-foreground text-xs">
                  Restricted to {session.allowedContracts.length} approved contract(s), listed
                  function selectors, {session.maxCallsPerDay} calls/day, cooldown{" "}
                  {session.coolDownLedgers} ledgers, and the displayed per-transaction/cumulative
                  ceilings.
                </p>
              </Card>
            );
          })}
        </div>
      )}
    </>
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
