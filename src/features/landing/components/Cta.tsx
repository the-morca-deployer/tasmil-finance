// @ts-nocheck
export default function Cta() {
  return (
    <>
      <section className="cta" id="start">
        <div className="cta-sticky">
          <div className="hub-card cta-frame">
            <img className="hub-bg" src="/tasmil-horizon.png" alt="" aria-hidden="true" />
            <div className="hub-veil"></div>
            <div className="hub-inner">
              <h2>
                Put your stablecoins
                <br />
                to work today
              </h2>
              <p className="hsub">
                Connect a Stellar wallet, deploy your vault, and pick a preset. Your capital starts
                compounding in minutes.
              </p>
              <div className="hub-cta">
                <a className="btn btn-primary btn-lg" href="/waitlist">
                  Join Waitlist <span className="arr">→</span>
                </a>
                <a className="btn btn-ghost btn-lg" href="#features">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M8 5v14l11-7z"></path>
                  </svg>
                  See how it works
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
