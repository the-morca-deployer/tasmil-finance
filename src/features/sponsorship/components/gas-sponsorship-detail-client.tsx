"use client";
import Link from "next/link";
import { useState } from "react";
import { composeTxLabel, stroopsToXlm, truncateHash, txExplorerUrl } from "..";
import { useSponsorshipMe } from "../hooks/use-sponsorship-me";
import { ActionIcon } from "../lib/action-icon";
import { FAQ, HOW_IT_WORKS, TERMS } from "../lib/copy";
import type { SponsorshipDetailState, SponsorshipMe } from "../types";
import { Medallion } from "./medallion";
import { ProtocolStack } from "./protocol-stack";
import { RankChip } from "./rank-chip";
import { Starfield } from "./starfield";

export function GasSponsorshipDetailClient() {
  const { data, isLoading } = useSponsorshipMe(true);
  const state: SponsorshipDetailState = deriveState(data, isLoading);
  const cohortSize = data?.cohortSize ?? 100;
  const cfg = data?.config;

  return (
    <main className="relative text-white min-h-screen">
      <Starfield />

      <header className="sticky top-0 z-30 backdrop-blur bg-black/60 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-3 flex justify-between items-center">
          <nav aria-label="Breadcrumb" className="text-sm text-white/60">
            Rewards <span className="text-white/30 mx-2">/</span>{" "}
            <span className="text-white">Gas Sponsorship</span>
          </nav>
          <Link href="/chat" className="text-sm text-white/60 hover:text-white">
            ← Back to chat
          </Link>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 py-12 grid md:grid-cols-[1fr_auto] gap-10 items-start">
        <div>
          <div className="text-[12px] tracking-[0.22em] uppercase font-bold text-sponsor-accent mb-2">
            Gas Sponsorship
          </div>
          <h1 className="text-4xl font-bold mb-3">
            You&apos;re in the{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(110deg,#ffffff,#67E8F9 52%,#0EA5E9)",
              }}
            >
              Top {cohortSize}
            </span>
          </h1>
          <p className="text-white/60 max-w-xl">{heroSub(state, cohortSize)}</p>
        </div>
        <div className="relative">
          <Medallion size={140} />
          {state !== "guest" && data?.rank && (
            <div className="absolute -bottom-2 -right-2">
              <RankChip rank={data.rank} cohortSize={cohortSize} />
            </div>
          )}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6">
        <div className="rounded-xl border border-white/10 p-4 mb-12 grid md:grid-cols-[1fr_auto] gap-4 items-center">
          <div>
            <div className="text-sm text-white/80 font-semibold">Sponsored on Tasmil Vault</div>
            <p className="text-xs text-white/50">
              Free gas on Farming and AI Chat across supported Stellar protocols.
            </p>
          </div>
          <ProtocolStack />
        </div>
      </section>

      {(state === "active" || state === "fresh" || state === "exhausted" || state === "loading") &&
        cfg && (
          <section className="max-w-5xl mx-auto px-6 mb-12">
            <div className="rounded-2xl border border-white/10 p-6">
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <Stat
                  label="Sponsored TXs"
                  value={`${data?.usage?.txCount ?? 0}`}
                  suffix={`/ ${cfg.maxTxPerUser}`}
                  accent
                />
                <Stat label="Per-tx cap" value={cfg.maxXlmPerTx} suffix="XLM" />
                <Stat
                  label="Remaining"
                  value={stroopsToXlm(data?.usage?.xlmRemainingStroops ?? "0")}
                  suffix="XLM"
                />
              </div>
              <Dots maxTxPerUser={cfg.maxTxPerUser} used={data?.usage?.txCount ?? 0} />
              {data?.usage?.lastSponsoredAt && data.usage.txCount > 0 && data.recentTxs[0] && (
                <p className="mt-3 text-xs text-white/50">
                  Last sponsored TX: {new Date(data.usage.lastSponsoredAt).toLocaleDateString()},{" "}
                  {stroopsToXlm(data.recentTxs[0].feeStroops)} XLM
                </p>
              )}
            </div>
          </section>
        )}

      {(state === "active" || state === "fresh" || state === "exhausted") && cfg && (
        <section className="max-w-5xl mx-auto px-6 mb-12">
          <div className="text-[12px] tracking-[0.22em] uppercase font-bold text-sponsor-accent mb-2">
            Activity
          </div>
          <h2 className="text-2xl font-semibold mb-4">Recent sponsored transactions</h2>
          {data && data.recentTxs.length === 0 ? (
            <div className="rounded-xl border border-white/10 p-6 text-white/50 text-sm">
              No sponsored transactions yet. Your first eligible TX will be covered automatically.
            </div>
          ) : (
            <ul className="space-y-2">
              {data?.recentTxs.map((tx) => (
                <li
                  key={tx.txHash}
                  className="flex items-center gap-3 rounded-xl border border-white/10 p-3"
                >
                  <span className="w-9 h-9 grid place-items-center rounded-full bg-white/5 text-sponsor-accent">
                    <ActionIcon action={tx.action} className="w-4 h-4" />
                  </span>
                  <div className="flex-1">
                    <div className="text-sm text-white">
                      {composeTxLabel(tx.action, tx.protocol, tx.asset, tx.poolLabel)}
                    </div>
                    <div className="text-xs text-white/40 flex gap-2">
                      <span>{truncateHash(tx.txHash)}</span>
                      <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-white">
                      {stroopsToXlm(tx.feeStroops)} XLM
                    </span>
                    <a
                      href={txExplorerUrl(cfg.network, tx.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="View on Stellar Expert"
                      className="text-white/40 hover:text-white"
                    >
                      ↗
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="max-w-5xl mx-auto px-6 mb-12">
        <div className="text-[12px] tracking-[0.22em] uppercase font-bold text-sponsor-accent mb-2">
          How it works
        </div>
        <h2 className="text-2xl font-semibold mb-6">A passive perk, nothing to claim</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {HOW_IT_WORKS(cohortSize).map((s) => (
            <div key={s.num} className="rounded-xl border border-white/10 p-4">
              <div className="font-mono text-sponsor-accent text-sm">{s.num}</div>
              <div className="font-semibold mt-2">{s.h}</div>
              <p className="text-sm text-white/60 mt-1">{s.b}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 mb-12">
        <div className="text-[12px] tracking-[0.22em] uppercase font-bold text-sponsor-accent mb-2">
          The fine print
        </div>
        <h2 className="text-2xl font-semibold mb-4">Limits and rules</h2>
        <div className="rounded-2xl border border-white/10 p-6">
          {cfg && (
            <ul className="space-y-3">
              {TERMS(cohortSize, cfg.maxTxPerUser, cfg.maxXlmPerTx, cfg.totalCapXlm).map((t, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className={t.kind === "ok" ? "text-sponsor-accent" : "text-amber-400"}>
                    {t.kind === "ok" ? "✓" : "△"}
                  </span>
                  <span className="text-white/80">{t.b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="text-[12px] tracking-[0.22em] uppercase font-bold text-sponsor-accent mb-2">
          Questions
        </div>
        <h2 className="text-2xl font-semibold mb-6">Frequently asked</h2>
        <FaqAccordion />
      </section>
    </main>
  );
}

function deriveState(data: SponsorshipMe | undefined, isLoading: boolean): SponsorshipDetailState {
  if (isLoading) return "loading";
  if (!data) return "guest";
  if (!data.enrolled) return "guest";
  const used = data.usage?.txCount ?? 0;
  if (used === 0) return "fresh";
  if (used >= data.config.maxTxPerUser) return "exhausted";
  return "active";
}

function heroSub(state: SponsorshipDetailState, cohortSize: number): string {
  if (state === "guest")
    return `Gas sponsorship is reserved for the first ${cohortSize} wallets on Tasmil. Connect your wallet to check eligibility.`;
  if (state === "exhausted")
    return "You've used all sponsored transactions. Thank you for being an early Tasmil user.";
  return `You're one of the first ${cohortSize} wallets on Tasmil. Your gas fees are on us, so you can deposit, rebalance, and harvest without holding XLM.`;
}

function Stat({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: string;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-white/50">{label}</div>
      <div className={`text-2xl font-bold ${accent ? "text-sponsor-accent" : "text-white"}`}>
        {value}
        {suffix && <span className="ml-1 text-sm text-white/40 font-normal">{suffix}</span>}
      </div>
    </div>
  );
}

function Dots({ maxTxPerUser, used }: { maxTxPerUser: number; used: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: maxTxPerUser }).map((_, i) => (
        <i
          key={i}
          className={`block w-2.5 h-2.5 rounded-full ${
            i < used ? "bg-sponsor-accent" : "bg-white/10"
          }`}
        />
      ))}
      <span className="ml-2 text-xs text-white/40">
        {Math.max(0, maxTxPerUser - used)} remaining
      </span>
    </div>
  );
}

function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-2">
      {FAQ.map((item, i) => (
        <div key={i} className="rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
            className="w-full text-left p-4 flex justify-between items-center"
          >
            <span className="text-sm font-medium">{item.q}</span>
            <span className="text-white/40">{open === i ? "−" : "+"}</span>
          </button>
          {open === i && <div className="p-4 pt-0 text-sm text-white/60">{item.a}</div>}
        </div>
      ))}
    </div>
  );
}
