"use client";

import { QuestHeaderBadges } from "@/features/quest/components/QuestHeaderBadges";
import { WalletRankInfo } from "@/features/quest/components/WalletRankInfo";
import { SponsorIndicator } from "@/features/sponsorship/components/sponsor-indicator";
import { BrandLogo } from "@/shared/components/brand-logo";
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

  return (
    <nav
      data-testid="top-nav-bar"
      className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-6 border-border border-b bg-[rgba(20,20,25,0.72)] px-[clamp(20px,5vw,56px)] backdrop-blur-[18px]"
    >
      <BrandLogo
        href="/chat/new"
        logoSrc={sidebarData.header.logo_url}
        text={sidebarData.header.brand_name}
        alt="Logo"
        size="md"
      />

      <div className="flex items-center gap-0.5 max-[900px]:hidden">
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
