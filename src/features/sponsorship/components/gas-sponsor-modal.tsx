"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { Medallion } from "./medallion";
import { ProtocolStack } from "./protocol-stack";
import { RankChip } from "./rank-chip";
import { Starfield } from "./starfield";

interface Props {
  rank: number;
  cohortSize: number;
  maxTxPerUser: number;
  maxXlmPerTx: string;
  onClose: () => void;
  onPrimaryCta: () => void;
  onDetail: () => void;
}

export function GasSponsorModal({
  rank,
  cohortSize,
  maxTxPerUser,
  maxXlmPerTx,
  onClose,
  onPrimaryCta,
  onDetail,
}: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const terms = [
    {
      val: `First ${cohortSize} only`,
      label: "Reserved cohort, no waitlist",
    },
    {
      val: `${maxTxPerUser} transactions`,
      label: "Sponsored per user",
    },
    {
      val: `${maxXlmPerTx} XLM max`,
      label: "Sponsored per transaction",
    },
  ];

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gas-sponsor-title"
        className="fixed inset-0 z-50 grid place-items-center p-6"
        style={{
          background:
            "radial-gradient(680px 440px at 50% -10%, rgba(103,232,249,0.14), transparent 70%), rgba(0,0,0,0.85)",
        }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <Starfield />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-2xl rounded-2xl border border-white/10 p-8"
          style={{
            background:
              "radial-gradient(440px 240px at 50% -14%, rgba(103,232,249,0.10), transparent 72%), linear-gradient(180deg,#101015,#0A0A0D)",
            boxShadow:
              "0 50px 130px -42px #000, 0 0 90px -58px rgba(103,232,249,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-5 right-5 w-10 h-10 rounded-full grid place-items-center bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition"
          >
            ✕
          </button>

          <div className="absolute top-5 left-6">
            <RankChip rank={rank} cohortSize={cohortSize} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-8 mt-8">
            <div className="flex flex-col gap-4 items-start">
              <Medallion />
              <span className="text-[12px] tracking-[0.22em] uppercase font-bold text-sponsor-accent">
                Gas Sponsorship
              </span>
              <h2 id="gas-sponsor-title" className="text-3xl font-bold text-white">
                You&apos;re in the{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: "linear-gradient(110deg,#ffffff,#67E8F9 52%,#0EA5E9)",
                  }}
                >
                  Top {cohortSize}
                </span>
              </h2>
              <p className="text-white/60">
                You&apos;re one of the first {cohortSize} wallets on Tasmil. Your gas fees are on
                us.
              </p>
              <div className="w-full rounded-xl border border-white/10 p-3">
                <div className="text-sm text-white/80 font-semibold">Sponsored on Tasmil Vault</div>
                <p className="text-xs text-white/50 mb-2">Free gas on Farming and AI Chat.</p>
                <ProtocolStack />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="text-sm font-semibold text-white/80">What you get</div>
              <ul className="space-y-2">
                {terms.map((t) => (
                  <li key={t.val} className="flex items-start gap-2 text-sm">
                    <span className="text-sponsor-accent">✓</span>
                    <span>
                      <span className="font-semibold text-white">{t.val}</span>
                      <span className="block text-white/55">{t.label}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={onPrimaryCta}
                className="mt-auto rounded-xl py-3 px-4 font-semibold text-black"
                style={{
                  background: "linear-gradient(110deg,#fff,#67E8F9 52%,#0EA5E9)",
                }}
              >
                Start Earning Yield →
              </button>
              <button
                type="button"
                onClick={onDetail}
                className="text-sm text-sponsor-accent hover:underline self-start"
              >
                Detail
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
