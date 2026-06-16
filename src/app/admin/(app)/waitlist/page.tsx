"use client";

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { StatusPill } from "@/features/admin/components/status-pill";
import {
  useUpdateWaitlistEntry,
  useWaitlistEntries,
} from "@/features/admin/hooks/use-admin-waitlist";
import { WAITLIST_STATUSES, type WaitlistStatus } from "@/features/admin/types";

const LIMIT = 20;

interface Entry {
  id: string;
  walletAddress: string | null;
  email: string | null;
  status: string;
  successfulReferralCount: number;
  createdAt: string;
}

export default function WaitlistPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

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

  const items = (data?.items ?? []) as Entry[];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Waitlist</h1>

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
          Failed to load: {error?.message}{" "}
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
              <th style={{ padding: "8px 10px" }}>Wallet</th>
              <th style={{ padding: "8px 10px" }}>Email</th>
              <th style={{ padding: "8px 10px" }}>Status</th>
              <th style={{ padding: "8px 10px" }}>Referrals</th>
              <th style={{ padding: "8px 10px" }}>Joined</th>
              <th style={{ padding: "8px 10px" }}>Change</th>
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <tr key={e.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
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
                    }}
                  >
                    {WAITLIST_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
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
