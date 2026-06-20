"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  type CohortFallbackRow,
  type CohortMember,
  useCohortConfig,
  useCohortFallbackLog,
  useCohortMembers,
  useUpdateCohortConfig,
} from "@/features/admin/hooks/use-admin-cohort-sponsor";
import {
  useResetSponsorSlots,
  useSponsorBalance,
  useSponsorConfig,
  useSponsorLogs,
  useSponsorStats,
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

// ===========================================================================
// Cohort sponsor (v2) — new gas-sponsorship module
// ===========================================================================

function stroopsToXlm(stroops: string | bigint | number): string {
  const n = typeof stroops === "string" ? Number(stroops) : Number(stroops);
  if (!Number.isFinite(n)) return "0";
  return (n / 1e7).toFixed(7);
}

function CohortConfigCard() {
  const { data, isLoading } = useCohortConfig();
  const mutation = useUpdateCohortConfig();
  const [cohortSize, setCohortSize] = useState<string>("");
  const [maxTxPerUser, setMaxTxPerUser] = useState<string>("");
  const [maxXlmPerTx, setMaxXlmPerTx] = useState<string>("");
  const [enabled, setEnabled] = useState<boolean>(true);

  useEffect(() => {
    if (!data) return;
    setCohortSize(String(data.cohortSize ?? ""));
    setMaxTxPerUser(String(data.maxTxPerUser ?? ""));
    setMaxXlmPerTx(String(data.maxXlmPerTx ?? ""));
    setEnabled(Boolean(data.enabled));
  }, [data]);

  if (isLoading || !data) {
    return (
      <div style={card}>
        <Loader2 size={16} className="animate-spin" />
      </div>
    );
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      cohortSize: Number(cohortSize),
      maxTxPerUser: Number(maxTxPerUser),
      maxXlmPerTx,
      enabled,
    });
  };

  return (
    <div style={card} data-testid="cohort-config-card">
      <h2 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 12px" }}>
        Cohort sponsor (v2) — config
      </h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={label}>Cohort size</div>
            <input
              data-testid="cohort-cohort-size"
              type="number"
              min={0}
              value={cohortSize}
              onChange={(e) => setCohortSize(e.target.value)}
              style={input}
            />
          </div>
          <div>
            <div style={label}>Max TX / user</div>
            <input
              data-testid="cohort-max-tx-per-user"
              type="number"
              min={0}
              value={maxTxPerUser}
              onChange={(e) => setMaxTxPerUser(e.target.value)}
              style={input}
            />
          </div>
          <div>
            <div style={label}>Max XLM / TX</div>
            <input
              data-testid="cohort-max-xlm-per-tx"
              type="text"
              value={maxXlmPerTx}
              onChange={(e) => setMaxXlmPerTx(e.target.value)}
              style={input}
            />
          </div>
          <div>
            <div style={label}>Network</div>
            <div style={value}>{data.network}</div>
          </div>
        </div>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <input
            data-testid="cohort-enabled"
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          Enabled
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            data-testid="cohort-save"
            type="submit"
            disabled={mutation.isPending}
            style={{
              padding: "6px 16px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(103,232,249,0.12)",
              color: "inherit",
              cursor: mutation.isPending ? "not-allowed" : "pointer",
              opacity: mutation.isPending ? 0.6 : 1,
            }}
          >
            {mutation.isPending ? "Saving…" : "Save"}
          </button>
          <span style={{ fontSize: 11, color: "rgba(245,248,252,0.4)" }}>
            v{data.version} · updated {new Date(data.updatedAt).toLocaleString()}
          </span>
        </div>
      </form>
    </div>
  );
}

function CohortMembersTable() {
  const { data, isLoading } = useCohortMembers(100);
  if (isLoading || !data) {
    return (
      <div style={card}>
        <Loader2 size={16} className="animate-spin" />
      </div>
    );
  }
  return (
    <div style={card} data-testid="cohort-members-card">
      <h2 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 12px" }}>
        Cohort members ({data.members.length})
      </h2>
      {data.members.length === 0 ? (
        <p style={{ fontSize: 13, color: "rgba(245,248,252,0.5)" }}>No members yet.</p>
      ) : (
        <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "rgba(245,248,252,0.4)" }}>
              <th style={{ padding: "6px 8px" }}>Rank</th>
              <th style={{ padding: "6px 8px" }}>User ID</th>
              <th style={{ padding: "6px 8px" }}>Assigned</th>
              <th style={{ padding: "6px 8px" }}>Modal seen</th>
              <th style={{ padding: "6px 8px" }}>TX count</th>
              <th style={{ padding: "6px 8px" }}>XLM sponsored</th>
            </tr>
          </thead>
          <tbody>
            {data.members.map((m: CohortMember) => (
              <tr key={m.userId} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <td style={{ padding: "6px 8px", fontWeight: 600 }}>#{m.rank}</td>
                <td style={{ padding: "6px 8px", fontFamily: "monospace" }}>
                  {m.userId.slice(0, 12)}…
                </td>
                <td style={{ padding: "6px 8px" }}>
                  {new Date(m.assignedAt).toLocaleDateString()}
                </td>
                <td style={{ padding: "6px 8px" }}>
                  {m.modalSeenAt ? "✓" : <span style={{ opacity: 0.4 }}>—</span>}
                </td>
                <td style={{ padding: "6px 8px" }}>{m.txCount}</td>
                <td style={{ padding: "6px 8px" }}>{stroopsToXlm(m.xlmSponsoredStroops)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function CohortFallbackLogTable() {
  const { data, isLoading } = useCohortFallbackLog(50);
  if (isLoading || !data) {
    return (
      <div style={card}>
        <Loader2 size={16} className="animate-spin" />
      </div>
    );
  }
  return (
    <div style={card} data-testid="cohort-fallback-card">
      <h2 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 12px" }}>
        Cohort fallback log ({data.rows.length})
      </h2>
      {data.rows.length === 0 ? (
        <p style={{ fontSize: 13, color: "rgba(245,248,252,0.5)" }}>No fallback events recorded.</p>
      ) : (
        <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "rgba(245,248,252,0.4)" }}>
              <th style={{ padding: "6px 8px" }}>When</th>
              <th style={{ padding: "6px 8px" }}>Reason</th>
              <th style={{ padding: "6px 8px" }}>User</th>
              <th style={{ padding: "6px 8px" }}>TX</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r: CohortFallbackRow) => (
              <tr key={r.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <td style={{ padding: "6px 8px" }}>{new Date(r.createdAt).toLocaleString()}</td>
                <td style={{ padding: "6px 8px" }}>{r.reason}</td>
                <td style={{ padding: "6px 8px", fontFamily: "monospace" }}>
                  {r.userId ? `${r.userId.slice(0, 12)}…` : "—"}
                </td>
                <td style={{ padding: "6px 8px", fontFamily: "monospace" }}>
                  {r.txHash ? `${r.txHash.slice(0, 10)}…` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

      <hr
        style={{
          border: "none",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          margin: "32px 0 20px",
        }}
      />
      <CohortConfigCard />
      <CohortMembersTable />
      <CohortFallbackLogTable />
    </div>
  );
}
