"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import {
  useSponsorBalance,
  useSponsorConfig,
  useSponsorLogs,
  useSponsorStats,
  useResetSponsorSlots,
  useTestTelegramAlert,
  useUpdateSponsorConfig,
} from "@/features/admin/hooks/use-admin-sponsor";

const LIMIT = 20;

const card: React.CSSProperties = {
  padding: "20px 24px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  marginBottom: 16,
};

const label: React.CSSProperties = {
  fontSize: 11,
  color: "rgba(245,248,252,0.4)",
  marginBottom: 4,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const value: React.CSSProperties = { fontSize: 22, fontWeight: 700 };

const input: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8,
  color: "inherit",
  padding: "6px 10px",
  fontSize: 14,
  width: 120,
};

function BalanceCard() {
  const { data, isLoading, refetch, isFetching } = useSponsorBalance();
  const { data: cfg } = useSponsorConfig();
  const threshold = (cfg as { xlmAlertThreshold?: number } | undefined)?.xlmAlertThreshold ?? 5;
  const balance = data?.balance ?? 0;

  let badgeColor: string;
  if (balance > 0 && balance <= threshold) {
    badgeColor = "#f87171";
  } else if (balance > 0 && balance <= threshold * 2) {
    badgeColor = "#fbbf24";
  } else {
    badgeColor = "#4ade80";
  }

  return (
    <div style={card}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>Sponsor Account Balance</h2>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          style={{
            fontSize: 12,
            background: "transparent",
            border: "none",
            color: "#38bdf8",
            cursor: isFetching ? "not-allowed" : "pointer",
            opacity: isFetching ? 0.5 : 1,
          }}
        >
          {isFetching ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      {isLoading ? (
        <Loader2 className="animate-spin" size={16} />
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: badgeColor }}>
            {balance.toFixed(4)} XLM
          </span>
          {data?.publicKey && (
            <span style={{ fontSize: 12, fontFamily: "monospace", color: "rgba(245,248,252,0.4)" }}>
              {data.publicKey.slice(0, 6)}...{data.publicKey.slice(-6)}
            </span>
          )}
        </div>
      )}
      <p style={{ fontSize: 12, color: "rgba(245,248,252,0.3)", margin: "8px 0 0" }}>
        Alert threshold: {threshold} XLM
      </p>
    </div>
  );
}

function TestAlertButton() {
  const { mutate, isPending } = useTestTelegramAlert();
  return (
    <button
      onClick={() => mutate()}
      disabled={isPending}
      style={{
        fontSize: 13,
        padding: "6px 14px",
        borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.15)",
        background: "transparent",
        color: "inherit",
        cursor: isPending ? "not-allowed" : "pointer",
        opacity: isPending ? 0.5 : 1,
      }}
    >
      {isPending ? "Sending..." : "Test Alert"}
    </button>
  );
}

function ResetSlotsButton() {
  const { mutate, isPending } = useResetSponsorSlots();
  return (
    <button
      onClick={() => {
        if (window.confirm("Reset slot counter to 0? This allows new users to be sponsored.")) {
          mutate();
        }
      }}
      disabled={isPending}
      style={{
        fontSize: 13,
        padding: "6px 14px",
        borderRadius: 8,
        border: "1px solid rgba(239,68,68,0.3)",
        background: "transparent",
        color: "#f87171",
        cursor: isPending ? "not-allowed" : "pointer",
        opacity: isPending ? 0.5 : 1,
      }}
    >
      {isPending ? "Resetting..." : "Reset Slot Counter"}
    </button>
  );
}

function ConfigCard() {
  const { data: cfg, isLoading } = useSponsorConfig();
  const update = useUpdateSponsorConfig();
  const [editing, setEditing] = useState(false);
  const [slots, setSlots] = useState("");
  const [txPerDay, setTxPerDay] = useState("");
  const [active, setActive] = useState(true);
  const [xlmAlertThreshold, setXlmAlertThreshold] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");

  function startEdit() {
    if (!cfg) return;
    setSlots(String(cfg.maxSlots));
    setTxPerDay(String(cfg.maxTxPerUserPerDay));
    setActive(cfg.active);
    const cfgAny = cfg as unknown as Record<string, unknown>;
    setXlmAlertThreshold(String(cfgAny.xlmAlertThreshold ?? ""));
    setTelegramChatId(String(cfgAny.telegramChatId ?? ""));
    setEditing(true);
  }

  function save() {
    const extra: Record<string, unknown> = {};
    if (xlmAlertThreshold !== "") extra.xlmAlertThreshold = parseFloat(xlmAlertThreshold);
    if (telegramChatId !== "") extra.telegramChatId = telegramChatId;
    update.mutate(
      {
        maxSlots: Number(slots),
        maxTxPerUserPerDay: Number(txPerDay),
        active,
        ...extra,
      } as Parameters<typeof update.mutate>[0],
      { onSuccess: () => setEditing(false) }
    );
  }

  if (isLoading)
    return (
      <div style={card}>
        <Loader2 className="animate-spin" size={16} />
      </div>
    );
  if (!cfg) return null;

  return (
    <div style={card}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>Sponsor Config</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "2px 10px",
              borderRadius: 99,
              background: cfg.active ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
              color: cfg.active ? "#4ade80" : "#f87171",
            }}
          >
            {cfg.active ? "ACTIVE" : "PAUSED"}
          </span>
          {!editing && (
            <button
              onClick={startEdit}
              style={{
                fontSize: 12,
                padding: "4px 12px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "transparent",
                color: "inherit",
                cursor: "pointer",
              }}
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={label}>Max Slots</span>
              <input
                style={input}
                type="number"
                value={slots}
                onChange={(e) => setSlots(e.target.value)}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={label}>Max TX / User / Day</span>
              <input
                style={input}
                type="number"
                value={txPerDay}
                onChange={(e) => setTxPerDay(e.target.value)}
              />
            </label>
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                justifyContent: "flex-end",
              }}
            >
              <span style={label}>Active</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8, height: 34 }}>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: "pointer" }}
                />
                <span style={{ fontSize: 13 }}>{active ? "Enabled" : "Paused"}</span>
              </div>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={label}>Alert Threshold (XLM)</span>
              <input
                style={input}
                type="number"
                step="0.1"
                min="0"
                value={xlmAlertThreshold}
                onChange={(e) => setXlmAlertThreshold(e.target.value)}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={label}>Telegram Chat ID</span>
              <input
                style={{ ...input, width: 180, fontFamily: "monospace" }}
                type="text"
                placeholder="-100xxxxxxxxx"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
              />
            </label>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={save}
              disabled={update.isPending}
              style={{
                fontSize: 13,
                padding: "6px 16px",
                borderRadius: 8,
                border: "none",
                background: "#0ea5e9",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {update.isPending && <Loader2 size={13} className="animate-spin" />}
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              style={{
                fontSize: 13,
                padding: "6px 16px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "transparent",
                color: "inherit",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
          <div>
            <div style={label}>Max Slots</div>
            <div style={value}>{cfg.maxSlots}</div>
          </div>
          <div>
            <div style={label}>Slots Used</div>
            <div style={value}>{cfg.currentSlots ?? "—"}</div>
          </div>
          <div>
            <div style={label}>Max TX / User / Day</div>
            <div style={value}>{cfg.maxTxPerUserPerDay}</div>
          </div>
          <div>
            <div style={label}>Rule</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{cfg.rule}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatsCard() {
  const { data: stats, isLoading } = useSponsorStats();

  if (isLoading)
    return (
      <div style={card}>
        <Loader2 className="animate-spin" size={16} />
      </div>
    );
  if (!stats) return null;

  const cards = [
    { label: "Total Sponsored", val: stats.total },
    { label: "XLM Spent", val: `${stats.totalFeeXlm.toFixed(4)} XLM` },
    { label: "Onboarding TXs", val: stats.byType.onboarding },
    { label: "AI Chat TXs", val: stats.byType.ai_chat },
    { label: "Slot Usage", val: `${(stats.slotUsage * 100).toFixed(1)}%` },
  ];

  return (
    <div style={card}>
      <h2 style={{ fontWeight: 600, fontSize: 15, margin: "0 0 16px" }}>Sponsorship Stats</h2>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {cards.map((c) => (
          <div
            key={c.label}
            style={{
              flex: "1 1 100px",
              padding: "12px 16px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <div style={label}>{c.label}</div>
            <div style={value}>{c.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LogsTable() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSponsorLogs(page, LIMIT);

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;

  function trunc(s: string, n: number) {
    return s.length > n ? `${s.slice(0, n)}…` : s;
  }

  return (
    <div style={card}>
      <h2 style={{ fontWeight: 600, fontSize: 15, margin: "0 0 16px" }}>Sponsor Logs</h2>
      {isLoading ? (
        <Loader2 className="animate-spin" size={16} />
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ color: "rgba(245,248,252,0.4)", textAlign: "left" }}>
                  {["Date", "Public Key", "TX Hash", "Type", "Fee (XLM)"].map((h) => (
                    <th
                      key={h}
                      style={{ padding: "6px 12px", fontWeight: 500, whiteSpace: "nowrap" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.data ?? []).map((log) => (
                  <tr key={log.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: "8px 12px", fontFamily: "monospace" }}>
                      {trunc(log.publicKey, 16)}
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <a
                        href={`https://stellar.expert/explorer/public/tx/${log.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#38bdf8",
                          textDecoration: "none",
                          fontFamily: "monospace",
                        }}
                      >
                        {trunc(log.txHash, 16)}
                      </a>
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 99,
                          background:
                            log.txType === "onboarding"
                              ? "rgba(139,92,246,0.15)"
                              : "rgba(14,165,233,0.15)",
                          color: log.txType === "onboarding" ? "#a78bfa" : "#38bdf8",
                        }}
                      >
                        {log.txType}
                      </span>
                    </td>
                    <td style={{ padding: "8px 12px" }}>{log.feeXlm.toFixed(5)}</td>
                  </tr>
                ))}
                {!data?.data?.length && (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: "24px 12px",
                        textAlign: "center",
                        color: "rgba(245,248,252,0.3)",
                      }}
                    >
                      No sponsorship logs yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: "4px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "transparent",
                  color: "inherit",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  opacity: page === 1 ? 0.4 : 1,
                }}
              >
                ‹
              </button>
              <span style={{ fontSize: 13, padding: "4px 8px", color: "rgba(245,248,252,0.5)" }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: "4px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "transparent",
                  color: "inherit",
                  cursor: page === totalPages ? "not-allowed" : "pointer",
                  opacity: page === totalPages ? 0.4 : 1,
                }}
              >
                ›
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SponsorAdminPage() {
  return (
    <div style={{ padding: "24px 32px", maxWidth: 960 }}>
      <h1 style={{ fontWeight: 700, fontSize: 22, margin: "0 0 20px" }}>Gas Sponsor</h1>
      <BalanceCard />
      <ConfigCard />
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <TestAlertButton />
        <ResetSlotsButton />
      </div>
      <StatsCard />
      <LogsTable />
    </div>
  );
}
