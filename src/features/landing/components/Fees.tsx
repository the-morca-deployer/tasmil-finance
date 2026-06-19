// @ts-nocheck
export default function Fees() {
  return (
    <>
      <section className="section fees" id="fees">
        <div className="fees-glow"></div>
        <div className="fees-horizon">
          <img src="/tasmil-orb.png" alt="" aria-hidden="true" />
        </div>
        <div className="fees-fade"></div>
        <div className="wrap">
          <div className="eyebrow reveal">Fees</div>
          <h2
            className="reveal d1 fees-rot"
            aria-label="No deposit, withdrawal, or subscription fee."
          >
            No{" "}
            <span className="fr" id="feesFr">
              <span className="fr-track" aria-hidden="true">
                <span className="fr-i">
                  <em>deposit</em>
                </span>
                <span className="fr-i">
                  <em>withdrawal</em>
                </span>
                <span className="fr-i">
                  <em>subscription</em>
                </span>
              </span>
            </span>{" "}
            <em>fee.</em>
          </h2>
          <p className="sub reveal d2">
            You pay only Stellar network gas, about $0.001 per action. A performance fee on profits
            above your all-time high is planned, not yet active. When it ships, you'll see it before
            you ever opt in.
          </p>
          <div className="fees-pills reveal d3">
            <span className="fees-pill">
              <svg viewBox="0 0 16 16" fill="none">
                <path
                  d="M3.5 8.5l3 3 6-7"
                  stroke="var(--accent)"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
              Deposit <span className="dim">$0</span>
            </span>
            <span className="fees-pill">
              <svg viewBox="0 0 16 16" fill="none">
                <path
                  d="M3.5 8.5l3 3 6-7"
                  stroke="var(--accent)"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
              Withdrawal <span className="dim">$0</span>
            </span>
            <span className="fees-pill">
              <svg viewBox="0 0 16 16" fill="none">
                <path
                  d="M3.5 8.5l3 3 6-7"
                  stroke="var(--accent)"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
              Network gas <span className="dim">~$0.001</span>
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
