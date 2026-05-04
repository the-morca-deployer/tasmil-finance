"use client";

import { EvmWalletProvider } from "@/features/aggregator/providers/evm-wallet-provider";
import { MultiSidebarLayout } from "@/shared/layout/multi-sidebar-layout";

export default function AggregatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <MultiSidebarLayout showRightSidebar={false} showHeader={false}>
      <EvmWalletProvider>{children}</EvmWalletProvider>
    </MultiSidebarLayout>
  );
}
