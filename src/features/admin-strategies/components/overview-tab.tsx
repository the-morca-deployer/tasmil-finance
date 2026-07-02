"use client";

import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { Fragment, useState } from "react";
import { ExportCsvButton } from "@/shared/components/export-csv-button";
import {
  useAdminStrategies,
  useMarketplaceOverview,
  useStrategyParticipants,
} from "../hooks/use-admin-marketplace";

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        flex: 1,
        padding: "14px 16px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: "rgba(245,248,252,0.4)" }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function ParticipantsRow({ strategyId }: { strategyId: string }) {
  const { data, isLoading } = useStrategyParticipants(strategyId);
  if (isLoading)
    return (
      <div style={{ padding: 14 }}>
        <Loader2 size={16} className="animate-spin" />
      </div>
    );
  const participants = data ?? [];
  if (participants.length === 0)
    return <div style={{ padding: 14, color: "rgba(245,248,252,0.4)", fontSize: 12 }}>No participants</div>;
  return (
    <table style={{ width: "100%", fontSize: 12 }}>
      <thead>
        <tr style={{ textAlign: "left", color: "rgba(245,248,252,0.4)" }}>
          <th style={{ padding: "6px 10px" }}>Wallet</th>
          <th style={{ padding: "6px 10px", textAlign: "right" }}>Deposited (USD)</th>
          <th style={{ padding: "6px 10px", textAlign: "right" }}>Share %</th>
          <th style={{ padding: "6px 10px" }}>Joined</th>
        </tr>
      </thead>
      <tbody>
        {participants.map((p) => (
          <tr key={p.wallet}>
            <td style={{ padding: "6px 10px", fontFamily: "monospace" }}>
              {p.wallet.length > 12 ? `${p.wallet.slice(0, 6)}…${p.wallet.slice(-6)}` : p.wallet}
            </td>
            <td style={{ padding: "6px 10px", textAlign: "right" }}>
              {p.deposited.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </td>
            <td style={{ padding: "6px 10px", textAlign: "right" }}>{p.sharePct}%</td>
            <td style={{ padding: "6px 10px", color: "rgba(245,248,252,0.6)" }}>{p.joined.slice(0, 10)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function OverviewTab() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const overview = useMarketplaceOverview();
  const strategies = useAdminStrategies();

  const o = overview.data;
  const rows = strategies.data ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {overview.isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
          <Loader2 className="animate-spin" />
        </div>
      ) : o ? (
        <div style={{ display: "flex", gap: 12 }}>
          <Kpi
            label="Total TVL"
            value={`$${o.totalTvlUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          />
          <Kpi label="Depositors" value={o.totalDepositors.toLocaleString()} />
          <Kpi label="Published" value={String(o.statusCounts.PUBLISHED)} />
          <Kpi label="Pending" value={String(o.statusCounts.PENDING)} />
          <Kpi label="Publishers" value={String(o.publisherCount)} />
        </div>
      ) : (
        <div style={{ color: "#FB7185" }}>Failed to load overview</div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontSize: 15, fontWeight: 700 }}>Per-strategy breakdown</h2>
        <ExportCsvButton endpoint="/api/admin/marketplace/strategies/export" />
      </div>

      {strategies.isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "rgba(245,248,252,0.4)" }}>
              <th style={{ padding: "8px 10px", width: 28 }} />
              <th style={{ padding: "8px 10px" }}>Strategy</th>
              <th style={{ padding: "8px 10px" }}>Asset</th>
              <th style={{ padding: "8px 10px", textAlign: "right" }}>TVL (USD)</th>
              <th style={{ padding: "8px 10px", textAlign: "right" }}>Depositors</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <Fragment key={s.id}>
                <tr
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}
                  onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                >
                  <td style={{ padding: 10 }}>
                    {expandedId === s.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </td>
                  <td style={{ padding: 10, fontWeight: 600 }}>{s.name}</td>
                  <td style={{ padding: 10 }}>{s.baseAsset}</td>
                  <td style={{ padding: 10, textAlign: "right", fontWeight: 600 }}>
                    {s.tvlUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: 10, textAlign: "right" }}>{s.userCount}</td>
                </tr>
                {expandedId === s.id && (
                  <tr>
                    <td colSpan={5} style={{ background: "rgba(255,255,255,0.02)" }}>
                      <ParticipantsRow strategyId={s.id} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
