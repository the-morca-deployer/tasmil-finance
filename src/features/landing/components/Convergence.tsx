// @ts-nocheck
export default function Convergence() {
  return (
    <>
      <section className="section converge" id="converge">
        <div className="wrap">
          <span className="ix reveal">Convergence</span>
          <h2 className="reveal d1">
            Every protocol.
            <br />
            One vault.
          </h2>
          <p className="lead reveal d2">
            Stellar's top DeFi protocols come fragmented, with separate liquidity, dashboards and
            risk. Tasmil Finance folds them into a single position you control.
          </p>
          <div className="conv-stage reveal d2" id="convStage" aria-hidden="true">
            <div className="conv-lane"></div>
            <div className="conv-vault">
              <div className="cv-ring"></div>
              <img src="/tasmil-logo.png" alt="" />
              <span>Tasmil Vault</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
