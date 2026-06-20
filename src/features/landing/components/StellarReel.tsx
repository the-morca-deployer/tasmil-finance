// @ts-nocheck
export default function StellarReel() {
  return (
    <>
      <section className="stellar-reel" id="backed" aria-label="Backed by Stellar">
        <div className="sr-stage">
          <video
            className="sr-vid"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
          >
            <source src="/tasmil-coins.webm" type="video/webm" />
          </video>
          <div className="sr-fade"></div>
        </div>
        <div className="sr-copy">
          <h2>
            Backed by <span className="grad">Stellar.</span>
          </h2>
          <div className="sr-meta">
            <div>
              <span className="v">~5s</span>
              <span className="l">Settlement</span>
            </div>
            <div>
              <span className="v">$0.001</span>
              <span className="l">Avg. fee</span>
            </div>
            <div>
              <span className="v">24/7</span>
              <span className="l">On-chain</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
