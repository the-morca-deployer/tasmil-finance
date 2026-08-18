"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MegaMenu } from "./MegaMenu";

const NAV_LINKS = [
  { href: "/strategies", label: "Strategies", hasMegaMenu: true },
  { href: "/chat/new", label: "Chat" },
  { href: "/missions", label: "Missions" },
  { href: "/farming", label: "Farming" },
  { href: "/aggregator", label: "Aggregator" },
  { href: "/portfolio", label: "Portfolio" },
];

export function StrategyNav() {
  const pathname = usePathname() ?? "";

  const isActive = (href: string) => {
    if (href === "/strategies") {
      return pathname.startsWith("/strategies");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav
      className={cn(
        "sticky top-0 z-[100] flex h-[68px] items-center justify-between",
        "border-b border-[rgba(255,255,255,0.08)]",
        "bg-[rgba(0,0,0,0.72)] backdrop-blur-[18px]",
        "px-[clamp(20px,5vw,72px)]"
      )}
    >
      {/* Brand */}
      <Link href="/strategies" className="flex items-center gap-3">
        <span className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-gradient-to-r from-white via-[#67E8F9] to-[#0EA5E9] font-extrabold text-[10px] text-[#04141A]">
          T
        </span>
        <span className="font-bold text-[17px] tracking-[-0.02em] text-[#F4F7FB]">
          Tasmil Finance
        </span>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-1">
        {NAV_LINKS.map((link) => {
          const active = isActive(link.href);
          const content = (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative inline-flex items-center gap-1 rounded-[100px] px-[18px] py-2",
                "text-[14.5px] font-medium transition-colors",
                active
                  ? "text-[#F4F7FB]"
                  : "text-[rgba(244,247,251,0.58)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#F4F7FB]"
              )}
            >
              {link.label}
              {link.hasMegaMenu && (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              )}
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-1/2 h-[2px] w-[60%] -translate-x-1/2 rounded-[2px] bg-[#67E8F9] shadow-[0_0_10px_rgba(103,232,249,0.5)]"
                />
              )}
            </Link>
          );

          if (link.hasMegaMenu) {
            return (
              <div key={link.href} className="relative group">
                {content}
                <MegaMenu />
              </div>
            );
          }

          return content;
        })}
      </div>

      {/* Right - wallet area placeholder */}
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-2.5 rounded-[100px] border border-[rgba(255,255,255,0.14)] bg-[#0D111A] py-1.5 pl-3.5 pr-1.5">
          <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-gradient-to-r from-white via-[#67E8F9] to-[#0EA5E9] text-[9px] font-bold text-[#04141A]">
            W
          </span>
          <span className="font-mono text-[13px] text-[#F4F7FB]">Connect Wallet</span>
        </span>
      </div>
    </nav>
  );
}
