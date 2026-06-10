"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/* ---------- icons ---------- */
function IcoShield({ s = 14 }: { s?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
function IcoKey({ s = 14 }: { s?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="4.2" />
      <path d="M11 11l8 8M16 16l2-2M18.5 18.5l1.8-1.8" />
    </svg>
  );
}
function IcoBolt({ s = 14 }: { s?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L4.5 13.5H11l-1 8.5L18.5 10.5H12l1-8.5Z" />
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

/* ---------- animated illustrations ---------- */
function KeyAnim() {
  return (
    <div className="tw-key-anim" aria-hidden="true">
      <span className="wa-glow" />
      <svg viewBox="0 0 120 120" width={92} height={92} fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="60" cy="60" r="44" stroke="var(--tw-accent-line)" strokeWidth="1.6" />
        <g className="tw-key-spin">
          <circle cx="60" cy="44" r="12" />
          <circle cx="60" cy="44" r="4" fill="currentColor" stroke="none" />
          <line x1="60" y1="56" x2="60" y2="86" />
          <line x1="60" y1="78" x2="71" y2="78" />
          <line x1="60" y1="86" x2="68" y2="86" />
        </g>
      </svg>
    </div>
  );
}

function PopperAnim() {
  const pieces = Array.from({ length: 13 }, (_, i) => i);
  const colors = ["var(--tw-accent)", "var(--tw-accent-2)", "#ffffff", "var(--tw-ok)", "var(--tw-accent-deep)"];
  return (
    <div className="tw-popper-anim" aria-hidden="true">
      <span className="wa-glow" />
      {pieces.map((i) => {
        const ang = -12 + (i / (pieces.length - 1)) * 112;
        const dist = 28 + (i % 3) * 11;
        return (
          <span
            key={i}
            className="tw-pp-piece"
            style={{
              "--pang": `${ang}deg`,
              "--pdist": `${dist}px`,
              "--pdelay": `${(i % 4) * 0.04}s`,
              background: colors[i % colors.length],
              width: (i % 2 ? 5 : 4) + "px",
              height: (i % 3 ? 8 : 5) + "px",
            } as React.CSSProperties}
          />
        );
      })}
      <svg viewBox="0 0 120 120" width={92} height={92} fill="none" style={{ position: "relative", zIndex: 2, overflow: "visible" }}>
        <defs>
          <linearGradient id="ac-pp-grad" x1="30" y1="92" x2="80" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--tw-accent-2)" />
            <stop offset="1" stopColor="var(--tw-accent)" />
          </linearGradient>
        </defs>
        <g className="tw-pp-cone">
          <path d="M28 92 L62 46 L84 74 Z" fill="url(#ac-pp-grad)" />
          <path d="M40 80 L57 58" stroke="var(--tw-accent-deep)" strokeWidth="4.5" strokeLinecap="round" opacity="0.5" />
          <path d="M52 87 L70 66" stroke="var(--tw-accent-deep)" strokeWidth="4.5" strokeLinecap="round" opacity="0.5" />
          <ellipse cx="73" cy="60" rx="6" ry="17.5" fill="#05070C" transform="rotate(-38 73 60)" />
          <ellipse cx="73" cy="60" rx="6" ry="17.5" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.6" transform="rotate(-38 73 60)" />
        </g>
      </svg>
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
        <Link className="tw-brand" href="/waitlist">
          <span className="tw-brand-mark">T</span>
          <span className="tw-brand-name" style={{ color: "var(--tw-text)" }}>Tasmil</span>
        </Link>
        <div className="tw-nav-right">
          <Link className="tw-nav-link" href="/waitlist">← Back to waitlist</Link>
        </div>
      </div>
    </nav>
  );
}

/* ---------- Stepper ---------- */
type StepState = "active" | "done" | "inactive";
function Stepper({ labels, idx }: { labels: string[]; idx: number }) {
  return (
    <div className="tw-stepper">
      {labels.map((label, i) => {
        const state: StepState = i < idx ? "done" : i === idx ? "active" : "inactive";
        return (
          <div key={label} style={{ display: "contents" }}>
            <div className={`tw-step ${state}`}>
              <div className="tw-step-node">
                {i < idx ? (
                  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7" />
                  </svg>
                ) : i + 1}
              </div>
              <div className="tw-step-label">{label}</div>
            </div>
            {i < labels.length - 1 && (
              <div className={`tw-step-line${i < idx ? " filled" : ""}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- AccessCodeCard (existing logic, new visuals) ---------- */
type Screen = "connect" | "verify" | "code" | "done";

function AccessFlow() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("code");
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stepperIdx = screen === "done" ? 2 : screen === "code" ? 1 : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setErr(false);
    setErrorMsg("");
    try {
      const res = await fetch("/api/waitlist/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase(), walletAddress: "unknown" }),
      });
      if (!res.ok) {
        const data = await res.json();
        const msgs: Record<number, string> = {
          404: "Code not found.",
          409: "This code has already been fully used.",
          410: "This code has been revoked.",
        };
        const msg = msgs[res.status] ?? (data as { message?: string }).message ?? "Invalid code.";
        setErrorMsg(msg);
        setErr(true);
        if (inputRef.current) {
          inputRef.current.classList.remove("tw-shake");
          void inputRef.current.offsetWidth;
          inputRef.current.classList.add("tw-shake");
        }
        return;
      }
      setScreen("done");
      timerRef.current = setTimeout(() => router.push("/dashboard"), 1800);
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setErr(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const codeDisplay = code.trim().toUpperCase() || "STLR42";

  return (
    <div className="tw-board" style={{ width: "100%", maxWidth: 440 }}>
      <div className="tw-board-body">
        <Stepper labels={["Wallet", "Code", "Done"]} idx={stepperIdx} />

        {screen === "code" && (
          <div className="tw-screen" key="code">
            <KeyAnim />
            <h3 className="tw-screen-h">Enter your access code</h3>
            <p className="tw-screen-p">
              Paste the invite code you received to unlock your seat.
            </p>
            <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
              <input
                ref={inputRef}
                className={`tw-field code${err ? " err" : ""}`}
                placeholder="XXXX-XXXX-XXXX"
                value={code}
                onChange={(e) => { setCode(e.target.value); if (err) { setErr(false); setErrorMsg(""); } }}
                maxLength={20}
                autoFocus
                autoComplete="off"
                autoCapitalize="characters"
              />
              {err && errorMsg && (
                <div className="tw-err-msg">
                  <IcoShield s={14} /> {errorMsg}
                </div>
              )}
              <button
                type="submit"
                className="tw-btn tw-btn-primary"
                style={{ marginTop: 14 }}
                disabled={!code.trim() || loading}
              >
                {loading ? <><span className="tw-spinner" /> Redeeming…</> : <>Redeem & claim seat →</>}
              </button>
            </form>
            <button
              type="button"
              className="tw-hint-chip"
              onClick={() => setCode("TASMIL-2026-BETA")}
            >
              <IcoKey s={11} /> Use demo code
            </button>
          </div>
        )}

        {screen === "done" && (
          <div className="tw-screen" key="done">
            <PopperAnim />
            <h3 className="tw-screen-h">Access granted</h3>
            <p className="tw-screen-p">Welcome to Tasmil — your seat is secured. Redirecting…</p>

            <div className="tw-seat-pass">
              <div className="tw-sp-left">
                <span className="tw-sp-label">Your seat</span>
                <span className="tw-sp-num" style={{ fontFamily: "var(--tw-font-mono)" }}>#0613</span>
                <span className="tw-sp-cohort">Early cohort</span>
              </div>
              <div className="tw-sp-perf" />
              <div className="tw-sp-right">
                <span className="tw-sp-verified">
                  <IcoShield s={14} /> Verified
                </span>
                <span className="tw-sp-addr">{codeDisplay.slice(0, 12)}</span>
              </div>
            </div>

            <button
              type="button"
              className="tw-btn tw-btn-primary"
              style={{ marginTop: 18 }}
              onClick={() => router.push("/dashboard")}
            >
              Enter dashboard →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Access page copy ---------- */
const ACCESS_META = [
  { icon: IcoKey,    text: <><b>Invite-only</b> — codes issued to waitlist members</> },
  { icon: IcoBolt,   text: <><b>Instant access</b> — vault live on Stellar mainnet</> },
  { icon: IcoShield, text: <><b>Non-custodial</b> — funds stay in your wallet</> },
];

/* ---------- page export ---------- */
export default function AccessPage() {
  return (
    <div
      style={{
        background: "var(--tw-bg)",
        color: "var(--tw-text)",
        minHeight: "100vh",
        fontFamily: "var(--tw-font)",
      }}
    >
      <BgFX />
      <Nav />

      <section className="tw-access-stage">
        <div className="tw-hero-veil" aria-hidden="true" />
        <div className="tw-hero-fade" aria-hidden="true" />

        <div className="tw-wrap tw-access-grid">
          {/* left copy */}
          <div className="access-copy">
            <span className="tw-eyebrow" style={{ marginBottom: 30, display: "block" }}>
              Gated access
            </span>
            <h1 className="tw-access-title">
              Enter your
              <br />
              <span className="tw-grad-text">access code</span>
            </h1>
            <p className="tw-access-desc">
              Invite-only private beta. Redeem your code to unlock AI-managed yield vaults on
              Stellar.
            </p>

            <div className="tw-access-meta">
              {ACCESS_META.map((m, i) => (
                <div className="row" key={i}>
                  <span className="ic"><m.icon s={14} /></span>
                  <span>{m.text}</span>
                </div>
              ))}
            </div>

            <Link className="tw-back-link" href="/waitlist">
              <span>←</span> Back to waitlist
            </Link>
          </div>

          {/* right card */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <AccessFlow />
          </div>
        </div>
      </section>
    </div>
  );
}
