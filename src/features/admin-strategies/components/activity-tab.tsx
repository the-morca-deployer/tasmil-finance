"use client";

import { Loader2 } from "lucide-react";
import { ExportCsvButton } from "@/shared/components/export-csv-button";
import { useAdminPublishers, useMarketplaceLeaderboard } from "../hooks/use-admin-marketplace";

function shortAddr(addr: string): string {
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-6)}` : addr;
}

export function ActivityTab() {
  const publishers = useAdminPublishers();
  const leaderboard = useMarketplaceLeaderboard();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>Publishers</h2>
          <ExportCsvButton endpoint="/api/admin/marketplace/publishers/export" />
        </div>
        {publishers.isLoading ? (
          <Loader2 className="animate-spin" />
        ) : (publishers.data ?? []).length === 0 ? (
          <div style={{ color: "rgba(245,248,252,0.4)", fontSize: 13 }}>No publishers yet</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "rgba(245,248,252,0.4)" }}>
                <th style={{ padding: "8px 10px" }}>Name</th>
                <th style={{ padding: "8px 10px" }}>Address</th>
                <th style={{ padding: "8px 10px", textAlign: "right" }}>Commission (bps)</th>
                <th style={{ padding: "8px 10px", textAlign: "right" }}>Strategies</th>
                <th style={{ padding: "8px 10px" }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {(publishers.data ?? []).map((p) => (
                <tr key={p.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <td style={{ padding: 10, fontWeight: 600 }}>{p.name}</td>
                  <td style={{ padding: 10, fontFamily: "monospace", fontSize: 11 }}>
                    {shortAddr(p.stellarAddress)}
                  </td>
                  <td style={{ padding: 10, textAlign: "right" }}>{p.commissionBps}</td>
                  <td style={{ padding: 10, textAlign: "right" }}>{p.strategyCount}</td>
                  <td style={{ padding: 10, color: "rgba(245,248,252,0.6)", fontSize: 12 }}>
                    {p.createdAt.slice(0, 10)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700 }}>Strategy leaderboard (by TVL)</h2>
        {leaderboard.isLoading ? (
          <Loader2 className="animate-spin" />
        ) : (leaderboard.data ?? []).length === 0 ? (
          <div style={{ color: "rgba(245,248,252,0.4)", fontSize: 13 }}>
            No ranked strategies yet
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "rgba(245,248,252,0.4)" }}>
                <th style={{ padding: "8px 10px" }}>#</th>
                <th style={{ padding: "8px 10px" }}>Strategy</th>
                <th style={{ padding: "8px 10px" }}>Publisher</th>
                <th style={{ padding: "8px 10px", textAlign: "right" }}>APY %</th>
                <th style={{ padding: "8px 10px", textAlign: "right" }}>TVL (USD)</th>
                <th style={{ padding: "8px 10px", textAlign: "right" }}>Users</th>
              </tr>
            </thead>
            <tbody>
              {(leaderboard.data ?? []).map((e) => (
                <tr key={e.strategyId} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <td style={{ padding: 10, color: "rgba(245,248,252,0.4)" }}>{e.rank}</td>
                  <td style={{ padding: 10, fontWeight: 600 }}>{e.name}</td>
                  <td style={{ padding: 10 }}>{e.publisherName || "—"}</td>
                  <td style={{ padding: 10, textAlign: "right" }}>{e.apy.toFixed(2)}</td>
                  <td style={{ padding: 10, textAlign: "right", fontWeight: 600 }}>
                    {e.tvlUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: 10, textAlign: "right" }}>{e.userCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
