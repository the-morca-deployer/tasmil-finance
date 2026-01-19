"use client";

import { VaultDemo } from "@/features/vault";
import { MultiSidebarLayout } from "@/shared/layout/multi-sidebar-layout";

export default function VaultDemoPage() {
  return (
    <MultiSidebarLayout showRightSidebar={false} showHeader={true} title="Vault Demo">
      <div className="mx-auto max-w-4xl p-6">
        <VaultDemo />
      </div>
    </MultiSidebarLayout>
  );
}