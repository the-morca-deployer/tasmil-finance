// @ts-nocheck
export default function Security() {
  return (
    <>
      <section className="section security" id="security">
        <div className="wrap">
          <div className="sec-head reveal" style={{ marginBottom: "0" }}>
            <div>
              <div className="eyebrow">Security</div>
              <h2>
                Non-custodial.
                <br />
                The bot has limits.
              </h2>
            </div>
            <p className="rt">
              A scoped session key can optimize, never escape. Your owner key always wins.
            </p>
          </div>
          <div className="sec-ledger reveal">
            <div className="ledger-col allow">
              <div className="ledger-h">The bot can</div>
              <div className="ledger-sub">Inside the scoped session key</div>
              <div className="ledger-row">
                <span className="ledger-ic">
                  <svg viewBox="0 0 18 18" fill="none">
                    <path
                      d="M4 9.5l3 3 7-7.5"
                      stroke="var(--accent)"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                </span>
                Rebalance between registered strategies
              </div>
              <div className="ledger-row">
                <span className="ledger-ic">
                  <svg viewBox="0 0 18 18" fill="none">
                    <path
                      d="M4 9.5l3 3 7-7.5"
                      stroke="var(--accent)"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                </span>
                Harvest rewards back to your vault
              </div>
              <div className="ledger-row">
                <span className="ledger-ic">
                  <svg viewBox="0 0 18 18" fill="none">
                    <path
                      d="M4 9.5l3 3 7-7.5"
                      stroke="var(--accent)"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                </span>
                Sign within a scoped session key
              </div>
            </div>
            <div className="ledger-div"></div>
            <div className="ledger-col deny">
              <div className="ledger-h">The bot cannot</div>
              <div className="ledger-sub">Hard-blocked on-chain</div>
              <div className="ledger-row">
                <span className="ledger-ic">
                  <svg viewBox="0 0 18 18" fill="none">
                    <path
                      d="M5.5 5.5l7 7M12.5 5.5l-7 7"
                      stroke="var(--deny)"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    ></path>
                  </svg>
                </span>
                Send funds to external addresses
              </div>
              <div className="ledger-row">
                <span className="ledger-ic">
                  <svg viewBox="0 0 18 18" fill="none">
                    <path
                      d="M5.5 5.5l7 7M12.5 5.5l-7 7"
                      stroke="var(--deny)"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    ></path>
                  </svg>
                </span>
                Touch your private key
              </div>
              <div className="ledger-row">
                <span className="ledger-ic">
                  <svg viewBox="0 0 18 18" fill="none">
                    <path
                      d="M5.5 5.5l7 7M12.5 5.5l-7 7"
                      stroke="var(--deny)"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    ></path>
                  </svg>
                </span>
                Bypass on-chain rate limits
              </div>
            </div>
          </div>
          <div className="sec-guards reveal d1">
            <div className="guard">
              <span className="guard-ic">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="8" cy="8" r="4.2" stroke="currentColor" strokeWidth="1.7"></circle>
                  <path
                    d="M11 11l8 8M16 16l2.5-2.5M14 14l2.5-2.5"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
              </span>
              <div>
                <div className="gt">Session keys</div>
                <div className="gl">Permissions enforced on-chain</div>
              </div>
            </div>
            <div className="guard">
              <span className="guard-ic">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M13 3L5 13h6l-2 8 10-12h-7l1-6z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  ></path>
                </svg>
              </span>
              <div>
                <div className="gt">Circuit breaker</div>
                <div className="gl">Auto-halts on anomalies</div>
              </div>
            </div>
            <div className="guard">
              <span className="guard-ic">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 12a8 8 0 1 1 2.3 5.6"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  ></path>
                  <path
                    d="M6 18v-3.5H9.5"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
              </span>
              <div>
                <div className="gt">Revoke anytime</div>
                <div className="gl">One signature kills access</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
