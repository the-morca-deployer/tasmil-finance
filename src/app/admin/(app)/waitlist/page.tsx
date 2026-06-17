"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Loader2,
  Mail,
  Send,
} from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { StatusPill } from "@/features/admin/components/status-pill";
import {
  useBulkSendAccess,
  useSendAccessToEntry,
  useUpdateWaitlistEntry,
  useWaitlistDispatches,
  useWaitlistEntries,
} from "@/features/admin/hooks/use-admin-waitlist";
import { type EmailDispatch, WAITLIST_STATUSES, type WaitlistStatus } from "@/features/admin/types";
import { useAdminDashboard } from "@/features/admin-whitelist/hooks/use-admin-dashboard";

const LIMIT = 20;

interface Entry {
  id: string;
  walletAddress: string | null;
  email: string | null;
  status: string;
  successfulReferralCount: number;
  createdAt: string;
}

function StatusCards() {
  const { data } = useAdminDashboard();
  const cards = [
    { label: "Total", value: data?.waitlist?.allTime ?? "—" },
    { label: "Access Sent", value: data?.emailDispatches?.accessSent ?? "—" },
    { label: "Email Confirmed", value: data?.emailDispatches?.confirmationSent ?? "—" },
    { label: "Wallets", value: data?.walletStats?.totalWalletEntries ?? "—" },
    { label: "Referrals", value: data?.walletStats?.totalSuccessfulReferrals ?? "—" },
  ];
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      {cards.map((c) => (
        <div
          key={c.label}
          style={{
            flex: "1 1 100px",
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
          }}
        >
          <div style={{ fontSize: 11, color: "rgba(245,248,252,0.4)", marginBottom: 4 }}>
            {c.label}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}

function DispatchHistory({ entryId, email }: { entryId: string; email: string | null }) {
  const { data: dispatches, isLoading } = useWaitlistDispatches(entryId);

  if (isLoading) {
    return (
      <tr>
        <td colSpan={7} style={{ padding: "12px 20px" }}>
          <Loader2 size={14} className="animate-spin" />
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td
        colSpan={7}
        style={{
          padding: "12px 20px",
          background: "rgba(255,255,255,0.02)",
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 8,
            color: "rgba(245,248,252,0.6)",
          }}
        >
          Email history{email ? ` · ${email}` : ""}
        </div>
        {!dispatches || dispatches.length === 0 ? (
          <div style={{ color: "rgba(245,248,252,0.3)", fontSize: 12 }}>No emails sent yet</div>
        ) : (
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ color: "rgba(245,248,252,0.4)" }}>
                <th style={{ textAlign: "left", padding: "4px 8px" }}>Type</th>
                <th style={{ textAlign: "left", padding: "4px 8px" }}>Status</th>
                <th style={{ textAlign: "left", padding: "4px 8px" }}>Sent At</th>
                <th style={{ textAlign: "left", padding: "4px 8px" }}>Error</th>
              </tr>
            </thead>
            <tbody>
              {dispatches.map((d: EmailDispatch) => (
                <tr key={d.id}>
                  <td style={{ padding: "4px 8px", fontFamily: "monospace" }}>{d.templateType}</td>
                  <td
                    style={{
                      padding: "4px 8px",
                      color:
                        d.status === "SENT"
                          ? "#34D399"
                          : d.status === "FAILED"
                            ? "#FB7185"
                            : "rgba(245,248,252,0.6)",
                    }}
                  >
                    {d.status}
                  </td>
                  <td style={{ padding: "4px 8px", color: "rgba(245,248,252,0.5)" }}>
                    {d.sentAt ? new Date(d.sentAt).toLocaleString() : "—"}
                  </td>
                  <td style={{ padding: "4px 8px", color: "#FB7185" }}>{d.errorMessage ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </td>
    </tr>
  );
}

export default function WaitlistPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError, error, refetch } = useWaitlistEntries({
    page,
    limit: LIMIT,
    status: statusFilter || undefined,
    search: search || undefined,
  });
  const update = useUpdateWaitlistEntry();
  const sendAccess = useSendAccessToEntry();
  const bulkSend = useBulkSendAccess();

  const items = (data?.items ?? []) as Entry[];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((e) => e.id)));
  }

  async function handleBulkSend() {
    setBulkConfirm(false);
    await bulkSend.mutateAsync({ entryIds: Array.from(selected) });
    setSelected(new Set());
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Waitlist</h1>

      <StatusCards />

      {selected.size > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            borderRadius: 10,
            background: "rgba(0,191,255,0.08)",
            border: "1px solid rgba(0,191,255,0.2)",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600 }}>{selected.size} selected</span>
          <button
            type="button"
            onClick={() => setBulkConfirm(true)}
            disabled={bulkSend.isPending}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 8,
              background: "rgba(0,191,255,0.15)",
              border: "1px solid rgba(0,191,255,0.3)",
              color: "#00BFFF",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            <Mail size={14} />
            Send Access Email
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(245,248,252,0.5)",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Clear
          </button>
        </div>
      )}

      {bulkConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: "#131720",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 14,
              padding: 28,
              width: 360,
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Confirm Bulk Send</h3>
            <p style={{ fontSize: 13, color: "rgba(245,248,252,0.6)", marginBottom: 20 }}>
              Send access emails to {selected.size} selected entries?
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setBulkConfirm(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "transparent",
                  color: "rgba(245,248,252,0.7)",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkSend}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: "linear-gradient(135deg, #00BFFF, #0080FF)",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Send {selected.size} Emails
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          placeholder="Search wallet or email…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{
            flex: 1,
            minWidth: 220,
            padding: "9px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
            color: "#F5F8FC",
          }}
        />
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: "9px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
            color: "#F5F8FC",
          }}
        >
          <option value="">All statuses</option>
          {WAITLIST_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Loader2 className="animate-spin" />
        </div>
      ) : isError ? (
        <div style={{ color: "#FB7185" }}>
          Failed to load: {(error as Error)?.message}{" "}
          <button type="button" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div style={{ color: "rgba(245,248,252,0.4)", padding: 40, textAlign: "center" }}>
          No entries found
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "rgba(245,248,252,0.4)" }}>
              <th style={{ padding: "8px 10px", width: 32 }}>
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={selected.size === items.length && items.length > 0}
                  onChange={toggleAll}
                />
              </th>
              <th style={{ padding: "8px 10px" }}>Wallet</th>
              <th style={{ padding: "8px 10px" }}>Email</th>
              <th style={{ padding: "8px 10px" }}>Status</th>
              <th style={{ padding: "8px 10px" }}>Referrals</th>
              <th style={{ padding: "8px 10px" }}>Joined</th>
              <th style={{ padding: "8px 10px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <Fragment key={e.id}>
                <tr style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <td style={{ padding: "10px" }}>
                    <input
                      type="checkbox"
                      aria-label={`Select ${e.id}`}
                      checked={selected.has(e.id)}
                      onChange={() => toggleSelect(e.id)}
                    />
                  </td>
                  <td style={{ padding: "10px", fontFamily: "monospace" }}>
                    {e.walletAddress
                      ? `${e.walletAddress.slice(0, 6)}…${e.walletAddress.slice(-4)}`
                      : "—"}
                  </td>
                  <td style={{ padding: "10px" }}>{e.email ?? "—"}</td>
                  <td style={{ padding: "10px" }}>
                    <StatusPill status={e.status} />
                  </td>
                  <td style={{ padding: "10px" }}>{e.successfulReferralCount}</td>
                  <td style={{ padding: "10px" }}>{new Date(e.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: "10px" }}>
                    <div
                      style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}
                    >
                      <select
                        aria-label={`Status for ${e.id}`}
                        value={e.status}
                        disabled={update.isPending}
                        onChange={(ev) =>
                          update.mutate({ id: e.id, status: ev.target.value as WaitlistStatus })
                        }
                        style={{
                          padding: "5px 8px",
                          borderRadius: 8,
                          border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(255,255,255,0.04)",
                          color: "#F5F8FC",
                          fontSize: 12,
                        }}
                      >
                        {WAITLIST_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      {e.email && (e.status === "PENDING" || e.status === "CONFIRMED") && (
                        <button
                          type="button"
                          title="Send Access Email"
                          disabled={sendAccess.isPending}
                          onClick={() => sendAccess.mutate({ entryId: e.id, email: e.email! })}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "5px 8px",
                            borderRadius: 8,
                            border: "1px solid rgba(0,191,255,0.3)",
                            background: "rgba(0,191,255,0.08)",
                            color: "#00BFFF",
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          <Send size={12} /> Send
                        </button>
                      )}
                      <button
                        type="button"
                        title="Email history"
                        onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "5px 8px",
                          borderRadius: 8,
                          border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(255,255,255,0.04)",
                          color: "rgba(245,248,252,0.6)",
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        {expandedId === e.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedId === e.id && <DispatchHistory entryId={e.id} email={e.email} />}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 10,
        }}
      >
        <span style={{ fontSize: 12, color: "rgba(245,248,252,0.4)" }}>
          Page {page} / {totalPages} · {total} total
        </span>
        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          <ChevronLeft size={16} />
        </button>
        <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
