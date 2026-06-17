"use client";

import { Copy, Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAdminQuestWallets } from "@/features/admin/hooks/use-admin-quest-wallets";

const LIMIT = 50;

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => null);
}

function exportCsv(
  rows: {
    rank: number;
    walletAddress: string;
    username: string | null;
    totalPoints: number;
    tier: string | null;
  }[]
) {
  const header = "rank,wallet_address,username,total_points,tier";
  const lines = rows.map(
    (r) => `${r.rank},${r.walletAddress},${r.username ?? ""},${r.totalPoints},${r.tier ?? ""}`
  );
  const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `quest-wallets-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminQuestWalletsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError, error, refetch } = useAdminQuestWallets(LIMIT, search);

  const entries = data?.entries ?? [];
  const total = data?.total ?? 0;

  function handleCopy(addr: string) {
    copyToClipboard(addr);
    setCopied(addr);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Quest Wallets</h1>
        <button
          type="button"
          onClick={() => exportCsv(entries)}
          disabled={entries.length === 0}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)",
            color: "#F5F8FC",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      <input
        placeholder="Search by wallet address…"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        style={{
          padding: "9px 12px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.04)",
          color: "#F5F8FC",
          maxWidth: 420,
        }}
      />

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Loader2 className="animate-spin" />
        </div>
      ) : isError ? (
        <div style={{ color: "#FB7185" }}>
          Failed to load: {error?.message}{" "}
          <button type="button" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      ) : entries.length === 0 ? (
        <div style={{ color: "rgba(245,248,252,0.4)", padding: 40, textAlign: "center" }}>
          No quest wallets found
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "rgba(245,248,252,0.4)" }}>
              <th style={{ padding: "8px 10px" }}>#</th>
              <th style={{ padding: "8px 10px" }}>Wallet</th>
              <th style={{ padding: "8px 10px" }}>Username</th>
              <th style={{ padding: "8px 10px" }}>Tier</th>
              <th style={{ padding: "8px 10px", textAlign: "right" }}>Points</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.walletAddress} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <td style={{ padding: "10px", color: "rgba(245,248,252,0.4)" }}>{e.rank}</td>
                <td style={{ padding: "10px", fontFamily: "monospace" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {e.walletAddress.length > 12
                      ? `${e.walletAddress.slice(0, 6)}…${e.walletAddress.slice(-6)}`
                      : e.walletAddress}
                    <button
                      type="button"
                      onClick={() => handleCopy(e.walletAddress)}
                      title="Copy address"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: copied === e.walletAddress ? "#4ADE80" : "rgba(245,248,252,0.4)",
                        padding: 2,
                      }}
                    >
                      <Copy size={13} />
                    </button>
                  </span>
                </td>
                <td style={{ padding: "10px", color: "rgba(245,248,252,0.6)", fontSize: 12 }}>
                  {e.username ?? "—"}
                </td>
                <td style={{ padding: "10px" }}>
                  {e.tier ? (
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        background: "rgba(99,102,241,0.15)",
                        color: "#a5b4fc",
                      }}
                    >
                      {e.tier}
                    </span>
                  ) : (
                    <span style={{ color: "rgba(245,248,252,0.3)" }}>—</span>
                  )}
                </td>
                <td style={{ padding: "10px", textAlign: "right", fontWeight: 600 }}>
                  {e.totalPoints.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ fontSize: 12, color: "rgba(245,248,252,0.4)", textAlign: "right" }}>
        {total} total wallets
      </div>
    </div>
  );
}
