"use client";

import { useEffect, useState } from "react";
import {
  REFERRAL_LAYERS,
  REFERRAL_SEGMENTS,
  type ReferralConfigRow,
  type ReferralSegment,
  useReferralConfig,
  useUpdateReferralConfig,
} from "@/features/admin/hooks/use-admin-referral-config";

const inputStyle: React.CSSProperties = {
  padding: "7px 10px",
  borderRadius: 7,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "#F5F8FC",
  fontSize: 13,
  width: 90,
};

const smallBtnStyle: React.CSSProperties = {
  padding: "5px 12px",
  borderRadius: 7,
  border: "none",
  background: "linear-gradient(135deg, #00BFFF, #0080FF)",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: 12,
};

function MatrixCell({
  layer,
  segment,
  row,
}: {
  layer: number;
  segment: ReferralSegment;
  row?: ReferralConfigRow;
}) {
  const update = useUpdateReferralConfig();
  const [form, setForm] = useState({ rateBps: row?.rateBps ?? 0, isActive: row?.isActive ?? true });

  // Keep the local form in sync when server data arrives or changes.
  useEffect(() => {
    setForm({ rateBps: row?.rateBps ?? 0, isActive: row?.isActive ?? true });
  }, [row?.rateBps, row?.isActive]);

  const inputId = `rate-${layer}-${segment}`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "12px 14px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          id={inputId}
          type="number"
          min={0}
          max={10000}
          value={form.rateBps}
          onChange={(e) => setForm((f) => ({ ...f, rateBps: Number(e.target.value) }))}
          style={inputStyle}
          aria-label={`Layer ${layer} ${segment} rate in bps`}
        />
        <span style={{ fontSize: 11, opacity: 0.5 }}>bps = {(form.rateBps / 100).toFixed(2)}%</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            aria-label={`Layer ${layer} ${segment} active`}
          />
          Active
        </label>
        <button
          type="button"
          onClick={() =>
            update.mutate({ layer, segment, rateBps: form.rateBps, isActive: form.isActive })
          }
          disabled={update.isPending}
          style={smallBtnStyle}
        >
          {update.isPending ? "Saving" : "Save"}
        </button>
      </div>
      {!row && (
        <span style={{ fontSize: 11, color: "#FBBF24" }}>
          Not set. Falls back to the NORMAL rate until saved.
        </span>
      )}
    </div>
  );
}

export default function ReferralConfigPage() {
  const { data, isLoading, error } = useReferralConfig();

  const byCell = new Map<string, ReferralConfigRow>();
  for (const row of data ?? []) {
    byCell.set(`${row.layer}:${row.segment}`, row);
  }

  return (
    <div style={{ padding: 24, maxWidth: 1000 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Referral Commission Matrix</h1>
      <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 20 }}>
        Commission rate in basis points per referral layer and earner segment. The earner&apos;s own
        segment picks the column. A cell that is not set falls back to the NORMAL rate for that
        layer. New rates apply to future claims only.
      </p>

      {isLoading && <p style={{ fontSize: 13, opacity: 0.6 }}>Loading commission matrix</p>}
      {error && <p style={{ fontSize: 13, color: "#f87171" }}>Failed to load: {error.message}</p>}

      {!isLoading && !error && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "80px repeat(3, 1fr)",
            gap: 12,
            alignItems: "stretch",
          }}
        >
          <div />
          {REFERRAL_SEGMENTS.map((segment) => (
            <div
              key={segment}
              style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                opacity: 0.7,
                alignSelf: "end",
                paddingBottom: 4,
              }}
            >
              {segment}
            </div>
          ))}
          {REFERRAL_LAYERS.map((layer) => (
            <div key={layer} style={{ display: "contents" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#00BFFF",
                }}
              >
                L{layer}
              </div>
              {REFERRAL_SEGMENTS.map((segment) => (
                <MatrixCell
                  key={`${layer}:${segment}`}
                  layer={layer}
                  segment={segment}
                  row={byCell.get(`${layer}:${segment}`)}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
