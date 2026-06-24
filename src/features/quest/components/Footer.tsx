"use client";

import Image from "next/image";
import Link from "next/link";

const LINKS = {
  website: "https://tasmil-finance.xyz",
  docs: "https://tasmil-user-docs.vercel.app/docs",
  x: "https://x.com/tasmilfinance",
  telegram: "https://t.me/tasmilfinance",
  discord: "https://discord.gg/tasmil",
  stellar: "https://stellar.org",
  soroban: "https://soroban.stellar.org",
  stellarExpert: "https://stellar.expert",
};

const Footer: React.FC = () => {
  return (
    <footer className="qf">
      {/* Top: 4-column grid matching landing page */}
      <div className="qf-wrap">
        <div className="qf-grid">
          {/* Brand */}
          <div className="qf-brand-col">
            <Link href="/quest" className="qf-brand">
              <Image src="/tasmil-logo.png" alt="Tasmil Finance" width={40} height={40} />
              <span className="qf-brand-name">Tasmil Finance</span>
            </Link>
            <p className="qf-brand-desc">
              An automated DeFi yield protocol on Stellar. Deposit USDC or XLM,
              pick a risk level, and Tasmil Finance rebalances across the best
              protocols, non-custodial.
            </p>
          </div>

          {/* Quest */}
          <div className="qf-col">
            <div className="qf-col-head">Quest</div>
            <Link href="/quest">Explore</Link>
            <Link href="/quest/campaigns">Campaigns</Link>
            <Link href="/quest/leaderboard">Leaderboard</Link>
            <Link href="/quest/profile">Profile</Link>
          </div>

          {/* Protocols */}
          <div className="qf-col">
            <div className="qf-col-head">Protocols</div>
            <a href="https://blend.finance" target="_blank" rel="noopener">Blend</a>
            <a href="https://soroswap.io" target="_blank" rel="noopener">Soroswap</a>
            <a href="https://aquarius.finance" target="_blank" rel="noopener">Aquarius</a>
            <a href="https://phoenixdefi.io" target="_blank" rel="noopener">Phoenix</a>
          </div>

          {/* Network */}
          <div className="qf-col">
            <div className="qf-col-head">Network</div>
            <a href={LINKS.stellar} target="_blank" rel="noopener">Stellar</a>
            <a href={LINKS.soroban} target="_blank" rel="noopener">Soroban</a>
            <a href={LINKS.stellarExpert} target="_blank" rel="noopener">Stellar Expert</a>
          </div>
        </div>
      </div>

      {/* Aurora watermark */}
      <div className="qf-mark" aria-hidden="true">
        <b>Tasmil</b> Finance
      </div>

      {/* Bottom: social + copyright + disclaimer */}
      <div className="qf-wrap qf-bottom-wrap">
        <div className="qf-bottom">
          <div className="qf-social">
            <a href={LINKS.x} target="_blank" rel="noopener" aria-label="X" className="qf-social-ic">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href={LINKS.telegram} target="_blank" rel="noopener" aria-label="Telegram" className="qf-social-ic">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M9.04 15.29l-.37 5.2c.53 0 .76-.23 1.04-.5l2.5-2.4 5.18 3.79c.95.52 1.62.25 1.88-.88l3.4-15.94c.3-1.4-.51-1.95-1.43-1.6L1.13 9.86C-.24 10.4-.22 11.18.9 11.52l5.05 1.57L17.6 5.74c.55-.36 1.05-.16.64.2L9.04 15.29z" />
              </svg>
            </a>
            <a href={LINKS.discord} target="_blank" rel="noopener" aria-label="Discord" className="qf-social-ic">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M19.3 5.3A16 16 0 0 0 15.4 4l-.24.5a12 12 0 0 1 3.3 1.6 11 11 0 0 0-9 0A12 12 0 0 1 12.8 4.5L12.6 4a16 16 0 0 0-3.9 1.3C5.6 9 4.8 12.6 5.2 16.2a16 16 0 0 0 4.9 2.4l.6-.9a10 10 0 0 1-1.6-.8l.4-.3a11 11 0 0 0 9 0l.4.3a10 10 0 0 1-1.6.8l.6.9a16 16 0 0 0 4.9-2.4c.5-4.6-.9-8.2-3.6-10.9zM9.8 14.2c-.9 0-1.6-.9-1.6-1.9s.7-1.9 1.6-1.9 1.6.9 1.6 1.9-.7 1.9-1.6 1.9zm4.4 0c-.9 0-1.6-.9-1.6-1.9s.7-1.9 1.6-1.9 1.6.9 1.6 1.9-.7 1.9-1.6 1.9z" />
              </svg>
            </a>
          </div>

          <div className="qf-copy-row">
            <p className="qf-copy">&copy; 2026 Tasmil Finance. All rights reserved.</p>
            <p className="qf-copy-disclaimer">
              For informational purposes only, not financial advice. DeFi yields are variable
              and capital is at risk.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
