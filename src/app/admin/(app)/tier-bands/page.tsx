"use client";

import { useEffect, useState } from "react";
import {
  type TierBandRow,
  useTierBands,
  useUpdateTierBand,
} from "@/features/admin/hooks/use-admin-tier-bands";
import { ExportCsvButton } from "@/shared/components/export-csv-button";

const inputStyle: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "#F5F8FC",
  fontSize: 13,
  width: 140,
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

function TierRow({
  row,
  prev,
  next,
}: {
  row: TierBandRow;
  prev?: TierBandRow;
  next?: TierBandRow;
}) {
  const update = useUpdateTierBand();
  const [min, setMin] = useState(row.min);

  // Keep the local form in sync if the server data changes.
  useEffect(() => {
    setMin(row.min);
  }, [row.min]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    update.mutate({ tier: row.tier, min });
  }

  const inputId = `tier-${row.tier}-min`;

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
      <div style={{ minWidth: 90 }}>
        <div style={{ fontSize: 11, opacity: 0.6, textTransform: "uppercase" }}>Tier</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#00BFFF" }}>{row.tier}</div>
      </div>

      <div>
        <label
          htmlFor={inputId}
          style={{ display: "block", fontSize: 11, opacity: 0.6, marginBottom: 6 }}
        >
          Points to reach {row.tier}
        </label>
        <input
          id={inputId}
          type="number"
          min={prev ? prev.min + 1 : 1}
          max={next ? next.min - 1 : undefined}
          value={min}
          onChange={(e) => setMin(Number(e.target.value))}
          style={inputStyle}
        />
        <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>
          {prev ? `> ${prev.tier} (${prev.min.toLocaleString()})` : "no lower bound"}
          {next ? ` and < ${next.tier} (${next.min.toLocaleString()})` : ""}
        </div>
      </div>

      <button type="submit" disabled={update.isPending} style={primaryBtnStyle}>
        {update.isPending ? "Saving…" : `Save ${row.tier}`}
      </button>
    </form>
  );
}

export default function TierBandsPage() {
  const { data, isLoading, error } = useTierBands();
  const rows = [...(data ?? [])].sort((a, b) => a.min - b.min);

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Quest Tier Bands</h1>
        <ExportCsvButton endpoint="/api/admin/tier-bands/export" />
      </div>
      <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 20 }}>
        Set the total quest points required to reach each tier. Thresholds must stay strictly
        ascending — the server rejects a value that isn&apos;t between its neighbors.
      </p>

      {isLoading && <p style={{ fontSize: 13, opacity: 0.6 }}>Loading tier bands…</p>}
      {error && <p style={{ fontSize: 13, color: "#f87171" }}>Failed to load: {error.message}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map((row, i) => (
          <TierRow key={row.tier} row={row} prev={rows[i - 1]} next={rows[i + 1]} />
        ))}
      </div>
    </div>
  );
}
