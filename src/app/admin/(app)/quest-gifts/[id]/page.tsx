"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  type GiftRecipientRow,
  useAdminGifts,
  useBatchGiftPayout,
  useGiftRecipients,
  useMarkGiftPayout,
  useResendGiftEmail,
  useResendGiftNotification,
} from "@/features/admin/hooks/use-admin-quest-gifts";

const inputStyle: React.CSSProperties = {
  padding: "7px 10px",
  borderRadius: 7,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "#F5F8FC",
  fontSize: 13,
  width: 90,
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

const cancelBtnStyle: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "transparent",
  color: "rgba(245,248,252,0.7)",
  cursor: "pointer",
  fontSize: 13,
};

const smallBtnStyle: React.CSSProperties = {
  padding: "5px 10px",
  borderRadius: 7,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "transparent",
  color: "rgba(245,248,252,0.75)",
  cursor: "pointer",
  fontSize: 12,
};

const truncate = (s?: string | null) =>
  s ? (s.length > 12 ? `${s.slice(0, 6)}...${s.slice(-4)}` : s) : "—";

function fmtDateTime(iso?: string | null) {
  return iso ? new Date(iso).toLocaleString() : "—";
}

// ---- Mark Paid modal (single row) ----
function MarkPaidModal({
  giftId,
  row,
  onClose,
}: {
  giftId: string;
  row: GiftRecipientRow;
  onClose: () => void;
}) {
  const markPayout = useMarkGiftPayout(giftId);
  const [txHash, setTxHash] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await markPayout.mutateAsync({ recipientId: row.id, paidTxHash: txHash.trim() || undefined });
    onClose();
  }

  return (
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
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#131720",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 14,
          padding: 28,
          width: 440,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>Mark payout paid</h3>
        <div style={{ fontSize: 13, color: "rgba(245,248,252,0.7)" }}>
          {truncate(row.walletAddress)} receives {row.usdcAwarded} USDC and {row.pointsAwarded} pts
        </div>
        <label style={{ fontSize: 12, opacity: 0.7 }}>
          Transaction hash (optional)
          <input
            placeholder="On-chain tx hash"
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            style={{
              padding: "9px 12px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)",
              color: "#F5F8FC",
              fontSize: 13,
              width: "100%",
              marginTop: 6,
            }}
          />
        </label>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} style={cancelBtnStyle}>
            Cancel
          </button>
          <button type="submit" disabled={markPayout.isPending} style={primaryBtnStyle}>
            {markPayout.isPending ? <Loader2 size={14} className="animate-spin" /> : "Mark Paid"}
          </button>
        </div>
      </form>
    </div>
  );
}

const RECIPIENTS_PAGE_SIZE = 50;

// ---- Recipient payout table + batch ----
function RecipientsTable({ giftId }: { giftId: string }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useGiftRecipients(giftId, page, RECIPIENTS_PAGE_SIZE);
  const batch = useBatchGiftPayout(giftId);
  const resendNote = useResendGiftNotification(giftId);
  const resendEmail = useResendGiftEmail(giftId);

  const [markRow, setMarkRow] = useState<GiftRecipientRow | null>(null);
  const [batchMode, setBatchMode] = useState(false);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [rowResults, setRowResults] = useState<
    Record<string, { success: boolean; error?: string }>
  >({});

  // Selection spans a single page's rows; changing pages would leave stale/invisible
  // selections that are confusing (and dangerous for a payout action), so reset on page change.
  // biome-ignore lint/correctness/useExhaustiveDependencies: page is a trigger, not read in the body
  useEffect(() => {
    setBatchMode(false);
    setSelected({});
    setRowResults({});
  }, [page]);

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / RECIPIENTS_PAGE_SIZE));
  const pending = rows.filter((r) => r.payoutStatus === "PENDING");

  function toggleSelect(id: string) {
    setSelected((s) => {
      const next = { ...s };
      if (id in next) delete next[id];
      else next[id] = "";
      return next;
    });
  }

  async function confirmBatch() {
    const items = Object.entries(selected).map(([recipientId, txHash]) => ({
      recipientId,
      paidTxHash: txHash.trim() || undefined,
    }));
    if (items.length === 0) return;
    const res = await batch.mutateAsync(items);
    const map: Record<string, { success: boolean; error?: string }> = {};
    for (const r of res.results) map[r.recipientId] = { success: r.success, error: r.error };
    setRowResults(map);
    setSelected({});
    setBatchMode(false);
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Recipients</h2>
        {pending.length > 0 &&
          (batchMode ? (
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => setBatchMode(false)} style={cancelBtnStyle}>
                Cancel batch
              </button>
              <button
                type="button"
                onClick={confirmBatch}
                disabled={batch.isPending || Object.keys(selected).length === 0}
                style={primaryBtnStyle}
              >
                {batch.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  `Confirm Batch Payout (${Object.keys(selected).length})`
                )}
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setBatchMode(true)} style={cancelBtnStyle}>
              Batch mark paid
            </button>
          ))}
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 30 }}>
          <Loader2 className="animate-spin" />
        </div>
      ) : isError ? (
        <div style={{ color: "#FB7185" }}>Failed to load recipients</div>
      ) : rows.length === 0 ? (
        <div style={{ color: "rgba(245,248,252,0.4)", padding: 30, textAlign: "center" }}>
          No recipients. The target resolved to zero quest users.
        </div>
      ) : (
        <>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "rgba(245,248,252,0.4)" }}>
                {batchMode && <th style={{ padding: "6px 8px" }} />}
                <th style={{ padding: "6px 8px" }}>Wallet</th>
                <th style={{ padding: "6px 8px" }}>User</th>
                <th style={{ padding: "6px 8px" }}>Email</th>
                <th style={{ padding: "6px 8px" }}>Points</th>
                <th style={{ padding: "6px 8px" }}>USDC</th>
                <th style={{ padding: "6px 8px" }}>Status</th>
                <th style={{ padding: "6px 8px" }}>Tx</th>
                <th style={{ padding: "6px 8px" }}>Paid at</th>
                <th style={{ padding: "6px 8px" }}>Notified</th>
                <th style={{ padding: "6px 8px" }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isSelected = r.id in selected;
                const rr = rowResults[r.id];
                return (
                  <tr key={r.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    {batchMode && (
                      <td style={{ padding: "6px 8px" }}>
                        {r.payoutStatus === "PENDING" && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(r.id)}
                            aria-label={`Select ${r.walletAddress ?? r.id}`}
                          />
                        )}
                      </td>
                    )}
                    <td style={{ padding: "6px 8px", fontFamily: "var(--font-mono, monospace)" }}>
                      {truncate(r.walletAddress)}
                    </td>
                    <td style={{ padding: "6px 8px" }}>{r.username ?? "—"}</td>
                    <td style={{ padding: "6px 8px" }}>{r.email ?? "—"}</td>
                    <td style={{ padding: "6px 8px" }}>{r.pointsAwarded}</td>
                    <td style={{ padding: "6px 8px" }}>{r.usdcAwarded}</td>
                    <td style={{ padding: "6px 8px" }}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          background:
                            r.payoutStatus === "PAID"
                              ? "rgba(52,211,153,0.12)"
                              : "rgba(251,191,36,0.12)",
                          color: r.payoutStatus === "PAID" ? "#34D399" : "#FBBF24",
                        }}
                      >
                        {r.payoutStatus === "PAID" ? "Paid" : "Pending"}
                      </span>
                      {rr && (
                        <span
                          style={{
                            marginLeft: 8,
                            fontSize: 11,
                            color: rr.success ? "#34D399" : "#FB7185",
                          }}
                        >
                          {rr.success ? "batch ok" : `batch failed: ${rr.error ?? "error"}`}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "6px 8px", fontFamily: "var(--font-mono, monospace)" }}>
                      {r.paidTxHash ? (
                        <span title={r.paidTxHash}>{truncate(r.paidTxHash)}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td
                      style={{ padding: "6px 8px", fontSize: 12, color: "rgba(245,248,252,0.6)" }}
                    >
                      {fmtDateTime(r.paidAt)}
                    </td>
                    <td style={{ padding: "6px 8px" }}>{r.notifiedAt ? "Yes" : "No"}</td>
                    <td style={{ padding: "6px 8px", whiteSpace: "nowrap" }}>
                      {batchMode && isSelected ? (
                        <input
                          placeholder="tx hash (optional)"
                          value={selected[r.id] ?? ""}
                          onChange={(e) => setSelected((s) => ({ ...s, [r.id]: e.target.value }))}
                          style={{ ...inputStyle, width: 160 }}
                          aria-label={`Batch tx hash for ${r.walletAddress ?? r.id}`}
                        />
                      ) : r.payoutStatus === "PENDING" && !batchMode ? (
                        <button type="button" onClick={() => setMarkRow(r)} style={smallBtnStyle}>
                          Mark Paid
                        </button>
                      ) : r.payoutStatus === "PAID" ? (
                        <span style={{ display: "inline-flex", gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => resendNote.mutate(r.id)}
                            disabled={resendNote.isPending}
                            style={smallBtnStyle}
                          >
                            Resend notification
                          </button>
                          <button
                            type="button"
                            onClick={() => resendEmail.mutate(r.id)}
                            disabled={resendEmail.isPending}
                            style={smallBtnStyle}
                          >
                            Resend email
                          </button>
                        </span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 10,
            }}
          >
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={cancelBtnStyle}
            >
              Prev
            </button>
            <span style={{ fontSize: 12, color: "rgba(245,248,252,0.5)" }}>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={cancelBtnStyle}
            >
              Next
            </button>
          </div>
        </>
      )}

      {markRow && <MarkPaidModal giftId={giftId} row={markRow} onClose={() => setMarkRow(null)} />}
    </section>
  );
}

export default function GiftDetailPage() {
  const params = useParams<{ id: string }>();
  const giftId = params.id;
  const { data: gifts, isLoading } = useAdminGifts();
  const gift = (gifts ?? []).find((g) => g.id === giftId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Link
        href="/admin/quest-gifts"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          color: "rgba(245,248,252,0.6)",
        }}
      >
        <ArrowLeft size={14} />
        Back to gifts
      </Link>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Loader2 className="animate-spin" />
        </div>
      ) : !gift ? (
        <div style={{ color: "#FB7185" }}>Gift not found</div>
      ) : (
        <>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>{gift.title}</h1>
            <div style={{ fontSize: 13, color: "rgba(245,248,252,0.5)", marginTop: 4 }}>
              {gift.targetType} target with {gift.recipientCount} recipient(s), {gift.points} pts
              and {gift.usdc} USDC each. Paid {gift.paidCount}, pending {gift.pendingCount}.
            </div>
          </div>

          <RecipientsTable giftId={giftId} />
        </>
      )}
    </div>
  );
}
