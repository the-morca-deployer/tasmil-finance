// @ts-nocheck
"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/shared/components/brand-logo";
import { useWallet as useWalletCtx } from "@/shared/context/wallet-context";
import { Button } from "@/shared/ui/button";
import { mountBeams } from "./beams";

/* shared.jsx — icons, background FX, Nav, Footer, Stepper, helpers (window globals) */

/* ---------- icons (simple, stroke-based) ---------- */
const Ico = {
  wallet: (p) => (
    <svg
      viewBox="0 0 24 24"
      width={p?.s || 24}
      height={p?.s || 24}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="6" width="18" height="13" rx="3" />
      <path d="M3 9.5h18" />
      <circle cx="16.5" cy="13.2" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  ),
  check: (p) => (
    <svg
      viewBox="0 0 24 24"
      width={p?.s || 15}
      height={p?.s || 15}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  ),
  copy: (p) => (
    <svg
      viewBox="0 0 24 24"
      width={p?.s || 15}
      height={p?.s || 15}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M5 15V6a2 2 0 0 1 2-2h8" />
    </svg>
  ),
  key: (p) => (
    <svg
      viewBox="0 0 24 24"
      width={p?.s || 24}
      height={p?.s || 24}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="8" r="4.2" />
      <path d="M11 11l8 8M16 16l2-2M18.5 18.5l1.8-1.8" />
    </svg>
  ),
  shield: (p) => (
    <svg
      viewBox="0 0 24 24"
      width={p?.s || 24}
      height={p?.s || 24}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  bolt: (p) => (
    <svg
      viewBox="0 0 24 24"
      width={p?.s || 20}
      height={p?.s || 20}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 2L4.5 13.5H11l-1 8.5L18.5 10.5H12l1-8.5Z" />
    </svg>
  ),
  chart: (p) => (
    <svg
      viewBox="0 0 24 24"
      width={p?.s || 20}
      height={p?.s || 20}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19h16M7 16V9M12 16V5M17 16v-4" />
    </svg>
  ),
  layers: (p) => (
    <svg
      viewBox="0 0 24 24"
      width={p?.s || 20}
      height={p?.s || 20}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l9 5-9 5-9-5 9-5Z" />
      <path d="M3 13l9 5 9-5M3 16.5l9 5 9-5" opacity="0.5" />
    </svg>
  ),
  x: (p) => (
    <svg viewBox="0 0 24 24" width={p?.s || 15} height={p?.s || 15} fill="currentColor">
      <path d="M18.9 2H22l-7.6 8.7L23 22h-6.8l-5-6.6L5.5 22H2.3l8.1-9.3L1.7 2h6.9l4.6 6.1L18.9 2Zm-1.2 18h1.9L7.1 4H5L17.7 20Z" />
    </svg>
  ),
  telegram: (p) => (
    <svg viewBox="0 0 24 24" width={p?.s || 15} height={p?.s || 15} fill="currentColor">
      <path d="M21.9 4.3 18.7 19.4c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-4.9 9-8.1c.4-.3-.1-.5-.6-.2L6.4 13 1.7 11.5c-1-.3-1-.9.2-1.4L20.6 3c.8-.3 1.5.2 1.3 1.3Z" />
    </svg>
  ),
  docs: (p) => (
    <svg
      viewBox="0 0 24 24"
      width={p?.s || 15}
      height={p?.s || 15}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M14 3v5h5M9 13h6M9 17h5" />
    </svg>
  ),
  mail: (p) => (
    <svg
      viewBox="0 0 24 24"
      width={p?.s || 24}
      height={p?.s || 24}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M4 7.5l7.3 5.2a1.2 1.2 0 0 0 1.4 0L20 7.5" />
    </svg>
  ),
};

/* ---------- helpers ---------- */
function makeAddr() {
  const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let s = "G";
  for (let i = 0; i < 55; i++) s += c[Math.floor(Math.random() * c.length)];
  return s;
}
const trunc = (a) => (a ? a.slice(0, 6) + "…" + a.slice(-6) : "");

const LINKS = {
  telegram: "https://t.me/tasmilfinance",
  x: "https://x.com/tasmilfinance",
  docs: "https://tasmil-user-docs.vercel.app/docs",
  app: "https://zyf.ai",
};

/* ---------- background FX ---------- */
function BgFX() {
  return (
    <div className="bg-fx" aria-hidden="true">
      <div className="bg-grid"></div>
      <div className="bg-glow g2"></div>
      <div className="bg-glow g3"></div>
    </div>
  );
}

/* ---------- Beams hero background (three.js port of React Bits <Beams />) ---------- */
const BEAM_LIGHT = { Aqua: "#0369A1", Violet: "#C4B5FD", Emerald: "#6EE7B7", Amber: "#FCD34D" };
function BeamsBg({ accent, enabled }) {
  const ref = useRef(null);
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const on = enabled && !reduced;
  useEffect(() => {
    if (!on || !mountBeams || !ref.current) return;
    const inst = mountBeams(ref.current, {
      lightColor: BEAM_LIGHT[accent] || "#67E8F9",
      beamNumber: 14,
      beamWidth: 2.2,
      beamHeight: 20,
      speed: 1.8,
      noiseIntensity: 1.55,
      scale: 0.18,
      rotation: 0,
    });
    return () => inst && inst.dispose();
  }, [accent, on]);
  return (
    <div className={"beams" + (on ? "" : " beams-off")} aria-hidden="true">
      <canvas ref={ref} className="beams-canvas"></canvas>
      <div className="beams-scrim"></div>
    </div>
  );
}

/* ---------- animated wallet illustration (connect screen) ---------- */
function WalletAnim() {
  return (
    <div className="wallet-anim" aria-hidden="true">
      <span className="wa-glow"></span>
      <svg className="wa-svg" viewBox="0 0 120 120" fill="none">
        <defs>
          <linearGradient
            id="wa-card-grad"
            x1="34"
            y1="22"
            x2="86"
            y2="56"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#ffffff"></stop>
            <stop offset="1" stopColor="var(--accent)"></stop>
          </linearGradient>
          <clipPath id="wa-clip">
            <rect x="20" y="20" width="80" height="46" rx="6"></rect>
          </clipPath>
        </defs>
        {/* card slides down into the wallet pocket */}
        <g clipPath="url(#wa-clip)">
          <g className="wa-card">
            <rect x="38" y="18" width="44" height="29" rx="6" fill="url(#wa-card-grad)"></rect>
            <rect x="44" y="36" width="15" height="3" rx="1.5" fill="rgba(0,0,0,0.32)"></rect>
            <circle cx="74" cy="26" r="3.4" fill="rgba(0,0,0,0.22)"></circle>
          </g>
        </g>
        {/* wallet front pocket — covers the lower half of the card */}
        <g
          className="wa-body"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="26" y="50" width="68" height="46" rx="13" fill="#0B0F18"></rect>
          <path d="M26 64 H94"></path>
          <circle cx="80" cy="80" r="4.2" fill="currentColor" stroke="none"></circle>
        </g>
      </svg>
    </div>
  );
}

/* ---------- animated alert bell (email screen) ---------- */
function MailAnim() {
  return (
    <div className="bell-anim" aria-hidden="true">
      <span className="wa-glow"></span>
      <svg
        className="bell-svg"
        viewBox="0 0 120 120"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <g className="bell-waves">
          <path className="bw bw-l" d="M30 44 C 24 50 24 64 30 70"></path>
          <path className="bw bw-r" d="M90 44 C 96 50 96 64 90 70"></path>
        </g>
        <g className="bell-swing">
          <circle cx="60" cy="26" r="3.4" fill="currentColor" stroke="none"></circle>
          <path d="M42 78 V52 a18 18 0 0 1 36 0 V78 l4 7 H38 Z" fill="#0B0F18"></path>
          <circle
            className="bell-clapper"
            cx="60"
            cy="90"
            r="4.6"
            fill="currentColor"
            stroke="none"
          ></circle>
        </g>
      </svg>
    </div>
  );
}

/* ---------- animated radar scan (verify screen) ---------- */
function ScanAnim() {
  return (
    <div className="scan-anim" aria-hidden="true">
      <svg className="scan-svg" viewBox="0 0 120 120" fill="none">
        <defs>
          <linearGradient
            id="scan-grad"
            x1="60"
            y1="60"
            x2="60"
            y2="16"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="var(--accent)" stopOpacity="0.55"></stop>
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0"></stop>
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="42" stroke="var(--accent-line)" strokeWidth="1.4"></circle>
        <circle cx="60" cy="60" r="28" stroke="var(--line-2)" strokeWidth="1.4"></circle>
        <circle cx="60" cy="60" r="14" stroke="var(--line-2)" strokeWidth="1.4"></circle>
        <g className="scan-sweep">
          <path d="M60 60 L60 18 A42 42 0 0 1 98 44 Z" fill="url(#scan-grad)"></path>
          <line x1="60" y1="60" x2="60" y2="18" stroke="var(--accent)" strokeWidth="2"></line>
        </g>
        <circle className="scan-blip" cx="78" cy="42" r="3.2" fill="var(--accent)"></circle>
        <circle cx="60" cy="60" r="5" fill="var(--accent)"></circle>
      </svg>
    </div>
  );
}

/* ---------- animated turning key (access-code screen) ---------- */
function KeyAnim() {
  return (
    <div className="key-anim" aria-hidden="true">
      <span className="wa-glow"></span>
      <svg
        className="key-svg"
        viewBox="0 0 120 120"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="60" cy="60" r="44" stroke="var(--accent-line)" strokeWidth="1.6"></circle>
        <g className="key-spin">
          <circle cx="60" cy="44" r="12"></circle>
          <circle cx="60" cy="44" r="4" fill="currentColor" stroke="none"></circle>
          <line x1="60" y1="56" x2="60" y2="86"></line>
          <line x1="60" y1="78" x2="71" y2="78"></line>
          <line x1="60" y1="86" x2="68" y2="86"></line>
        </g>
      </svg>
    </div>
  );
}

/* ---------- animated success check (done / access-granted) ---------- */
function CheckAnim({ ok = true }) {
  const sparks = [0, 60, 120, 180, 240, 300];
  return (
    <div className={"check-anim" + (ok ? " ok" : "")} aria-hidden="true">
      <span className="ca-glow"></span>
      <svg className="ca-svg" viewBox="0 0 120 120" fill="none">
        <circle className="ca-disc" cx="60" cy="60" r="40"></circle>
        <circle className="ca-ring" cx="60" cy="60" r="40" pathLength="100"></circle>
        <path
          className="ca-check"
          d="M41 61 L54 74 L80 47"
          pathLength="100"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>
        <g className="ca-sparks" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round">
          {sparks.map((deg, i) => (
            <g key={i} transform={"rotate(" + deg + " 60 60)"}>
              <line className="ca-spark" x1="60" y1="13" x2="60" y2="21"></line>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

/* ---------- congrats confetti burst (waitlist done) ---------- */
function CongratsAnim() {
  const pieces = Array.from({ length: 16 }, (_, i) => i);
  const colors = ["var(--accent)", "var(--accent-2)", "var(--accent-deep)", "#ffffff", "var(--ok)"];
  return (
    <div className="congrats-anim" aria-hidden="true">
      {pieces.map((i) => {
        const ang = (i / 16) * 360 + (i % 2 ? 11 : 0);
        const dist = 32 + (i % 3) * 9;
        const st = {
          "--ang": ang + "deg",
          "--dist": dist + "px",
          "--delay": (i % 5) * 0.03 + "s",
          background: colors[i % colors.length],
          width: (i % 2 ? 5 : 4) + "px",
          height: (i % 3 ? 9 : 5) + "px",
        };
        return <span className="cg-piece" key={i} style={st}></span>;
      })}
      <span className="cg-core">{Ico.check({ s: 24 })}</span>
    </div>
  );
}

/* ---------- party popper burst (done screens) ---------- */
function PopperAnim() {
  const pieces = Array.from({ length: 13 }, (_, i) => i);
  const colors = ["var(--accent)", "var(--accent-2)", "#ffffff", "var(--ok)", "var(--accent-deep)"];
  const n = pieces.length;
  return (
    <div className="popper-anim" aria-hidden="true">
      <span className="wa-glow"></span>
      {pieces.map((i) => {
        const ang = -12 + (i / (n - 1)) * 112;
        const dist = 28 + (i % 3) * 11;
        const st = {
          "--pang": ang + "deg",
          "--pdist": dist + "px",
          "--pdelay": (i % 4) * 0.04 + "s",
          background: colors[i % colors.length],
          width: (i % 2 ? 5 : 4) + "px",
          height: (i % 3 ? 8 : 5) + "px",
        };
        return <span className="pp-piece" key={i} style={st}></span>;
      })}
      <svg className="pp-cone-svg" viewBox="0 0 120 120" fill="none">
        <defs>
          <linearGradient
            id="pp-cone-grad"
            x1="30"
            y1="92"
            x2="80"
            y2="48"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="var(--accent-2)"></stop>
            <stop offset="1" stopColor="var(--accent)"></stop>
          </linearGradient>
        </defs>
        <g className="pp-cone">
          <path d="M28 92 L62 46 L84 74 Z" fill="url(#pp-cone-grad)"></path>
          <path
            d="M40 80 L57 58"
            stroke="var(--accent-deep)"
            strokeWidth="4.5"
            strokeLinecap="round"
            opacity="0.5"
          ></path>
          <path
            d="M52 87 L70 66"
            stroke="var(--accent-deep)"
            strokeWidth="4.5"
            strokeLinecap="round"
            opacity="0.5"
          ></path>
          <ellipse
            cx="73"
            cy="60"
            rx="6"
            ry="17.5"
            fill="#05070C"
            transform="rotate(-38 73 60)"
          ></ellipse>
          <ellipse
            cx="73"
            cy="60"
            rx="6"
            ry="17.5"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            opacity="0.6"
            transform="rotate(-38 73 60)"
          ></ellipse>
        </g>
      </svg>
    </div>
  );
}

/* ---------- generic animated glyph (rings + pulsing core, reused on gate/result) ---------- */
function PulseGlyph({ children, ok }) {
  return (
    <div className={"pulse-glyph" + (ok ? " ok" : "")} aria-hidden="true">
      <span className="pg-ring"></span>
      <span className="pg-ring pg-ring-2"></span>
      <span className="pg-core">{children}</span>
    </div>
  );
}

/* ---------- nav ---------- */
function Nav({ variant, codeHref, homeHref }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { isConnected, displayAddress, disconnect } = useWalletCtx();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  // Lock body scroll when sidebar open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleDisconnect = async () => {
    await disconnect();
    setOpen(false);
  };

  return (
    <>
      <nav className={"nav" + (scrolled ? " scrolled" : "")}>
        <div className="wrap nav-inner">
          <BrandLogo href="/" logoSrc="/tasmil-logo.png" text="Tasmil Finance" size="md" />
          {variant === "landing" ? (
            <div className="nav-center">
              <Link className="nav-link" href="#how">
                How it works
              </Link>
              <Link className="nav-link" href="#why">
                Why join
              </Link>
            </div>
          ) : null}
          <div className="nav-right">
            {variant === "landing" ? (
              <Link className="nav-code nav-hide-mobile" href={codeHref}>
                {Ico.key({ s: 14 })} Have a code? <span className="arr">→</span>
              </Link>
            ) : (
              <Link className="nav-code nav-hide-mobile" href={homeHref}>
                Join Waitlist <span className="arr">→</span>
              </Link>
            )}
            {/* Hamburger — mobile only */}
            <Button
              variant="ghost"
              className="nav-burger"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <span />
              <span />
              <span />
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile sidebar */}
      <div className={"wl-sidebar" + (open ? " open" : "")} aria-hidden={!open}>
        <div className="wl-sidebar-head">
          <BrandLogo
            href="/"
            logoSrc="/tasmil-logo.png"
            text="Tasmil Finance"
            size="md"
            onClick={() => setOpen(false)}
          />
          <Button
            variant="ghost"
            className="wl-sidebar-close"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            ✕
          </Button>
        </div>

        <div className="wl-sidebar-body">
          {variant === "landing" && (
            <>
              <Link className="wl-sb-link" href="#how" onClick={() => setOpen(false)}>
                How it works
              </Link>
              <Link className="wl-sb-link" href="#why" onClick={() => setOpen(false)}>
                Why join
              </Link>
            </>
          )}
          {variant === "landing" ? (
            <Link
              className="btn btn-primary"
              href={codeHref}
              onClick={() => setOpen(false)}
              style={{ marginTop: 8 }}
            >
              {Ico.key({ s: 14 })} Have a code? <span className="arr">→</span>
            </Link>
          ) : (
            <Link
              className="btn btn-primary"
              href={homeHref}
              onClick={() => setOpen(false)}
              style={{ marginTop: 8 }}
            >
              Join Waitlist <span className="arr">→</span>
            </Link>
          )}
        </div>

        {isConnected && displayAddress && (
          <div className="wl-sidebar-wallet">
            <span className="wl-sidebar-addr">{displayAddress}</span>
            <Button variant="ghost" size="sm" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </div>
        )}
      </div>
      {open && <div className="wl-sidebar-scrim" onClick={() => setOpen(false)} />}
    </>
  );
}

/* ---------- stepper ---------- */
function Stepper({ steps, idx }) {
  return (
    <div className="stepper">
      {steps.map((label, i) => {
        const st = i < idx ? "done" : i === idx ? "active" : "";
        return (
          <React.Fragment key={label}>
            <div className={"step " + st}>
              <div className="step-node">{i < idx ? Ico.check({ s: 14 }) : i + 1}</div>
              <div className="step-label">{label}</div>
            </div>
            {i < steps.length - 1 && (
              <div className={"step-line" + (i < idx ? " filled" : "")}></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ---------- footer ---------- */
function Footer() {
  const auroraRef = useRef(null);
  useEffect(() => {
    const el = auroraRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => {
        if (es[0].isIntersecting) {
          el.classList.add("in");
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const L = "/";
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <BrandLogo
              href={L + "#top"}
              logoSrc="/tasmil-logo.png"
              text="Tasmil Finance"
              size="md"
            />
            <p className="foot-desc">
              An automated DeFi yield protocol on Stellar. Deposit USDC or XLM, pick a risk level,
              and Tasmil Finance rebalances across the best protocols, non-custodial.
            </p>
          </div>
          <div className="foot-col">
            <div className="foot-head">Product</div>
            <Link href={L + "#features"}>How it works</Link>
            <Link href={L + "#converge"}>One vault</Link>
            <Link href={L + "#security"}>Security</Link>
            <Link href={L + "#fees"}>Fees</Link>
            <Link href={L + "#faq"}>FAQ</Link>
            <Link href="/waitlist">Join waitlist</Link>
            <Link href="/access">Have a code?</Link>
          </div>
          <div className="foot-col">
            <div className="foot-head">Protocols</div>
            <Link href={L + "#partners"}>Blend</Link>
            <Link href={L + "#partners"}>Soroswap</Link>
            <Link href={L + "#partners"}>Aquarius</Link>
            <Link href={L + "#partners"}>Phoenix</Link>
            <Link href={L + "#partners"}>Allbridge</Link>
          </div>
          <div className="foot-col">
            <div className="foot-head">Network</div>
            <a href="https://stellar.org" target="_blank" rel="noopener">
              Stellar
            </a>
            <a href="https://soroban.stellar.org" target="_blank" rel="noopener">
              Soroban
            </a>
            <a href="https://stellar.expert" target="_blank" rel="noopener">
              Stellar Expert
            </a>
          </div>
        </div>
      </div>

      <div className="foot-aurora">
        <div className="fa-cols" ref={auroraRef}>
          <span className="fa-col" style={{ "--h": "30%" }}></span>
          <span className="fa-col" style={{ "--h": "46%" }}></span>
          <span className="fa-col" style={{ "--h": "60%" }}></span>
          <span className="fa-col" style={{ "--h": "72%" }}></span>
          <span className="fa-col" style={{ "--h": "60%" }}></span>
          <span className="fa-col" style={{ "--h": "46%" }}></span>
          <span className="fa-col" style={{ "--h": "30%" }}></span>
        </div>
        <div className="fa-grain"></div>
      </div>

      <div className="wrap">
        <div className="fa-top">
          <div className="fa-social">
            <a className="fa-ic" href={LINKS.x} target="_blank" rel="noopener" aria-label="X">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
              </svg>
            </a>
            <a
              className="fa-ic"
              href={LINKS.telegram}
              target="_blank"
              rel="noopener"
              aria-label="Telegram"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M9.04 15.29l-.37 5.2c.53 0 .76-.23 1.04-.5l2.5-2.4 5.18 3.79c.95.52 1.62.25 1.88-.88l3.4-15.94c.3-1.4-.51-1.95-1.43-1.6L1.13 9.86C-.24 10.4-.22 11.18.9 11.52l5.05 1.57L17.6 5.74c.55-.36 1.05-.16.64.2L9.04 15.29z"></path>
              </svg>
            </a>
            <a className="fa-ic" href={LINKS.docs} target="_blank" rel="noopener" aria-label="Docs">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
                <path d="M14 3v5h5M9 13h6M9 17h5" />
              </svg>
            </a>
          </div>
          <div className="fa-copy">
            © 2026 Tasmil Finance. All rights reserved.
            <span className="fa-disc">
              For informational purposes only, not financial advice. DeFi yields are variable and
              capital is at risk.
            </span>
          </div>
        </div>
        <div className="fa-mark" aria-hidden="true">
          <b>Tasmil</b> Finance
        </div>
      </div>
    </footer>
  );
}

/* ---------- toast hook ---------- */
function useToast() {
  const [msg, setMsg] = useState(null);
  const tm = useRef(null);
  const fire = (m) => {
    setMsg(m);
    clearTimeout(tm.current);
    tm.current = setTimeout(() => setMsg(null), 2600);
  };
  const Toast = () => (
    <div
      style={{
        position: "fixed",
        bottom: 28,
        left: "50%",
        transform: `translateX(-50%) translateY(${msg ? 0 : 20}px)`,
        opacity: msg ? 1 : 0,
        transition: "all .3s cubic-bezier(0.22,1,0.36,1)",
        pointerEvents: "none",
        zIndex: 200,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "13px 18px",
          borderRadius: 13,
          background: "rgba(8,10,16,0.94)",
          border: "1px solid var(--line-2)",
          boxShadow: "0 24px 60px -20px rgba(0,0,0,0.9), 0 0 40px -22px var(--accent-glow)",
          backdropFilter: "blur(14px)",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--accent)",
            boxShadow: "0 0 10px var(--accent)",
          }}
        ></span>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{msg}</span>
      </div>
    </div>
  );
  return [fire, Toast];
}

/* accent application */
function useAccent(name) {
  const HUE = { Aqua: 200, Violet: 285, Emerald: 155, Amber: 70 };
  useEffect(() => {
    document.documentElement.style.setProperty("--h", HUE[name] ?? 192);
  }, [name]);
}

export {
  Ico,
  makeAddr,
  trunc,
  LINKS,
  BgFX,
  BeamsBg,
  WalletAnim,
  MailAnim,
  ScanAnim,
  KeyAnim,
  CheckAnim,
  CongratsAnim,
  PopperAnim,
  PulseGlyph,
  Nav,
  Stepper,
  Footer,
  useToast,
  useAccent,
};
