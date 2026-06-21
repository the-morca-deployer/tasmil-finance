"use client";

import Image from "next/image";
import Link from "next/link";

const LINKS = {
  website: "https://tasmil-finance.xyz",
  docs: "https://tasmil-user-docs.vercel.app/docs",
  x: "https://x.com/tasmilfinance",
  telegram: "https://t.me/tasmilfinance",
};

const Footer: React.FC = () => {
  return (
    <footer className="qf">
      {/* Top: 3-column grid */}
      <div className="qf-wrap">
        <div className="qf-grid">
          {/* Brand */}
          <div className="qf-brand">
            <Link href="/quest" className="qf-brand-link">
              <Image src="/logo.png" alt="Tasmil" width={40} height={40} />
              <span className="qf-brand-name">Tasmil Finance</span>
            </Link>
            <p className="qf-brand-desc">
              The premier questing platform for the Tasmil ecosystem. Earn rewards, verify on-chain
              activity, and boost your profile.
            </p>
          </div>

          <div className="qf-nav-group">
            {/* Platform links */}
            <div className="qf-col">
              <div className="qf-col-head">Platform</div>
              <Link href="/quest">Explore</Link>
              <Link href="/quest/campaigns">Campaigns</Link>
              <Link href="/quest/leaderboard">Leaderboard</Link>
              <Link href="/quest/profile">Profile</Link>
            </div>

            {/* Resources */}
            <div className="qf-col">
              <div className="qf-col-head">Resources</div>
              <a href={LINKS.website} target="_blank" rel="noreferrer">
                Official Website
              </a>
              <a href={LINKS.docs} target="_blank" rel="noreferrer">
                Docs
              </a>
              <a href="#">Brand Assets</a>
              <a href="#">Help Center</a>
            </div>
          </div>
        </div>
      </div>

      {/* Ghost watermark */}
      <div className="qf-mark" aria-hidden="true">
        Tasmil Finance
      </div>

      {/* Bottom: social + copyright */}
      <div className="qf-wrap qf-bottom-wrap">
        <div className="qf-bottom">
          <div className="qf-social">
            <a
              href={LINKS.x}
              target="_blank"
              rel="noreferrer"
              aria-label="X (Twitter)"
              className="qf-social-ic"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href={LINKS.telegram}
              target="_blank"
              rel="noreferrer"
              aria-label="Telegram"
              className="qf-social-ic"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M21.9 4.3 18.7 19.4c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-4.9 9-8.1c.4-.3-.1-.5-.6-.2L6.4 13 1.7 11.5c-1-.3-1-.9.2-1.4L20.6 3c.8-.3 1.5.2 1.3 1.3Z" />
              </svg>
            </a>
            <a
              href={LINKS.website}
              target="_blank"
              rel="noreferrer"
              aria-label="Website"
              className="qf-social-ic"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </a>
          </div>

          <div className="qf-sep" />

          <div className="qf-copy-row">
            <p className="qf-copy">© 2025 Tasmil Network. All rights reserved.</p>
            <div className="qf-copy-links">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
