"use client";
import React, { useEffect, useRef } from "react";

export default function Footer() {
  const colsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = colsRef.current;
    if (!el) return;
    const t = setTimeout(() => el.classList.add("in"), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {/* .footer: position:relative; padding:96px 0 0; overflow:hidden; background:#000; min-height:clamp(680px,72vw,960px) */}
      {/* ::before: top border gradient line with glow */}
      <footer
        className="relative overflow-hidden bg-black"
        style={{
          padding: "96px 0 0",
          minHeight: "clamp(680px,72vw,960px)",
        }}
      >
        {/* ::before top line */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 right-0 top-0 h-[2px]"
          style={{
            background: "linear-gradient(90deg,transparent,var(--accent) 50%,transparent)",
            boxShadow: "0 0 8px var(--accent-glow)",
          }}
        />

        {/* .wrap: max-width:var(--maxw); margin:0 auto; padding-inline:var(--gutter) */}
        <div className="mx-auto w-full" style={{ maxWidth: "var(--maxw)", paddingInline: "var(--gutter)" }}>
          {/* .foot-grid: grid 1.8fr 1fr 1fr 1fr; gap:clamp(32px,4vw,60px); z-index:2
             @media(max-width:1000px): grid-cols:1fr 1fr 1fr
             @media(max-width:780px): grid-cols:1fr 1fr
             @media(max-width:480px): grid-cols:1fr */}
          <div
            className="relative z-[2] grid [grid-template-columns:1.8fr_1fr_1fr_1fr] max-[1000px]:[grid-template-columns:1fr_1fr_1fr] max-[780px]:grid-cols-2 max-[480px]:grid-cols-1"
            style={{ gap: "clamp(32px,4vw,60px)" }}
          >
            {/* .foot-brand: flex col; align-items:flex-start; gap:22px; max-width:340px
                 @media(max-width:1000px): grid-column:1 / -1; max-width:420px */}
            <div
              className="flex flex-col items-start gap-[22px] max-w-[340px] max-[1000px]:[grid-column:1_/_-1] max-[1000px]:max-w-[420px]"
            >
              {/* .brand (footer variant): flex; align-items:center; gap:15px; font-weight:700; font-size:30px; letter-spacing:-0.03em */}
              {/* .brand-name: gradient text */}
              {/* .mk (footer): width:48px; height:48px */}
              <a
                href="/quest"
                className="flex items-center gap-[15px] font-bold no-underline"
                style={{ fontSize: "30px", letterSpacing: "-0.03em" }}
              >
                <img
                  src="/tasmil-tf-logo.png"
                  alt=""
                  className="flex-none"
                  style={{ width: "48px", height: "48px" }}
                />
                <span
                  style={{
                    background: "linear-gradient(100deg,#fff 0%,var(--accent) 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  Tasmil Quest
                </span>
              </a>
              {/* .foot-desc: font-size:16.5px; line-height:1.62; color:rgba(244,247,251,0.82) */}
              <p className="text-[16.5px] leading-[1.62]" style={{ color: "rgba(244,247,251,0.82)" }}>
                An automated DeFi yield protocol on Stellar. Deposit USDC or XLM, pick a risk level,
                and Tasmil Finance rebalances across the best protocols, non-custodial.
              </p>
            </div>

            {/* .foot-col: flex flex-col; gap:16px */}
            <div className="flex flex-col gap-4">
              {/* .foot-head: font-size:12.5px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; color:var(--accent); margin-bottom:4px */}
              <div
                className="mb-1 text-[12.5px] font-bold uppercase tracking-[0.2em] text-quest-accent"
              >
                Quest
              </div>
              {/* .foot-col a: font-size:15px; color:rgba(244,247,251,0.78); transition:color .25s */}
              <a href="/quest" className="text-[15px] transition-colors duration-[250ms] hover:text-quest-text" style={{ color: "rgba(244,247,251,0.78)" }}>Explore</a>
              <a href="/quest/campaigns" className="text-[15px] transition-colors duration-[250ms] hover:text-quest-text" style={{ color: "rgba(244,247,251,0.78)" }}>Campaigns</a>
              <a href="/quest/leaderboard" className="text-[15px] transition-colors duration-[250ms] hover:text-quest-text" style={{ color: "rgba(244,247,251,0.78)" }}>Leaderboard</a>
              <a href="/quest/profile" className="text-[15px] transition-colors duration-[250ms] hover:text-quest-text" style={{ color: "rgba(244,247,251,0.78)" }}>Profile</a>
            </div>

            <div className="flex flex-col gap-4">
              <div className="mb-1 text-[12.5px] font-bold uppercase tracking-[0.2em] text-quest-accent">Protocols</div>
              <a href="https://blend.finance" target="_blank" rel="noopener" className="text-[15px] transition-colors duration-[250ms] hover:text-quest-text" style={{ color: "rgba(244,247,251,0.78)" }}>Blend</a>
              <a href="https://soroswap.io" target="_blank" rel="noopener" className="text-[15px] transition-colors duration-[250ms] hover:text-quest-text" style={{ color: "rgba(244,247,251,0.78)" }}>Soroswap</a>
              <a href="https://aquarius.finance" target="_blank" rel="noopener" className="text-[15px] transition-colors duration-[250ms] hover:text-quest-text" style={{ color: "rgba(244,247,251,0.78)" }}>Aquarius</a>
              <a href="https://phoenixdefi.io" target="_blank" rel="noopener" className="text-[15px] transition-colors duration-[250ms] hover:text-quest-text" style={{ color: "rgba(244,247,251,0.78)" }}>Phoenix</a>
            </div>

            <div className="flex flex-col gap-4">
              <div className="mb-1 text-[12.5px] font-bold uppercase tracking-[0.2em] text-quest-accent">Network</div>
              <a href="https://stellar.org" target="_blank" rel="noopener" className="text-[15px] transition-colors duration-[250ms] hover:text-quest-text" style={{ color: "rgba(244,247,251,0.78)" }}>Stellar</a>
              <a href="https://soroban.stellar.org" target="_blank" rel="noopener" className="text-[15px] transition-colors duration-[250ms] hover:text-quest-text" style={{ color: "rgba(244,247,251,0.78)" }}>Soroban</a>
              <a href="https://stellar.expert" target="_blank" rel="noopener" className="text-[15px] transition-colors duration-[250ms] hover:text-quest-text" style={{ color: "rgba(244,247,251,0.78)" }}>Stellar Expert</a>
            </div>
          </div>
        </div>

        {/* .foot-aurora: position:absolute; inset:0; z-index:0; overflow:hidden; pointer-events:none; background:#000 */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-black">
          {/* .fa-cols: position:absolute; inset:0; display:flex */}
          {/* .fa-col: flex:1; position:relative */}
          {/* .fa-col::before: absolute; left/right/bottom:0; height:var(--h); gradient; scaleY(0) -> scaleY(1) on .in */}
          <div className="absolute inset-0 flex fa-cols" ref={colsRef}>
            <span className="fa-col relative flex-1" style={{ "--h": "30%" } as React.CSSProperties} />
            <span className="fa-col relative flex-1" style={{ "--h": "46%" } as React.CSSProperties} />
            <span className="fa-col relative flex-1" style={{ "--h": "60%" } as React.CSSProperties} />
            <span className="fa-col relative flex-1" style={{ "--h": "72%" } as React.CSSProperties} />
            <span className="fa-col relative flex-1" style={{ "--h": "60%" } as React.CSSProperties} />
            <span className="fa-col relative flex-1" style={{ "--h": "46%" } as React.CSSProperties} />
            <span className="fa-col relative flex-1" style={{ "--h": "30%" } as React.CSSProperties} />
          </div>
        </div>

        {/* second .wrap block */}
        <div className="mx-auto w-full" style={{ maxWidth: "var(--maxw)", paddingInline: "var(--gutter)" }}>
          {/* .fa-top: position:relative; z-index:2; margin-top:clamp(60px,9vw,128px); flex col; gap:15px */}
          <div
            className="relative z-[2] flex flex-col gap-[15px]"
            style={{ marginTop: "clamp(60px,9vw,128px)" }}
          >
            {/* .fa-social: flex; gap:10px */}
            <div className="flex gap-[10px]">
              {/* .fa-ic: width:34px; height:34px; border-radius:9px; grid place-items-center; bg rgba(255,255,255,0.06); border:1px solid var(--line-2); color:var(--text); hover:color:accent, bg:accent-soft */}
              <a
                href="https://x.com/tasmilfinance"
                target="_blank"
                rel="noopener"
                aria-label="X"
                className="grid place-items-center rounded-[9px] border border-quest-line-2 bg-white/[0.06] text-quest-text transition-colors duration-[250ms] hover:border-quest-accent-line hover:bg-[var(--accent-soft)] hover:text-quest-accent"
                style={{ width: "34px", height: "34px" }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ width: "17px", height: "17px" }}>
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>

            {/* .fa-copy: font-family:var(--mono); font-size:15px; color:var(--muted); line-height:1.6 */}
            {/* .fa-disc: display:block; color:var(--dim); font-size:14px; max-width:560px; margin-top:3px */}
            <div
              className="text-[15px] leading-[1.6] text-quest-muted"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              &copy; 2026 Tasmil Finance. All rights reserved.
              <span
                className="mt-[3px] block text-[14px] text-quest-dim"
                style={{ maxWidth: "560px" }}
              >
                For informational purposes only, not financial advice. DeFi yields are variable and capital is at risk.
              </span>
            </div>
          </div>

          {/* .fa-mark: absolute; left/right:0; bottom:clamp(14px,3.5%,46px); z-index:2; text-align:center; white-space:nowrap;
               font-size:11.6vw; font-weight:700; letter-spacing:-0.01em; line-height:0.86; text-transform:uppercase;
               color:rgba(255,255,255,0.96); text-shadow:0 2px 44px rgba(0,18,28,0.5); pointer-events:none */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 right-0 z-[2] text-center font-bold uppercase"
            style={{
              bottom: "clamp(14px,3.5%,46px)",
              whiteSpace: "nowrap",
              fontSize: "11.6vw",
              letterSpacing: "-0.01em",
              lineHeight: "0.86",
              color: "rgba(255,255,255,0.96)",
              textShadow: "0 2px 44px rgba(0,18,28,0.5)",
            }}
          >
            <b>Tasmil</b> Finance
          </div>
        </div>
      </footer>
    </>
  );
}
