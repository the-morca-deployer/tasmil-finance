"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface NavProps {
  variant?: "landing" | "access";
  codeHref?: string;
  homeHref?: string;
}

const KeyIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width={14}
    height={14}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="8" cy="8" r="4.2" />
    <path d="M11 11l8 8M16 16l2-2M18.5 18.5l1.8-1.8" />
  </svg>
);

export function Nav({ variant = "landing", codeHref = "/access", homeHref = "/" }: NavProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`nav${scrolled ? " scrolled" : ""}`}>
      <div className="wrap nav-inner">
        <Link className="brand" href={homeHref}>
          <span className="brand-mark">T</span>
          <span className="brand-name">Tasmil</span>
        </Link>
        <div className="nav-right">
          {variant === "landing" ? (
            <>
              <a className="nav-link hide-sm" href="#how">
                How it works
              </a>
              <a className="nav-link hide-sm" href="#why">
                Why join
              </a>
              <Link className="nav-code" href={codeHref}>
                <KeyIcon /> Have a code? <span className="arr">→</span>
              </Link>
            </>
          ) : (
            <Link className="nav-link" href={homeHref}>
              ← Back to waitlist
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
