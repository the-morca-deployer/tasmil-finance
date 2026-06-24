"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { QuestHeaderBadges } from "@/features/quest/components/QuestHeaderBadges";
import { WalletRankInfo } from "@/features/quest/components/WalletRankInfo";
import { SponsorIndicator } from "@/features/sponsorship/components/sponsor-indicator";
import { MegaMenu } from "@/features/strategies/components/MegaMenu";
import { cn } from "@/lib/utils";
import { ConnectWalletButton } from "@/shared/components/connect-wallet-button";
import { NavLink } from "./nav-link";
import type { SidebarData } from "./sidebar-data";

interface TopNavBarProps {
  sidebarData: SidebarData;
  /**
   * Retained for layout-API compatibility. The chat-history trigger has been
   * removed from the header surface entirely; this prop is no longer consumed.
   */
  showRightSidebar?: boolean;
}

export function TopNavBar({ sidebarData }: TopNavBarProps) {
  const items = sidebarData.navGroups.flatMap((g) => g.items);
  const pathname = usePathname() ?? "";

  return (
    <nav
      data-testid="top-nav-bar"
      className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-6 border-border border-b bg-background px-4"
    >
      <Link href="/chat/new" className="flex items-center gap-2.5">
        <Image src={sidebarData.header.logo_url} width={40} height={40} alt="Logo" />
        <span className="animate-shimmer-text bg-[length:200%_100%] bg-gradient-to-r from-[#b5eaff] via-white to-[#00bfff] bg-clip-text font-bold text-transparent text-xl">
          {sidebarData.header.brand_name}
        </span>
      </Link>

      <div className="ml-6 flex items-center gap-2 overflow-x-auto">
        {/* Strategies megamenu trigger */}
        <div className="group relative">
          <Link
            href="/strategies"
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-4 py-1.5 font-medium text-sm transition-colors",
              pathname?.startsWith("/strategies")
                ? "text-foreground"
                : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
            )}
          >
            Strategies
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5"
            >
              <title>Open strategies menu</title>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </Link>
          <MegaMenu />
        </div>
        {items.map((item) => (
          <NavLink key={item.url} item={item} />
        ))}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <QuestHeaderBadges />
        <SponsorIndicator />
        <ConnectWalletButton variant="topbar" rankSlot={<WalletRankInfo />} />
      </div>
    </nav>
  );
}
