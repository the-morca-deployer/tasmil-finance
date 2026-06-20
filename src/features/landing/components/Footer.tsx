// @ts-nocheck
export default function Footer() {
  return (
    <>
      <footer className="footer">
        <div className="wrap">
          <div className="foot-grid">
            <div className="foot-brand">
              <a className="brand" href="#top">
                <img
                  className="mk"
                  src="/tasmil-logo.png"
                  alt="Tasmil Finance"
                  width="40"
                  height="40"
                />
                <span className="brand-name">Tasmil Finance</span>
              </a>
              <p className="foot-desc">
                An automated DeFi yield protocol on Stellar. Deposit USDC or XLM, pick a risk level,
                and Tasmil Finance rebalances across the best protocols, non-custodial.
              </p>
            </div>

            <div className="foot-col">
              <div className="foot-head">Product</div>
              <a href="#features">How it works</a>
              <a href="#converge">One vault</a>
              <a href="#security">Security</a>
              <a href="#fees">Fees</a>
              <a href="#faq">FAQ</a>
              <a href="/waitlist">Join waitlist</a>
              <a href="/access">Have a code?</a>
            </div>

            <div className="foot-col">
              <div className="foot-head">Protocols</div>
              <a href="#partners">Blend</a>
              <a href="#partners">Soroswap</a>
              <a href="#partners">Aquarius</a>
              <a href="#partners">Phoenix</a>
              <a href="#partners">Allbridge</a>
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
          <div className="fa-cols">
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
              <a
                className="fa-ic"
                href="https://x.com"
                target="_blank"
                rel="noopener"
                aria-label="X"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                </svg>
              </a>
              <a className="fa-ic" href="#" aria-label="Telegram">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M9.04 15.29l-.37 5.2c.53 0 .76-.23 1.04-.5l2.5-2.4 5.18 3.79c.95.52 1.62.25 1.88-.88l3.4-15.94c.3-1.4-.51-1.95-1.43-1.6L1.13 9.86C-.24 10.4-.22 11.18.9 11.52l5.05 1.57L17.6 5.74c.55-.36 1.05-.16.64.2L9.04 15.29z"></path>
                </svg>
              </a>
              <a className="fa-ic" href="#" aria-label="Discord">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M19.3 5.3A16 16 0 0 0 15.4 4l-.24.5a12 12 0 0 1 3.3 1.6 11 11 0 0 0-9 0A12 12 0 0 1 12.8 4.5L12.6 4a16 16 0 0 0-3.9 1.3C5.6 9 4.8 12.6 5.2 16.2a16 16 0 0 0 4.9 2.4l.6-.9a10 10 0 0 1-1.6-.8l.4-.3a11 11 0 0 0 9 0l.4.3a10 10 0 0 1-1.6.8l.6.9a16 16 0 0 0 4.9-2.4c.5-4.6-.9-8.2-3.6-10.9zM9.8 14.2c-.9 0-1.6-.9-1.6-1.9s.7-1.9 1.6-1.9 1.6.9 1.6 1.9-.7 1.9-1.6 1.9zm4.4 0c-.9 0-1.6-.9-1.6-1.9s.7-1.9 1.6-1.9 1.6.9 1.6 1.9-.7 1.9-1.6 1.9z"></path>
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
    </>
  );
}
