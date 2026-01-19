"use client";

import { VaultStrategiesPage } from "@/features/vault";
import { MultiSidebarLayout } from "@/shared/layout/multi-sidebar-layout";

export default function VaultStrategiesRoute() {
  return (
    <MultiSidebarLayout showRightSidebar={false} showHeader={true} title="AI Strategies">
      <VaultStrategiesPage />
    </MultiSidebarLayout>
  );
}
