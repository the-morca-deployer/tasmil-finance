// @ts-nocheck
export default function Hero() {
  return (
    <>
      <header className="hero" id="top">
        <div className="hero-floor"></div>
        <div className="hero-fade"></div>
        <div className="hero-skyline" aria-hidden="true">
          <span className="hs-col" style={{ "--h": "100%" }}></span>
          <span className="hs-col" style={{ "--h": "70%" }}></span>
          <span className="hs-col" style={{ "--h": "40%" }}></span>
          <span className="hs-col" style={{ "--h": "22%" }}></span>
          <span className="hs-col" style={{ "--h": "40%" }}></span>
          <span className="hs-col" style={{ "--h": "70%" }}></span>
          <span className="hs-col" style={{ "--h": "100%" }}></span>
        </div>
        <div className="hero-inner2">
          <div className="hero-text">
            <span className="hero-pill">DeFi Yield Protocol on Stellar</span>
            <h1>
              <span className="l1">One Vault.</span>
              <span className="l2">Every Protocol.</span>
            </h1>
            <p className="sub">
              Tasmil Finance puts your stablecoins to work across Stellar's top DeFi protocols.
              Auto-rebalancing yield, non-custodial, always yours.
            </p>
            <div className="hero-cta">
              <a className="btn btn-primary btn-lg" href="/waitlist">
                Join Waitlist <span className="arr">→</span>
              </a>
              <a className="btn btn-ghost btn-lg" href="#features">
                See how it works
              </a>
            </div>
          </div>
          <div className="hero-object" id="heroStage">
            <div className="obj3d" id="obj3d">
              <img
                src="/tasmil-crypto.svg"
                alt="Tasmil multi-asset crypto vault"
                draggable="false"
              />
            </div>
          </div>
        </div>
        <a className="scroll-cue" href="#backed">
          <span>Scroll</span>
        </a>
      </header>
    </>
  );
}
