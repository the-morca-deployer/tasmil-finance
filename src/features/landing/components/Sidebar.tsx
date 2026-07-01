// @ts-nocheck
import { BrandLogo } from "@/shared/components/brand-logo";

export default function Sidebar() {
  return (
    <>
      <div className="nav-scrim" id="navScrim"></div>
      <aside className="sidebar" id="sidebar" aria-hidden="true">
        <div className="sidebar-head">
          <BrandLogo href="#top" logoSrc="/tasmil-logo.png" text="Tasmil Finance" size="md" />
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
