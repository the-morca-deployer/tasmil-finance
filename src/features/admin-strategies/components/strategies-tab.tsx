"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { ExportCsvButton } from "@/shared/components/export-csv-button";
import {
  useAdminStrategies,
  useApproveStrategy,
  useRejectStrategy,
} from "../hooks/use-admin-marketplace";
import type { StrategyStatus } from "../types";

const STATUS_FILTERS: Array<StrategyStatus | "ALL"> = [
  "ALL",
  "PENDING",
  "PUBLISHED",
  "PAUSED",
  "REJECTED",
  "INACTIVE",
];

const STATUS_COLORS: Record<StrategyStatus, { bg: string; fg: string }> = {
  PENDING: { bg: "rgba(251,191,36,0.15)", fg: "#FBBF24" },
  PUBLISHED: { bg: "rgba(74,222,128,0.15)", fg: "#4ADE80" },
  PAUSED: { bg: "rgba(148,163,184,0.15)", fg: "#94A3B8" },
  REJECTED: { bg: "rgba(251,113,133,0.15)", fg: "#FB7185" },
  INACTIVE: { bg: "rgba(148,163,184,0.15)", fg: "#94A3B8" },
};

function short(addr: string | null): string {
  if (!addr) return "—";
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-6)}` : addr;
}

export function StrategiesTab() {
  const [status, setStatus] = useState<StrategyStatus | "ALL">("ALL");
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    name: string;
    action: "approve" | "reject";
  } | null>(null);

  const { data, isLoading, isError } = useAdminStrategies(status === "ALL" ? undefined : status);
  const approve = useApproveStrategy();
  const reject = useRejectStrategy();

  const strategies = data ?? [];

  function handleConfirm() {
    if (!confirmAction) return;
    if (confirmAction.action === "approve") approve.mutate(confirmAction.id);
    else reject.mutate(confirmAction.id);
    setConfirmAction(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              style={{
                padding: "6px 12px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                border: "1px solid rgba(255,255,255,0.1)",
                background: status === s ? "rgba(0,191,255,0.2)" : "rgba(255,255,255,0.04)",
                color: status === s ? "#7DD3FC" : "rgba(245,248,252,0.6)",
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <ExportCsvButton
          endpoint="/api/admin/marketplace/strategies/export"
          params={status === "ALL" ? undefined : { status }}
        />
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Loader2 className="animate-spin" />
        </div>
      ) : isError ? (
        <div style={{ color: "#FB7185" }}>Failed to load strategies</div>
      ) : strategies.length === 0 ? (
        <div style={{ color: "rgba(245,248,252,0.4)", padding: 40, textAlign: "center" }}>
          No strategies
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "rgba(245,248,252,0.4)" }}>
              <th style={{ padding: "8px 10px" }}>Name</th>
              <th style={{ padding: "8px 10px" }}>Status</th>
              <th style={{ padding: "8px 10px" }}>Publisher</th>
              <th style={{ padding: "8px 10px" }}>Asset</th>
              <th style={{ padding: "8px 10px", textAlign: "right" }}>Fee (bps)</th>
              <th style={{ padding: "8px 10px", textAlign: "right" }}>TVL (USD)</th>
              <th style={{ padding: "8px 10px", textAlign: "right" }}>Depositors</th>
              <th style={{ padding: "8px 10px" }}>Keeper</th>
              <th style={{ padding: "8px 10px" }}>Published</th>
              <th style={{ padding: "8px 10px" }} />
            </tr>
          </thead>
          <tbody>
            {strategies.map((s) => (
              <tr key={s.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <td style={{ padding: 10, fontWeight: 600 }}>{s.name}</td>
                <td style={{ padding: 10 }}>
                  <span
                    style={{
                      padding: "3px 10px",
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 600,
                      background: STATUS_COLORS[s.status].bg,
                      color: STATUS_COLORS[s.status].fg,
                    }}
                  >
                    {s.status}
                  </span>
                </td>
                <td style={{ padding: 10 }}>
                  {s.publisherName ?? "—"}
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: 11,
                      color: "rgba(245,248,252,0.4)",
                    }}
                  >
                    {short(s.publisherAddress)}
                  </div>
                </td>
                <td style={{ padding: 10 }}>{s.baseAsset}</td>
                <td style={{ padding: 10, textAlign: "right" }}>{s.perfFeeBps}</td>
                <td style={{ padding: 10, textAlign: "right", fontWeight: 600 }}>
                  {s.tvlUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </td>
                <td style={{ padding: 10, textAlign: "right" }}>{s.userCount}</td>
                <td style={{ padding: 10, fontFamily: "monospace", fontSize: 11 }}>
                  {short(s.keeperWalletAddress)}
                </td>
                <td style={{ padding: 10, color: "rgba(245,248,252,0.6)", fontSize: 12 }}>
                  {s.publishedAt.slice(0, 10)}
                </td>
                <td style={{ padding: 10 }}>
                  {s.status === "PENDING" && (
                    <span style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        disabled={approve.isPending || reject.isPending}
                        onClick={() =>
                          setConfirmAction({ id: s.id, name: s.name, action: "approve" })
                        }
                        style={{
                          padding: "5px 10px",
                          borderRadius: 8,
                          fontSize: 12,
                          cursor: "pointer",
                          border: "1px solid rgba(74,222,128,0.3)",
                          background: "rgba(74,222,128,0.12)",
                          color: "#4ADE80",
                        }}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={approve.isPending || reject.isPending}
                        onClick={() =>
                          setConfirmAction({ id: s.id, name: s.name, action: "reject" })
                        }
                        style={{
                          padding: "5px 10px",
                          borderRadius: 8,
                          fontSize: 12,
                          cursor: "pointer",
                          border: "1px solid rgba(251,113,133,0.3)",
                          background: "rgba(251,113,133,0.12)",
                          color: "#FB7185",
                        }}
                      >
                        Reject
                      </button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {confirmAction && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 16px",
            borderRadius: 10,
            background:
              confirmAction.action === "approve"
                ? "rgba(74,222,128,0.08)"
                : "rgba(251,113,133,0.08)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <span style={{ fontSize: 13 }}>
            {confirmAction.action === "approve" ? "Approve" : "Reject"} "{confirmAction.name}"?
          </span>
          <button
            type="button"
            onClick={handleConfirm}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              background: confirmAction.action === "approve" ? "#4ADE80" : "#FB7185",
              color: "#0B0F14",
            }}
          >
            Confirm
          </button>
          <button
            type="button"
            onClick={() => setConfirmAction(null)}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              fontSize: 12,
              cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "transparent",
              color: "rgba(245,248,252,0.7)",
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
