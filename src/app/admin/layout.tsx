"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuthStore } from "@/features/admin-auth/store/use-admin-auth-store";
import { MultiSidebarLayout } from "@/shared/layout/multi-sidebar-layout";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAdminAuthStore();

  useEffect(() => {
    if (!isAuthenticated && typeof window !== "undefined") {
      router.push("/admin/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <MultiSidebarLayout showRightSidebar={false} showHeader={true} title="Admin">
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </MultiSidebarLayout>
  );
}