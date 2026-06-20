// @ts-nocheck
export default function Sidebar() {
  return (
    <>
      <div className="nav-scrim" id="navScrim"></div>
      <aside className="sidebar" id="sidebar" aria-hidden="true">
        <div className="sidebar-head">
          <a className="brand" href="#top">
            <img className="mk" src="/tasmil-logo.png" alt="" width="28" height="28" />
            <span className="brand-name">Tasmil Finance</span>
          </a>
          <button className="sidebar-close" id="sbClose" type="button" aria-label="Close menu">
            ×
          </button>
        </div>
        <nav className="sb-nav">
          <a className="sb-link" href="#features">
            How it works <span className="sb-ar">→</span>
          </a>
          <a className="sb-link" href="#converge">
            One vault <span className="sb-ar">→</span>
          </a>
          <a className="sb-link" href="#security">
            Security <span className="sb-ar">→</span>
          </a>
          <a className="sb-link" href="#fees">
            Fees <span className="sb-ar">→</span>
          </a>
          <a className="sb-link" href="#faq">
            FAQ <span className="sb-ar">→</span>
          </a>
        </nav>
        <a className="btn btn-primary btn-lg sb-cta" href="/waitlist">
          Join Waitlist <span className="arr">→</span>
        </a>
      </aside>
    </>
  );
}
