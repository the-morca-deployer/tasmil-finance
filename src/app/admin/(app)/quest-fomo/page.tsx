"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  type FomoEvent,
  useCreateFomoEvent,
  useDeleteFomoEvent,
  useFomoEvents,
  useUpdateFomoEvent,
} from "@/features/admin/hooks/use-admin-quest-fomo";

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

function toLocalInput(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

function FomoModal({ event, onClose }: { event: FomoEvent | null; onClose: () => void }) {
  const create = useCreateFomoEvent();
  const update = useUpdateFomoEvent();
  const [form, setForm] = useState({
    title: event?.title ?? "",
    description: event?.description ?? "",
    startAt: toLocalInput(event?.startAt),
    endAt: toLocalInput(event?.endAt),
    multiplier: event?.multiplier ?? 2,
    countdownDays: event?.countdownDays ?? 3,
    isActive: event?.isActive ?? true,
  });
  const pending = create.isPending || update.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.startAt || !form.endAt) return;
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      startAt: new Date(form.startAt).toISOString(),
      endAt: new Date(form.endAt).toISOString(),
      multiplier: Number(form.multiplier),
      countdownDays: Number(form.countdownDays),
      isActive: form.isActive,
    };
    if (event) await update.mutateAsync({ id: event.id, data: payload });
    else await create.mutateAsync(payload);
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
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>
          {event ? "Edit FOMO Event" : "New FOMO Event"}
        </h3>
        <input
          required
          placeholder="Title *"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          style={inputStyle}
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={2}
          style={{ ...inputStyle, resize: "none" }}
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input
            type="number"
            step="0.1"
            min={1}
            placeholder="Multiplier"
            value={form.multiplier}
            onChange={(e) => setForm((f) => ({ ...f, multiplier: Number(e.target.value) }))}
            style={inputStyle}
            aria-label="Multiplier"
          />
          <input
            type="number"
            min={1}
            placeholder="Countdown days"
            value={form.countdownDays}
            onChange={(e) => setForm((f) => ({ ...f, countdownDays: Number(e.target.value) }))}
            style={inputStyle}
            aria-label="Countdown days"
          />
        </div>
        <label
          style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}
        >
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
          />
          Active
        </label>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} style={cancelBtnStyle}>
            Cancel
          </button>
          <button type="submit" disabled={pending} style={primaryBtnStyle}>
            {pending ? <Loader2 size={14} className="animate-spin" /> : event ? "Save" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}

function fmtDateTime(iso?: string) {
  return iso ? new Date(iso).toLocaleString() : "—";
}

export default function QuestFomoPage() {
  const { data: events, isLoading, isError } = useFomoEvents();
  const del = useDeleteFomoEvent();
  const [modal, setModal] = useState<{ open: boolean; event: FomoEvent | null }>({
    open: false,
    event: null,
  });

  function handleDelete(id: string, title: string) {
    if (window.confirm(`Delete FOMO event "${title}"?`)) del.mutate(id);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>FOMO Events</h1>
        <button
          type="button"
          onClick={() => setModal({ open: true, event: null })}
          style={{ ...primaryBtnStyle, display: "flex", alignItems: "center", gap: 6 }}
        >
          <Plus size={14} />
          New Event
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Loader2 className="animate-spin" />
        </div>
      ) : isError ? (
        <div style={{ color: "#FB7185" }}>Failed to load FOMO events</div>
      ) : (events ?? []).length === 0 ? (
        <div style={{ color: "rgba(245,248,252,0.4)", padding: 40, textAlign: "center" }}>
          No FOMO events yet
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "rgba(245,248,252,0.4)" }}>
              <th style={{ padding: "8px 10px" }}>Title</th>
              <th style={{ padding: "8px 10px" }}>Window</th>
              <th style={{ padding: "8px 10px" }}>Multiplier</th>
              <th style={{ padding: "8px 10px" }}>Active</th>
              <th style={{ padding: "8px 10px" }} />
            </tr>
          </thead>
          <tbody>
            {(events ?? []).map((ev) => (
              <tr key={ev.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <td style={{ padding: "10px", fontWeight: 600 }}>{ev.title}</td>
                <td style={{ padding: "10px", fontSize: 12, color: "rgba(245,248,252,0.5)" }}>
                  {fmtDateTime(ev.startAt)} to {fmtDateTime(ev.endAt)}
                </td>
                <td style={{ padding: "10px", fontFamily: "var(--font-mono, monospace)" }}>
                  {ev.multiplier}x
                </td>
                <td style={{ padding: "10px" }}>{ev.isActive ? "Yes" : "No"}</td>
                <td
                  style={{
                    padding: "10px",
                    textAlign: "right",
                    display: "flex",
                    gap: 8,
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setModal({ open: true, event: ev })}
                    style={cancelBtnStyle}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(ev.id, ev.title)}
                    style={cancelBtnStyle}
                    aria-label={`Delete ${ev.title}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modal.open && (
        <FomoModal event={modal.event} onClose={() => setModal({ open: false, event: null })} />
      )}
    </div>
  );
}
