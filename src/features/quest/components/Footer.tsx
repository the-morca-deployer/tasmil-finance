// @ts-nocheck
import { useEffect, useRef } from "react";

export default function Footer() {
  const colsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = colsRef.current;
    if (el) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            el.classList.add("in");
            observer.disconnect();
          }
        },
        { threshold: 0.1 },
      );
      observer.observe(el);
      return () => observer.disconnect();
    }
  }, []);

  return (
    <>
      <footer className="footer">
        <div className="wrap">
          <div className="foot-grid">
            <div className="foot-brand">
              <a className="brand" href="/quest">
                <img className="mk" src="/tasmil-logo.png" alt="Tasmil Finance" width="40" height="40" />
                <span className="brand-name">Tasmil Finance</span>
              </a>
              <p className="foot-desc">
                An automated DeFi yield protocol on Stellar. Deposit USDC or XLM, pick a risk level,
                and Tasmil Finance rebalances across the best protocols, non-custodial.
              </p>
            </div>

            <div className="foot-col">
              <div className="foot-head">Quest</div>
              <a href="/quest">Explore</a>
              <a href="/quest/campaigns">Campaigns</a>
              <a href="/quest/leaderboard">Leaderboard</a>
              <a href="/quest/profile">Profile</a>
            </div>

            <div className="foot-col">
              <div className="foot-head">Protocols</div>
              <a href="https://blend.finance" target="_blank" rel="noopener">Blend</a>
              <a href="https://soroswap.io" target="_blank" rel="noopener">Soroswap</a>
              <a href="https://aquarius.finance" target="_blank" rel="noopener">Aquarius</a>
              <a href="https://phoenixdefi.io" target="_blank" rel="noopener">Phoenix</a>
            </div>

            <div className="foot-col">
              <div className="foot-head">Network</div>
              <a href="https://stellar.org" target="_blank" rel="noopener">Stellar</a>
              <a href="https://soroban.stellar.org" target="_blank" rel="noopener">Soroban</a>
              <a href="https://stellar.expert" target="_blank" rel="noopener">Stellar Expert</a>
            </div>
          </div>
        </div>

        <div className="foot-aurora">
          <div className="fa-cols" ref={colsRef}>
            <span className="fa-col" style={{ "--h": "30%" } as any}></span>
            <span className="fa-col" style={{ "--h": "46%" } as any}></span>
            <span className="fa-col" style={{ "--h": "60%" } as any}></span>
            <span className="fa-col" style={{ "--h": "72%" } as any}></span>
            <span className="fa-col" style={{ "--h": "60%" } as any}></span>
            <span className="fa-col" style={{ "--h": "46%" } as any}></span>
            <span className="fa-col" style={{ "--h": "30%" } as any}></span>
          </div>
          <div className="fa-grain"></div>
        </div>

        <div className="wrap">
          <div className="fa-top">
            <div className="fa-social">
              <a className="fa-ic" href="https://x.com/tasmilfinance" target="_blank" rel="noopener" aria-label="X">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                </svg>
              </a>
            </div>
            <div className="fa-copy">
              &copy; 2026 Tasmil Finance. All rights reserved.
              <span className="fa-disc">
                For informational purposes only, not financial advice. DeFi yields are variable and capital is at risk.
              </span>
            </div>
          </div>
          <div className="fa-mark" aria-hidden="true">
            <b>Tasmil</b> Finance
          </div>
        </div>
      </footer>
    </>
  );
}
