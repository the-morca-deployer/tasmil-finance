"use client";

import { VaultPortfolioPage } from "@/features/vault";
import { MultiSidebarLayout } from "@/shared/layout/multi-sidebar-layout";

export default function VaultPortfolioRoute() {
  return (
    <MultiSidebarLayout showRightSidebar={false} showHeader={true} title="Your Vault">
      <VaultPortfolioPage />
    </MultiSidebarLayout>
  );
}
