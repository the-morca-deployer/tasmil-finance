"use client";

import { VaultActivityPage } from "@/features/vault";
import { MultiSidebarLayout } from "@/shared/layout/multi-sidebar-layout";

export default function VaultActivityRoute() {
  return (
    <MultiSidebarLayout showRightSidebar={false} showHeader={true} title="Activity">
      <VaultActivityPage />
    </MultiSidebarLayout>
  );
}
