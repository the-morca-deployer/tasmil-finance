"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAuthStore } from "@/store/use-auth";
import { composeTxLabel, stroopsToXlm, truncateHash, txExplorerUrl } from "..";
import { useSponsorshipMe } from "../hooks/use-sponsorship-me";
import { FAQ, HOW_IT_WORKS, TERMS } from "../lib/copy";
import type { SponsorshipDetailState, SponsorshipMe } from "../types";
import { Starfield } from "./starfield";

const PROTOS = [
  { name: "Tasmil Vault", src: "/protocols/tasmil.svg", href: "#", isTasmil: true },
  { name: "Soroswap", src: "/protocols/soroswap.svg", href: "https://soroswap.finance" },
  { name: "Blend", src: "/protocols/blend.svg", href: "https://www.blend.capital" },
  { name: "Aquarius", src: "/protocols/aquarius.svg", href: "https://aqua.network" },
  { name: "Phoenix", src: "/protocols/phoenix.svg", href: "#" },
  { name: "DeFindex", src: "/protocols/defindex.svg", href: "#" },
];

// ───────────────────────── icons ─────────────────────────

const I = {
  arr: (
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h13M13 6l6 6-6 6" />
    </svg>
  ),
  wallet: (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M16 12h2" />
      <path d="M3 9h13" />
    </svg>
  ),
  trophy: (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
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
  ),
  ext: (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 5h5v5M19 5l-8 8M11 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" />
    </svg>
  ),
  tickOk: (
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
  ),
  tickWarn: (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3 2 20h20L12 3Z" />
      <path d="M12 10v4M12 17h.01" />
    </svg>
  ),
  back: (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H6M11 6l-6 6 6 6" />
    </svg>
  ),
  clock: (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  txDown: (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v12M7 12l5 5 5-5" />
    </svg>
  ),
};

// ───────────────────────── style tokens (mirror ref :root) ─────────────────────────

const T = {
  font: "'Hanken Grotesk', system-ui, -apple-system, sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
  text: "#F4F7FB",
  muted: "rgba(244,247,251,0.58)",
  dim: "rgba(244,247,251,0.34)",
  faint: "rgba(244,247,251,0.16)",
  accent: "#67E8F9",
  accentSoft: "rgba(103,232,249,0.14)",
  accentLine: "rgba(103,232,249,0.32)",
  accentGlow: "rgba(103,232,249,0.50)",
  line: "rgba(255,255,255,0.08)",
  line2: "rgba(255,255,255,0.14)",
  gold: "#FBC54A",
  goldSoft: "rgba(251,197,74,0.13)",
  goldLine: "rgba(251,197,74,0.34)",
  grad: "linear-gradient(110deg,#ffffff 0%,#67E8F9 52%,#0EA5E9 100%)",
  maxw: 940,
};

const cardStyle: React.CSSProperties = {
  background:
    "radial-gradient(440px 240px at 50% -20%, rgba(103,232,249,0.08), transparent 72%), linear-gradient(180deg,#101015,#0A0A0D)",
  border: "1px solid rgba(255,255,255,0.16)",
  boxShadow: "0 40px 110px -50px #000, inset 0 1px 0 rgba(255,255,255,0.04)",
  borderRadius: 24,
};

// ───────────────────────── main component ─────────────────────────

export function GasSponsorshipDetailClient() {
  const { data, isLoading } = useSponsorshipMe(true);
  const state: SponsorshipDetailState = deriveState(data, isLoading);
  const cohortSize = data?.cohortSize ?? 100;
  const cfg = data?.config;
  const used = data?.usage?.txCount ?? 0;
  const maxTx = cfg?.maxTxPerUser ?? 5;
  const remXlm = stroopsToXlm(data?.usage?.xlmRemainingStroops ?? "0");
  const walletAddress = useAuthStore((s) => s.user?.walletAddress);
  const showTracker =
    state === "active" || state === "fresh" || state === "exhausted" || state === "loading";
  const showRecent = state === "active" || state === "fresh" || state === "exhausted";
  const showRank = state !== "guest" && state !== "loading" && data?.rank != null;

  const subText = heroSub(state, cohortSize);

  return (
    <main
      className="relative min-h-screen"
      style={{
        background: "#000",
        color: T.text,
        fontFamily: T.font,
        letterSpacing: "-0.01em",
        fontVariantNumeric: "tabular-nums",
        lineHeight: 1.5,
      }}
    >
      {/* Fixed backdrop */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 0,
          background:
            "radial-gradient(680px 440px at 50% -8%, rgba(103,232,249,0.14), transparent 70%), radial-gradient(900px 620px at 50% 118%, rgba(14,165,233,0.08), transparent 70%), #000",
        }}
      />
      <Starfield />

      {/* ───── sticky breadcrumb sub-header (logo + nav comes from MultiSidebarLayout) ───── */}
      <header
        className="sticky top-0"
        style={{
          zIndex: 30,
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: `1px solid ${T.line}`,
          display: "none",
        }}
      >
        <div
          className="mx-auto flex items-center justify-between"
          style={{ maxWidth: T.maxw, padding: "14px 24px", gap: 16 }}
        >
          <div className="flex items-center" style={{ gap: 13, minWidth: 0 }}>
            <span style={{ width: 30, height: 30, flex: "none", display: "block" }}>
              <Image
                src="/protocols/tasmil.svg"
                alt="Tasmil"
                width={30}
                height={30}
                style={{
                  width: "100%",
                  height: "auto",
                  filter: "drop-shadow(0 0 8px rgba(103,232,249,0.4))",
                }}
              />
            </span>
            <nav
              aria-label="Breadcrumb"
              className="flex items-center"
              style={{
                gap: 9,
                fontSize: 13.5,
                fontWeight: 600,
                whiteSpace: "nowrap",
                minWidth: 0,
              }}
            >
              <Link href="/" style={{ color: T.dim, textDecoration: "none" }}>
                Rewards
              </Link>
              <span style={{ color: T.faint }}>/</span>
              <span style={{ color: T.text }}>Gas Sponsorship</span>
            </nav>
          </div>
          <div className="flex items-center" style={{ gap: 12 }}>
            {walletAddress && (
              <span
                className="inline-flex items-center"
                style={{
                  gap: 8,
                  fontFamily: T.mono,
                  fontSize: 12.5,
                  color: T.muted,
                  padding: "8px 14px",
                  borderRadius: 100,
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${T.line2}`,
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: T.accent,
                    boxShadow: `0 0 8px ${T.accentGlow}`,
                  }}
                />
                {walletAddress.slice(0, 4)}…{walletAddress.slice(-4)}
              </span>
            )}
            <Link
              href="/chat"
              className="inline-flex items-center transition-colors hover:text-white"
              style={{
                gap: 7,
                fontSize: 13.5,
                fontWeight: 600,
                color: T.muted,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              {I.back}
              Back to chat
            </Link>
          </div>
        </div>
      </header>

      {/* ───── page shell ───── */}
      <div
        className="relative mx-auto"
        style={{ zIndex: 2, maxWidth: T.maxw, padding: "0 24px 120px" }}
      >
        {/* HERO */}
        <section style={{ padding: "56px 0 30px" }}>
          <div className="grid items-center" style={{ gridTemplateColumns: "1fr auto", gap: 60 }}>
            <div style={{ minWidth: 0 }}>
              <SecEyebrow style={{ marginBottom: 18 }}>Gas Sponsorship</SecEyebrow>
              <h1
                style={{
                  fontSize: "clamp(40px, 5.4vw, 56px)",
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.02,
                  textWrap: "balance",
                  margin: 0,
                }}
              >
                You&rsquo;re in the{" "}
                <span
                  style={{
                    backgroundImage: T.grad,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  Top {cohortSize}
                </span>
              </h1>
              <p
                style={{
                  marginTop: 20,
                  fontSize: 17,
                  color: T.muted,
                  lineHeight: 1.55,
                  maxWidth: 540,
                }}
              >
                {subText}
              </p>
              <div className="flex flex-wrap items-center" style={{ marginTop: 28, gap: 13 }}>
                {state === "guest" && (
                  <a
                    href="#"
                    className="inline-flex items-center justify-center"
                    style={{
                      gap: 10,
                      padding: "14px 26px",
                      borderRadius: 100,
                      border: "1px solid transparent",
                      fontSize: 16,
                      fontWeight: 700,
                      letterSpacing: "-0.01em",
                      textDecoration: "none",
                      color: "#04141A",
                      background: T.grad,
                      boxShadow: `0 0 42px -12px ${T.accentGlow}`,
                    }}
                  >
                    {I.wallet}
                    Check eligibility
                  </a>
                )}
                {state === "exhausted" && (
                  <Chip muted>
                    {I.trophy}
                    Sponsorship used
                  </Chip>
                )}
                {(state === "active" || state === "fresh") && (
                  <Chip>
                    {I.trophy}
                    Sponsorship active
                  </Chip>
                )}
              </div>
            </div>

            {/* Medal + rank badge */}
            <div style={{ flex: "none" }}>
              <div className="relative inline-flex" style={{ paddingBottom: 8 }}>
                <Medal />
                {showRank && data?.rank != null && (
                  <span
                    className="absolute inline-flex items-center"
                    style={{
                      left: "50%",
                      bottom: -8,
                      transform: "translateX(-50%)",
                      gap: 8,
                      padding: "8px 16px",
                      borderRadius: 100,
                      background: "rgba(8,12,14,0.94)",
                      border: `1px solid ${T.accentLine}`,
                      boxShadow: `0 8px 24px -8px #000, 0 0 26px -10px ${T.accentGlow}`,
                      fontFamily: T.mono,
                      fontSize: 14,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      backdropFilter: "blur(4px)",
                      color: T.text,
                    }}
                  >
                    <span style={{ color: T.accent, flex: "none" }}>{I.trophy}</span>
                    <b style={{ color: "#EAFEFF", fontWeight: 700 }}>#{data.rank}</b>
                    <span style={{ color: T.dim, fontWeight: 600, fontSize: 12.5 }}>
                      of {cohortSize}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* hero foot */}
          <div
            className="flex items-center justify-between"
            style={{
              marginTop: 40,
              paddingTop: 28,
              borderTop: `1px solid ${T.line}`,
              gap: 28,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: T.dim,
                  marginBottom: 8,
                }}
              >
                Sponsored on Tasmil Vault
              </div>
              <p
                style={{
                  fontSize: 13.5,
                  color: T.muted,
                  lineHeight: 1.5,
                  margin: 0,
                  maxWidth: 420,
                }}
              >
                Free gas on <b style={{ color: T.text, fontWeight: 600 }}>Farming</b> and{" "}
                <b style={{ color: T.text, fontWeight: 600 }}>AI Chat</b> across supported Stellar
                protocols.
              </p>
            </div>
            <ProtoStack />
          </div>
        </section>

        {/* USAGE TRACKER */}
        {showTracker && cfg && (
          <Section style={{ marginTop: 46 }}>
            <div style={{ ...cardStyle, padding: 30 }}>
              <div className="flex" style={{ gap: 0 }}>
                <UItem
                  label="Sponsored TXs"
                  value={`${used}`}
                  unit={`/ ${maxTx}`}
                  cyan
                  loading={state === "loading"}
                />
                <UItem
                  label="Per-tx cap"
                  value={cfg.maxXlmPerTx}
                  unit="XLM"
                  withBorder
                  loading={state === "loading"}
                />
                <UItem
                  label="Remaining"
                  value={remXlm}
                  unit="XLM"
                  withBorder
                  loading={state === "loading"}
                />
              </div>

              <div className="flex items-center" style={{ marginTop: 28, gap: 13 }}>
                {Array.from({ length: maxTx }, (_, i) => (
                  <i
                    key={i}
                    style={{
                      display: "block",
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: i < used ? T.grad : "rgba(255,255,255,0.06)",
                      border: i < used ? "1px solid transparent" : `1px solid ${T.line2}`,
                      boxShadow: i < used ? `0 0 12px -2px ${T.accentGlow}` : "none",
                      transition: "all .4s cubic-bezier(0.22,1,0.36,1)",
                    }}
                  />
                ))}
                <span style={{ marginLeft: "auto", fontSize: 12.5, color: T.dim }}>
                  {Math.max(0, maxTx - used)} remaining
                </span>
              </div>

              {used > 0 && data?.usage?.lastSponsoredAt && data.recentTxs[0] && (
                <div
                  className="flex items-center"
                  style={{
                    marginTop: 24,
                    paddingTop: 20,
                    borderTop: `1px solid ${T.line}`,
                    gap: 9,
                    fontSize: 13.5,
                    color: T.muted,
                  }}
                >
                  <span style={{ color: T.dim }}>{I.clock}</span>
                  <span>
                    Last sponsored TX:{" "}
                    <span style={{ fontFamily: T.mono, color: T.text }}>
                      {new Date(data.usage.lastSponsoredAt).toLocaleDateString()}
                    </span>
                    ,{" "}
                    <span style={{ fontFamily: T.mono, color: T.text }}>
                      {stroopsToXlm(data.recentTxs[0].feeStroops)} XLM
                    </span>
                  </span>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* RECENT TX */}
        {showRecent && cfg && (
          <Section style={{ marginTop: 46 }}>
            <SecEyebrow>Activity</SecEyebrow>
            <SecTitle>Recent sponsored transactions</SecTitle>
            <div
              className="flex flex-col"
              style={{ marginTop: 18, borderTop: `1px solid ${T.line}` }}
            >
              {data && data.recentTxs.length === 0 ? (
                <div
                  style={{
                    padding: "26px 4px",
                    fontSize: 14,
                    color: T.muted,
                    borderBottom: `1px solid ${T.line}`,
                  }}
                >
                  No sponsored transactions yet. Your first eligible TX will be covered
                  automatically.
                </div>
              ) : (
                data?.recentTxs.map((tx) => (
                  <div
                    key={tx.txHash}
                    className="flex items-center"
                    style={{
                      gap: 14,
                      padding: "15px 4px",
                      borderBottom: `1px solid ${T.line}`,
                    }}
                  >
                    <span
                      className="grid place-items-center"
                      style={{
                        flex: "none",
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        color: T.accent,
                        background: T.accentSoft,
                        border: `1px solid ${T.accentLine}`,
                      }}
                    >
                      {I.txDown}
                    </span>
                    <div className="flex flex-col" style={{ minWidth: 0, flex: 1, gap: 3 }}>
                      <span
                        style={{
                          fontSize: 14.5,
                          fontWeight: 600,
                          letterSpacing: "-0.01em",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {composeTxLabel(tx.action, tx.protocol, tx.asset, tx.poolLabel)}
                      </span>
                      <span
                        className="flex items-center"
                        style={{ gap: 8, fontSize: 12, color: T.dim }}
                      >
                        <span style={{ fontFamily: T.mono }}>{truncateHash(tx.txHash)}</span>
                        <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                      </span>
                    </div>
                    <div className="flex items-center" style={{ flex: "none", gap: 12 }}>
                      <span
                        style={{
                          fontFamily: T.mono,
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#EAFEFF",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {stroopsToXlm(tx.feeStroops)} XLM
                      </span>
                      <a
                        href={txExplorerUrl(cfg.network, tx.txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="View on Stellar Expert"
                        className="grid place-items-center transition-colors"
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          color: T.dim,
                          background: "rgba(255,255,255,0.04)",
                          border: `1px solid ${T.line2}`,
                        }}
                      >
                        {I.ext}
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Section>
        )}

        {/* HOW IT WORKS */}
        <Section style={{ marginTop: 46 }}>
          <SecEyebrow>How it works</SecEyebrow>
          <SecTitle>A passive perk, nothing to claim</SecTitle>
          <div
            className="grid"
            style={{ marginTop: 24, gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}
          >
            {HOW_IT_WORKS(cohortSize).map((s) => (
              <div
                key={s.num}
                className="flex flex-col"
                style={{ ...cardStyle, padding: "24px 22px", gap: 12 }}
              >
                <span
                  style={{
                    fontFamily: T.mono,
                    fontSize: 13,
                    fontWeight: 700,
                    color: T.accent,
                    letterSpacing: "0.04em",
                  }}
                >
                  {s.num}
                </span>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {s.h}
                </span>
                <span style={{ fontSize: 14, color: T.muted, lineHeight: 1.55 }}>{s.b}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* LIMITS */}
        <Section style={{ marginTop: 46 }}>
          <SecEyebrow>The fine print</SecEyebrow>
          <SecTitle>Limits and rules</SecTitle>
          <div style={{ ...cardStyle, padding: "28px 30px", marginTop: 24 }}>
            <div
              className="flex items-center"
              style={{
                gap: 10,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: T.dim,
                marginBottom: 8,
              }}
            >
              What you get
              <span style={{ flex: 1, height: 1, background: T.line }} />
            </div>
            <div className="flex flex-col">
              {cfg &&
                TERMS(cohortSize, cfg.maxTxPerUser, cfg.maxXlmPerTx, cfg.totalCapXlm).map(
                  (t, i) => (
                    <div
                      key={i}
                      className="flex items-start"
                      style={{
                        gap: 14,
                        padding: "14px 2px",
                        borderTop: i === 0 ? undefined : `1px solid ${T.line}`,
                      }}
                    >
                      <span
                        className="grid place-items-center"
                        style={{
                          flex: "none",
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          marginTop: 1,
                          background: t.kind === "ok" ? T.accentSoft : T.goldSoft,
                          border: `1px solid ${t.kind === "ok" ? T.accentLine : T.goldLine}`,
                          color: t.kind === "ok" ? T.accent : T.gold,
                        }}
                      >
                        {t.kind === "ok" ? I.tickOk : I.tickWarn}
                      </span>
                      <div
                        style={{
                          minWidth: 0,
                          fontSize: 14.5,
                          lineHeight: 1.5,
                          color: T.muted,
                        }}
                      >
                        {t.b}
                      </div>
                    </div>
                  )
                )}
            </div>
          </div>
        </Section>

        {/* FAQ */}
        <Section style={{ marginTop: 46 }}>
          <SecEyebrow>Questions</SecEyebrow>
          <SecTitle>Frequently asked</SecTitle>
          <FaqAccordion />
        </Section>

        {/* FOOTER CTA */}
        <Section style={{ marginTop: 46 }}>
          <div
            className="flex flex-col items-center"
            style={{
              ...cardStyle,
              padding: "36px 32px",
              textAlign: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                fontSize: 21,
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              Your gas fees are on us
            </div>
            <p
              style={{
                fontSize: 14.5,
                color: T.muted,
                maxWidth: 440,
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              Nothing to activate. Keep using Tasmil and your eligible transactions stay covered.
            </p>
            <div className="flex flex-col items-center" style={{ marginTop: 8, gap: 14 }}>
              <Link
                href="/chat"
                className="inline-flex items-center justify-center"
                style={{
                  gap: 10,
                  padding: "14px 26px",
                  borderRadius: 100,
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  textDecoration: "none",
                  color: "#04141A",
                  background: T.grad,
                  boxShadow: `0 0 42px -12px ${T.accentGlow}`,
                }}
              >
                Start Earning Yield
                {I.arr}
              </Link>
              <Link
                href="/rewards/welcome"
                className="inline-flex items-center"
                style={{
                  gap: 6,
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: T.muted,
                  textDecoration: "none",
                }}
              >
                See all rewards <span style={{ display: "inline-flex" }}>›</span>
              </Link>
            </div>
          </div>
        </Section>
      </div>
    </main>
  );
}

// ───────────────────────── helpers ─────────────────────────

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

// ───────────────────────── leaf components ─────────────────────────

function SecEyebrow({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className="inline-flex items-center"
      style={{
        gap: 11,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: T.accent,
        marginBottom: 18,
        ...style,
      }}
    >
      <span style={{ width: 24, height: 1, background: T.accent, opacity: 0.55 }} />
      {children}
    </span>
  );
}

function SecTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: 24,
        fontWeight: 800,
        letterSpacing: "-0.03em",
        lineHeight: 1.1,
        margin: 0,
      }}
    >
      {children}
    </h2>
  );
}

function Section({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <section style={{ scrollMarginTop: 80, ...style }}>{children}</section>;
}

function Chip({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span
      className="inline-flex items-center"
      style={{
        gap: 9,
        padding: "11px 17px",
        borderRadius: 100,
        fontSize: 13.5,
        fontWeight: 700,
        letterSpacing: "-0.01em",
        whiteSpace: "nowrap",
        color: muted ? T.muted : T.accent,
        background: muted ? "rgba(255,255,255,0.05)" : T.accentSoft,
        border: `1px solid ${muted ? T.line2 : T.accentLine}`,
      }}
    >
      {children}
    </span>
  );
}

function UItem({
  label,
  value,
  unit,
  cyan,
  withBorder,
  loading,
}: {
  label: string;
  value: string;
  unit?: string;
  cyan?: boolean;
  withBorder?: boolean;
  loading?: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        padding: withBorder ? "0 22px" : "0 22px 0 0",
        paddingLeft: withBorder ? 22 : 0,
        borderLeft: withBorder ? `1px solid ${T.line}` : undefined,
      }}
    >
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: T.dim,
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 8,
          fontFamily: T.mono,
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          color: loading ? "transparent" : cyan ? "#EAFEFF" : T.text,
          background: loading
            ? "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 37%, rgba(255,255,255,0.04) 63%)"
            : undefined,
          backgroundSize: loading ? "400% 100%" : undefined,
          animation: loading ? "shimmer 1.4s linear infinite" : undefined,
          borderRadius: loading ? 8 : undefined,
          display: "inline-block",
          minWidth: loading ? 60 : undefined,
        }}
      >
        {value}
        {unit && (
          <span
            style={{
              fontSize: 14,
              color: T.dim,
              fontWeight: 600,
              marginLeft: 4,
            }}
          >
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function Medal() {
  return (
    <div className="relative grid place-items-center">
      <span
        className="absolute pointer-events-none"
        style={{
          inset: -24,
          borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(103,232,249,0.50), transparent 72%)",
          opacity: 0.4,
          filter: "blur(6px)",
          zIndex: -1,
        }}
      />
      <div
        className="relative grid place-items-center"
        style={{
          width: 118,
          height: 118,
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
            width: 90,
            height: 90,
            borderRadius: "50%",
            background: "radial-gradient(circle at 50% 32%, #0c1418, #070a0c 78%)",
            boxShadow: "inset 0 2px 10px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(103,232,249,0.22)",
          }}
        >
          <Image
            src="/protocols/tasmil.svg"
            alt="Tasmil Finance"
            width={54}
            height={54}
            style={{
              width: 54,
              height: "auto",
              filter: "drop-shadow(0 0 10px rgba(103,232,249,0.40))",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function ProtoStack() {
  return (
    <div className="flex items-center" style={{ paddingTop: 2 }}>
      {PROTOS.map((p, i) => (
        <a
          key={p.name}
          href={p.href}
          target={p.href.startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
          className="relative block transition-transform hover:-translate-y-[7px] hover:z-30"
          style={{
            width: 42,
            height: 42,
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
            width={38}
            height={38}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              objectFit: p.isTasmil ? "contain" : "cover",
              padding: p.isTasmil ? 8 : 0,
            }}
          />
        </a>
      ))}
    </div>
  );
}

function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="flex flex-col" style={{ marginTop: 20, borderTop: `1px solid ${T.line}` }}>
      {FAQ.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i} style={{ borderBottom: `1px solid ${T.line}` }}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between transition-colors hover:text-cyan-300"
              style={{
                gap: 16,
                padding: "20px 4px",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: T.font,
                fontSize: 16,
                fontWeight: 600,
                color: T.text,
                textAlign: "left",
                letterSpacing: "-0.01em",
              }}
            >
              {item.q}
              <span
                style={{
                  width: 20,
                  height: 20,
                  flex: "none",
                  position: "relative",
                  display: "inline-block",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    background: T.accent,
                    borderRadius: 2,
                    left: "50%",
                    top: 3,
                    bottom: 3,
                    width: 2,
                    transform: `translateX(-50%) ${isOpen ? "scaleY(0)" : ""}`,
                    transition: "transform .3s cubic-bezier(0.22,1,0.36,1)",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    background: T.accent,
                    borderRadius: 2,
                    top: "50%",
                    left: 3,
                    right: 3,
                    height: 2,
                    transform: "translateY(-50%)",
                  }}
                />
              </span>
            </button>
            <div
              style={{
                maxHeight: isOpen ? 320 : 0,
                overflow: "hidden",
                transition: "max-height .35s cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              <div
                style={{
                  padding: "0 4px 22px",
                  fontSize: 14.5,
                  color: T.muted,
                  lineHeight: 1.6,
                  maxWidth: 600,
                }}
              >
                {item.a}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
