"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { adminDownload } from "@/shared/lib/admin-download";

interface ExportCsvButtonProps {
  /** Backend export path, e.g. "/api/admin/codes/export". */
  endpoint: string;
  /** Optional query params (current table filters). */
  params?: Record<string, string>;
  disabled?: boolean;
}

export function ExportCsvButton({ endpoint, params, disabled }: ExportCsvButtonProps) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      const qs = params && Object.keys(params).length > 0 ? `?${new URLSearchParams(params)}` : "";
      await adminDownload(`${endpoint}${qs}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || pending}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 14px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
        color: "#F5F8FC",
        cursor: disabled || pending ? "default" : "pointer",
        opacity: disabled || pending ? 0.6 : 1,
        fontSize: 13,
      }}
    >
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
      Export CSV
    </button>
  );
}
