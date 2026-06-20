"use client";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { Starfield } from "./starfield";

// Confetti burst — mirrors ref HTML `fireBurst`. Fires ~480ms after mount
// (when the medallion spin lands), launching 26 pieces from above the medal.
function fireConfetti(host: HTMLElement, originTopPx: number) {
  const cols = ["#67E8F9", "#0EA5E9", "#ffffff", "#A9F2FB"];
  const N = 26;
  const rect = host.getBoundingClientRect();
  const cx = rect.width / 2;
  for (let i = 0; i < N; i++) {
    const piece = document.createElement("span");
    const w = i % 2 ? 5 : 4;
    const h = i % 3 ? 11 : 6;
    Object.assign(piece.style, {
      position: "absolute",
      borderRadius: "2px",
      pointerEvents: "none",
      zIndex: "7",
      willChange: "transform,opacity",
      width: `${w}px`,
      height: `${h}px`,
      background: cols[i % cols.length],
      left: `${cx}px`,
      top: `${originTopPx}px`,
    } as Partial<CSSStyleDeclaration>);
    host.appendChild(piece);
    const ang = ((-90 + (Math.random() * 340 - 170)) * Math.PI) / 180;
    const dist = 90 + Math.random() * 150;
    const dx = Math.cos(ang) * dist;
    const dy = Math.sin(ang) * dist + 50;
    const rot = Math.random() * 720 - 360;
    const anim = piece.animate(
      [
        { transform: "translate(-50%,-50%)", opacity: 1 },
        {
          transform: `translate(calc(-50% + ${dx * 0.6}px),calc(-50% + ${
            dy * 0.55 - 50
          }px)) rotate(${rot * 0.6}deg)`,
          opacity: 1,
          offset: 0.55,
        },
        {
          transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) rotate(${rot}deg)`,
          opacity: 0,
        },
      ],
      {
        duration: 1100 + Math.random() * 500,
        easing: "cubic-bezier(0.18,0.7,0.3,1)",
      }
    );
    anim.onfinish = () => piece.remove();
  }
}

interface Props {
  rank: number;
  cohortSize: number;
  maxTxPerUser: number;
  maxXlmPerTx: string;
  onClose: () => void;
  onPrimaryCta: () => void;
  onDetail: () => void;
}

const PROTOS = [
  { name: "Tasmil Vault", src: "/protocols/tasmil.svg", href: "#", isTasmil: true },
  { name: "Soroswap", src: "/protocols/soroswap.svg", href: "https://soroswap.finance" },
  { name: "Blend", src: "/protocols/blend.svg", href: "https://www.blend.capital" },
  { name: "Aquarius", src: "/protocols/aquarius.svg", href: "https://aqua.network" },
  { name: "Phoenix", src: "/protocols/phoenix.svg", href: "#" },
  { name: "DeFindex", src: "/protocols/defindex.svg", href: "#" },
  { name: "Allbridge", src: "/protocols/allbridge.svg", href: "https://allbridge.io" },
];

const TickIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="15"
    height="15"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12.5l4.5 4.5L19 7" />
  </svg>
);

const TrophyIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="13"
    height="13"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 4h12v3a6 6 0 0 1-12 0V4Z" />
    <path d="M6 6H3.5v.5A2.5 2.5 0 0 0 6 9" />
    <path d="M18 6h2.5v.5A2.5 2.5 0 0 1 18 9" />
    <path d="M9.5 18h5" />
    <path d="M12 14v4" />
  </svg>
);

export function GasSponsorModal({
  rank,
  cohortSize,
  maxTxPerUser,
  maxXlmPerTx,
  onClose,
  onPrimaryCta,
  onDetail,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const medalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Fire confetti burst once after medallion spin lands (~480ms post-mount).
  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const t = setTimeout(() => {
      const card = cardRef.current;
      const medal = medalRef.current;
      if (!card || !medal) return;
      const cardRect = card.getBoundingClientRect();
      const medalRect = medal.getBoundingClientRect();
      fireConfetti(card, medalRect.top - cardRect.top + 40);
    }, 680);
    return () => clearTimeout(t);
  }, []);

  const padded = String(rank).padStart(2, "0");
  const terms = [
    { val: `First ${cohortSize} only`, label: "Reserved cohort, no waitlist" },
    { val: `${maxTxPerUser} transactions`, label: "Sponsored per user" },
    { val: `${maxXlmPerTx} XLM max`, label: "Sponsored per transaction" },
  ];

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gas-sponsor-title"
        className="fixed inset-0 z-50 grid place-items-center p-6"
        style={{
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          fontFamily: "'Hanken Grotesk', system-ui, -apple-system, sans-serif",
          letterSpacing: "-0.01em",
        }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <Starfield />

        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full overflow-hidden"
          style={{
            maxWidth: 940,
            borderRadius: 30,
            background:
              "radial-gradient(440px 240px at 50% -14%, rgba(103,232,249,0.10), transparent 72%), linear-gradient(180deg,#101015,#0A0A0D)",
            border: "1px solid rgba(255,255,255,0.16)",
            boxShadow:
              "0 50px 130px -42px #000, 0 0 90px -58px rgba(103,232,249,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* Rank chip */}
          <span
            className="absolute z-[5] inline-flex items-center"
            style={{
              top: 22,
              left: 24,
              gap: 8,
              padding: "8px 13px",
              borderRadius: 100,
              background: "rgba(103,232,249,0.14)",
              border: "1px solid rgba(103,232,249,0.32)",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.02em",
              color: "#67E8F9",
            }}
          >
            <TrophyIcon />
            <span>
              <span style={{ color: "#EAFEFF", fontWeight: 700 }}>{padded}</span>
              <span style={{ color: "rgba(244,247,251,0.34)" }}>/{cohortSize}</span>
            </span>
          </span>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute grid place-items-center transition-all hover:rotate-90"
            style={{
              top: 20,
              right: 20,
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.14)",
              color: "rgba(244,247,251,0.58)",
              zIndex: 5,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          <div className="grid" style={{ gridTemplateColumns: "1fr 1.04fr" }}>
            {/* HERO (left) */}
            <div
              className="relative flex flex-col items-start"
              style={{
                padding: "48px 44px",
                gap: 22,
                background:
                  "radial-gradient(360px 280px at 24% 18%, rgba(103,232,249,0.10), transparent 70%), linear-gradient(160deg, rgba(255,255,255,0.03), transparent 60%)",
                borderRight: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {/* Medallion */}
              <motion.div
                ref={medalRef}
                className="relative grid place-items-center"
                style={{ marginTop: 30 }}
                initial={{ scale: 0.4, rotate: -40, opacity: 0 }}
                animate={{ scale: [0.4, 1.12, 1], rotate: [-40, 6, 0], opacity: 1 }}
                transition={{ duration: 1, times: [0, 0.55, 1], ease: [0.22, 1, 0.36, 1] }}
              >
                <span
                  className="absolute pointer-events-none"
                  style={{
                    inset: -26,
                    borderRadius: "50%",
                    background:
                      "radial-gradient(closest-side, rgba(103,232,249,0.50), transparent 72%)",
                    opacity: 0.4,
                    filter: "blur(6px)",
                    zIndex: -1,
                  }}
                />
                <div
                  className="relative grid place-items-center"
                  style={{
                    width: 124,
                    height: 124,
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle at 50% 30%, rgba(150,238,250,0.45), transparent 60%), conic-gradient(from 210deg, #0369A1, #67E8F9 28%, #9FEFFB 50%, #67E8F9 72%, #0369A1)",
                    boxShadow:
                      "0 0 0 1px rgba(103,232,249,0.55), 0 18px 50px -16px rgba(0,0,0,0.7), 0 0 44px -8px rgba(103,232,249,0.50)",
                  }}
                >
                  <div
                    className="grid place-items-center"
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: "50%",
                      background: "radial-gradient(circle at 50% 32%, #0c1418, #070a0c 78%)",
                      boxShadow:
                        "inset 0 2px 10px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(103,232,249,0.22)",
                    }}
                  >
                    <Image
                      src="/protocols/tasmil.svg"
                      alt="Tasmil Finance"
                      width={58}
                      height={58}
                      style={{
                        width: 58,
                        height: "auto",
                        filter: "drop-shadow(0 0 10px rgba(103,232,249,0.40))",
                      }}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Eyebrow + Title */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.36, ease: [0.16, 1, 0.3, 1] }}
              >
                <span
                  className="inline-flex items-center font-bold"
                  style={{
                    gap: 11,
                    fontSize: 12,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "#67E8F9",
                  }}
                >
                  <span style={{ width: 24, height: 1, background: "#67E8F9", opacity: 0.55 }} />
                  Gas Sponsorship
                  <span style={{ width: 24, height: 1, background: "#67E8F9", opacity: 0.55 }} />
                </span>
                <h2
                  id="gas-sponsor-title"
                  style={{
                    marginTop: 14,
                    fontSize: 40,
                    fontWeight: 800,
                    letterSpacing: "-0.035em",
                    lineHeight: 1.03,
                    color: "#F4F7FB",
                  }}
                >
                  You&rsquo;re in the{" "}
                  <span
                    style={{
                      backgroundImage:
                        "linear-gradient(110deg,#ffffff 0%,#67E8F9 52%,#0EA5E9 100%)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    Top {cohortSize}
                  </span>
                </h2>
              </motion.div>

              {/* Sub */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.51, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  fontSize: 16,
                  color: "rgba(244,247,251,0.58)",
                  lineHeight: 1.55,
                  maxWidth: 330,
                }}
              >
                You&rsquo;re one of the first {cohortSize} wallets on Tasmil. Your gas fees are on
                us.
              </motion.p>
              {/* Protocols */}
              <motion.div
                style={{ marginTop: "auto", paddingTop: 8 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.66, ease: [0.16, 1, 0.3, 1] }}
              >
                <p
                  style={{
                    fontSize: 13.5,
                    color: "rgba(244,247,251,0.58)",
                    lineHeight: 1.5,
                    marginBottom: 12,
                    maxWidth: 340,
                  }}
                >
                  Free gas on <b style={{ color: "#F4F7FB", fontWeight: 600 }}>Farming</b> and{" "}
                  <b style={{ color: "#F4F7FB", fontWeight: 600 }}>AI Chat</b>.
                </p>
                <div className="flex items-center" style={{ paddingTop: 2 }}>
                  {PROTOS.map((p, i) => (
                    <a
                      key={p.name}
                      href={p.href}
                      target={p.href.startsWith("http") ? "_blank" : undefined}
                      rel="noreferrer"
                      className="proto-pill relative block transition-transform hover:-translate-y-[7px] hover:z-30"
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        marginLeft: i === 0 ? 0 : -12,
                        background: "#0e1b1b",
                        border: "2px solid #0b0b0f",
                        boxShadow: "0 0 0 1px rgba(255,255,255,0.08)",
                      }}
                      aria-label={p.name}
                    >
                      <Image
                        src={p.src}
                        alt={p.name}
                        width={40}
                        height={40}
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: "50%",
                          objectFit: p.isTasmil ? "contain" : "cover",
                          padding: p.isTasmil ? 9 : 0,
                        }}
                      />
                      <span
                        className="proto-tip"
                        style={{
                          position: "absolute",
                          bottom: "calc(100% + 11px)",
                          left: "50%",
                          transform: "translate(-50%, 6px)",
                          padding: "7px 12px",
                          borderRadius: 10,
                          background: "#15151b",
                          border: "1px solid rgba(255,255,255,0.14)",
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: "#F4F7FB",
                          whiteSpace: "nowrap",
                          letterSpacing: "-0.01em",
                          opacity: 0,
                          pointerEvents: "none",
                          transition: "opacity .2s ease, transform .2s ease",
                          boxShadow: "0 12px 30px -10px #000",
                        }}
                      >
                        {p.name}
                      </span>
                    </a>
                  ))}
                </div>
                {/* Inline CSS for tooltip hover (can't use Tailwind hover on a child span easily). */}
                <style>{`
                  .proto-pill:hover .proto-tip { opacity: 1; transform: translate(-50%, 0); }
                `}</style>
              </motion.div>
            </div>

            {/* SIDE (right) */}
            <div className="flex flex-col justify-center" style={{ padding: "44px 42px", gap: 24 }}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.81, ease: [0.16, 1, 0.3, 1] }}
              >
                <div
                  className="flex items-center"
                  style={{
                    gap: 10,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "rgba(244,247,251,0.34)",
                    marginBottom: 6,
                  }}
                >
                  What you get
                  <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
                </div>
                <div className="flex flex-col" style={{ gap: 2 }}>
                  {terms.map((t, i) => (
                    <div
                      key={t.val}
                      className="flex items-center"
                      style={{
                        gap: 14,
                        padding: "13px 2px",
                        borderTop: i === 0 ? undefined : "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <span
                        className="grid place-items-center flex-none"
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          background: "rgba(103,232,249,0.14)",
                          border: "1px solid rgba(103,232,249,0.32)",
                          color: "#67E8F9",
                        }}
                      >
                        <TickIcon />
                      </span>
                      <span className="flex flex-col" style={{ gap: 1, minWidth: 0 }}>
                        <span
                          style={{
                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                            fontVariantNumeric: "tabular-nums",
                            fontWeight: 700,
                            color: "#F4F7FB",
                          }}
                        >
                          {t.val}
                        </span>
                        <span
                          style={{
                            fontSize: 15,
                            color: "rgba(244,247,251,0.58)",
                            fontWeight: 500,
                          }}
                        >
                          {t.label}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.button
                type="button"
                onClick={onPrimaryCta}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.96, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -2 }}
                className="flex items-center justify-center"
                style={{
                  gap: 10,
                  width: "100%",
                  padding: 18,
                  borderRadius: 100,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 17,
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  color: "#04141A",
                  background: "linear-gradient(110deg,#ffffff 0%,#67E8F9 52%,#0EA5E9 100%)",
                  boxShadow: "0 0 42px -12px rgba(103,232,249,0.50)",
                  marginTop: 8,
                }}
              >
                Start Earning Yield
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h13M13 6l6 6-6 6" />
                </svg>
              </motion.button>

              {/* Detail link removed per design */}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
