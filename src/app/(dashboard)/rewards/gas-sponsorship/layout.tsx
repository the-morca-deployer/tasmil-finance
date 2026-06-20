"use client";

import { MultiSidebarLayout } from "@/shared/layout/multi-sidebar-layout";

export default function GasSponsorshipLayout({ children }: { children: React.ReactNode }) {
  return (
    <MultiSidebarLayout showRightSidebar={false} showHeader={true}>
      {children}
    </MultiSidebarLayout>
  );
}
