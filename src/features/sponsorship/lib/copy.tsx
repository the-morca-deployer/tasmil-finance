import type { ReactNode } from "react";

export const HOW_IT_WORKS = (cohortSize: number) => [
  {
    num: "01",
    h: "Automatic enrollment",
    b: `The first ${cohortSize} wallets on Tasmil are enrolled. No claim, no waitlist.`,
  },
  {
    num: "02",
    h: "Eligible actions",
    b: "Deposits, withdrawals, rebalances, and harvests on supported pools.",
  },
  {
    num: "03",
    h: "Auto-apply",
    b: "When you sign a qualifying TX, Tasmil pays the network fee on your behalf, up to the cap.",
  },
];

export const TERMS = (
  cohortSize: number,
  maxTxPerUser: number,
  maxXlmPerTx: string,
  totalCapXlm: string,
): Array<{ kind: "ok" | "warn"; b: ReactNode }> => [
  {
    kind: "ok",
    b: (
      <>
        <b>Reserved cohort.</b> The first {cohortSize} wallets only, no waitlist.
      </>
    ),
  },
  {
    kind: "ok",
    b: (
      <>
        <b>{maxTxPerUser} sponsored transactions</b> per wallet.
      </>
    ),
  },
  {
    kind: "ok",
    b: (
      <>
        <b>{maxXlmPerTx} XLM max</b> sponsored per transaction (up to {totalCapXlm} XLM total).
      </>
    ),
  },
  {
    kind: "warn",
    b: (
      <>
        <b>Excess fees</b> beyond the cap come from your own wallet.
      </>
    ),
  },
  {
    kind: "warn",
    b: (
      <>
        <b>Tasmil-issued only.</b> Direct contract calls outside the app are not sponsored.
      </>
    ),
  },
];

export const FAQ = [
  {
    q: "How do I know if I'm enrolled?",
    a: "If you were among the first wallets on Tasmil, this page shows your rank and usage tracker. No enrollment step is required; eligibility is assigned automatically.",
  },
  {
    q: "Why was a sponsored transaction rejected?",
    a: "Common reasons: exceeding the per-transaction cap, using all sponsored transactions, or signing a transaction outside Tasmil. The network fee comes from your own wallet in those cases.",
  },
  {
    q: "Can I combine this with the $10 Welcome Reward?",
    a: "Yes. The two programs are independent and stack.",
  },
  {
    q: "What happens after my sponsored TXs are used?",
    a: "Sponsorship ends and you pay your own network fees. Stellar fees are a fraction of a cent.",
  },
  {
    q: "Which protocols are covered?",
    a: "Farming and AI Chat actions on Tasmil-supported Stellar protocols, including Soroswap, Blend, Aquarius, Phoenix, and DeFindex.",
  },
];
