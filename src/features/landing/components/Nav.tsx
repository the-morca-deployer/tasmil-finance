// @ts-nocheck
import { APP_ENTRY, isWaitlistMode } from "@/lib/waitlist-mode";
import { BrandLogo } from "@/shared/components/brand-logo";

export default function Nav() {
  const waitlist = isWaitlistMode();
  return (
    <>
      <nav className="nav" id="nav">
        <BrandLogo href="#top" logoSrc="/tasmil-logo.png" text="Tasmil Finance" size="md" />
        <div className="nav-center">
          <a href="#features">How it works</a>
          <a href="#features">Product</a>
          <a href="#security">Security</a>
          <a href="#fees">Fees</a>
        </div>
        <div className="nav-actions">
          {waitlist ? (
            <>
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
            </>
          ) : (
            <a
              className="btn btn-primary"
              href={APP_ENTRY}
              style={{ padding: "11px 22px", fontSize: "14px" }}
            >
              Launch App <span className="arr">→</span>
            </a>
          )}
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
