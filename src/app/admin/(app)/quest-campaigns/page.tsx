"use client";

import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  type QuestCampaign,
  useCreateQuestCampaign,
  useQuestCampaigns,
} from "@/features/admin/hooks/use-admin-quest-campaigns";

const CATEGORIES = ["BLEND", "SOROSWAP", "AQUARIUS"];

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

function CreateCampaignModal({ onClose }: { onClose: () => void }) {
  const create = useCreateQuestCampaign();
  const [form, setForm] = useState({
    title: "",
    protocol: "",
    category: "BLEND",
    description: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    await create.mutateAsync(form);
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
          width: 400,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>New Quest Campaign</h3>
        <input
          required
          placeholder="Title *"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          style={inputStyle}
        />
        <input
          placeholder="Protocol (e.g. Blend, SoroSwap)"
          value={form.protocol}
          onChange={(e) => setForm((f) => ({ ...f, protocol: e.target.value }))}
          style={inputStyle}
        />
        <select
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          style={inputStyle}
          aria-label="Category"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
          style={{ ...inputStyle, resize: "none" }}
        />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} style={cancelBtnStyle}>
            Cancel
          </button>
          <button type="submit" disabled={create.isPending} style={primaryBtnStyle}>
            {create.isPending ? <Loader2 size={14} className="animate-spin" /> : "Create Campaign"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function QuestCampaignsPage() {
  const router = useRouter();
  const { data: campaigns, isLoading, isError } = useQuestCampaigns();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = (campaigns ?? []).filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Quest Campaigns</h1>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          style={{ ...primaryBtnStyle, display: "flex", alignItems: "center", gap: 6 }}
        >
          <Plus size={14} />
          New Campaign
        </button>
      </div>

      <input
        placeholder="Search campaigns…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ ...inputStyle, maxWidth: 320 }}
      />

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Loader2 className="animate-spin" />
        </div>
      ) : isError ? (
        <div style={{ color: "#FB7185" }}>Failed to load campaigns</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: "rgba(245,248,252,0.4)", padding: 40, textAlign: "center" }}>
          No campaigns found
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "rgba(245,248,252,0.4)" }}>
              <th style={{ padding: "8px 10px" }}>Name</th>
              <th style={{ padding: "8px 10px" }}>Protocol</th>
              <th style={{ padding: "8px 10px" }}>Category</th>
              <th style={{ padding: "8px 10px" }}>Tasks</th>
              <th style={{ padding: "8px 10px" }}>Status</th>
              <th style={{ padding: "8px 10px" }}>Period</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c: QuestCampaign) => (
              <tr
                key={c.id}
                onClick={() => router.push(`/admin/quest-campaigns/${c.id}`)}
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  cursor: "pointer",
                }}
              >
                <td style={{ padding: "10px", fontWeight: 600 }}>{c.title}</td>
                <td style={{ padding: "10px" }}>{c.protocol}</td>
                <td style={{ padding: "10px" }}>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 6,
                      fontSize: 11,
                      background: "rgba(0,191,255,0.1)",
                      color: "#00BFFF",
                    }}
                  >
                    {c.category}
                  </span>
                </td>
                <td style={{ padding: "10px" }}>{c._count?.tasks ?? "—"}</td>
                <td style={{ padding: "10px" }}>
                  <span
                    style={{
                      color: c.isActive ? "#34D399" : "rgba(245,248,252,0.4)",
                      fontSize: 12,
                    }}
                  >
                    {c.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td style={{ padding: "10px", fontSize: 12, color: "rgba(245,248,252,0.5)" }}>
                  {c.startAt ? new Date(c.startAt).toLocaleDateString() : "—"}
                  {c.endAt ? ` – ${new Date(c.endAt).toLocaleDateString()}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showCreate && <CreateCampaignModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
