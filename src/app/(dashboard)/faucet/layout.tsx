"use client";
import { MultiSidebarLayout } from "@/shared/layout/multi-sidebar-layout";
export default function FaucetLayout({ children }: { children: React.ReactNode }) {
  return (
    <MultiSidebarLayout showRightSidebar={false} showHeader={true} title="Testnet Faucet">
      {children}
    </MultiSidebarLayout>
  );
}
