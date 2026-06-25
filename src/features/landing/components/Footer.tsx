export default function Footer() {
  const auroraCols: Array<{ h: string; delay: string }> = [
    { h: "30%", delay: "0s" },
    { h: "46%", delay: "0.07s" },
    { h: "60%", delay: "0.14s" },
    { h: "72%", delay: "0.21s" },
    { h: "60%", delay: "0.18s" },
    { h: "46%", delay: "0.11s" },
    { h: "30%", delay: "0.05s" },
  ];

  return (
    <>
      <footer
        className={[
          "relative overflow-hidden bg-black pt-[96px]",
          "[min-height:clamp(680px,72vw,960px)]",
          "max-[600px]:[min-height:auto] max-[600px]:pb-[46px]",
        ].join(" ")}
      >
        {/* top border accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] [background:linear-gradient(90deg,transparent,var(--accent)_50%,transparent)] [box-shadow:0_0_8px_var(--accent-glow)]" />

        {/* aurora background layer — position:absolute so it's behind the content z-layers */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-black">
          {/* fa-cols: KEEP class — JS querySelector(".fa-cols") depends on it; group for data-in Tailwind variants */}
          <div className="fa-cols group absolute inset-0 flex" data-in="false">
            {auroraCols.map((col, i) => (
              <span
                key={i}
                className="fa-col flex-1 relative"
                style={
                  {
                    "--h": col.h,
                    "--delay": col.delay,
                  } as React.CSSProperties
                }
              >
                {/* aurora bar: rises from bottom when data-in=true */}
                <span
                  className={[
                    "absolute left-0 right-0 bottom-0",
                    "[height:var(--h,85%)]",
                    "[background:linear-gradient(to_top,#e0fbff_0%,#a5f3fc_12%,#67e8f9_30%,#0ea5e9_52%,#0369a1_72%,#04243a_88%,transparent_100%)]",
                    "[transform-origin:bottom]",
                    "scale-y-0",
                    "[transition:transform_1.05s_cubic-bezier(0.16,1,0.3,1)]",
                    "[transition-delay:var(--delay,0s)]",
                    "group-data-[in=true]:scale-y-100",
                    "motion-reduce:transform-none motion-reduce:transition-none",
                  ].join(" ")}
                />
              </span>
            ))}
          </div>
          {/* noise grain overlay */}
          <div
            className={[
              "fa-grain absolute inset-0 pointer-events-none opacity-60 mix-blend-multiply",
              "[background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")]",
              "[background-size:200px_200px]",
            ].join(" ")}
          />
        </div>

        {/* brand + links grid */}
        <div className="relative z-[2] max-w-[var(--maxw)] mx-auto px-[var(--gutter)]">
          <div
            className={[
              "grid relative z-[2]",
              "[grid-template-columns:1.8fr_1fr_1fr_1fr]",
              "[gap:clamp(32px,4vw,60px)]",
              "max-[1000px]:[grid-template-columns:1fr_1fr_1fr]",
              "max-[600px]:[grid-template-columns:1fr_1fr] max-[600px]:[gap:34px_24px]",
            ].join(" ")}
          >
            {/* brand column — KEEP .brand/.mk/.brand-name classes (shared global CSS) */}
            <div
              className={[
                "flex flex-col items-start gap-[22px] max-w-[340px]",
                "max-[1000px]:[grid-column:1_/_-1] max-[1000px]:max-w-[420px]",
                "max-[600px]:[grid-column:1_/_-1]",
              ].join(" ")}
            >
              {/* .foot-brand .brand tweak: margin:0, font-size:26px, gap:15px */}
              {/* .foot-brand .mk tweak: width:48px, height:48px */}
              <a className="brand m-0 !text-[26px] !gap-[15px]" href="#top">
                <img
                  className="mk !w-[48px] !h-[48px]"
                  src="/tasmil-logo.png"
                  alt="Tasmil Finance"
                  width="40"
                  height="40"
                />
                <span className="brand-name">Tasmil Finance</span>
              </a>
              <p className="text-[16.5px] leading-[1.62] text-[rgba(244,247,251,0.82)]">
                An automated DeFi yield protocol on Stellar. Deposit USDC or XLM, pick a risk
                level, and Tasmil Finance rebalances across the best protocols, non-custodial.
              </p>
            </div>

            {/* Product column */}
            <div className="flex flex-col gap-4">
              <div className="text-[12.5px] font-bold tracking-[0.2em] uppercase text-[var(--accent)] mb-1">
                Product
              </div>
              {[
                { href: "#features", label: "How it works" },
                { href: "#converge", label: "One vault" },
                { href: "#security", label: "Security" },
                { href: "#fees", label: "Fees" },
                { href: "#faq", label: "FAQ" },
                { href: "/waitlist", label: "Join waitlist" },
                { href: "/access", label: "Have a code?" },
              ].map(({ href, label }) => (
                <a
                  key={href + label}
                  className="text-[15px] text-[rgba(244,247,251,0.78)] transition-colors duration-[250ms] hover:text-[var(--text)]"
                  href={href}
                >
                  {label}
                </a>
              ))}
            </div>

            {/* Protocols column */}
            <div className="flex flex-col gap-4">
              <div className="text-[12.5px] font-bold tracking-[0.2em] uppercase text-[var(--accent)] mb-1">
                Protocols
              </div>
              {["Blend", "Soroswap", "Aquarius", "Phoenix", "Allbridge"].map((name) => (
                <a
                  key={name}
                  className="text-[15px] text-[rgba(244,247,251,0.78)] transition-colors duration-[250ms] hover:text-[var(--text)]"
                  href="#partners"
                >
                  {name}
                </a>
              ))}
            </div>

            {/* Network column */}
            <div className="flex flex-col gap-4">
              <div className="text-[12.5px] font-bold tracking-[0.2em] uppercase text-[var(--accent)] mb-1">
                Network
              </div>
              {[
                { href: "https://stellar.org", label: "Stellar" },
                { href: "https://soroban.stellar.org", label: "Soroban" },
                { href: "https://stellar.expert", label: "Stellar Expert" },
              ].map(({ href, label }) => (
                <a
                  key={label}
                  className="text-[15px] text-[rgba(244,247,251,0.78)] transition-colors duration-[250ms] hover:text-[var(--text)]"
                  href={href}
                  target="_blank"
                  rel="noopener"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* social + copy + wordmark — wrapper is NON-positioned (matches legacy .wrap) so
            the absolute .fa-mark resolves its containing block to <footer>, not this box */}
        <div className="max-w-[var(--maxw)] mx-auto px-[var(--gutter)]">
          <div
            className={[
              "relative z-[2]",
              "[margin-top:clamp(60px,9vw,128px)]",
              "flex flex-col gap-[15px]",
              "max-[600px]:mt-[54px]",
            ].join(" ")}
          >
            {/* social icons */}
            <div className="flex gap-[10px]">
              <a
                className={[
                  "w-[34px] h-[34px] rounded-[9px] grid place-items-center",
                  "bg-white/[0.06] border border-[var(--line-2)] text-[var(--text)]",
                  "transition-[color,border-color,background] duration-[250ms]",
                  "hover:text-[var(--accent)] hover:bg-[var(--accent-soft)]",
                ].join(" ")}
                href="https://x.com"
                target="_blank"
                rel="noopener"
                aria-label="X"
              >
                <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                className={[
                  "w-[34px] h-[34px] rounded-[9px] grid place-items-center",
                  "bg-white/[0.06] border border-[var(--line-2)] text-[var(--text)]",
                  "transition-[color,border-color,background] duration-[250ms]",
                  "hover:text-[var(--accent)] hover:bg-[var(--accent-soft)]",
                ].join(" ")}
                href="#"
                aria-label="Telegram"
              >
                <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M9.04 15.29l-.37 5.2c.53 0 .76-.23 1.04-.5l2.5-2.4 5.18 3.79c.95.52 1.62.25 1.88-.88l3.4-15.94c.3-1.4-.51-1.95-1.43-1.6L1.13 9.86C-.24 10.4-.22 11.18.9 11.52l5.05 1.57L17.6 5.74c.55-.36 1.05-.16.64.2L9.04 15.29z" />
                </svg>
              </a>
              <a
                className={[
                  "w-[34px] h-[34px] rounded-[9px] grid place-items-center",
                  "bg-white/[0.06] border border-[var(--line-2)] text-[var(--text)]",
                  "transition-[color,border-color,background] duration-[250ms]",
                  "hover:text-[var(--accent)] hover:bg-[var(--accent-soft)]",
                ].join(" ")}
                href="#"
                aria-label="Discord"
              >
                <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M19.3 5.3A16 16 0 0 0 15.4 4l-.24.5a12 12 0 0 1 3.3 1.6 11 11 0 0 0-9 0A12 12 0 0 1 12.8 4.5L12.6 4a16 16 0 0 0-3.9 1.3C5.6 9 4.8 12.6 5.2 16.2a16 16 0 0 0 4.9 2.4l.6-.9a10 10 0 0 1-1.6-.8l.4-.3a11 11 0 0 0 9 0l.4.3a10 10 0 0 1-1.6.8l.6.9a16 16 0 0 0 4.9-2.4c.5-4.6-.9-8.2-3.6-10.9zM9.8 14.2c-.9 0-1.6-.9-1.6-1.9s.7-1.9 1.6-1.9 1.6.9 1.6 1.9-.7 1.9-1.6 1.9zm4.4 0c-.9 0-1.6-.9-1.6-1.9s.7-1.9 1.6-1.9 1.6.9 1.6 1.9-.7 1.9-1.6 1.9z" />
                </svg>
              </a>
            </div>

            {/* copy + disclaimer */}
            <div className="font-[var(--mono)] text-[12.5px] text-[var(--muted)] leading-[1.6]">
              © 2026 Tasmil Finance. All rights reserved.
              <span className="block text-[var(--dim)] text-[11.5px] max-w-[560px] mt-[3px]">
                For informational purposes only, not financial advice. DeFi yields are variable and
                capital is at risk.
              </span>
            </div>
          </div>

          {/* ghost wordmark — KEEP .fa-mark class (JS IntersectionObserver observes this element) */}
          <div
            className={[
              "fa-mark absolute left-0 right-0 z-[2]",
              "[bottom:clamp(14px,3.5%,46px)]",
              "text-center whitespace-nowrap pointer-events-none",
              "text-[11.6vw] font-bold tracking-[-0.01em] leading-[0.86] uppercase",
              "text-[rgba(255,255,255,0.96)] [text-shadow:0_2px_44px_rgba(0,18,28,0.5)]",
              "max-[600px]:static max-[600px]:mt-[36px] max-[600px]:text-[14vw]",
              "max-[600px]:leading-[0.92] max-[600px]:whitespace-normal",
            ].join(" ")}
            aria-hidden="true"
          >
            <b>Tasmil</b> Finance
          </div>
        </div>
      </footer>
    </>
  );
}
