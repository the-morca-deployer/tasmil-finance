"use client";

import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  GIFT_TARGET_TYPES,
  type GiftTargetType,
  USER_TIERS,
  type UserTier,
  useAdminGifts,
  useCreateGift,
} from "@/features/admin/hooks/use-admin-quest-gifts";
import {
  REFERRAL_SEGMENTS,
  type ReferralSegment,
} from "@/features/admin/hooks/use-admin-referral-config";

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

const USDC_PATTERN = /^\d+(\.\d+)?$/;

function parseWallets(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(/[\s,]+/)
        .map((w) => w.trim())
        .filter(Boolean)
    ),
  ];
}

function fmtDate(iso?: string) {
  return iso ? new Date(iso).toLocaleDateString() : "—";
}

function CreateGiftModal({ onClose }: { onClose: () => void }) {
  const create = useCreateGift();
  const [form, setForm] = useState({
    title: "",
    points: "",
    usdc: "",
    targetType: "WALLET" as GiftTargetType,
    walletsRaw: "",
    segment: "NORMAL" as ReferralSegment,
    tier: "BRONZE" as UserTier,
  });

  const parsedWallets = useMemo(() => parseWallets(form.walletsRaw), [form.walletsRaw]);
  const usdcTrimmed = form.usdc.trim();
  const usdcInvalid = usdcTrimmed !== "" && !USDC_PATTERN.test(usdcTrimmed);
  const pointsNum = form.points.trim() === "" ? 0 : Number(form.points);
  const pointsInvalid = !Number.isInteger(pointsNum) || pointsNum < 0;

  const submitDisabled =
    create.isPending ||
    !form.title.trim() ||
    usdcInvalid ||
    pointsInvalid ||
    (form.targetType === "WALLET" && parsedWallets.length === 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitDisabled) return;
    await create.mutateAsync({
      title: form.title.trim(),
      points: pointsNum,
      usdc: usdcTrimmed || undefined,
      targetType: form.targetType,
      targetWallets: form.targetType === "WALLET" ? parsedWallets : undefined,
      targetSegment: form.targetType === "SEGMENT" ? form.segment : undefined,
      targetTier: form.targetType === "TIER" ? form.tier : undefined,
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
          width: 480,
          maxHeight: "90vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>New Gift</h3>

        <input
          required
          placeholder="Gift title *"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          style={inputStyle}
        />

        <div style={{ display: "flex", gap: 10 }}>
          <label style={{ fontSize: 11, opacity: 0.6, flex: 1 }}>
            Points per recipient
            <input
              type="number"
              min={0}
              placeholder="0"
              value={form.points}
              onChange={(e) => setForm((f) => ({ ...f, points: e.target.value }))}
              style={inputStyle}
            />
          </label>
          <label style={{ fontSize: 11, opacity: 0.6, flex: 1 }}>
            USDC per recipient
            <input
              inputMode="decimal"
              placeholder="0"
              value={form.usdc}
              onChange={(e) => setForm((f) => ({ ...f, usdc: e.target.value }))}
              style={inputStyle}
            />
          </label>
        </div>
        {usdcInvalid && (
          <span style={{ fontSize: 12, color: "#FB7185" }}>
            USDC must be a plain decimal number, for example 5 or 0.5
          </span>
        )}
        {pointsInvalid && (
          <span style={{ fontSize: 12, color: "#FB7185" }}>
            Points must be a whole number of 0 or more
          </span>
        )}

        <label style={{ fontSize: 11, opacity: 0.6 }}>
          Target
          <select
            value={form.targetType}
            onChange={(e) =>
              setForm((f) => ({ ...f, targetType: e.target.value as GiftTargetType }))
            }
            style={inputStyle}
          >
            {GIFT_TARGET_TYPES.map((t) => (
              <option key={t} value={t}>
                {t === "WALLET" ? "Specific wallets" : t === "SEGMENT" ? "Segment" : "Tier"}
              </option>
            ))}
          </select>
        </label>

        {form.targetType === "WALLET" && (
          <label style={{ fontSize: 11, opacity: 0.6 }}>
            Wallet addresses (one per line, or comma separated)
            <textarea
              rows={5}
              placeholder={"G...\nG..."}
              value={form.walletsRaw}
              onChange={(e) => setForm((f) => ({ ...f, walletsRaw: e.target.value }))}
              style={{
                ...inputStyle,
                fontFamily: "var(--font-mono, monospace)",
                resize: "vertical",
              }}
            />
            <span style={{ fontSize: 11, opacity: 0.8 }}>
              {parsedWallets.length} address(es) entered
            </span>
          </label>
        )}

        {form.targetType === "SEGMENT" && (
          <label style={{ fontSize: 11, opacity: 0.6 }}>
            Segment
            <select
              value={form.segment}
              onChange={(e) =>
                setForm((f) => ({ ...f, segment: e.target.value as ReferralSegment }))
              }
              style={inputStyle}
            >
              {REFERRAL_SEGMENTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        )}

        {form.targetType === "TIER" && (
          <label style={{ fontSize: 11, opacity: 0.6 }}>
            Tier
            <select
              value={form.tier}
              onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value as UserTier }))}
              style={inputStyle}
            >
              {USER_TIERS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        )}

        <div
          style={{
            fontSize: 12,
            color: "rgba(245,248,252,0.55)",
            padding: "10px 12px",
            borderRadius: 8,
            background: "rgba(0,191,255,0.06)",
            border: "1px solid rgba(0,191,255,0.15)",
          }}
        >
          Points are credited to recipients immediately when the gift is created. USDC amounts start
          as Pending and must be marked paid on the gift detail page after the transfer. Segment and
          tier membership is snapshotted now. Wallets without a quest account are skipped, so check
          the recipient count after creating.
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} style={cancelBtnStyle}>
            Cancel
          </button>
          <button type="submit" disabled={submitDisabled} style={primaryBtnStyle}>
            {create.isPending ? <Loader2 size={14} className="animate-spin" /> : "Create Gift"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function QuestGiftsPage() {
  const router = useRouter();
  const { data: gifts, isLoading, isError } = useAdminGifts();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Quest Gifts</h1>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          style={{ ...primaryBtnStyle, display: "flex", alignItems: "center", gap: 6 }}
        >
          <Plus size={14} />
          New Gift
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Loader2 className="animate-spin" />
        </div>
      ) : isError ? (
        <div style={{ color: "#FB7185" }}>Failed to load gifts</div>
      ) : (gifts ?? []).length === 0 ? (
        <div style={{ color: "rgba(245,248,252,0.4)", padding: 40, textAlign: "center" }}>
          No gifts yet
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "rgba(245,248,252,0.4)" }}>
              <th style={{ padding: "8px 10px" }}>Title</th>
              <th style={{ padding: "8px 10px" }}>Target</th>
              <th style={{ padding: "8px 10px" }}>Points each</th>
              <th style={{ padding: "8px 10px" }}>USDC each</th>
              <th style={{ padding: "8px 10px" }}>Recipients</th>
              <th style={{ padding: "8px 10px" }}>Paid / Pending</th>
              <th style={{ padding: "8px 10px" }}>Total USDC</th>
              <th style={{ padding: "8px 10px" }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {(gifts ?? []).map((g) => (
              <tr
                key={g.id}
                onClick={() => router.push(`/admin/quest-gifts/${g.id}`)}
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}
              >
                <td style={{ padding: "10px", fontWeight: 600 }}>{g.title}</td>
                <td style={{ padding: "10px" }}>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 6,
                      fontSize: 11,
                      background: "rgba(0,191,255,0.12)",
                      color: "#00BFFF",
                    }}
                  >
                    {g.targetType}
                  </span>
                </td>
                <td style={{ padding: "10px" }}>{g.points.toLocaleString("en-US")}</td>
                <td style={{ padding: "10px", fontFamily: "var(--font-mono, monospace)" }}>
                  {g.usdc}
                </td>
                <td style={{ padding: "10px" }}>{g.recipientCount}</td>
                <td style={{ padding: "10px" }}>
                  <span style={{ color: "#34D399" }}>{g.paidCount}</span>
                  <span style={{ color: "rgba(245,248,252,0.4)" }}> / </span>
                  <span style={{ color: "#FBBF24" }}>{g.pendingCount}</span>
                </td>
                <td style={{ padding: "10px", fontFamily: "var(--font-mono, monospace)" }}>
                  {g.totalUsdcAwarded}
                </td>
                <td style={{ padding: "10px", fontSize: 12, color: "rgba(245,248,252,0.5)" }}>
                  {fmtDate(g.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showCreate && <CreateGiftModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
