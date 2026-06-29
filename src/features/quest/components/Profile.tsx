"use client";

import { CheckCircle2, Copy, Edit2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useMemo, useState } from "react";
import { toast } from "sonner";
import { Rise } from "@/features/quest/components/Rise";
import { Button } from "@/features/quest/components/ui/button";
import { useWallet } from "@/features/quest/context/wallet-context";
import {
  QUEST_AVATAR_VARIANTS,
  variantFromAvatarUrl,
  variantToken,
} from "@/features/quest/lib/avatar";
import { $, withAuth } from "@/features/quest/lib/kubb-config";
import {
  type ReferralTree,
  type ReferralTreeNode,
  unwrapEnvelope,
} from "@/features/quest/lib/season-types";
import { type QuestRank, RANK_ORDER, RANK_STYLES, rankFromPoints } from "@/features/quest/lib/tier";
import { useQuestAuthStore } from "@/features/quest/store/use-quest-auth";
import {
  useReferralControllerGetMyReferral,
  useReferralControllerGetTree,
  useSocialAccountsControllerFindAll,
  useUsersControllerGetMyCampaigns,
  useUsersControllerGetPointsHistory,
  useUsersControllerGetReferrals,
  useUsersControllerUpdateProfile,
} from "@/gen-quest/hooks";
import { TasmilAvatar } from "@/shared/components/tasmil-avatar";

const fmt = (n: number) => n.toLocaleString("en-US");

// ---- Local interfaces ----
interface SocialAccount {
  id: string;
  platform: "X" | "Discord" | "Telegram";
  platformUserId: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  connectedAt: string;
}
interface ApiCampaign {
  id: string;
  title: string;
  description?: string;
  rewardPoints?: number;
  logoUrl?: string;
  coverUrl?: string;
  questersCount?: number;
}
interface RawLedgerEntry {
  createdAt?: string;
  occurredAt?: string;
  source?: string;
  description?: string;
  campaignTitle?: string;
  points?: number;
  delta?: number;
}
interface RawReferral {
  username?: string;
  layer?: number;
  joinedAt?: string;
  questPoints?: number;
  ptsEarned?: number;
  status?: string;
}

// Tab slugs — must match the ?tab= URL param values
const TAB_SLUGS = ["overview", "my-quest", "referrals", "social"] as const;
type TabSlug = (typeof TAB_SLUGS)[number];

function isValidSlug(s: string | null): s is TabSlug {
  return TAB_SLUGS.includes(s as TabSlug);
}

function shortAddr(a?: string) {
  if (!a) return "";
  return a.length <= 10 ? a : `${a.slice(0, 6)}...${a.slice(-4)}`;
}

// ---- Sidebar ----
function Sidebar({ tab, setTab }: { tab: TabSlug; setTab: (t: TabSlug) => void }) {
  const { user, updateUser } = useQuestAuthStore();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.username ?? "");
  const [showAvPicker, setShowAvPicker] = useState(false);
  const [copied, setCopied] = useState(false);

  const updateName = useUsersControllerUpdateProfile();

  const handleSaveName = () => {
    if (newName.trim()) {
      updateUser({ username: newName.trim() });
      updateName.mutate({ data: { username: newName.trim() } });
    }
    setEditingName(false);
  };

  const items: { id: TabSlug; label: string; icon: React.ReactNode }[] = [
    {
      id: "overview",
      label: "Overview",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="18"
          height="18"
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
    {
      id: "my-quest",
      label: "My Quests",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="18"
          height="18"
        >
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1" />
        </svg>
      ),
    },
    {
      id: "referrals",
      label: "Referrals",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="18"
          height="18"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13A4 4 0 0 1 16 11" />
        </svg>
      ),
    },
    {
      id: "social",
      label: "Social Accounts",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="18"
          height="18"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
        </svg>
      ),
    },
  ];

  const headerRank = rankFromPoints(user?.totalPoints ?? 0).rank;
  const headerVar = rankVar(headerRank);
  const headerAsset = rankAsset(headerRank);

  return (
    <div className="px-4 pt-[26px] pb-[26px] flex flex-col gap-5 max-[720px]:border-b max-[720px]:border-b-[rgba(255,255,255,0.08)] max-[720px]:p-4">
      <div className="flex flex-col items-start px-2 pt-[6px] pb-[2px]">
        <div className="relative w-24 h-24 mb-[14px] max-[720px]:w-16 max-[720px]:h-16">
          <div className="w-24 h-24 rounded-full overflow-hidden border-[3px] border-[var(--accent)] shadow-[0_0_0_4px_var(--accent-soft)] max-[720px]:w-16 max-[720px]:h-16">
            <TasmilAvatar
              seed={user?.walletAddress ?? "default"}
              variant={variantFromAvatarUrl(user?.avatarUrl)}
              size="full"
            />
          </div>
          <button
            className="absolute bottom-0.5 right-0.5 w-7 h-7 rounded-full grid place-items-center bg-[var(--surface)] border border-[rgba(255,255,255,0.14)] cursor-pointer text-[rgba(244,247,251,0.58)] hover:text-[var(--accent)] hover:border-[rgba(103,232,249,0.32)]"
            onClick={() => setShowAvPicker(!showAvPicker)}
            aria-label="Change avatar"
          >
            <Edit2 size={15} />
          </button>
        </div>

        {editingName ? (
          <div className="flex items-center gap-2 mt-[14px]">
            <input
              className="input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{ fontSize: 14, padding: "6px 10px" }}
              autoFocus
              onBlur={handleSaveName}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveName();
              }}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-[14px]">
            <span className="text-[19px] font-bold tracking-[-0.02em]">
              {user?.username ?? "Quester"}
            </span>
            <button
              className="w-6 h-6 grid place-items-center rounded-[6px] cursor-pointer text-[rgba(244,247,251,0.34)] bg-transparent border-none hover:text-[var(--accent)] hover:bg-[var(--accent-soft)]"
              onClick={() => {
                setNewName(user?.username ?? "");
                setEditingName(true);
              }}
              aria-label="Edit username"
            >
              <Edit2 size={13} />
            </button>
          </div>
        )}

        <button
          className="inline-flex items-center gap-[6px] font-mono text-[13px] text-[rgba(244,247,251,0.34)] cursor-pointer bg-transparent border-none px-2 py-1 mt-2 rounded-[6px] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)]"
          onClick={() => {
            navigator.clipboard?.writeText(user?.walletAddress ?? "");
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          }}
        >
          {shortAddr(user?.walletAddress)}{" "}
          {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
        </button>

        <span
          className="inline-flex items-center gap-[6px] text-[10px] font-bold tracking-[0.14em] uppercase py-[5px] px-[11px] rounded-[100px] mt-3 border"
          style={{
            color: headerVar.color,
            background: headerVar.soft,
            borderColor: headerVar.line,
          }}
        >
          {headerAsset && (
            <img
              className="w-4 h-4 object-contain [filter:drop-shadow(0_2px_3px_rgba(0,0,0,0.4))]"
              src={headerAsset}
              alt=""
            />
          )}
          {headerRank}
        </span>
      </div>

      <div className="h-px bg-[rgba(255,255,255,0.08)]" />

      {showAvPicker && (
        <div>
          <div className="grid grid-cols-3 gap-[10px]">
            {QUEST_AVATAR_VARIANTS.map((v) => (
              <button
                key={v}
                type="button"
                className="w-full aspect-square rounded-[14px] cursor-pointer border-2 border-transparent overflow-hidden transition-[border-color,transform] duration-[250ms] hover:scale-105 hover:border-[var(--accent)]"
                onClick={() => {
                  updateUser({ avatarUrl: variantToken(v) });
                  setShowAvPicker(false);
                }}
              >
                <TasmilAvatar seed={user?.walletAddress ?? "default"} variant={v} size="full" />
              </button>
            ))}
          </div>
        </div>
      )}

      <nav className="flex flex-col gap-1">
        {items.map((it) => (
          <button
            key={it.id}
            className={`flex items-center gap-3 text-[14px] font-semibold px-[14px] py-[10px] rounded-[14px] cursor-pointer transition-[color,background] duration-[250ms] text-left bg-transparent border-none w-full ${
              tab === it.id
                ? "text-[var(--accent)] bg-[var(--accent-soft)]"
                : "text-[rgba(244,247,251,0.58)] hover:text-[var(--text)] hover:bg-[rgba(255,255,255,0.04)]"
            }`}
            onClick={() => setTab(it.id)}
            type="button"
          >
            {it.icon} {it.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

// PtsCoin
const Pts = () => (
  <svg
    className="inline-block flex-none w-[18px] h-[18px]"
    style={{ verticalAlign: -4, marginLeft: 4 }}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <linearGradient id="ptsG" x1="0.15" y1="0.1" x2="0.85" y2="0.9">
      <stop stopColor="#A5F3FC" />
      <stop offset="1" stopColor="#0EA5E9" />
    </linearGradient>
    <circle cx="12" cy="12" r="9" fill="url(#ptsG)" />
    <path d="M12.7 6.4l-4.3 6.05h2.9l-.9 4.45 4.4-6.2h-3z" fill="#04141A" />
  </svg>
);

// Rank visuals derived from the canonical tier module. globals.css defines
// --bronze/--silver/--gold/--diamond var families; "muted" is a neutral grey
// for Unranked, which has no dedicated rank variable or badge asset.
const RANK_VAR: Record<string, { color: string; soft: string; line: string }> = {
  bronze: { color: "var(--bronze)", soft: "var(--bronze-soft)", line: "var(--bronze-line)" },
  silver: { color: "var(--silver)", soft: "var(--silver-soft)", line: "var(--silver-line)" },
  gold: { color: "var(--gold)", soft: "var(--gold-soft)", line: "var(--gold-line)" },
  diamond: { color: "var(--diamond)", soft: "var(--diamond-soft)", line: "rgba(103,232,249,0.32)" },
  platinum: { color: "#5fd6c8", soft: "rgba(95,214,200,0.12)", line: "rgba(95,214,200,0.32)" },
  emerald: { color: "#34d399", soft: "rgba(52,211,153,0.12)", line: "rgba(52,211,153,0.32)" },
  master: { color: "#c084fc", soft: "rgba(192,132,252,0.12)", line: "rgba(192,132,252,0.34)" },
  muted: {
    color: "rgba(244,247,251,0.62)",
    soft: "rgba(244,247,251,0.06)",
    line: "rgba(244,247,251,0.18)",
  },
};
const rankVar = (rank: QuestRank) => RANK_VAR[RANK_STYLES[rank].cssKey] ?? RANK_VAR.muted!;
const rankAsset = (rank: QuestRank) => RANK_STYLES[rank].asset;
const RANK_ABBR: Record<QuestRank, string> = {
  Unranked: "UR",
  Bronze: "BR",
  Silver: "SI",
  Gold: "GO",
  Platinum: "PL",
  Emerald: "EM",
  Diamond: "DI",
  Master: "MA",
};

// ---- Overview Tab ----
function OverviewTab() {
  const { user } = useQuestAuthStore();
  const { data: pointsData } = useUsersControllerGetPointsHistory(
    user?.id ?? "",
    withAuth as never
  );
  const { data: refData } = useReferralControllerGetMyReferral(withAuth as never);

  // Backend returns `{ referralCode, totalEarned, totalInvited, rates }`. The
  // client interceptor unwraps the `{ success, data }` envelope, so handle both.
  const referral = useMemo(
    () =>
      unwrapEnvelope<{
        referralCode?: string | null;
        totalEarned?: number;
        totalInvited?: number;
        rates?: { layer: number; rateBps: number }[];
      }>(refData) ?? {},
    [refData]
  );
  const refCode = referral.referralCode ?? user?.referralCode ?? "—";
  const refEarned = referral.totalEarned ?? 0;
  const refInvited = referral.totalInvited ?? 0;
  const refRate = (layer: number) => {
    const bps = (referral.rates ?? []).find((r) => r.layer === layer)?.rateBps;
    return bps != null ? `${Math.round(bps / 100)}%` : "—";
  };

  const ledger = useMemo(() => {
    const raw = pointsData as
      | { data?: { items?: RawLedgerEntry[] } }
      | { items?: RawLedgerEntry[] }
      | undefined;
    const items =
      (raw as { data?: { items?: RawLedgerEntry[] } })?.data?.items ??
      (raw as { items?: RawLedgerEntry[] })?.items ??
      [];
    return items.slice(0, 5);
  }, [pointsData]);

  const points = user?.totalPoints ?? 0;
  // Single source of truth: rank + progress derived from points so the badge
  // label and the progress bar always agree (see lib/tier.ts).
  const rd = rankFromPoints(points);
  const currentRank = rd.rank;
  const tierCurrentIdx = RANK_ORDER.indexOf(currentRank);
  const curVar = rankVar(currentRank);
  const nextRank = rd.nextRank;
  const nextVar = rankVar(nextRank ?? currentRank);
  const toNext = rd.toNext;
  const progress = rd.progress;

  return (
    <div>
      <h1 className="text-[30px] font-extrabold tracking-[-0.035em] mb-[22px]">Overview</h1>

      <div
        className="grid gap-[14px] items-start"
        style={{ gridTemplateColumns: "minmax(0,1fr) 320px" }}
      >
        <div className="flex flex-col gap-[14px] min-w-0">
          <div className="border border-[rgba(255,255,255,0.08)] rounded-[22px] [background:var(--card-grad)] overflow-hidden">
            <div className="px-[30px] pt-[28px] pb-[22px]">
              <div className="flex items-center justify-between gap-4 mb-[18px]">
                <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-[rgba(244,247,251,0.34)] whitespace-nowrap">
                  Current Points
                </div>
                <span
                  className="inline-flex items-center gap-[6px] text-[10px] font-bold tracking-[0.14em] uppercase py-[5px] px-[11px] rounded-[100px] border flex-none"
                  style={{ color: curVar.color, background: curVar.soft, borderColor: curVar.line }}
                >
                  {rankAsset(currentRank) && (
                    <img
                      className="w-4 h-4 object-contain [filter:drop-shadow(0_2px_3px_rgba(0,0,0,0.4))]"
                      src={rankAsset(currentRank)}
                      alt=""
                    />
                  )}
                  {currentRank} tier
                </span>
              </div>

              <div className="flex items-center justify-between gap-6 flex-wrap">
                <div
                  className="text-[56px] font-extrabold font-mono tracking-[-0.03em] leading-none"
                  style={{
                    background: "var(--grad)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {fmt(points)}
                </div>

                <div
                  className="flex gap-[2px] rounded-[11px] border border-[rgba(255,255,255,0.08)] flex-none"
                  style={{ padding: 5, background: "rgba(32,32,36,0.30)" }}
                >
                  {RANK_ORDER.map((rank, i) => {
                    const isOn = i === tierCurrentIdx;
                    const rv = rankVar(rank);
                    const asset = rankAsset(rank);
                    return (
                      <div
                        key={rank}
                        className="flex flex-col items-center gap-[4px] text-[9px] font-bold tracking-[0.06em] uppercase rounded-[8px]"
                        style={{
                          width: 34,
                          padding: "7px 3px",
                          background: isOn ? rv.soft : "none",
                          color: isOn ? rv.color : "rgba(244,247,251,0.34)",
                          border: "none",
                        }}
                      >
                        {asset ? (
                          <img
                            className="object-contain"
                            style={{
                              width: 22,
                              height: 22,
                              opacity: isOn ? 1 : 0.4,
                              filter: isOn ? "none" : "saturate(0.55)",
                            }}
                            src={asset}
                            alt=""
                          />
                        ) : (
                          <span
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 999,
                              background: rv.soft,
                              border: `1px solid ${rv.line}`,
                              opacity: isOn ? 1 : 0.4,
                            }}
                          />
                        )}
                        {RANK_ABBR[rank]}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-[18px] px-[26px] py-[22px] border-t border-[rgba(255,255,255,0.08)]">
              <div className="flex flex-col items-center gap-[7px] flex-none w-16">
                {rankAsset(currentRank) ? (
                  <img
                    className="object-contain [filter:drop-shadow(0_5px_9px_rgba(0,0,0,0.45))]"
                    style={{ width: 42, height: 42 }}
                    src={rankAsset(currentRank)}
                    alt=""
                  />
                ) : (
                  <span
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 999,
                      background: curVar.soft,
                      border: `1px solid ${curVar.line}`,
                    }}
                  />
                )}
                <div
                  className="text-[9px] font-bold tracking-[0.12em] uppercase"
                  style={{ color: curVar.color }}
                >
                  {currentRank}
                </div>
              </div>

              <div className="flex-1">
                <div
                  className="relative h-3 rounded-[100px] border border-[rgba(255,255,255,0.08)] overflow-hidden"
                  style={{ background: "var(--surface)" }}
                >
                  <div
                    className="h-full rounded-[100px] [background:var(--grad)] transition-[width] duration-1000"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                <div className="mt-[9px] text-[12px] text-[rgba(244,247,251,0.58)] text-center">
                  {nextRank ? (
                    <>
                      <b className="text-[var(--accent)] font-mono">{fmt(Math.max(0, toNext))}</b>
                      <Pts /> to reach {nextRank}
                    </>
                  ) : (
                    "Max rank reached"
                  )}
                </div>
              </div>

              <div
                className="flex flex-col items-center gap-[7px] flex-none w-16"
                style={{ opacity: 0.55 }}
              >
                {nextRank && rankAsset(nextRank) ? (
                  <img
                    className="object-contain [filter:drop-shadow(0_5px_9px_rgba(0,0,0,0.45))]"
                    style={{ width: 42, height: 42 }}
                    src={rankAsset(nextRank)}
                    alt=""
                  />
                ) : (
                  <span
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 999,
                      background: nextVar.soft,
                      border: `1px solid ${nextVar.line}`,
                    }}
                  />
                )}
                <div
                  className="text-[9px] font-bold tracking-[0.12em] uppercase"
                  style={{ color: nextVar.color }}
                >
                  {nextRank ?? "Max"}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-[14px]">
            <div className="border border-[rgba(255,255,255,0.08)] rounded-[22px] [background:var(--card-grad)] px-[22px] py-[20px] flex flex-col">
              <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-[rgba(244,247,251,0.34)]">
                Daily Streak
              </div>
              <div className="text-[40px] font-extrabold font-mono tracking-[-0.03em] leading-none flex items-center gap-[10px] mt-2">
                <svg viewBox="0 0 24 24" width="30" height="30" fill="none" aria-hidden="true">
                  <linearGradient id="fg" x1="0.5" y1="0" x2="0.5" y2="1">
                    <stop offset="0" stopColor="#FCD34D" />
                    <stop offset="0.5" stopColor="#FB923C" />
                    <stop offset="1" stopColor="#F43F5E" />
                  </linearGradient>
                  <path
                    d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
                    fill="url(#fg)"
                  />
                </svg>
                {user?.loginStreak ?? 0}
              </div>
              <div className="text-[12px] text-[rgba(244,247,251,0.58)] mt-2">day streak</div>
            </div>
            <div className="border border-[rgba(255,255,255,0.08)] rounded-[22px] [background:var(--card-grad)] px-[22px] py-[20px] flex flex-col">
              <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-[rgba(244,247,251,0.34)]">
                Quests Done
              </div>
              <div className="text-[40px] font-extrabold font-mono tracking-[-0.03em] leading-none mt-2">
                0
              </div>
              <div className="text-[12px] text-[rgba(244,247,251,0.58)] mt-2">total quests</div>
            </div>
          </div>
        </div>

        <div
          className="border border-[rgba(255,255,255,0.08)] rounded-[22px] [background:var(--card-grad)] flex flex-col min-w-0"
          style={{ padding: 22 }}
        >
          <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[rgba(244,247,251,0.58)]">
            Referral Program
          </div>
          <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-[rgba(244,247,251,0.34)] mt-[18px]">
            Your Code
          </div>
          <div
            className="text-[28px] font-black font-mono text-[var(--text)]"
            style={{ letterSpacing: 3, margin: "6px 0 16px" }}
          >
            {refCode}
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              block
              onClick={() => {
                navigator.clipboard?.writeText(refCode === "—" ? "" : refCode);
                toast.success("Copied!");
              }}
            >
              <Copy size={13} /> Copy Code
            </Button>
            <Button variant="ghost" size="sm" block>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                width="13"
                height="13"
              >
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <path d="M16 6l-4-4-4 4" />
                <path d="M12 2v13" />
              </svg>
              Share Link
            </Button>
          </div>

          <div
            className="rounded-[14px] border border-[rgba(255,255,255,0.08)] mt-3"
            style={{ background: "rgba(32,32,36,0.30)", padding: "16px 18px" }}
          >
            <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-[rgba(244,247,251,0.34)]">
              Total Earned From Refs
            </div>
            <div
              className="flex items-center gap-[6px] text-[26px] font-extrabold font-mono text-[var(--accent)] mt-2"
              style={{ letterSpacing: "-0.02em" }}
            >
              {fmt(refEarned)}
              <Pts />
            </div>
            <div className="flex gap-6 pt-[14px] mt-[14px] border-t border-[rgba(255,255,255,0.08)]">
              <div>
                <div className="text-[18px] font-bold font-mono">{fmt(refInvited)}</div>
                <div className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[rgba(244,247,251,0.34)] mt-0.5">
                  Total invited
                </div>
              </div>
            </div>
          </div>

          <div
            className="rounded-[14px] border border-[rgba(255,255,255,0.08)] mt-3"
            style={{ background: "rgba(32,32,36,0.30)", padding: "16px 18px" }}
          >
            <div className="flex items-center justify-between gap-[10px]">
              <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[rgba(244,247,251,0.34)]">
                Referral Rates
              </span>
              <span className="text-[9px] font-bold tracking-[0.1em] uppercase text-[var(--accent)] bg-[var(--accent-soft)] px-[9px] py-1 rounded-[100px]">
                Tier 1
              </span>
            </div>
            <div className="flex gap-[14px] mt-[14px]">
              {(
                [
                  ["L1", 1, "Direct"],
                  ["L2", 2, "Indirect"],
                  ["L3", 3, "3rd"],
                ] as const
              ).map(([k, layer, sub]) => (
                <div key={k} className="flex flex-col gap-[3px]">
                  <span
                    className="text-[20px] font-extrabold font-mono text-[var(--accent)]"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {refRate(layer)}
                  </span>
                  <span className="text-[9px] font-semibold tracking-[0.08em] uppercase text-[rgba(244,247,251,0.34)]">
                    {k} {sub}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {ledger.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Recent Activity</div>
          {ledger.map((e, i) => (
            <div
              key={i}
              className="ledger-row"
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: "1px solid var(--line)",
                fontSize: 13,
                color: "var(--muted)",
              }}
            >
              <span>{e.campaignTitle ?? e.description ?? e.source ?? "Activity"}</span>
              <span
                style={{ fontFamily: "var(--font-mono)", color: "var(--accent)", fontWeight: 600 }}
              >
                +{e.points ?? e.delta ?? 0}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- My Quests Tab ----
function MyQuestsTab() {
  const [subtab, setSubtab] = useState<"pending" | "claimable" | "claimed">("pending");
  const { isAuthenticated } = useWallet();

  const { data: rawData, isLoading } = useUsersControllerGetMyCampaigns(
    { status: subtab },
    withAuth as never
  );

  const items = useMemo(() => {
    const d = rawData as
      | { success?: boolean; data?: { items?: ApiCampaign[] }; items?: ApiCampaign[] }
      | ApiCampaign[]
      | undefined;
    if (!d) return [];
    if (Array.isArray(d)) return d;
    // Wrapped envelope: { success, data: { items } }
    if (d.success && d.data?.items) return d.data.items;
    // Already unwrapped by response interceptor: { items }
    if ((d as { items?: ApiCampaign[] }).items) return (d as { items?: ApiCampaign[] }).items ?? [];
    return [];
  }, [rawData]);

  if (!isAuthenticated)
    return (
      <p style={{ color: "var(--muted)", padding: "40px 0", textAlign: "center" }}>
        Connect your wallet to view quests.
      </p>
    );

  const subtabs = [
    { id: "pending" as const, label: "Pending" },
    { id: "claimable" as const, label: "Claimable" },
    { id: "claimed" as const, label: "Claimed" },
  ];

  return (
    <div>
      {/* ph1 */}
      <h1 className="text-[30px] font-extrabold tracking-[-0.035em] mb-[22px]">My Quests</h1>

      {/* subtabs — with pill count badge */}
      <div className="flex gap-[2px] border-b border-[rgba(255,255,255,0.08)] mb-[22px]">
        {subtabs.map((s) => (
          <button
            key={s.id}
            className={`relative inline-flex items-center gap-2 text-[14px] font-semibold bg-none border-none px-4 py-3 cursor-pointer transition-[color] duration-[250ms] ${
              subtab === s.id
                ? "text-[var(--accent)]"
                : "text-[rgba(244,247,251,0.58)] hover:text-[var(--text)]"
            }`}
            style={{ background: "none" }}
            onClick={() => setSubtab(s.id)}
          >
            {s.label}
            <span
              className={`text-[11px] font-bold font-mono px-[7px] py-[2px] rounded-[100px] ${
                subtab === s.id
                  ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "bg-[var(--surface)] text-[rgba(244,247,251,0.58)]"
              }`}
            >
              {items.length}
            </span>
            {subtab === s.id && (
              <span className="absolute left-[14px] right-[14px] bottom-[-1px] h-0.5 bg-[var(--accent)] rounded-[2px] shadow-[0_0_10px_var(--accent-glow)]" />
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p style={{ color: "var(--muted)", padding: 20 }}>Loading quests...</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center text-center py-12 gap-[14px]">
          <div className="text-[18px] font-bold tracking-[-0.02em] text-[var(--text)]">
            No {subtab} quests
          </div>
          <div className="text-[14px] text-[rgba(244,247,251,0.58)]">
            {subtab === "pending"
              ? "Join campaigns to start earning."
              : "Complete tasks to claim rewards."}
          </div>
        </div>
      ) : (
        /* quest-grid: 2-column card grid */
        <div className="grid grid-cols-2 gap-[14px] max-[720px]:grid-cols-1">
          {items.map((c) => {
            const ct = c as unknown as Record<string, unknown>;
            const pts = (ct.rewardPoints as number) ?? 0;
            const cover =
              (ct.coverUrl as string) || (ct.logoUrl as string) || (ct.banner as string) || null;
            return (
              <Link
                key={c.id}
                href={`/quest/campaign/${c.id}`}
                className="border border-[rgba(255,255,255,0.08)] rounded-[22px] [background:var(--card-grad)] overflow-hidden transition-[border-color,transform] duration-300 hover:border-[rgba(103,232,249,0.32)] hover:-translate-y-[3px] flex flex-col"
              >
                {/* qc-cover: image cover (like Explore) + pts badge */}
                <div className="relative h-[128px] overflow-hidden border-b border-[rgba(255,255,255,0.08)] bg-[#0c0e10]">
                  {cover ? (
                    <img
                      alt=""
                      src={cover}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "repeating-linear-gradient(135deg,rgba(255,255,255,0.03) 0 12px,transparent 12px 24px), linear-gradient(160deg,var(--accent-soft),rgba(14,165,233,0.05))",
                      }}
                    />
                  )}
                  {/* pts badge: top-right pill */}
                  <span className="absolute top-3 right-3 text-[12px] font-bold font-mono text-[var(--accent)] px-[11px] py-[5px] rounded-[100px] border border-[rgba(103,232,249,0.32)] bg-[rgba(12,12,14,0.8)] backdrop-blur-[6px]">
                    +{fmt(pts)}
                    <Pts />
                  </span>
                </div>

                {/* qc-body */}
                <div className="flex flex-col flex-1 px-5 py-[18px]">
                  <div className="text-[16px] font-bold tracking-[-0.02em] mb-[7px]">
                    {ct.title as string}
                  </div>
                  <div className="text-[13px] text-[rgba(244,247,251,0.58)] leading-[1.55] mb-4 flex-1">
                    {(ct.description as string) ?? ""}
                  </div>

                  {/* qc-foot: status label + CTA button */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-[rgba(244,247,251,0.58)]">
                      {subtab}
                    </span>
                    <Button
                      variant={
                        subtab === "claimable"
                          ? "primary"
                          : subtab === "pending"
                            ? "accent"
                            : "ghost"
                      }
                      size="sm"
                      disabled={subtab === "claimed"}
                      style={{ whiteSpace: "nowrap" }}
                    >
                      {subtab === "claimed" ? <CheckCircle2 size={12} /> : null}
                      {subtab === "pending"
                        ? "View Quest"
                        : subtab === "claimable"
                          ? "Claim Points"
                          : "Completed"}
                    </Button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---- Referral tree helpers ----
function LayerBadge({ l }: { l: number }) {
  const isL1 = l === 1;
  return (
    <span
      className={`inline-block text-[9px] font-bold tracking-[0.06em] uppercase px-[7px] py-[3px] rounded-[100px] border whitespace-nowrap ${
        isL1
          ? "text-[var(--accent)] bg-[var(--accent-soft)] border-[rgba(103,232,249,0.32)]"
          : "text-[rgba(244,247,251,0.58)] bg-[var(--surface)] border-[rgba(255,255,255,0.14)]"
      }`}
    >
      L{l}
    </span>
  );
}

function StatusBadge({ s }: { s: "active" | "inactive" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-[7px] py-[3px] text-[9px] font-bold tracking-[0.06em] uppercase border whitespace-nowrap ${
        s === "active"
          ? "text-[var(--green)] bg-[rgba(52,211,153,0.12)] border-[rgba(52,211,153,0.28)]"
          : "text-[rgba(244,247,251,0.34)] bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]"
      }`}
    >
      {s}
    </span>
  );
}

const TREE_INDENT = [12, 36, 60];

function TreeRow({ node, depth }: { node: ReferralTreeNode; depth: number }) {
  const [open, setOpen] = useState(depth === 0);
  const hasKids = (node.children?.length ?? 0) > 0;
  const paddingLeft = TREE_INDENT[Math.min(depth, 2)];

  return (
    <div>
      <button
        type="button"
        onClick={() => hasKids && setOpen((o) => !o)}
        className="flex w-full items-center gap-3 border-b border-[rgba(255,255,255,0.08)] py-[11px] text-left transition-[background] duration-200 hover:bg-[rgba(255,255,255,0.04)]"
        style={{ paddingLeft, paddingRight: 16 }}
      >
        {/* chevron */}
        <span className="w-4 flex-none text-[rgba(244,247,251,0.34)]">
          {hasKids ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              width={14}
              height={14}
              style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 200ms" }}
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          ) : null}
        </span>
        {/* avatar */}
        <TasmilAvatar seed={node.name} size={28} className="flex-none" />
        {/* name */}
        <span className="flex-1 min-w-0 font-mono text-[13px] font-semibold truncate">
          {node.name}
        </span>
        {/* badges */}
        <LayerBadge l={node.layer} />
        <StatusBadge s={node.status} />
        {/* quest pts */}
        <span className="w-[90px] text-right font-mono text-[12px] text-[rgba(244,247,251,0.58)] tabular-nums">
          {node.q.toLocaleString("en-US")}
          <Pts />
        </span>
        {/* earned pts */}
        <span className="w-[90px] text-right font-mono text-[12px] text-[var(--accent)] tabular-nums">
          {node.e.toLocaleString("en-US")}
          <Pts />
        </span>
      </button>
      {hasKids &&
        open &&
        node.children.map((c) => <TreeRow key={c.userId} node={c} depth={depth + 1} />)}
    </div>
  );
}

// ---- Referrals Tab ----
function ReferralsTab() {
  const { data: refData } = useReferralControllerGetMyReferral(withAuth as never);
  const { data: refsData } = useUsersControllerGetReferrals(withAuth as never);
  const { data: treeRaw, isLoading: treeLoading } = useReferralControllerGetTree($);
  const [view, setView] = useState<"list" | "tree">("list");
  const { user } = useQuestAuthStore();

  const referralTree = useMemo(() => unwrapEnvelope<ReferralTree>(treeRaw), [treeRaw]);
  const treeNodes = referralTree?.tree ?? [];

  // Client interceptor unwraps the `{ success, data }` envelope, so handle both.
  const refDataObj = useMemo(
    () => unwrapEnvelope<Record<string, unknown>>(refData) ?? {},
    [refData]
  );

  const refs = useMemo(() => {
    const d = unwrapEnvelope<RawReferral[]>(refsData);
    return Array.isArray(d) ? d : [];
  }, [refsData]);

  // Backend fields: `referralCode`, `totalEarned`, `totalInvited`, `rates`.
  // There is no "active referrals" metric, so derive it from the list status.
  const rates = (refDataObj as { rates?: { layer: number; rateBps: number }[] })?.rates ?? [];
  const totalEarned = (refDataObj as { totalEarned?: number })?.totalEarned ?? 0;
  const totalReferrals = (refDataObj as { totalInvited?: number })?.totalInvited ?? refs.length;
  const activeReferrals = refs.filter((r) => (r.status ?? "active") === "active").length;
  const referralCode =
    (refDataObj as { referralCode?: string })?.referralCode ?? user?.referralCode ?? "—";
  const l1Rate = rates.find((r) => r.layer === 1)?.rateBps ?? 0;

  const howCards = [
    {
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="19"
          height="19"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13A4 4 0 0 1 16 11" />
        </svg>
      ),
      pct: `${Math.round(l1Rate / 100)}%`,
      tier: "L1 Direct",
      title: "Invite a Friend",
      desc: "Earn from every direct referral's quest activity, paid in points.",
    },
    {
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="19"
          height="19"
        >
          <circle cx="12" cy="5" r="2.5" />
          <circle cx="5" cy="19" r="2.5" />
          <circle cx="19" cy="19" r="2.5" />
          <path d="M12 7.5v4M10 13l-3.5 3.5M14 13l3.5 3.5" />
        </svg>
      ),
      pct: `${Math.round((rates.find((r) => r.layer === 2)?.rateBps ?? 0) / 100)}%`,
      tier: "L2 Indirect",
      title: "Network Rewards",
      desc: "Earn from your friends' referrals' quest activity as they grow.",
    },
    {
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="19"
          height="19"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" />
        </svg>
      ),
      pct: `${Math.round((rates.find((r) => r.layer === 3)?.rateBps ?? 0) / 100)}%`,
      tier: "L3 Deep Network",
      title: "3rd Layer Earnings",
      desc: "Earn 1% from third-level referrals' quest activity, forever.",
    },
  ];

  return (
    <div>
      <h1 className="text-[30px] font-extrabold tracking-[-0.035em] mb-[22px]">Referrals</h1>

      {/* SECTION A: ref-hero + earn-card (2-col) */}
      <div
        className="grid gap-[18px] mb-[14px]"
        style={{ gridTemplateColumns: "1fr 280px", alignItems: "stretch" }}
      >
        {/* ref-hero */}
        <div className="border border-[rgba(255,255,255,0.08)] rounded-[22px] [background:var(--card-grad)] px-[30px] py-[28px]">
          <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[rgba(244,247,251,0.58)]">
            Referral Program
          </div>
          <h2 className="text-[30px] font-extrabold tracking-[-0.03em] leading-[1.2] mt-[14px] max-w-[460px]">
            Invite Friends, Earn Up to{" "}
            <span
              style={{
                background: "var(--grad)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {Math.round(l1Rate / 100)}%
            </span>{" "}
            of their Quest Points
          </h2>
          <p className="text-[14px] text-[rgba(244,247,251,0.58)] leading-[1.6] mt-4 mb-[26px] max-w-[440px]">
            Earn from your referrals' quest points across three layers, forever. No expiry and no
            minimum.
          </p>

          {/* codebox */}
          <div
            className="border border-[rgba(255,255,255,0.14)] rounded-[14px] px-5 py-[18px]"
            style={{ background: "rgba(32,32,36,0.30)" }}
          >
            <div className="flex items-center justify-between gap-3 mb-[10px]">
              <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[rgba(244,247,251,0.34)]">
                Your Referral Code
              </span>
              <button
                className="inline-flex items-center gap-2 text-[12px] font-semibold text-[rgba(244,247,251,0.58)] bg-none border-none cursor-pointer transition-[color] duration-200 hover:text-[var(--accent)] p-0"
                style={{ background: "none" }}
                onClick={() => {}}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  width="13"
                  height="13"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
                Set custom code
              </button>
            </div>
            <div className="text-[28px] font-black font-mono mb-4" style={{ letterSpacing: 4 }}>
              {referralCode}
            </div>
            <div className="flex gap-[10px]">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  navigator.clipboard?.writeText(referralCode);
                  toast.success("Copied!");
                }}
              >
                <Copy size={13} /> Copy Code
              </Button>
              <Button variant="ghost" size="sm">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  width="13"
                  height="13"
                >
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <path d="M16 6l-4-4-4 4" />
                  <path d="M12 2v13" />
                </svg>
                Share Link
              </Button>
            </div>
          </div>
        </div>

        {/* earn-card */}
        <div className="border border-[rgba(255,255,255,0.08)] rounded-[22px] [background:var(--card-grad)] px-[22px] py-[22px] flex flex-col">
          <div className="flex items-center justify-between mb-[18px]">
            <h3 className="text-[16px] font-bold">My Earnings</h3>
            <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-[var(--accent)] bg-[var(--accent-soft)] border border-[rgba(103,232,249,0.32)] px-[10px] py-1 rounded-[100px]">
              Tier 1
            </span>
          </div>

          <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-[rgba(244,247,251,0.34)]">
            Commission Amount
          </div>
          <div
            className="text-[32px] font-extrabold font-mono text-[var(--accent)] leading-none mt-1"
            style={{ letterSpacing: "-0.02em" }}
          >
            {fmt(totalEarned)}
            <Pts />
          </div>

          <div className="h-px bg-[rgba(255,255,255,0.08)] my-[18px]" />

          <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-[rgba(244,247,251,0.34)]">
            Earn Rate (F1)
          </div>
          <div
            className="text-[24px] font-extrabold font-mono mt-1"
            style={{ letterSpacing: "-0.02em" }}
          >
            {Math.round(l1Rate / 100)}%
          </div>

          <div className="h-px bg-[rgba(255,255,255,0.08)] my-[18px]" />

          <div className="flex gap-[30px]">
            <div>
              <div className="text-[20px] font-bold font-mono">{totalReferrals}</div>
              <div className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[rgba(244,247,251,0.34)] mt-0.5">
                Total Invited
              </div>
            </div>
            <div>
              <div className="text-[20px] font-bold font-mono text-[var(--green)]">
                {activeReferrals}
              </div>
              <div className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[rgba(244,247,251,0.34)] mt-0.5">
                Active
              </div>
            </div>
          </div>

          <div className="mt-auto pt-[18px]">
            <div className="h-px bg-[rgba(255,255,255,0.08)] mb-[18px]" />
            <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-[rgba(244,247,251,0.34)] mb-2">
              Quest PTS toward Tier 2
            </div>
            <div
              className="relative h-3 rounded-[100px] border border-[rgba(255,255,255,0.08)] overflow-hidden"
              style={{ background: "var(--surface)" }}
            >
              <div
                className="h-full rounded-[100px] [background:var(--grad)]"
                style={{ width: "46%" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION B: how-grid (3 cards) */}
      <div className="grid grid-cols-3 gap-[14px] mt-[14px]">
        {howCards.map((h) => (
          <div
            key={h.tier}
            className="border border-[rgba(255,255,255,0.08)] rounded-[22px] [background:var(--card-grad)] p-[22px]"
          >
            <div className="flex items-start justify-between mb-[18px]">
              <div className="w-[38px] h-[38px] rounded-[12px] grid place-items-center bg-[var(--accent-soft)] border border-[rgba(103,232,249,0.32)] text-[var(--accent)]">
                {h.icon}
              </div>
              <span
                className="text-[28px] font-extrabold font-mono text-[var(--accent)]"
                style={{ letterSpacing: "-0.02em" }}
              >
                {h.pct}
              </span>
            </div>
            <div className="text-[9px] font-bold tracking-[0.14em] uppercase text-[rgba(244,247,251,0.34)] mb-1">
              {h.tier}
            </div>
            <div className="text-[15px] font-bold tracking-[-0.02em] mb-[9px]">{h.title}</div>
            <p className="text-[12.5px] text-[rgba(244,247,251,0.58)] leading-[1.55]">{h.desc}</p>
          </div>
        ))}
      </div>

      {/* SECTION C: list / tree toggle + table */}
      <div className="mt-[26px]">
        {/* lt-tabs */}
        <div className="flex gap-[2px] border-b border-[rgba(255,255,255,0.08)] mb-4">
          {(["list", "tree"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`relative text-[11px] font-bold tracking-[0.14em] uppercase bg-none border-none px-[14px] py-[11px] cursor-pointer transition-[color] duration-200 ${
                view === v
                  ? "text-[var(--accent)]"
                  : "text-[rgba(244,247,251,0.58)] hover:text-[var(--text)]"
              }`}
              style={{ background: "none" }}
            >
              {v === "list" ? "Referral List" : "Referral Tree"}
              {view === v && (
                <span className="absolute left-3 right-3 bottom-[-1px] h-0.5 bg-[var(--accent)] rounded-[2px] shadow-[0_0_10px_var(--accent-glow)]" />
              )}
            </button>
          ))}
        </div>

        {view === "list" ? (
          refs.length === 0 ? (
            <div className="text-center py-12 text-[13px] text-[rgba(244,247,251,0.58)]">
              No referrals yet. Share your code to get started.
            </div>
          ) : (
            /* reflist */
            <div className="border border-[rgba(255,255,255,0.08)] rounded-[22px] [background:var(--card-grad)] overflow-hidden">
              {/* rl-head: 5-col grid */}
              <div
                className="grid items-center gap-[10px] px-[22px] py-[11px] text-[10px] font-bold tracking-[0.12em] uppercase text-[rgba(244,247,251,0.34)] border-b border-[rgba(255,255,255,0.08)]"
                style={{
                  gridTemplateColumns: "1.6fr 0.7fr 1fr 1fr",
                  background: "rgba(0,0,0,0.25)",
                }}
              >
                <span>Username</span>
                <span>Layer</span>
                <span>Joined</span>
                <span className="text-right">PTS</span>
              </div>
              {refs.map((r, i) => (
                <div
                  key={i}
                  className="grid items-center gap-[10px] px-[22px] py-[14px] border-b border-[rgba(255,255,255,0.08)] last:border-b-0 transition-[background] duration-200 hover:bg-[var(--accent-soft)]"
                  style={{ gridTemplateColumns: "1.6fr 0.7fr 1fr 1fr" }}
                >
                  {/* rl-user */}
                  <div className="flex items-center gap-[10px] min-w-0">
                    <TasmilAvatar seed={r.username ?? "u"} size={30} className="flex-none" />
                    <span className="font-mono text-[13px] font-semibold truncate">
                      {r.username ?? "User"}
                    </span>
                  </div>
                  {/* layerb */}
                  <span>
                    <span
                      className={`inline-block text-[9px] font-bold tracking-[0.06em] uppercase px-[7px] py-[3px] rounded-[100px] border whitespace-nowrap ${
                        (r.layer ?? 1) === 1
                          ? "text-[var(--accent)] bg-[var(--accent-soft)] border-[rgba(103,232,249,0.32)]"
                          : "text-[rgba(244,247,251,0.58)] bg-[var(--surface)] border-[rgba(255,255,255,0.14)]"
                      }`}
                    >
                      L{r.layer ?? 1}
                    </span>
                  </span>
                  {/* joined */}
                  <span className="text-[12px] text-[rgba(244,247,251,0.58)]">
                    {r.joinedAt ? new Date(r.joinedAt).toLocaleDateString() : ""}
                  </span>
                  {/* pts (total) */}
                  <span className="font-mono text-[13px] text-right tabular-nums text-[var(--accent)]">
                    {((r.questPoints ?? 0) + (r.ptsEarned ?? 0)).toLocaleString()}
                    <Pts />
                  </span>
                </div>
              ))}
            </div>
          )
        ) : /* referral tree — real nested hierarchy */
        treeLoading ? (
          <div className="text-center py-12 text-[13px] text-[rgba(244,247,251,0.58)]">
            Loading tree…
          </div>
        ) : treeNodes.length === 0 ? (
          <div className="text-center py-12 text-[13px] text-[rgba(244,247,251,0.58)]">
            Referral tree will appear once you have active referrals.
          </div>
        ) : (
          <div className="border border-[rgba(255,255,255,0.08)] rounded-[22px] [background:var(--card-grad)] overflow-hidden">
            {/* rt-head */}
            <div
              className="flex items-center gap-3 pl-[52px] pr-4 py-[11px] text-[10px] font-bold tracking-[0.12em] uppercase text-[rgba(244,247,251,0.34)] border-b border-[rgba(255,255,255,0.08)]"
              style={{ background: "rgba(0,0,0,0.25)" }}
            >
              <span className="flex-1">Username</span>
              <span className="w-[52px]">Layer</span>
              <span className="w-[68px]">Status</span>
              <span className="w-[90px] text-right">Quest PTS</span>
              <span className="w-[90px] text-right">Earned PTS</span>
            </div>
            {treeNodes.map((n) => (
              <TreeRow key={n.userId} node={n} depth={0} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Social Tab ----
function SocialTab() {
  const { data: socData } = useSocialAccountsControllerFindAll({
    ...withAuth,
    query: { staleTime: 30 * 1000 },
  });

  const accounts = useMemo<SocialAccount[]>(() => {
    const d = socData as { data?: SocialAccount[] } | SocialAccount[] | undefined;
    if (Array.isArray(d)) return d;
    return d?.data ?? [];
  }, [socData]);

  const socials = [
    {
      platform: "X" as const,
      label: "X (Twitter)",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      platform: "Discord" as const,
      label: "Discord",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
          <path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.445.865-.608 1.249a18.27 18.27 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.249.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127c-.598.349-1.22.645-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.057c.5-5.177-.838-9.673-3.549-13.66a.06.06 0 0 0-.031-.029zM8.02 15.331c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      ),
    },
    {
      platform: "Telegram" as const,
      label: "Telegram",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      ),
    },
  ];

  const isConnected = (p: string) => accounts.some((a) => a.platform === p);

  return (
    <div>
      <h1 className="text-[30px] font-extrabold tracking-[-0.035em] mb-[22px]">Social Accounts</h1>
      <div className="flex flex-col gap-3 max-w-[620px]">
        {socials.map((s) => {
          const connected = isConnected(s.platform);
          const acc = accounts.find((a) => a.platform === s.platform);
          return (
            <div
              key={s.platform}
              className="flex items-center gap-4 px-[22px] py-[18px] border border-[rgba(255,255,255,0.08)] rounded-[22px] [background:var(--card-grad)] transition-[border-color] duration-[250ms] hover:border-[rgba(103,232,249,0.32)]"
            >
              <div className="w-[46px] h-[46px] rounded-[13px] flex-none grid place-items-center bg-[var(--surface)] border border-[rgba(255,255,255,0.14)]">
                {s.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-bold tracking-[-0.02em]">
                  {connected ? (acc?.username ?? s.platform) : s.label}
                </div>
                <div
                  className={`text-[12.5px] mt-[2px] ${connected ? "text-[var(--green)]" : "text-[rgba(244,247,251,0.58)]"}`}
                >
                  {connected ? "Connected" : "Not connected"}
                </div>
              </div>
              {connected ? (
                <Button variant="ghost" size="sm">
                  Disconnect
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const width = 500;
                    const height = 700;
                    const left = window.screen.width / 2 - width / 2;
                    const top = window.screen.height / 2 - height / 2;
                    window.open(
                      `/api/auth/${s.platform.toLowerCase()}`,
                      `${s.platform} Login`,
                      `width=${width},height=${height},left=${left},top=${top}`
                    );
                  }}
                >
                  Connect
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Inner Profile content (reads useSearchParams) ----
function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawSlug = searchParams.get("tab");
  const tab: TabSlug = isValidSlug(rawSlug) ? rawSlug : "overview";

  const setTab = (t: TabSlug) => {
    router.replace(`?tab=${t}`, { scroll: false });
  };

  const { isAuthenticated, connect } = useWallet();

  if (!isAuthenticated) {
    return (
      <div
        className="flex flex-col items-center text-center py-20 px-5 gap-[14px]"
        style={{ minHeight: "50vh", justifyContent: "center" }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: 48, height: 48, color: "var(--dim)" }}
        >
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <path d="M22 10h-4a2 2 0 0 0 0 4h4" />
          <circle cx="15" cy="12" r="1" />
        </svg>
        <div className="text-[18px] font-bold tracking-[-0.02em] text-[var(--text)]">
          Connect your wallet
        </div>
        <div className="text-[14px] text-[rgba(244,247,251,0.58)]">
          Link your Stellar wallet to access quests, referrals, and rewards.
        </div>
        <Button type="button" variant="primary" onClick={connect} style={{ marginTop: 16 }}>
          Connect Wallet
        </Button>
      </div>
    );
  }

  return (
    <div className="relative left-1/2 w-screen max-w-none -translate-x-1/2 grid min-h-[calc(100vh-64px)] grid-cols-[220px_1fr] items-stretch [margin-top:-40px] [margin-bottom:-120px] max-[720px]:grid-cols-1 max-[720px]:[margin-top:-40px] max-[720px]:[margin-bottom:-120px]">
      <Sidebar tab={tab} setTab={setTab} />
      <div
        className="border-l border-[var(--line-2)] max-[720px]:border-l-0"
        style={{ padding: "0 clamp(24px, 5vw, 48px)" }}
      >
        <div className="pt-8">
          <Rise delay={0.08}>
            {tab === "overview" && <OverviewTab />}
            {tab === "my-quest" && <MyQuestsTab />}
            {tab === "referrals" && <ReferralsTab />}
            {tab === "social" && <SocialTab />}
          </Rise>
        </div>
      </div>
    </div>
  );
}

// ---- Main Profile ----
const Profile: React.FC = () => {
  return (
    <Rise>
      <Suspense fallback={<div style={{ minHeight: "50vh" }} />}>
        <ProfileContent />
      </Suspense>
    </Rise>
  );
};

export default Profile;
