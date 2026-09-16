"use client";

import { useEffect, useState } from "react";
import {
  type ReferralConfigRow,
  useReferralConfig,
  useUpdateReferralConfig,
} from "@/features/admin/hooks/use-admin-referral-config";

const inputStyle: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "#F5F8FC",
  fontSize: 13,
  width: 120,
};

const primaryBtnStyle: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 8,
  border: "none",
  background: "linear-gradient(135deg, #00BFFF, #0080FF)",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: 13,
};

interface LayerForm {
  rateBps: number;
  isActive: boolean;
}

function LayerRow({ row }: { row: ReferralConfigRow }) {
  const update = useUpdateReferralConfig();
  const [form, setForm] = useState<LayerForm>({ rateBps: row.rateBps, isActive: row.isActive });

  // Keep the local form in sync if the server data changes.
  useEffect(() => {
    setForm({ rateBps: row.rateBps, isActive: row.isActive });
  }, [row.rateBps, row.isActive]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    update.mutate({ layer: row.layer, rateBps: form.rateBps, isActive: form.isActive });
  }

  const inputId = `layer-${row.layer}-rate`;

  return (
    <form
      onSubmit={handleSave}
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 16,
        padding: "16px 18px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <div style={{ minWidth: 80 }}>
        <div style={{ fontSize: 11, opacity: 0.6, textTransform: "uppercase" }}>Layer</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#00BFFF" }}>L{row.layer}</div>
      </div>

      <div>
        <label
          htmlFor={inputId}
          style={{ display: "block", fontSize: 11, opacity: 0.6, marginBottom: 6 }}
        >
          Layer {row.layer} rate (bps)
        </label>
        <input
          id={inputId}
          type="number"
          min={0}
          max={10000}
          value={form.rateBps}
          onChange={(e) => setForm((f) => ({ ...f, rateBps: Number(e.target.value) }))}
          style={inputStyle}
        />
        <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>
          = {(form.rateBps / 100).toFixed(2)}%
        </div>
      </div>

      <label
        style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, paddingBottom: 8 }}
      >
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
        />
        Active
      </label>

      <button type="submit" disabled={update.isPending} style={primaryBtnStyle}>
        {update.isPending ? "Saving..." : `Save Layer ${row.layer}`}
      </button>
    </form>
  );
}

export default function ReferralConfigPage() {
  const { data, isLoading, error } = useReferralConfig();
  const rows = [...(data ?? [])].sort((a, b) => a.layer - b.layer);

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Referral Commission Rates</h1>
      <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 20 }}>
        Set the commission rate (in basis points) credited to each referral layer. New rates apply
        to future claims only.
      </p>

      {isLoading && <p style={{ fontSize: 13, opacity: 0.6 }}>Loading commission rates...</p>}
      {error && <p style={{ fontSize: 13, color: "#f87171" }}>Failed to load: {error.message}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map((row) => (
          <LayerRow key={row.layer} row={row} />
        ))}
      </div>
    </div>
  );
}
