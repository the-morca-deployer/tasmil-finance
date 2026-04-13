"use client";

import { AdminAuthGuard } from "@/features/admin-auth/components/admin-auth-guard";
import { AdminShell } from "@/features/admin/components/admin-shell";

export default function AdminAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      <AdminShell title="Admin Panel">
        {children}
      </AdminShell>
    </AdminAuthGuard>
  );
}
