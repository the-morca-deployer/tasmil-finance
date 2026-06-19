// @ts-nocheck
"use client";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import React from "react";
import { WaitlistPhaseBoard } from "@/features/waitlist/components/waitlist-phase-board";
import { BeamsBg, Ico, LINKS } from "./shared";

/* landing.jsx — Hero, ReferralLoop, WhyJoin */

const PROTOCOLS = [
  { id: "blend", name: "Blend", kind: "Lending markets", url: "https://www.blend.capital", i: 0 },
  { id: "soroswap", name: "Soroswap", kind: "AMM / DEX", url: "https://soroswap.finance", i: 1 },
  { id: "aquarius", name: "Aquarius", kind: "Liquidity & SDEX", url: "https://aqua.network", i: 2 },
  {
    id: "phoenix",
    name: "Phoenix",
    kind: "DEX on Soroban",
    url: "https://www.phoenix-hub.io",
    i: 3,
  },
  {
    id: "defindex",
    name: "DeFindex",
    kind: "Yield index vaults",
    url: "https://defindex.io",
    i: 4,
  },
  {
    id: "allbridge",
    name: "Allbridge",
    kind: "Cross-chain bridge",
    url: "https://allbridge.io",
    i: 5,
  },
  { id: "sdex", name: "SDEX", kind: "Stellar DEX", url: "https://www.stellar.org", i: 6 },
  {
    id: "templar",
    name: "Templar",
    kind: "Lending protocol",
    url: "https://templar.finance",
    i: 7,
  },
];

function PhaseBoardWrapper() {
  const searchParams = useSearchParams();
  return <WaitlistPhaseBoard referredByCode={searchParams.get("ref")} />;
}

function Hero({ accent, motion }) {
  return (
    <header className="hero" id="top">
      <BeamsBg accent={accent} enabled={motion} />
      <div className="hero-veil"></div>
      <div className="hero-fade"></div>
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">Private beta</span>
          <h1 className="hero-title" style={{ marginTop: 28 }}>
            <span className="tl">Tasmil</span>
            <span className="tl grad-text">Finance</span>
          </h1>
          <p className="hero-sub">AI-managed DeFi yield vaults on Stellar.</p>
          <div className="supported">
            <span className="supported-label">Integrated with</span>
            <div className="proto-stack">
              {PROTOCOLS.map((p) => (
                <a
                  className="proto"
                  key={p.id}
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ "--proto-i": p.i }}
                >
                  <Image src={"/protocols/" + p.id + ".svg"} alt={p.name} width={28} height={28} />
                  <span className="proto-tip">
                    <b>{p.name}</b>
                    {p.kind}
                  </span>
                </a>
              ))}
            </div>
          </div>
          <div className="social-row">
            <a className="social-pill" href={LINKS.telegram} target="_blank" rel="noreferrer">
              {Ico.telegram()} Telegram
            </a>
            <a className="social-pill" href={LINKS.x} target="_blank" rel="noreferrer">
              {Ico.x()} X / Twitter
            </a>
            <a className="social-pill" href={LINKS.docs} target="_blank" rel="noreferrer">
              {Ico.docs()} Docs
            </a>
          </div>
        </div>
        <div className="hero-board-col">
          <React.Suspense fallback={null}>
            <PhaseBoardWrapper />
          </React.Suspense>
        </div>
      </div>
    </header>
  );
}

function ReferralLoop() {
  const arrow = (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
  const loop = [
    {
      ico: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
        </svg>
      ),
      n: "Step 1",
      head: (
        <>
          Share your <span className="accent">invite link</span>
        </>
      ),
      sub: "Pass it to people who'd actually use Tasmil — only real signups count.",
    },
    {
      ico: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z" />
        </svg>
      ),
      n: "Step 2",
      head: (
        <>
          <span className="accent">+50 points</span> each
        </>
      ),
      sub: "Every accepted referral earns points, plus big one-time milestone bonuses.",
    },
    {
      ico: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 17l6-6 4 4 8-8M21 7v5M21 7h-5" />
        </svg>
      ),
      n: "Step 3",
      head: <>Climb the cohorts</>,
      sub: "More accepted referrals push you into an earlier wave with earlier access.",
    },
  ];
  const cohorts = [
    {
      rank: "01",
      name: "Founding",
      wave: "Wave 1",
      gate: "50+ refs",
      access: "First-ever access",
      pts: "5,100",
      peak: true,
    },
    {
      rank: "02",
      name: "Cohort 2",
      wave: "Wave 2",
      gate: "30–49 refs",
      access: "Months before launch",
      pts: "2,100",
    },
    {
      rank: "03",
      name: "Cohort 3",
      wave: "Wave 3",
      gate: "10–29 refs",
      access: "Weeks before launch",
      pts: "800",
    },
    {
      rank: "04",
      name: "Cohort 4",
      wave: "Wave 4 · Early",
      gate: "1–9 refs",
      access: "Priority queue",
      pts: "150",
    },
    {
      rank: "—",
      name: "Unranked",
      wave: "Wave 4",
      gate: "0 refs",
      access: "Standard launch",
      pts: "0",
    },
  ];
  const earn = [
    { label: "A friend joins with your link", pts: "+50" },
    { label: "You join via someone's link", pts: "+20" },
    { label: "Tweet your referral code · within 24h", pts: "+30" },
  ];
  const milestones = [
    { label: "1st accepted referral", pts: "+100" },
    { label: "10 referrals reached", pts: "+300" },
    { label: "30 referrals reached", pts: "+700" },
    { label: "50 referrals reached", pts: "+1,500" },
  ];

  return (
    <section className="section" id="how">
      <div className="wrap">
        <div className="section-head">
          <span className="kicker">02 — How it works</span>
          <h2 className="section-title">Invite to climb</h2>
          <p className="section-desc">
            It&apos;s one simple loop: invite people, earn Ref Points, and rise into earlier
            onboarding cohorts. The more accepted referrals you have, the earlier you get in.
          </p>
        </div>

        <div className="loop3">
          {loop.map((s, i) => (
            <React.Fragment key={i}>
              <div className="loop3-step">
                <div className="l3-top">
                  <span className="l3-ico">{s.ico}</span>
                  <span className="l3-step-n">{s.n}</span>
                </div>
                <div className="l3-head">{s.head}</div>
                <p className="l3-sub">{s.sub}</p>
              </div>
              {i < loop.length - 1 && <span className="l3-arrow">{arrow}</span>}
            </React.Fragment>
          ))}
        </div>

        <div className="loop3-cycle" aria-hidden="true">
          <svg className="cycle-line" viewBox="0 0 1000 46" preserveAspectRatio="none" fill="none">
            <path
              d="M835 0 V20 Q835 32 823 32 H177 Q165 32 165 20 V8"
              stroke="var(--accent)"
              strokeWidth="2.2"
              strokeDasharray="6 6"
              strokeLinecap="round"
            />
          </svg>
          <svg className="cycle-head" viewBox="0 0 16 14" fill="none">
            <path
              d="M2 11 L8 2 L14 11"
              stroke="var(--accent)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="cohorts-cap">
          <span className="cap-l">
            Your cohort is set by one thing — your <b>accepted referrals</b>. Climb higher for
            earlier access and lower fees.
          </span>
        </div>

        <div className="cohorts">
          <div className="cohort-head">
            <span>Cohort</span>
            <span>Refs needed</span>
            <span>Access window</span>
            <span className="ralign">Ref Points</span>
          </div>
          {cohorts.map((c, i) => (
            <div className={"cohort-row" + (c.peak ? " peak" : "")} key={i}>
              <span className="c-cohort">
                <span className="c-id">{c.rank}</span>
                <span className="c-name">
                  {c.name}
                  <span className="c-wave">{c.wave}</span>
                </span>
              </span>
              <span className="c-gate">{c.gate}</span>
              <span className="c-access">{c.access}</span>
              <span className="c-pts">
                {c.pts}
                <span className="c-pts-u">pts</span>
              </span>
            </div>
          ))}
        </div>

        <div className="points">
          <div className="pcard">
            <div className="pcard-top">
              <h5 className="pcard-title">How points stack</h5>
              <span className="formula">
                <b>refs × 50</b> + bonuses
              </span>
            </div>
            <div className="earn-list">
              {earn.map((e, i) => (
                <div className="earn-row" key={i}>
                  <span className="earn-label">{e.label}</span>
                  <span className="earn-pts">{e.pts}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="pcard">
            <div className="pcard-top">
              <h5 className="pcard-title">Milestone bonuses</h5>
              <span className="pcard-note">Each counts once</span>
            </div>
            <div className="earn-list">
              {milestones.map((m, i) => (
                <div className="earn-row" key={i}>
                  <span className="earn-label">{m.label}</span>
                  <span className="earn-pts">{m.pts}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="wl-rules">
          <span className="wl-rules-k">Queue rank</span>
          <p>
            Ranking follows your accepted-referral count — ties break to whoever joined first. You
            can&apos;t use your own code, tweets must be original posts containing your code within
            24h (no replies or retweets), and inviters must have progressed past the waitlist.
          </p>
        </div>
      </div>
    </section>
  );
}

function WhyJoin() {
  const cards = [
    {
      n: "01",
      ico: Ico.bolt,
      h: "AI-managed yield vaults",
      p: "Autonomous agents rebalance across Blend, Soroswap, Aquarius and Phoenix to optimize your yield.",
    },
    {
      n: "02",
      ico: Ico.layers,
      h: "Built on Stellar & Soroban",
      p: "Sub-cent fees and seconds-to-finality settlement. Assets stay liquid, transparent and on-chain.",
    },
    {
      n: "03",
      ico: Ico.shield,
      h: "Non-custodial by design",
      p: "Keeper wallets and session keys keep funds in your control — pick a risk preset and withdraw anytime.",
    },
  ];
  return (
    <section className="section" id="why">
      <div className="wrap">
        <div className="section-head">
          <span className="kicker">03 — Why claim a seat</span>
          <h2 className="section-title">Reasons to be early</h2>
        </div>
        <div className="why-grid">
          {cards.map((c) => (
            <div className="feature" key={c.n}>
              <div className="fx"></div>
              <span className="ficon">{c.ico({ s: 20 })}</span>
              <span className="fnum">{c.n}</span>
              <h4>{c.h}</h4>
              <p>{c.p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export { Hero, ReferralLoop, WhyJoin };
