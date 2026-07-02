"use client";

import { Loader2, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  REFERRAL_LAYERS,
  REFERRAL_SEGMENTS,
  type ReferralSegment,
} from "@/features/admin/hooks/use-admin-referral-config";
import {
  type QuestUserLookup,
  useDeleteUserOverride,
  useQuestUserLookup,
  useReplaceUserOverrides,
  useSetUserSegment,
} from "@/features/admin/hooks/use-admin-quest-users";

const inputStyle: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "#F5F8FC",
  fontSize: 13,
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
  s ? (s.length > 16 ? `${s.slice(0, 8)}...${s.slice(-6)}` : s) : "—";

// ---- Segment editor ----
function SegmentEditor({ user }: { user: QuestUserLookup }) {
  const setSegment = useSetUserSegment();
  const [segment, setSegmentValue] = useState<ReferralSegment>(user.segment);

  useEffect(() => {
    setSegmentValue(user.segment);
  }, [user.segment]);

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <h2 style={{ fontSize: 15, fontWeight: 700 }}>Segment</h2>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <select
          value={segment}
          onChange={(e) => setSegmentValue(e.target.value as ReferralSegment)}
          style={{ ...inputStyle, width: 180 }}
          aria-label="User segment"
        >
          {REFERRAL_SEGMENTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setSegment.mutate({ userId: user.userId, segment })}
          disabled={setSegment.isPending || segment === user.segment}
          style={primaryBtnStyle}
        >
          {setSegment.isPending ? "Saving" : "Save Segment"}
        </button>
      </div>
      <p style={{ fontSize: 12, opacity: 0.5 }}>
        The segment picks this user&apos;s column in the commission matrix. Overrides below win over
        the matrix.
      </p>
    </section>
  );
}

// ---- Per-layer override editor ----
interface OverrideFormRow {
  enabled: boolean;
  rateBps: number;
  isActive: boolean;
}

function seedOverrideForm(user: QuestUserLookup): Record<number, OverrideFormRow> {
  const form: Record<number, OverrideFormRow> = {};
  for (const layer of REFERRAL_LAYERS) {
    const existing = user.overrides.find((o) => o.layer === layer);
    form[layer] = existing
      ? { enabled: true, rateBps: existing.rateBps, isActive: existing.isActive }
      : { enabled: false, rateBps: 0, isActive: true };
  }
  return form;
}

function OverridesEditor({ user }: { user: QuestUserLookup }) {
  const replace = useReplaceUserOverrides();
  const del = useDeleteUserOverride();
  const [form, setForm] = useState<Record<number, OverrideFormRow>>(() => seedOverrideForm(user));

  // Re-seed when the server data changes (after save/delete/refetch or a new lookup).
  useEffect(() => {
    setForm(seedOverrideForm(user));
  }, [user]);

  function update(layer: number, patch: Partial<OverrideFormRow>) {
    setForm((f) => {
      const current = f[layer] ?? { enabled: false, rateBps: 0, isActive: true };
      return { ...f, [layer]: { ...current, ...patch } };
    });
  }

  function handleSave() {
    const overrides = REFERRAL_LAYERS.filter((layer) => form[layer]?.enabled).map((layer) => {
      const row = form[layer] ?? { enabled: false, rateBps: 0, isActive: true };
      return {
        layer,
        rateBps: Number(row.rateBps),
        isActive: row.isActive,
      };
    });
    replace.mutate({ userId: user.userId, overrides });
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <h2 style={{ fontSize: 15, fontWeight: 700 }}>Per-layer Rate Overrides</h2>
      <table style={{ width: "100%", maxWidth: 640, borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: "left", color: "rgba(245,248,252,0.4)" }}>
            <th style={{ padding: "6px 8px" }}>Layer</th>
            <th style={{ padding: "6px 8px" }}>Override</th>
            <th style={{ padding: "6px 8px" }}>Rate (bps)</th>
            <th style={{ padding: "6px 8px" }}>Active</th>
            <th style={{ padding: "6px 8px" }} />
          </tr>
        </thead>
        <tbody>
          {REFERRAL_LAYERS.map((layer) => {
            const row = form[layer] ?? { enabled: false, rateBps: 0, isActive: true };
            const hasServerRow = user.overrides.some((o) => o.layer === layer);
            return (
              <tr key={layer} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <td style={{ padding: "8px", fontWeight: 700, color: "#00BFFF" }}>L{layer}</td>
                <td style={{ padding: "8px" }}>
                  <input
                    type="checkbox"
                    checked={row.enabled}
                    onChange={(e) => update(layer, { enabled: e.target.checked })}
                    aria-label={`Override layer ${layer}`}
                  />
                </td>
                <td style={{ padding: "8px" }}>
                  <input
                    type="number"
                    min={0}
                    max={10000}
                    disabled={!row.enabled}
                    value={row.rateBps}
                    onChange={(e) => update(layer, { rateBps: Number(e.target.value) })}
                    style={{ ...inputStyle, width: 100, padding: "7px 10px" }}
                    aria-label={`Layer ${layer} override rate in bps`}
                  />
                </td>
                <td style={{ padding: "8px" }}>
                  <input
                    type="checkbox"
                    disabled={!row.enabled}
                    checked={row.isActive}
                    onChange={(e) => update(layer, { isActive: e.target.checked })}
                    aria-label={`Layer ${layer} override active`}
                  />
                </td>
                <td style={{ padding: "8px" }}>
                  {hasServerRow && (
                    <button
                      type="button"
                      onClick={() => del.mutate({ userId: user.userId, layer })}
                      disabled={del.isPending}
                      style={smallBtnStyle}
                      aria-label={`Delete layer ${layer} override`}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div>
        <button
          type="button"
          onClick={handleSave}
          disabled={replace.isPending}
          style={primaryBtnStyle}
        >
          {replace.isPending ? "Saving" : "Save Overrides"}
        </button>
      </div>
      <p style={{ fontSize: 12, opacity: 0.5 }}>
        Save replaces all overrides for this user. Layers without the Override checkbox are removed
        and fall back to the segment matrix.
      </p>
    </section>
  );
}

export default function QuestUsersPage() {
  const [walletInput, setWalletInput] = useState("");
  const [submittedWallet, setSubmittedWallet] = useState<string | null>(null);
  const { data: user, isLoading, error } = useQuestUserLookup(submittedWallet);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = walletInput.trim();
    if (trimmed) setSubmittedWallet(trimmed);
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Quest Users</h1>
        <p style={{ fontSize: 13, opacity: 0.6 }}>
          Look up a quest user by wallet address to set their referral segment and per-layer rate
          overrides.
        </p>
      </div>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: 10 }}>
        <input
          placeholder="Wallet address (G...)"
          value={walletInput}
          onChange={(e) => setWalletInput(e.target.value)}
          style={{
            ...inputStyle,
            flex: 1,
            maxWidth: 560,
            fontFamily: "var(--font-mono, monospace)",
          }}
          aria-label="Wallet address"
        />
        <button
          type="submit"
          disabled={!walletInput.trim() || isLoading}
          style={{ ...primaryBtnStyle, display: "flex", alignItems: "center", gap: 6 }}
        >
          <Search size={14} />
          Search
        </button>
      </form>

      {isLoading && (
        <div style={{ display: "flex", justifyContent: "center", padding: 30 }}>
          <Loader2 className="animate-spin" />
        </div>
      )}

      {error && !isLoading && <div style={{ color: "#FB7185", fontSize: 13 }}>{error.message}</div>}

      {user && !isLoading && (
        <>
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 12,
              padding: "16px 18px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <div>
              <div style={{ fontSize: 11, opacity: 0.5, textTransform: "uppercase" }}>Username</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{user.username ?? "—"}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, opacity: 0.5, textTransform: "uppercase" }}>Wallet</div>
              <div
                style={{ fontSize: 13, fontFamily: "var(--font-mono, monospace)" }}
                title={user.walletAddress}
              >
                {truncate(user.walletAddress)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, opacity: 0.5, textTransform: "uppercase" }}>Points</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {user.totalPoints.toLocaleString("en-US")}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, opacity: 0.5, textTransform: "uppercase" }}>Tier</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{user.tier}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, opacity: 0.5, textTransform: "uppercase" }}>Segment</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#00BFFF" }}>{user.segment}</div>
            </div>
          </section>

          <SegmentEditor user={user} />
          <OverridesEditor user={user} />
        </>
      )}
    </div>
  );
}
