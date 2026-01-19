"use client";

import { VaultLandingPage } from "@/features/vault";
import { MultiSidebarLayout } from "@/shared/layout/multi-sidebar-layout";

export default function VaultPage() {
  return (
    <MultiSidebarLayout showRightSidebar={false} showHeader={true} title="Tasmil Vault">
      <VaultLandingPage />
    </MultiSidebarLayout>
  );
}
