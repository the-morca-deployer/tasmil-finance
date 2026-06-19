// @ts-nocheck
export default function Nav() {
  return (
    <>
      <nav className="nav" id="nav">
        <a className="brand" href="#top">
          <img className="mk" src="/tasmil-logo.png" alt="Tasmil Finance" width="40" height="40" />
          <span className="brand-name">Tasmil Finance</span>
        </a>
        <div className="nav-center">
          <a href="#features">How it works</a>
          <a href="#features">Product</a>
          <a href="#security">Security</a>
          <a href="#fees">Fees</a>
        </div>
        <div className="nav-actions">
          <a
            className="btn btn-ghost"
            href="/access"
            style={{ padding: "11px 18px", fontSize: "14px" }}
          >
            Have a code?
          </a>
          <a
            className="btn btn-primary"
            href="/waitlist"
            style={{ padding: "11px 22px", fontSize: "14px" }}
          >
            Join Waitlist <span className="arr">→</span>
          </a>
        </div>
        <button
          className="nav-burger"
          id="navBurger"
          type="button"
          aria-label="Open menu"
          aria-expanded="false"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </nav>
    </>
  );
}
