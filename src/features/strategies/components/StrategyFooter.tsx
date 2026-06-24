"use client";

import Link from "next/link";

const LINKS = {
  website: "https://tasmil-finance.xyz",
  docs: "https://tasmil-user-docs.vercel.app/docs",
  x: "https://x.com/tasmilfinance",
  telegram: "https://t.me/tasmilfinance",
};

export function StrategyFooter() {
  return (
    <footer className="border-t border-[rgba(255,255,255,0.08)] bg-black px-[clamp(20px,5vw,72px)] py-12">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-8 md:flex-row md:justify-between">
        {/* Brand */}
        <div>
          <Link href="/strategies" className="flex items-center gap-2.5">
            <span className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-gradient-to-r from-white via-[#67E8F9] to-[#0EA5E9] font-extrabold text-[10px] text-[#04141A]">
              T
            </span>
            <span className="font-bold text-[17px] tracking-[-0.02em] text-[#F4F7FB]">
              Tasmil Finance
            </span>
          </Link>
          <p className="mt-3 max-w-xs text-[14px] leading-relaxed text-[rgba(244,247,251,0.34)]">
            Autonomous DeFi yield optimization. Browse, deploy, and track trading strategies on
            Stellar.
          </p>
        </div>

        {/* Nav columns */}
        <div className="flex gap-16">
          <div className="flex flex-col gap-2">
            <span className="mb-1 font-semibold text-[11px] uppercase tracking-[0.18em] text-[rgba(244,247,251,0.34)]">
              Strategies
            </span>
            <Link
              href="/strategies"
              className="text-[14px] text-[rgba(244,247,251,0.58)] hover:text-[#F4F7FB] transition-colors"
            >
              Marketplace
            </Link>
            <Link
              href="/strategies/dashboard"
              className="text-[14px] text-[rgba(244,247,251,0.58)] hover:text-[#F4F7FB] transition-colors"
            >
              Publisher Dashboard
            </Link>
            <Link
              href="/strategies/leaderboard"
              className="text-[14px] text-[rgba(244,247,251,0.58)] hover:text-[#F4F7FB] transition-colors"
            >
              Leaderboard
            </Link>
            <Link
              href="/strategies/create"
              className="text-[14px] text-[rgba(244,247,251,0.58)] hover:text-[#F4F7FB] transition-colors"
            >
              Publish Strategy
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="mb-1 font-semibold text-[11px] uppercase tracking-[0.18em] text-[rgba(244,247,251,0.34)]">
              Resources
            </span>
            <a
              href={LINKS.website}
              target="_blank"
              rel="noreferrer"
              className="text-[14px] text-[rgba(244,247,251,0.58)] hover:text-[#F4F7FB] transition-colors"
            >
              Website
            </a>
            <a
              href={LINKS.docs}
              target="_blank"
              rel="noreferrer"
              className="text-[14px] text-[rgba(244,247,251,0.58)] hover:text-[#F4F7FB] transition-colors"
            >
              Docs
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mx-auto mt-10 flex max-w-[1280px] flex-col items-center justify-between gap-4 border-t border-[rgba(255,255,255,0.08)] pt-6 sm:flex-row">
        <p className="text-[13px] text-[rgba(244,247,251,0.34)]">
          &copy; 2025 Tasmil Network. All rights reserved.
        </p>
        <div className="flex gap-6">
          {/* biome-ignore lint/a11y/useAnchorContent: aria-label provides accessible name */}
          <a
            href={LINKS.x}
            target="_blank"
            rel="noreferrer"
            aria-label="X (Twitter)"
            className="text-[rgba(244,247,251,0.34)] hover:text-[#F4F7FB] transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          {/* biome-ignore lint/a11y/useAnchorContent: aria-label provides accessible name */}
          <a
            href={LINKS.telegram}
            target="_blank"
            rel="noreferrer"
            aria-label="Telegram"
            className="text-[rgba(244,247,251,0.34)] hover:text-[#F4F7FB] transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
              <path d="M21.9 4.3 18.7 19.4c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-4.9 9-8.1c.4-.3-.1-.5-.6-.2L6.4 13 1.7 11.5c-1-.3-1-.9.2-1.4L20.6 3c.8-.3 1.5.2 1.3 1.3Z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
