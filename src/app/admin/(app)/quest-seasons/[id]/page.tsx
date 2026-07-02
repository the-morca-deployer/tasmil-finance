"use client";

import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  type SeasonRankReward,
  type SeasonResultRow,
  useAdminSeasons,
  useBatchPayout,
  useMarkPayout,
  useResendEmail,
  useResendNotification,
  useSeasonResults,
  useSetRankRewards,
} from "@/features/admin/hooks/use-admin-quest-seasons";

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

// ---- Rank rewards editor ----
function RankRewardsEditor({
  seasonId,
  status,
  initial,
}: {
  seasonId: string;
  status: string;
  initial: SeasonRankReward[];
}) {
  const save = useSetRankRewards(seasonId);
  const editable = status === "ACTIVE";
  const [rows, setRows] = useState<SeasonRankReward[]>(initial);

  // Sync when server data arrives/changes.
  useEffect(() => {
    setRows(initial);
  }, [initial]);

  function update(i: number, patch: Partial<SeasonRankReward>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setRows((rs) => [...rs, { rankFrom: 1, rankTo: 1, usdc: "0", points: 0, badge: "" }]);
  }
  function removeRow(i: number) {
    setRows((rs) => rs.filter((_, idx) => idx !== i));
  }
  function handleSave() {
    save.mutate({
      rewards: rows.map((r) => ({
        rankFrom: Number(r.rankFrom),
        rankTo: Number(r.rankTo),
        usdc: String(r.usdc ?? "0"),
        points: Number(r.points),
        badge: r.badge?.trim() ? r.badge.trim() : null,
      })),
    });
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Rank Rewards</h2>
        {!editable && (
          <span style={{ fontSize: 12, color: "rgba(245,248,252,0.4)" }}>
            Read only after the season has ended
          </span>
        )}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: "left", color: "rgba(245,248,252,0.4)" }}>
            <th style={{ padding: "6px 8px" }}>Rank from</th>
            <th style={{ padding: "6px 8px" }}>Rank to</th>
            <th style={{ padding: "6px 8px" }}>USDC</th>
            <th style={{ padding: "6px 8px" }}>Points</th>
            <th style={{ padding: "6px 8px" }}>Badge</th>
            <th style={{ padding: "6px 8px" }} />
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: rows are position-based edit rows
            <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <td style={{ padding: "6px 8px" }}>
                <input
                  type="number"
                  disabled={!editable}
                  value={r.rankFrom}
                  onChange={(e) => update(i, { rankFrom: Number(e.target.value) })}
                  style={{ ...inputStyle, width: 70 }}
                  aria-label={`Rank from row ${i + 1}`}
                />
              </td>
              <td style={{ padding: "6px 8px" }}>
                <input
                  type="number"
                  disabled={!editable}
                  value={r.rankTo}
                  onChange={(e) => update(i, { rankTo: Number(e.target.value) })}
                  style={{ ...inputStyle, width: 70 }}
                  aria-label={`Rank to row ${i + 1}`}
                />
              </td>
              <td style={{ padding: "6px 8px" }}>
                <input
                  inputMode="decimal"
                  disabled={!editable}
                  value={r.usdc}
                  onChange={(e) => update(i, { usdc: e.target.value })}
                  style={inputStyle}
                  aria-label={`USDC row ${i + 1}`}
                />
              </td>
              <td style={{ padding: "6px 8px" }}>
                <input
                  type="number"
                  disabled={!editable}
                  value={r.points}
                  onChange={(e) => update(i, { points: Number(e.target.value) })}
                  style={inputStyle}
                  aria-label={`Points row ${i + 1}`}
                />
              </td>
              <td style={{ padding: "6px 8px" }}>
                <input
                  disabled={!editable}
                  value={r.badge ?? ""}
                  onChange={(e) => update(i, { badge: e.target.value })}
                  style={{ ...inputStyle, width: 110 }}
                  aria-label={`Badge row ${i + 1}`}
                />
              </td>
              <td style={{ padding: "6px 8px" }}>
                {editable && (
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    style={smallBtnStyle}
                    aria-label={`Remove row ${i + 1}`}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editable && (
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={addRow}
            style={{ ...cancelBtnStyle, display: "flex", alignItems: "center", gap: 6 }}
          >
            <Plus size={13} />
            Add band
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={save.isPending}
            style={primaryBtnStyle}
          >
            {save.isPending ? <Loader2 size={14} className="animate-spin" /> : "Save Rank Rewards"}
          </button>
        </div>
      )}
    </section>
  );
}

// ---- Mark Paid modal (single row) ----
function MarkPaidModal({
  seasonId,
  row,
  onClose,
}: {
  seasonId: string;
  row: SeasonResultRow;
  onClose: () => void;
}) {
  const markPayout = useMarkPayout(seasonId);
  const [txHash, setTxHash] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await markPayout.mutateAsync({ resultId: row.id, paidTxHash: txHash.trim() || undefined });
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
          Rank #{row.finalRank} · {truncate(row.walletAddress)} · {row.usdcReward} USDC ·{" "}
          {row.pointsReward} pts
        </div>
        <label style={{ fontSize: 12, opacity: 0.7 }}>
          Transaction hash (optional for points-only bands)
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

// ---- Payout history + batch ----
function PayoutHistory({ seasonId }: { seasonId: string }) {
  const { data, isLoading, isError } = useSeasonResults(seasonId);
  const batch = useBatchPayout(seasonId);
  const resendNote = useResendNotification(seasonId);
  const resendEmail = useResendEmail(seasonId);

  const [markRow, setMarkRow] = useState<SeasonResultRow | null>(null);
  const [batchMode, setBatchMode] = useState(false);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [rowResults, setRowResults] = useState<
    Record<string, { success: boolean; error?: string }>
  >({});

  const rows = data?.items ?? [];
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
    const items = Object.entries(selected).map(([resultId, txHash]) => ({
      resultId,
      paidTxHash: txHash.trim() || undefined,
    }));
    if (items.length === 0) return;
    const res = await batch.mutateAsync(items);
    const map: Record<string, { success: boolean; error?: string }> = {};
    for (const r of res.results) map[r.resultId] = { success: r.success, error: r.error };
    setRowResults(map);
    setSelected({});
    setBatchMode(false);
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Payout History</h2>
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
        <div style={{ color: "#FB7185" }}>Failed to load payout history</div>
      ) : rows.length === 0 ? (
        <div style={{ color: "rgba(245,248,252,0.4)", padding: 30, textAlign: "center" }}>
          No results yet. Payout history appears once the season has ended.
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "rgba(245,248,252,0.4)" }}>
              {batchMode && <th style={{ padding: "6px 8px" }} />}
              <th style={{ padding: "6px 8px" }}>Rank</th>
              <th style={{ padding: "6px 8px" }}>Wallet</th>
              <th style={{ padding: "6px 8px" }}>User</th>
              <th style={{ padding: "6px 8px" }}>Email</th>
              <th style={{ padding: "6px 8px" }}>USDC</th>
              <th style={{ padding: "6px 8px" }}>Points</th>
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
                          aria-label={`Select rank ${r.finalRank}`}
                        />
                      )}
                    </td>
                  )}
                  <td style={{ padding: "6px 8px", fontWeight: 600 }}>#{r.finalRank}</td>
                  <td style={{ padding: "6px 8px", fontFamily: "var(--font-mono, monospace)" }}>
                    {truncate(r.walletAddress)}
                  </td>
                  <td style={{ padding: "6px 8px" }}>{r.username ?? "—"}</td>
                  <td style={{ padding: "6px 8px" }}>{r.email ?? "—"}</td>
                  <td style={{ padding: "6px 8px" }}>{r.usdcReward}</td>
                  <td style={{ padding: "6px 8px" }}>{r.pointsReward}</td>
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
                  <td style={{ padding: "6px 8px", fontSize: 12, color: "rgba(245,248,252,0.6)" }}>
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
                        aria-label={`Batch tx hash rank ${r.finalRank}`}
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
      )}

      {markRow && (
        <MarkPaidModal seasonId={seasonId} row={markRow} onClose={() => setMarkRow(null)} />
      )}
    </section>
  );
}

export default function SeasonDetailPage() {
  const params = useParams<{ id: string }>();
  const seasonId = params.id;
  const { data: seasons, isLoading } = useAdminSeasons();
  const season = (seasons ?? []).find((s) => s.id === seasonId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Link
        href="/admin/quest-seasons"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          color: "rgba(245,248,252,0.6)",
        }}
      >
        <ArrowLeft size={14} />
        Back to seasons
      </Link>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Loader2 className="animate-spin" />
        </div>
      ) : !season ? (
        <div style={{ color: "#FB7185" }}>Season not found</div>
      ) : (
        <>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>{season.name}</h1>
            <div style={{ fontSize: 13, color: "rgba(245,248,252,0.5)", marginTop: 4 }}>
              {season.status} ·{" "}
              {season.prizePoolUsdc ? `${season.prizePoolUsdc} USDC pool` : "no pool set"}
            </div>
          </div>

          <RankRewardsEditor
            seasonId={seasonId}
            status={season.status}
            initial={season.rankRewards ?? []}
          />

          <PayoutHistory seasonId={seasonId} />
        </>
      )}
    </div>
  );
}
