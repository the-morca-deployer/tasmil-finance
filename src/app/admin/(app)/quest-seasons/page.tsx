"use client";

import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  type SeasonStatus,
  type SeasonView,
  useAdminSeasons,
  useCreateSeason,
  useEndSeason,
} from "@/features/admin/hooks/use-admin-quest-seasons";

const inputStyle: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "#F5F8FC",
  fontSize: 13,
  width: "100%",
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

const STATUS_COLORS: Record<SeasonStatus, { color: string; bg: string }> = {
  ACTIVE: { color: "#34D399", bg: "rgba(52,211,153,0.12)" },
  ENDED: { color: "#FBBF24", bg: "rgba(251,191,36,0.12)" },
  REVEALED: { color: "#00BFFF", bg: "rgba(0,191,255,0.12)" },
};

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString();
}

function CreateSeasonModal({ onClose }: { onClose: () => void }) {
  const create = useCreateSeason();
  const [form, setForm] = useState({ name: "", startAt: "", endAt: "", prizePoolUsdc: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.startAt || !form.endAt) return;
    await create.mutateAsync({
      name: form.name.trim(),
      startAt: new Date(form.startAt).toISOString(),
      endAt: new Date(form.endAt).toISOString(),
      prizePoolUsdc: form.prizePoolUsdc.trim() || undefined,
    });
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
          width: 420,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>New Season</h3>
        <input
          required
          placeholder="Season name *"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          style={inputStyle}
        />
        <label style={{ fontSize: 11, opacity: 0.6 }}>
          Start
          <input
            required
            type="datetime-local"
            value={form.startAt}
            onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
            style={inputStyle}
          />
        </label>
        <label style={{ fontSize: 11, opacity: 0.6 }}>
          End
          <input
            required
            type="datetime-local"
            value={form.endAt}
            onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
            style={inputStyle}
          />
        </label>
        <input
          placeholder="Prize pool USDC (optional)"
          inputMode="decimal"
          value={form.prizePoolUsdc}
          onChange={(e) => setForm((f) => ({ ...f, prizePoolUsdc: e.target.value }))}
          style={inputStyle}
        />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} style={cancelBtnStyle}>
            Cancel
          </button>
          <button type="submit" disabled={create.isPending} style={primaryBtnStyle}>
            {create.isPending ? <Loader2 size={14} className="animate-spin" /> : "Create Season"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function QuestSeasonsPage() {
  const router = useRouter();
  const { data: seasons, isLoading, isError } = useAdminSeasons();
  const endSeason = useEndSeason();
  const [showCreate, setShowCreate] = useState(false);

  function handleEnd(e: React.MouseEvent, id: string, name: string) {
    e.stopPropagation();
    if (window.confirm(`End season "${name}"? This locks the leaderboard and computes results.`)) {
      endSeason.mutate(id);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Quest Seasons</h1>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          style={{ ...primaryBtnStyle, display: "flex", alignItems: "center", gap: 6 }}
        >
          <Plus size={14} />
          New Season
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Loader2 className="animate-spin" />
        </div>
      ) : isError ? (
        <div style={{ color: "#FB7185" }}>Failed to load seasons</div>
      ) : (seasons ?? []).length === 0 ? (
        <div style={{ color: "rgba(245,248,252,0.4)", padding: 40, textAlign: "center" }}>
          No seasons yet
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "rgba(245,248,252,0.4)" }}>
              <th style={{ padding: "8px 10px" }}>Name</th>
              <th style={{ padding: "8px 10px" }}>Dates</th>
              <th style={{ padding: "8px 10px" }}>Status</th>
              <th style={{ padding: "8px 10px" }}>Prize pool</th>
              <th style={{ padding: "8px 10px" }} />
            </tr>
          </thead>
          <tbody>
            {(seasons ?? []).map((s: SeasonView) => {
              const sc = STATUS_COLORS[s.status];
              return (
                <tr
                  key={s.id}
                  onClick={() => router.push(`/admin/quest-seasons/${s.id}`)}
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}
                >
                  <td style={{ padding: "10px", fontWeight: 600 }}>{s.name}</td>
                  <td style={{ padding: "10px", fontSize: 12, color: "rgba(245,248,252,0.5)" }}>
                    {fmtDate(s.startAt)} to {fmtDate(s.endAt)}
                  </td>
                  <td style={{ padding: "10px" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 6,
                        fontSize: 11,
                        background: sc.bg,
                        color: sc.color,
                      }}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td style={{ padding: "10px", fontFamily: "var(--font-mono, monospace)" }}>
                    {s.prizePoolUsdc ? `${s.prizePoolUsdc} USDC` : "—"}
                  </td>
                  <td style={{ padding: "10px", textAlign: "right" }}>
                    {s.status === "ACTIVE" && (
                      <button
                        type="button"
                        onClick={(e) => handleEnd(e, s.id, s.name)}
                        disabled={endSeason.isPending}
                        style={cancelBtnStyle}
                      >
                        End Season
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {showCreate && <CreateSeasonModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
