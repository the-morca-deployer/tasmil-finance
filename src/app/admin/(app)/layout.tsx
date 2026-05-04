"use client";

import { AdminShell } from "@/features/admin/components/admin-shell";
import { AdminAuthGuard } from "@/features/admin-auth/components/admin-auth-guard";

export default function AdminAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      <AdminShell title="Admin Panel">{children}</AdminShell>
    </AdminAuthGuard>
  );
}
