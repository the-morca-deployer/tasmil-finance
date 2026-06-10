"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { WaitlistPhaseBoard } from "@/features/whitelist/components/waitlist-phase-board";
import { PATHS } from "@/shared/constants/routes";

const Beams = dynamic(() => import("@/shared/ui/beams"), { ssr: false });

/* ---------- icons ---------- */
function IcoKey({ s = 14 }: { s?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={s}
      height={s}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="8" r="4.2" />
      <path d="M11 11l8 8M16 16l2-2M18.5 18.5l1.8-1.8" />
    </svg>
  );
}
function IcoBolt({ s = 20 }: { s?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={s}
      height={s}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 2L4.5 13.5H11l-1 8.5L18.5 10.5H12l1-8.5Z" />
    </svg>
  );
}
function IcoLayers({ s = 20 }: { s?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={s}
      height={s}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l9 5-9 5-9-5 9-5Z" />
      <path d="M3 13l9 5 9-5M3 16.5l9 5 9-5" opacity="0.5" />
    </svg>
  );
}
function IcoShield({ s = 20 }: { s?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={s}
      height={s}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
function IcoTelegram({ s = 15 }: { s?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={s} height={s} fill="currentColor">
      <path d="M21.9 4.3 18.7 19.4c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-4.9 9-8.1c.4-.3-.1-.5-.6-.2L6.4 13 1.7 11.5c-1-.3-1-.9.2-1.4L20.6 3c.8-.3 1.5.2 1.3 1.3Z" />
    </svg>
  );
}
function IcoX({ s = 15 }: { s?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={s} height={s} fill="currentColor">
      <path d="M18.9 2H22l-7.6 8.7L23 22h-6.8l-5-6.6L5.5 22H2.3l8.1-9.3L1.7 2h6.9l4.6 6.1L18.9 2Zm-1.2 18h1.9L7.1 4H5L17.7 20Z" />
    </svg>
  );
}
function IcoDocs({ s = 15 }: { s?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={s}
      height={s}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M14 3v5h5M9 13h6M9 17h5" />
    </svg>
  );
}

/* ---------- background FX ---------- */
function BgFX() {
  return (
    <div className="tw-bg-fx" aria-hidden="true">
      <div className="tw-bg-grid" />
      <div className="tw-bg-glow g2" />
      <div className="tw-bg-glow g3" />
    </div>
  );
}

/* ---------- Nav ---------- */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <nav className={`tw-nav${scrolled ? " scrolled" : ""}`}>
      <div className="tw-wrap tw-nav-inner">
        <Link className="tw-brand" href="#top">
          <img
            src="/images/logo.png"
            alt="Tasmil"
            style={{ width: 34, height: 34, borderRadius: 10 }}
          />
          <span className="tw-brand-name" style={{ color: "var(--tw-text)" }}>
            Tasmil Finance
          </span>
        </Link>
        <div className="tw-nav-right">
          <a className="tw-nav-link hide-sm" href="#how">
            How it works
          </a>
          <a className="tw-nav-link hide-sm" href="#why">
            Why join
          </a>
          <Link className="tw-nav-code" href="/access">
            <IcoKey s={14} /> Have a code? <span style={{ transition: "transform .3s" }}>→</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ---------- Hero ---------- */
function Hero({ referredByCode }: { referredByCode?: string | null }) {
  return (
    <header
      className="tw-hero"
      id="top"
      style={{ background: "var(--tw-bg)", fontFamily: "var(--tw-font)" }}
    >
      {/* Beams background with radial fade mask */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          WebkitMaskImage:
            "radial-gradient(ellipse 62% 62% at 50% 38%, #000 26%, rgba(0,0,0,0.5) 58%, transparent 82%)",
          maskImage:
            "radial-gradient(ellipse 62% 62% at 50% 38%, #000 26%, rgba(0,0,0,0.5) 58%, transparent 82%)",
        }}
      >
        <Beams
          beamWidth={2.2}
          beamHeight={20}
          beamNumber={14}
          lightColor="#67E8F9"
          speed={1.8}
          noiseIntensity={1.55}
          scale={0.18}
          rotation={0}
        />
      </div>
      {/* Left scrim so left-side copy stays readable */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background: "linear-gradient(90deg, #000206 0%, rgba(0,2,6,0.34) 22%, transparent 46%)",
        }}
      />
      <div className="tw-hero-veil" aria-hidden="true" />
      <div className="tw-hero-fade" aria-hidden="true" />

      <div className="tw-wrap tw-hero-grid">
        {/* left copy */}
        <div className="hero-copy">
          <span className="tw-eyebrow">Private beta</span>
          <h1 className="tw-hero-title" style={{ marginTop: 28 }}>
            <span style={{ display: "block", color: "var(--tw-text)" }}>Tasmil</span>
            <span style={{ display: "block" }} className="tw-grad-text">
              Finance
            </span>
          </h1>
          <p className="tw-hero-sub">AI-managed DeFi yield vaults on Stellar.</p>

          <div className="tw-social-row">
            <a className="tw-social-pill" href={PATHS.TELEGRAM} target="_blank" rel="noreferrer">
              <IcoTelegram /> Telegram
            </a>
            <a className="tw-social-pill" href={PATHS.X} target="_blank" rel="noreferrer">
              <IcoX /> X / Twitter
            </a>
            <a className="tw-social-pill" href={PATHS.DOCS} target="_blank" rel="noreferrer">
              <IcoDocs /> Docs
            </a>
          </div>
        </div>

        {/* right board */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div className="tw-board" style={{ width: "100%", maxWidth: 440 }}>
            <div className="tw-board-body">
              <Suspense
                fallback={
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "48px 0",
                    }}
                  >
                    <span className="tw-spinner on-dark" />
                  </div>
                }
              >
                <WaitlistPhaseBoardWithRef referredByCode={referredByCode} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ---------- Referral Loop ---------- */
const LOOP_STEPS = [
  {
    n: "01",
    h: "Claim your seat",
    p: "A valid access code binds a Tasmil seat to your Stellar wallet — verified on-chain.",
  },
  {
    n: "02",
    h: "Share your invites",
    p: "Every seat ships with invite codes. Pass them to people you'd actually want in the pool.",
  },
  {
    n: "03",
    h: "Climb the cohort",
    p: "Active invites move you into earlier onboarding cohorts and unlock lower launch fees.",
  },
];
const TIERS = [
  { rank: "—", ref: "Seat claimed", boost: "Cohort 4", peak: false },
  { rank: "↑", ref: "1 invite used", boost: "Cohort 3", peak: false },
  { rank: "↑", ref: "3 invites used", boost: "Cohort 2", peak: false },
  { rank: "★", ref: "All invites used", boost: "Cohort 1", peak: true },
];

function ReferralLoop() {
  return (
    <section
      className="tw-section"
      id="how"
      style={{ background: "var(--tw-bg-2)", fontFamily: "var(--tw-font)" }}
    >
      <div className="tw-wrap">
        <div className="tw-section-head">
          <span className="tw-kicker">02 — How it works</span>
          <h2 className="tw-section-title">A seat, then a loop</h2>
          <p className="tw-section-desc">
            Access is invite-gated, but movement is earned. Bring people in and your wallet rises
            through the onboarding cohorts.
          </p>
        </div>
        <div className="tw-referral">
          <div className="tw-loop-steps">
            {LOOP_STEPS.map((s) => (
              <div className="tw-loop-step" key={s.n}>
                <span className="tw-loop-num">{s.n}</span>
                <div>
                  <h5>{s.h}</h5>
                  <p>{s.p}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="tw-ladder">
            <div className="tw-ladder-rows">
              {TIERS.map((t, i) => (
                <div className={`tw-tier${t.peak ? " peak" : ""}`} key={i}>
                  <span className="tw-t-left">
                    <span className="tw-t-rank">{t.rank}</span>
                    <span className="tw-t-ref">{t.ref}</span>
                  </span>
                  <span className="tw-t-boost">{t.boost}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Why Join ---------- */
const WHY_CARDS = [
  {
    n: "01",
    icon: IcoBolt,
    h: "AI-managed yield vaults",
    p: "Autonomous agents rebalance across Blend, Soroswap, Aquarius and Phoenix to optimize your yield.",
  },
  {
    n: "02",
    icon: IcoLayers,
    h: "Built on Stellar & Soroban",
    p: "Sub-cent fees and seconds-to-finality settlement. Assets stay liquid, transparent and on-chain.",
  },
  {
    n: "03",
    icon: IcoShield,
    h: "Non-custodial by design",
    p: "Keeper wallets and session keys keep funds in your control — pick a risk preset and withdraw anytime.",
  },
];

function WhyJoin() {
  return (
    <section
      className="tw-section"
      id="why"
      style={{ background: "var(--tw-bg)", fontFamily: "var(--tw-font)" }}
    >
      <div className="tw-wrap">
        <div className="tw-section-head">
          <span className="tw-kicker">03 — Why claim a seat</span>
          <h2 className="tw-section-title">Reasons to be early</h2>
        </div>
        <div className="tw-why-grid">
          {WHY_CARDS.map((c) => (
            <div className="tw-feature" key={c.n}>
              <div className="fx" aria-hidden="true" />
              <span className="ficon">
                <c.icon s={20} />
              </span>
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

/* ---------- Footer ---------- */
function Footer() {
  return (
    <footer
      className="tw-foot"
      style={{ background: "var(--tw-bg)", fontFamily: "var(--tw-font)" }}
    >
      <div className="tw-wrap tw-foot-inner">
        <div className="tw-brand">
          <img
            src="/images/logo.png"
            alt="Tasmil"
            style={{ width: 28, height: 28, borderRadius: 8 }}
          />
          <span className="tw-foot-copy">
            © 2026 Tasmil Finance · AI-managed portfolios for Stellar
          </span>
        </div>
        <div className="tw-social-row" style={{ margin: 0 }}>
          <a className="tw-social-pill" href={PATHS.TELEGRAM} target="_blank" rel="noreferrer">
            <IcoTelegram /> Telegram
          </a>
          <a className="tw-social-pill" href={PATHS.X} target="_blank" rel="noreferrer">
            <IcoX /> X
          </a>
          <a className="tw-social-pill" href={PATHS.DOCS} target="_blank" rel="noreferrer">
            <IcoDocs /> Docs
          </a>
        </div>
      </div>
    </footer>
  );
}

/* ---------- inner component that reads searchParams ---------- */
function WaitlistPhaseBoardWithRef({ referredByCode }: { referredByCode?: string | null }) {
  return <WaitlistPhaseBoard referredByCode={referredByCode} />;
}

/* ---------- root: reads searchParams at the Suspense boundary ---------- */
function WaitlistPageInner() {
  const searchParams = useSearchParams();
  const referredByCode = searchParams.get("ref");
  return <Hero referredByCode={referredByCode} />;
}

/* ---------- page export ---------- */
export default function WaitlistPage() {
  return (
    <div style={{ background: "var(--tw-bg)", color: "var(--tw-text)", minHeight: "100vh" }}>
      <BgFX />
      <Nav />
      <Suspense fallback={null}>
        <WaitlistPageInner />
      </Suspense>
      <ReferralLoop />
      <WhyJoin />
      <Footer />
    </div>
  );
}
