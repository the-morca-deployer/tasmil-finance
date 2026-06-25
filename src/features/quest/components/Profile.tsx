"use client";

import { CheckCircle2, Copy, Edit2 } from "lucide-react";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { Rise } from "@/features/quest/components/Rise";
import { useWallet } from "@/features/quest/context/wallet-context";
import { withAuth } from "@/features/quest/lib/kubb-config";
import { useQuestAuthStore } from "@/features/quest/store/use-quest-auth";
import {
  useReferralControllerGetMyReferral,
  useSocialAccountsControllerFindAll,
  useUsersControllerGetMyCampaigns,
  useUsersControllerGetPointsHistory,
  useUsersControllerGetReferrals,
  useUsersControllerUpdateProfile,
} from "@/gen-quest/hooks";
const fmt = (n: number) => n.toLocaleString("en-US");

// ---- Local interfaces ----
interface SocialAccount {
  id: string; platform: "X" | "Discord" | "Telegram"; platformUserId: string;
  username?: string; displayName?: string; avatarUrl?: string; connectedAt: string;
}
interface ApiCampaign {
  id: string; title: string; description?: string; rewardPoints?: number;
  logoUrl?: string; coverUrl?: string; questersCount?: number;
}
interface RawLedgerEntry {
  createdAt?: string; occurredAt?: string; source?: string; description?: string;
  campaignTitle?: string; points?: number; delta?: number;
}
interface RawReferral { username?: string; layer?: number; joinedAt?: string; questPoints?: number; ptsEarned?: number; status?: string; }

// Avatar gradient
function avatarBg(seed: string) {
  let h = 0; for (let i = 0; i < seed.length; i++) { h = (h << 5) - h + seed.charCodeAt(i); h |= 0; }
  const a = Math.abs(h) % 360, b = (Math.abs(h) * 3 + 90) % 360;
  return `radial-gradient(circle at 32% 28%, hsl(${a} 80% 70%), hsl(${b} 75% 42%) 75%)`;
}

function shortAddr(a?: string) { if (!a) return ""; return a.length <= 10 ? a : `${a.slice(0, 6)}...${a.slice(-4)}`; }

const AV_COLORS = [
  "linear-gradient(135deg,#67E8F9,#0EA5E9)", "linear-gradient(135deg,#6EE7B7,#14B8A6)",
  "linear-gradient(135deg,#818CF8,#4F46E5)", "linear-gradient(135deg,#FBC54A,#E0915A)",
  "linear-gradient(135deg,#F472B6,#DB2777)", "linear-gradient(135deg,#C9D4E0,#64748B)",
  "linear-gradient(135deg,#34D399,#059669)", "linear-gradient(135deg,#A78BFA,#7C3AED)",
  "linear-gradient(135deg,#FB7185,#E11D48)", "linear-gradient(135deg,#38BDF8,#2563EB)",
];

// ---- Sidebar ----
function Sidebar({ tab, setTab }: { tab: string; setTab: (t: string) => void }) {
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

  const items = [
    { id: "overview", label: "Overview", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
    { id: "quests", label: "My Quests", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg> },
    { id: "referrals", label: "Referrals", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13A4 4 0 0 1 16 11"/></svg> },
    { id: "social", label: "Social Accounts", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></svg> },
  ];

  const tierBg = user?.tier?.toLowerCase() ?? "bronze";

  return (
    // pside: position:sticky; top:84px; padding:26px 16px; border-right:1px solid var(--line); height:calc(100vh - 84px); overflow-y:auto; display:flex; flex-direction:column; gap:20px;
    // max-[720px]: position:static; height:auto; border-right:none; border-bottom:1px solid var(--line); padding:16px
    <div className="sticky top-[84px] px-4 pt-[26px] pb-[26px] border-r border-[rgba(255,255,255,0.08)] h-[calc(100vh-84px)] overflow-y-auto flex flex-col gap-5 max-[720px]:static max-[720px]:h-auto max-[720px]:border-r-0 max-[720px]:border-b max-[720px]:border-b-[rgba(255,255,255,0.08)] max-[720px]:p-4">
      {/* uc: display:flex; flex-direction:column; align-items:flex-start; padding:6px 8px 2px; */}
      <div className="flex flex-col items-start px-2 pt-[6px] pb-[2px]">
        {/* uc-av-wrap: position:relative; width:96px; height:96px; margin-bottom:14px; */}
        {/* max-[720px]: width:64px; height:64px */}
        <div className="relative w-24 h-24 mb-[14px] max-[720px]:w-16 max-[720px]:h-16">
          {/* uc-av: width:96px; height:96px; border-radius:50%; border:3px solid var(--accent); box-shadow:0 0 0 4px var(--accent-soft); */}
          {/* max-[720px]: width:64px; height:64px */}
          <div
            className="w-24 h-24 rounded-full border-[3px] border-[var(--accent)] shadow-[0_0_0_4px_var(--accent-soft)] bg-cover bg-center max-[720px]:w-16 max-[720px]:h-16"
            style={{ background: user?.avatarUrl ? `url(${user.avatarUrl})` : avatarBg(user?.walletAddress ?? "default") }}
          />
          {/* uc-av-edit: position:absolute; bottom:2px; right:2px; width:28px; height:28px; border-radius:50%; display:grid; place-items:center; background:var(--surface); border:1px solid var(--line-2); cursor:pointer; color:var(--muted); */}
          {/* hover: color:var(--accent); border-color:var(--accent-line) */}
          <button
            className="absolute bottom-0.5 right-0.5 w-7 h-7 rounded-full grid place-items-center bg-[var(--surface)] border border-[rgba(255,255,255,0.14)] cursor-pointer text-[rgba(244,247,251,0.58)] hover:text-[var(--accent)] hover:border-[rgba(103,232,249,0.32)]"
            onClick={() => setShowAvPicker(!showAvPicker)}
            aria-label="Change avatar"
          >
            <Edit2 size={15} />
          </button>
        </div>

        {editingName ? (
          // uc-name-row: display:flex; align-items:center; gap:8px; margin-top:14px;
          <div className="flex items-center gap-2 mt-[14px]">
            <input className="input" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ fontSize: 14, padding: "6px 10px" }} autoFocus onBlur={handleSaveName} onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); }} />
          </div>
        ) : (
          // uc-name-row: display:flex; align-items:center; gap:8px; margin-top:14px;
          <div className="flex items-center gap-2 mt-[14px]">
            {/* uc-name: font-size:19px; font-weight:700; letter-spacing:-0.02em; */}
            <span className="text-[19px] font-bold tracking-[-0.02em]">{user?.username ?? "Quester"}</span>
            {/* uc-pencil: width:24px; height:24px; display:grid; place-items:center; border-radius:6px; cursor:pointer; color:var(--dim); background:none; border:none; */}
            {/* hover: color:var(--accent); background:var(--accent-soft) */}
            <button
              className="w-6 h-6 grid place-items-center rounded-[6px] cursor-pointer text-[rgba(244,247,251,0.34)] bg-transparent border-none hover:text-[var(--accent)] hover:bg-[var(--accent-soft)]"
              onClick={() => { setNewName(user?.username ?? ""); setEditingName(true); }}
              aria-label="Edit username"
            >
              <Edit2 size={13} />
            </button>
          </div>
        )}

        {/* uc-addr: display:inline-flex; align-items:center; gap:6px; font-family:var(--font-mono); font-size:13px; color:var(--dim); cursor:pointer; background:none; border:none; padding:4px 8px; margin-top:8px; border-radius:6px; */}
        {/* hover: color:var(--accent); background:var(--accent-soft) */}
        <button
          className="inline-flex items-center gap-[6px] font-mono text-[13px] text-[rgba(244,247,251,0.34)] cursor-pointer bg-transparent border-none px-2 py-1 mt-2 rounded-[6px] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)]"
          onClick={() => { navigator.clipboard?.writeText(user?.walletAddress ?? ""); setCopied(true); setTimeout(() => setCopied(false), 1400); }}
        >
          {shortAddr(user?.walletAddress)} {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
        </button>

        {/* tier-badge: display:inline-flex; align-items:center; gap:6px; font-size:10px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase; padding:5px 11px; border-radius:var(--r-pill); margin-top:12px; */}
        {/* tier-bronze: color:var(--bronze); background:var(--bronze-soft); border:1px solid var(--bronze-line); */}
        {/* tier-silver: color:var(--silver); background:var(--silver-soft); border:1px solid var(--silver-line); */}
        {/* tier-gold: color:var(--gold); background:var(--gold-soft); border:1px solid var(--gold-line); */}
        {/* tier-diamond: color:var(--diamond); background:var(--diamond-soft); border:1px solid var(--accent-line); */}
        <span
          className={`inline-flex items-center gap-[6px] text-[10px] font-bold tracking-[0.14em] uppercase py-[5px] px-[11px] rounded-[100px] mt-3 border ${
            tierBg === "bronze"
              ? "text-[var(--bronze)] bg-[var(--bronze-soft)] border-[var(--bronze-line)]"
              : tierBg === "silver"
              ? "text-[var(--silver)] bg-[var(--silver-soft)] border-[var(--silver-line)]"
              : tierBg === "gold"
              ? "text-[var(--gold)] bg-[var(--gold-soft)] border-[var(--gold-line)]"
              : "text-[var(--diamond)] bg-[var(--diamond-soft)] border-[rgba(103,232,249,0.32)]"
          }`}
        >
          {/* badge-crown: width:16px; height:16px; object-fit:contain; filter:drop-shadow(0 2px 3px rgba(0,0,0,0.4)); */}
          <img className="w-4 h-4 object-contain [filter:drop-shadow(0_2px_3px_rgba(0,0,0,0.4))]" src={`/ranks/${tierBg}.png`} alt="" />
          {user?.tier ?? "Bronze"}
        </span>
      </div>

      {/* pside-div: height:1px; background:var(--line); */}
      <div className="h-px bg-[rgba(255,255,255,0.08)]" />

      {/* Avatar picker popup */}
      {showAvPicker && (
        <div>
          {/* av-grid: display:grid; grid-template-columns:repeat(5,1fr); gap:10px; */}
          <div className="grid grid-cols-5 gap-[10px]">
            {AV_COLORS.map((bg, i) => (
              // av-opt: width:100%; aspect-ratio:1; border-radius:14px; cursor:pointer; border:2px solid transparent; transition:border-color .25s,transform .25s;
              // hover: transform:scale(1.05)
              // sel: border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-soft)
              <button
                key={i}
                className="w-full aspect-square rounded-[14px] cursor-pointer border-2 border-transparent transition-[border-color,transform] duration-[250ms] hover:scale-105"
                style={{ background: bg }}
                onClick={() => { updateUser({ avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=quest${i}` }); setShowAvPicker(false); }}
              />
            ))}
          </div>
        </div>
      )}

      {/* pnav: display:flex; flex-direction:column; gap:4px; */}
      <nav className="flex flex-col gap-1">
        {items.map((it) => (
          // pnav-item: display:flex; align-items:center; gap:12px; font-size:14px; font-weight:600; color:var(--muted); background:none; border:none; padding:10px 14px; border-radius:var(--r-sm); cursor:pointer; transition:color .25s,background .25s; text-align:left;
          // hover: color:var(--text); background:rgba(255,255,255,0.04)
          // active: color:var(--accent); background:var(--accent-soft)
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
  <svg className="pcoin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <linearGradient id="ptsG" x1="0.15" y1="0.1" x2="0.85" y2="0.9"><stop stopColor="#A5F3FC"/><stop offset="1" stopColor="#0EA5E9"/></linearGradient>
    <circle cx="12" cy="12" r="9" fill="url(#ptsG)"/><path d="M12.7 6.4l-4.3 6.05h2.9l-.9 4.45 4.4-6.2h-3z" fill="#04141A"/>
  </svg>
);

const mapTier: Record<string, string> = { bronze: "/ranks/bronze.png", silver: "/ranks/silver.png", gold: "/ranks/golden.png" };

// ---- Overview Tab ----
function OverviewTab() {
  const { user } = useQuestAuthStore();
  const { data: pointsData } = useUsersControllerGetPointsHistory(user?.id ?? "", withAuth as never);

  const ledger = useMemo(() => {
    const raw = pointsData as { data?: { items?: RawLedgerEntry[] } } | { items?: RawLedgerEntry[] } | undefined;
    const items = (raw as { data?: { items?: RawLedgerEntry[] } })?.data?.items ?? (raw as { items?: RawLedgerEntry[] })?.items ?? [];
    return items.slice(0, 5);
  }, [pointsData]);

  const points = user?.totalPoints ?? 12450;
  const t = user?.tier?.toLowerCase() ?? "bronze";
  const tierStrip = [["Br", "bronze", true], ["Si", "silver", false], ["Go", "gold", false], ["Di", "diamond", false]];
  const progressMap: Record<string, [number, number, string]> = { bronze: [0, 15000, "Silver"], silver: [15000, 50000, "Gold"], gold: [50000, 100000, "Diamond"], diamond: [100000, 0, "Max"] };
  const [fromP, toP, nextT] = progressMap[t] ?? [0, 15000, "Silver"];
  const progress = toP > 0 ? Math.min(1, Math.max(0, (points - fromP) / (toP - fromP))) : 1;

  return (
    <div>
      {/* ov-grid: display:grid; grid-template-columns:1fr 1fr; gap:28px; align-items:start; */}
      {/* max-[860px]: grid-template-columns:1fr */}
      <div className="grid grid-cols-2 gap-[28px] items-start max-[860px]:grid-cols-1">
        <div className="ov-left">
          {/* card: border:1px solid var(--line); border-radius:var(--r-card); background:var(--card-grad); padding:24px; transition:border-color .3s,transform .3s; */}
          {/* card:hover: border-color:var(--accent-line); transform:translateY(-2px) */}
          {/* hero2: padding:26px; */}
          <div className="border border-[rgba(255,255,255,0.08)] rounded-[22px] [background:var(--card-grad)] p-[26px] transition-[border-color,transform] duration-300 hover:border-[rgba(103,232,249,0.32)] hover:-translate-y-0.5">
            <div className="hero2-points">
              {/* hero2-head: display:flex; align-items:center; gap:14px; margin-bottom:18px; */}
              <div className="flex items-center gap-[14px] mb-[18px]">
                {/* hh-lab: font-size:11px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; color:var(--dim); */}
                <div className="text-[11px] font-bold tracking-[0.16em] uppercase text-[rgba(244,247,251,0.34)]">Current Points</div>
                {/* tier-badge + tier-{t} */}
                <span
                  className={`inline-flex items-center gap-[6px] text-[10px] font-bold tracking-[0.14em] uppercase py-[5px] px-[11px] rounded-[100px] border ${
                    t === "bronze"
                      ? "text-[var(--bronze)] bg-[var(--bronze-soft)] border-[var(--bronze-line)]"
                      : t === "silver"
                      ? "text-[var(--silver)] bg-[var(--silver-soft)] border-[var(--silver-line)]"
                      : t === "gold"
                      ? "text-[var(--gold)] bg-[var(--gold-soft)] border-[var(--gold-line)]"
                      : "text-[var(--diamond)] bg-[var(--diamond-soft)] border-[rgba(103,232,249,0.32)]"
                  }`}
                >
                  <img className="w-4 h-4 object-contain [filter:drop-shadow(0_2px_3px_rgba(0,0,0,0.4))]" src={mapTier[t] ?? mapTier.bronze} alt="" />
                  {user?.tier ?? "Bronze"} tier
                </span>
              </div>
              {/* hero2-row: display:flex; gap:16px; align-items:center; margin-top:16px; */}
              <div className="flex gap-4 items-center mt-4">
                {/* hh-pts: font-size:48px; font-weight:800; letter-spacing:-0.035em; line-height:1; color:var(--accent); font-family:var(--font-mono); */}
                <div className="text-[48px] font-extrabold tracking-[-0.035em] leading-none text-[var(--accent)] font-mono">{fmt(points)}</div>
                <div className="tier-strip ladder">
                  {tierStrip.map(([label, key, on]) => (
                    // ts-chip: display:flex; align-items:center; gap:7px; padding:8px 14px; border-radius:var(--r-pill); font-size:12px; font-weight:600; color:var(--dim); background:var(--surface); border:1px solid var(--line);
                    // ts-chip.on: color:var(--accent); background:var(--accent-soft); border-color:var(--accent-line)
                    <div
                      key={key as string}
                      className={`flex items-center gap-[7px] px-[14px] py-2 rounded-[100px] text-[12px] font-semibold border ${
                        on
                          ? "text-[var(--accent)] bg-[var(--accent-soft)] border-[rgba(103,232,249,0.32)]"
                          : "text-[rgba(244,247,251,0.34)] bg-[var(--surface)] border-[rgba(255,255,255,0.08)]"
                      }`}
                    >
                      <img className="w-4 h-4 object-contain [filter:drop-shadow(0_2px_3px_rgba(0,0,0,0.4))]" src={mapTier[key as string] ?? mapTier.bronze} alt="" style={{ width: 16, height: 16 }} />
                      {label as string}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="level-bar mt-5">
              {/* lvl-track-wrap: margin-top:10px; */}
              <div className="mt-[10px]">
                {/* lvl-track: height:8px; border-radius:var(--r-pill); background:rgba(255,255,255,0.06); border:1px solid var(--line); overflow:hidden; */}
                <div className="h-2 rounded-[100px] bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] overflow-hidden">
                  {/* lvl-fill: height:100%; border-radius:var(--r-pill); background:var(--grad); box-shadow:0 0 14px -2px var(--accent-glow); transition:width 1s var(--ease-out); */}
                  <div
                    className="h-full rounded-[100px] [background:var(--grad)] shadow-[0_0_14px_-2px_var(--accent-glow)] transition-[width] duration-1000"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                {/* lvl-meta: display:flex; justify-content:space-between; font-size:11.5px; color:var(--dim); margin-top:8px; font-family:var(--font-mono); */}
                <div className="flex justify-between text-[11.5px] text-[rgba(244,247,251,0.34)] mt-2 font-mono">
                  <b>{fmt(toP - points)}<Pts /></b> to reach {nextT}
                </div>
              </div>
            </div>
          </div>

          {/* mini-grid: display:grid; grid-template-columns:repeat(2,1fr); gap:14px; */}
          <div className="grid grid-cols-2 gap-[14px] mt-5">
            {/* mini: border:1px solid var(--line); border-radius:var(--r-sm); background:var(--surface); padding:18px; */}
            {/* card: border + rounded-[22px] + card-grad + padding + hover */}
            <div className="border border-[rgba(255,255,255,0.08)] rounded-[14px] bg-[var(--surface)] p-[18px]">
              {/* hh-lab */}
              <div className="text-[11px] font-bold tracking-[0.16em] uppercase text-[rgba(244,247,251,0.34)]">Daily Streak</div>
              {/* mini-big: font-size:28px; font-weight:800; font-family:var(--font-mono); letter-spacing:-0.02em; margin-top:8px; display:flex; align-items:center; gap:8px; */}
              <div className="text-[28px] font-extrabold font-mono tracking-[-0.02em] mt-2 flex items-center gap-2">
                <svg viewBox="0 0 24 24" width="30" height="30" fill="none" aria-hidden="true">
                  <linearGradient id="fg" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0" stopColor="#FCD34D"/><stop offset="0.5" stopColor="#FB923C"/><stop offset="1" stopColor="#F43F5E"/></linearGradient>
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" fill="url(#fg)"/>
                </svg>
                {user?.loginStreak ?? 7}
              </div>
              {/* st-sub: font-size:12px; color:var(--dim); margin-top:4px; */}
              <div className="text-[12px] text-[rgba(244,247,251,0.34)] mt-1">day streak</div>
            </div>
            <div className="border border-[rgba(255,255,255,0.08)] rounded-[14px] bg-[var(--surface)] p-[18px]">
              <div className="text-[11px] font-bold tracking-[0.16em] uppercase text-[rgba(244,247,251,0.34)]">Quests Done</div>
              {/* original had st-sub with inline style override: fontSize:28, marginTop:8 (inline wins over CSS's 24px) */}
              <div className="text-[28px] font-extrabold font-mono mt-2">{(user?.loginStreak ?? 7) * 6}</div>
              <div className="text-[12px] text-[rgba(244,247,251,0.34)] mt-1">total quests</div>
            </div>
          </div>
        </div>

        {/* Referral card — card + qref */}
        {/* qref: margin-top:28px; card: border + rounded-[22px] + card-grad + padding:24px + hover */}
        <div className="mt-[28px] border border-[rgba(255,255,255,0.08)] rounded-[22px] [background:var(--card-grad)] p-6 transition-[border-color,transform] duration-300 hover:border-[rgba(103,232,249,0.32)] hover:-translate-y-0.5">
          {/* sec-lab: font-size:13px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:var(--dim); margin-bottom:16px; */}
          <div className="text-[13px] font-bold tracking-[0.12em] uppercase text-[rgba(244,247,251,0.34)] mb-4">Referral Program</div>
          {/* hh-lab */}
          <div className="text-[11px] font-bold tracking-[0.16em] uppercase text-[rgba(244,247,251,0.34)] mt-[18px]">Your Code</div>
          {/* qref-code: display:flex; align-items:center; gap:10px; padding:12px 16px; background:var(--surface); border:1px solid var(--line-2); border-radius:var(--r-sm); font-family:var(--font-mono); font-size:14px; font-weight:600; color:var(--accent); letter-spacing:0.04em; */}
          <div className="flex items-center gap-[10px] px-4 py-3 bg-[var(--surface)] border border-[rgba(255,255,255,0.14)] rounded-[14px] font-mono text-[14px] font-semibold text-[var(--accent)] tracking-[0.04em] mt-[10px]">{user?.referralCode ?? "TASMIL-X7K9"}</div>
          <div className="qref-actions" style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="btn btn-primary btn-sm btn-block" onClick={() => { navigator.clipboard?.writeText(user?.referralCode ?? ""); toast.success("Copied!"); }}><Copy size={13} /> Copy Code</button>
            <button className="btn btn-ghost btn-sm btn-block"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v13"/></svg> Share Link</button>
          </div>
          {/* qref-block: margin-top:16px; padding-top:16px; border-top:1px solid var(--line); */}
          <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.08)]">
            <div className="text-[11px] font-bold tracking-[0.16em] uppercase text-[rgba(244,247,251,0.34)]">Total Earned From Refs</div>
            {/* qref-earned .qs-num style inline in original */}
            <div className="flex items-center gap-[6px] text-[28px] font-extrabold font-mono text-[var(--accent)] mt-2">1,250<Pts /></div>
            {/* qref-stats: display:flex; gap:24px; margin-top:12px; */}
            <div className="flex gap-6 mt-3">
              <div>
                {/* qs-num: font-size:28px; font-weight:800; font-family:var(--font-mono); color:var(--accent); line-height:1; */}
                <div className="text-[28px] font-extrabold font-mono text-[var(--accent)] leading-none">14</div>
                {/* qs-lab: font-size:10px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:var(--dim); margin-top:4px; */}
                <div className="text-[10px] font-bold tracking-[0.12em] uppercase text-[rgba(244,247,251,0.34)] mt-1">Total invited</div>
              </div>
              <div>
                <div className="text-[28px] font-extrabold font-mono text-[var(--green)] leading-none">9</div>
                <div className="text-[10px] font-bold tracking-[0.12em] uppercase text-[rgba(244,247,251,0.34)] mt-1">Active</div>
              </div>
            </div>
          </div>
          {/* qref-block */}
          <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.08)]">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold tracking-[0.16em] uppercase text-[rgba(244,247,251,0.34)]">Referral Rates</span>
            </div>
            {/* rate3: display:grid; grid-template-columns:repeat(3,1fr); gap:12px; */}
            <div className="grid grid-cols-3 gap-3 mt-[14px]">
              {[[1, "10%", "Direct"], [2, "3%", "Indirect"], [3, "1%", "3rd"]].map(([layer, pct, sub]) => (
                // rate-item: border:1px solid var(--line); border-radius:var(--r-sm); background:var(--surface); padding:14px; text-align:center;
                <div key={layer} className="border border-[rgba(255,255,255,0.08)] rounded-[14px] bg-[var(--surface)] p-[14px] text-center">
                  {/* rate-pct: font-size:22px; font-weight:800; font-family:var(--font-mono); color:var(--accent); */}
                  <div className="text-[22px] font-extrabold font-mono text-[var(--accent)]">{pct}</div>
                  {/* rate-lab: font-size:10px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:var(--dim); margin-top:4px; */}
                  <div className="text-[10px] font-bold tracking-[0.12em] uppercase text-[rgba(244,247,251,0.34)] mt-1">L{layer} {sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Referral code block — qref: margin-top:28px; */}
      {user?.referralCode && (
        <div className="mt-[28px]">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Your Referral Code</div>
          {/* qref-code */}
          <div className="flex items-center gap-[10px] px-4 py-3 bg-[var(--surface)] border border-[rgba(255,255,255,0.14)] rounded-[14px] font-mono text-[14px] font-semibold text-[var(--accent)] tracking-[0.04em]">
            {user.referralCode}
            <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard?.writeText(user.referralCode ?? ""); toast.success("Copied!"); }} style={{ marginLeft: "auto" }}>
              <Copy size={14} /> Copy
            </button>
          </div>
        </div>
      )}

      {/* Recent activity */}
      {ledger.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Recent Activity</div>
          {ledger.map((e, i) => (
            <div key={i} className="ledger-row" style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--line)", fontSize: 13, color: "var(--muted)" }}>
              <span>{e.campaignTitle ?? e.description ?? e.source ?? "Activity"}</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent)", fontWeight: 600 }}>+{e.points ?? e.delta ?? 0}</span>
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
    { status: subtab }, withAuth as never
  );

  const items = useMemo(() => {
    // Unwrap envelope
    const d = rawData as { success?: boolean; data?: { items?: ApiCampaign[] } } | ApiCampaign[] | undefined;
    if (!d) return [];
    if (Array.isArray(d)) return d;
    if (d.success && d.data?.items) return d.data.items;
    return [];
  }, [rawData]);

  if (!isAuthenticated) return <p style={{ color: "var(--muted)", padding: "40px 0", textAlign: "center" }}>Connect your wallet to view quests.</p>;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 24 }}>My Quests</h1>
      {/* subtabs: display:flex; gap:4px; border-bottom:1px solid var(--line); margin-bottom:20px; */}
      <div className="flex gap-1 border-b border-[rgba(255,255,255,0.08)] mb-5">
        {(["pending", "claimable", "claimed"] as const).map((s) => (
          // subtab: position:relative; font-size:14px; font-weight:600; color:var(--muted); background:none; border:none; padding:10px 16px; cursor:pointer; transition:color .25s;
          // subtab.active: color:var(--accent)
          // subtab.active::after: content:""; position:absolute; left:12px; right:12px; bottom:-1px; height:2px; background:var(--accent); border-radius:2px;
          <button
            key={s}
            className={`relative text-[14px] font-semibold bg-transparent border-none px-4 py-[10px] cursor-pointer transition-[color] duration-[250ms] ${
              subtab === s ? "text-[var(--accent)]" : "text-[rgba(244,247,251,0.58)]"
            }`}
            onClick={() => setSubtab(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            {/* cnt: font-size:11px; font-family:var(--font-mono); color:var(--dim); margin-left:6px; */}
            <span className="text-[11px] font-mono text-[rgba(244,247,251,0.34)] ml-[6px]">{items.length}</span>
            {subtab === s && <span className="absolute left-3 right-3 bottom-[-1px] h-0.5 bg-[var(--accent)] rounded-[2px]" />}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p style={{ color: "var(--muted)", padding: 20 }}>Loading quests...</p>
      ) : items.length === 0 ? (
        // empty: display:flex; flex-direction:column; align-items:center; text-align:center; padding:80px 20px; gap:14px;
        // et: font-size:18px; font-weight:700; letter-spacing:-0.02em; color:var(--text);
        // es: font-size:14px; color:var(--muted);
        <div className="flex flex-col items-center text-center p-10 gap-[14px]">
          <div className="text-[18px] font-bold tracking-[-0.02em] text-[var(--text)]">No {subtab} quests</div>
          <div className="text-[14px] text-[rgba(244,247,251,0.58)]">{subtab === "pending" ? "Join campaigns to start earning." : "Complete tasks to claim rewards."}</div>
        </div>
      ) : (
        // quest-grid: display:flex; flex-direction:column; gap:12px;
        <div className="flex flex-col gap-3">
          {items.map((c) => {
            const ct = c as unknown as Record<string, unknown>;
            const coverLabel = (ct.logoUrl as string) ? null : "cover";
            const pts = ct.rewardPoints as number ?? 0;
            return (
              // quest-card: display:flex; align-items:center; gap:16px; padding:14px 16px; border:1px solid var(--line); border-radius:var(--r-sm); background:var(--surface-2); transition:border-color .3s,transform .3s;
              // quest-card:hover: border-color:var(--accent-line); transform:translateY(-2px)
              <Link
                key={c.id}
                href={`/quest/campaign/${c.id}`}
                className="flex items-center gap-4 px-4 py-[14px] border border-[rgba(255,255,255,0.08)] rounded-[14px] bg-[rgba(32,32,36,0.30)] transition-[border-color,transform] duration-300 hover:border-[rgba(103,232,249,0.32)] hover:-translate-y-0.5"
              >
                {/* qc-cover: width:56px; height:56px; border-radius:12px; flex:none; display:grid; place-items:center; background:linear-gradient(160deg,var(--accent-soft),rgba(14,165,233,0.05)); border:1px solid var(--line); font-size:9px; color:var(--dim); text-transform:uppercase; */}
                <div className="w-14 h-14 rounded-[12px] flex-none grid place-items-center [background:linear-gradient(160deg,var(--accent-soft),rgba(14,165,233,0.05))] border border-[rgba(255,255,255,0.08)] text-[9px] text-[rgba(244,247,251,0.34)] uppercase relative">
                  {coverLabel && <span className="ph" style={{ fontSize: 9, color: "var(--dim)", textTransform: "uppercase" }}>cover</span>}
                  {/* qc-pts: font-size:13px; font-family:var(--font-mono); color:var(--accent); font-weight:700; white-space:nowrap; */}
                  <span className="absolute bottom-1.5 right-1.5 text-[10px] font-mono text-[var(--accent)] font-bold">+{pts}</span>
                </div>
                {/* qc-body: flex:1; */}
                <div className="flex-1">
                  {/* qc-title: font-size:15px; font-weight:700; letter-spacing:-0.01em; */}
                  <div className="text-[15px] font-bold tracking-[-0.01em]">{ct.title as string}</div>
                  {/* qc-desc: font-size:13px; color:var(--muted); margin-top:3px; */}
                  <div className="text-[13px] text-[rgba(244,247,251,0.58)] mt-[3px]">{ct.description as string ?? ""}</div>
                </div>
                <button className={`btn btn-sm ${subtab === "claimable" ? "btn-primary" : subtab === "pending" ? "btn-accent" : "btn-ghost"}`} disabled={subtab === "claimed"} style={{ whiteSpace: "nowrap" }}>
                  {subtab === "claimed" ? <CheckCircle2 size={12} /> : null}
                  {subtab === "pending" ? "View Quest" : subtab === "claimable" ? "Claim Points" : "Completed"}
                </button>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---- Referrals Tab ----
function ReferralsTab() {
  const { data: refData } = useReferralControllerGetMyReferral(withAuth as never);
  const { data: refsData } = useUsersControllerGetReferrals(withAuth as never);

  const refDataObj = useMemo(() => {
    const d = refData as { data?: Record<string, unknown> } | undefined;
    return d?.data ?? {};
  }, [refData]);

  const refs = useMemo(() => {
    const d = refsData as { data?: RawReferral[] } | RawReferral[] | undefined;
    if (Array.isArray(d)) return d;
    return d?.data ?? [];
  }, [refsData]);

  return (
    <div>
      {/* codebox: border:1px solid var(--line); border-radius:var(--r-sm); background:var(--surface); padding:16px; */}
      <div className="border border-[rgba(255,255,255,0.08)] rounded-[14px] bg-[var(--surface)] p-4 mb-6">
        {/* codebox-head: display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; */}
        <div className="flex justify-between items-center mb-[10px]">
          <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-[rgba(244,247,251,0.34)]">Your Code</span>
          <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard?.writeText((refDataObj as { code?: string })?.code ?? ""); toast.success("Copied!"); }}>
            <Copy size={14} /> Copy
          </button>
        </div>
        {/* code: font-family:var(--font-mono); font-size:15px; font-weight:700; color:var(--accent); letter-spacing:0.06em; */}
        <div className="font-mono text-[15px] font-bold text-[var(--accent)] tracking-[0.06em]">{(refDataObj as { code?: string })?.code ?? "TASMIL-X7K9"}</div>
      </div>

      {/* qref-earned: display:flex; gap:24px; margin-top:16px; text-align:center; */}
      <div className="flex gap-6 mt-4 mb-7">
        <div style={{ textAlign: "center", flex: 1 }}>
          {/* qs-num: font-size:28px; font-weight:800; font-family:var(--font-mono); color:var(--accent); line-height:1; */}
          <div className="text-[28px] font-extrabold font-mono text-[var(--accent)] leading-none">{fmt((refDataObj as { totalEarned?: number })?.totalEarned ?? 1250)}</div>
          {/* qs-lab: font-size:10px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:var(--dim); margin-top:4px; */}
          <div className="text-[10px] font-bold tracking-[0.12em] uppercase text-[rgba(244,247,251,0.34)] mt-1">Points Earned</div>
        </div>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div className="text-[28px] font-extrabold font-mono text-[var(--accent)] leading-none">{(refDataObj as { totalReferrals?: number })?.totalReferrals ?? 14}</div>
          <div className="text-[10px] font-bold tracking-[0.12em] uppercase text-[rgba(244,247,251,0.34)] mt-1">Total Refs</div>
        </div>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div className="text-[28px] font-extrabold font-mono text-[var(--green)] leading-none">{(refDataObj as { activeReferrals?: number })?.activeReferrals ?? 9}</div>
          <div className="text-[10px] font-bold tracking-[0.12em] uppercase text-[rgba(244,247,251,0.34)] mt-1">Active</div>
        </div>
      </div>

      {/* Rate tiers — rate3: display:grid; grid-template-columns:repeat(3,1fr); gap:12px; */}
      {((refDataObj as { rates?: { layer: number; rateBps: number }[] })?.rates?.length ?? 0) > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-7">
          {((refDataObj as { rates: { layer: number; rateBps: number }[] })?.rates ?? []).map((r) => (
            // rate-item: border:1px solid var(--line); border-radius:var(--r-sm); background:var(--surface); padding:14px; text-align:center;
            <div key={r.layer} className="border border-[rgba(255,255,255,0.08)] rounded-[14px] bg-[var(--surface)] p-[14px] text-center">
              {/* rate-pct: font-size:22px; font-weight:800; font-family:var(--font-mono); color:var(--accent); */}
              <div className="text-[22px] font-extrabold font-mono text-[var(--accent)]">{r.rateBps / 100}%</div>
              {/* rate-lab: font-size:10px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:var(--dim); margin-top:4px; */}
              <div className="text-[10px] font-bold tracking-[0.12em] uppercase text-[rgba(244,247,251,0.34)] mt-1">Layer {r.layer}</div>
            </div>
          ))}
        </div>
      )}

      {/* Referral list */}
      {refs.length > 0 && (
        <div className="mt-6">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Your Referrals</div>
          {/* reflist: border:1px solid var(--line); border-radius:var(--r-sm); overflow:hidden; */}
          <div className="border border-[rgba(255,255,255,0.08)] rounded-[14px] overflow-hidden">
            {/* rl-head: display:grid; grid-template-columns:2fr auto auto auto; gap:14px; padding:12px 14px; font-size:11px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:var(--dim); border-bottom:1px solid var(--line); */}
            <div className="grid grid-cols-[2fr_auto_auto_auto] gap-[14px] px-[14px] py-3 text-[11px] font-semibold tracking-[0.12em] uppercase text-[rgba(244,247,251,0.34)] border-b border-[rgba(255,255,255,0.08)]">
              <span>Username</span><span>Layer</span><span className="text-right">Quest PTS</span><span className="text-right">PTS Earned</span>
            </div>
            {refs.map((r, i) => (
              // rl-row: display:grid; grid-template-columns:2fr auto auto auto; gap:14px; align-items:center; padding:12px 14px; border-bottom:1px solid var(--line); font-size:13.5px; transition:background .2s;
              // rl-row:hover: background:var(--accent-soft)
              <div key={i} className="grid grid-cols-[2fr_auto_auto_auto] gap-[14px] items-center px-[14px] py-3 border-b border-[rgba(255,255,255,0.08)] text-[13.5px] transition-[background] duration-200 hover:bg-[var(--accent-soft)]">
                {/* rl-user: display:flex; align-items:center; gap:10px; */}
                <div className="flex items-center gap-[10px]">
                  {/* rl-av: width:30px; height:30px; border-radius:50%; flex:none; */}
                  <span className="w-[30px] h-[30px] rounded-full flex-none block" style={{ background: avatarBg(r.username ?? "u") }} />
                  {/* rl-name: font-weight:600; */}
                  <span className="font-semibold">{r.username ?? "User"}</span>
                  {/* statusb: display:inline-block; font-size:10px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; padding:4px 10px; border-radius:var(--r-pill); */}
                  {/* statusb.active: color:var(--green); background:var(--green-soft); border:1px solid var(--green-line); */}
                  {/* statusb.inactive: color:var(--dim); background:rgba(255,255,255,0.04); border:1px solid var(--line); */}
                  <span
                    className={`inline-block text-[10px] font-bold tracking-[0.1em] uppercase px-[10px] py-1 rounded-[100px] border ${
                      (r.status ?? "active") === "active"
                        ? "text-[var(--green)] bg-[var(--green-soft)] border-[rgba(110,231,183,0.32)]"
                        : "text-[rgba(244,247,251,0.34)] bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]"
                    }`}
                  >
                    {r.status ?? "active"}
                  </span>
                </div>
                {/* layerb: display:inline-block; font-size:10px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; padding:3px 8px; border-radius:6px; font-family:var(--font-mono); color:var(--accent); background:var(--accent-soft); border:1px solid var(--accent-line); */}
                <span className="inline-block text-[10px] font-bold tracking-[0.08em] uppercase px-2 py-[3px] rounded-[6px] font-mono text-[var(--accent)] bg-[var(--accent-soft)] border border-[rgba(103,232,249,0.32)]">L{r.layer ?? 1}</span>
                {/* rl-num: font-family:var(--font-mono); font-weight:600; text-align:right; display:inline-flex; align-items:center; gap:3px; */}
                <span className="font-mono font-semibold text-right inline-flex items-center gap-[3px]">{(r.questPoints ?? 0).toLocaleString()}<Pts /></span>
                {/* rl-num.earn: color:var(--accent) */}
                <span className="font-mono font-semibold text-right inline-flex items-center gap-[3px] text-[var(--accent)]">{(r.ptsEarned ?? 0).toLocaleString()}<Pts /></span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Social Tab ----
function SocialTab() {
  const { data: socData } = useSocialAccountsControllerFindAll({ ...withAuth, query: { staleTime: 30 * 1000 } });

  const accounts = useMemo<SocialAccount[]>(() => {
    const d = socData as { data?: SocialAccount[] } | SocialAccount[] | undefined;
    if (Array.isArray(d)) return d;
    return d?.data ?? [];
  }, [socData]);

  const socials = [
    { platform: "X" as const, label: "X (Twitter)", icon: <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
    { platform: "Discord" as const, label: "Discord", icon: <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.445.865-.608 1.249a18.27 18.27 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.249.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127c-.598.349-1.22.645-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.057c.5-5.177-.838-9.673-3.549-13.66a.06.06 0 0 0-.031-.029zM8.02 15.331c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg> },
    { platform: "Telegram" as const, label: "Telegram", icon: <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg> },
  ];

  const isConnected = (p: string) => accounts.some((a) => a.platform === p);

  return (
    // social-list: display:flex; flex-direction:column; gap:12px;
    <div className="flex flex-col gap-3">
      {socials.map((s) => {
        const connected = isConnected(s.platform);
        const acc = accounts.find((a) => a.platform === s.platform);
        return (
          // soc-card: display:flex; align-items:center; gap:14px; padding:14px 16px; border:1px solid var(--line); border-radius:var(--r-sm); background:var(--surface-2); transition:border-color .25s;
          // soc-card:hover: border-color:var(--accent-line)
          <div key={s.platform} className="flex items-center gap-[14px] px-4 py-[14px] border border-[rgba(255,255,255,0.08)] rounded-[14px] bg-[rgba(32,32,36,0.30)] transition-[border-color] duration-[250ms] hover:border-[rgba(103,232,249,0.32)]">
            {/* soc-ico: width:40px; height:40px; border-radius:11px; flex:none; display:grid; place-items:center; background:var(--surface); border:1px solid var(--line-2); */}
            <div className="w-10 h-10 rounded-[11px] flex-none grid place-items-center bg-[var(--surface)] border border-[rgba(255,255,255,0.14)]">{s.icon}</div>
            {/* soc-meta: flex:1; */}
            <div className="flex-1">
              {/* soc-name: font-size:14px; font-weight:600; */}
              <div className="text-[14px] font-semibold">{connected ? (acc?.username ?? s.platform) : s.label}</div>
              {/* soc-sub: font-size:12px; color:var(--muted); margin-top:2px; */}
              {/* soc-sub.connected: color:var(--green) */}
              <div className={`text-[12px] mt-[2px] ${connected ? "text-[var(--green)]" : "text-[rgba(244,247,251,0.58)]"}`}>
                {connected ? "Connected" : "Not connected"}
              </div>
            </div>
            {connected ? null : (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  const width = 500; const height = 700;
                  const left = window.screen.width / 2 - width / 2;
                  const top = window.screen.height / 2 - height / 2;
                  window.open(`/api/auth/${s.platform.toLowerCase()}`, `${s.platform} Login`, `width=${width},height=${height},left=${left},top=${top}`);
                }}
              >
                Connect
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---- Main Profile ----
const Profile: React.FC = () => {
  const [tab, setTab] = useState("overview");
  const { isAuthenticated, connect } = useWallet();

  if (!isAuthenticated) {
    // empty: display:flex; flex-direction:column; align-items:center; text-align:center; padding:80px 20px; gap:14px;
    // et: font-size:18px; font-weight:700; letter-spacing:-0.02em; color:var(--text);
    // es: font-size:14px; color:var(--muted);
    return (
      <div className="flex flex-col items-center text-center py-20 px-5 gap-[14px]" style={{ minHeight: "50vh", justifyContent: "center" }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 48, height: 48, color: "var(--dim)" }}>
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <path d="M22 10h-4a2 2 0 0 0 0 4h4" />
          <circle cx="15" cy="12" r="1" />
        </svg>
        <div className="text-[18px] font-bold tracking-[-0.02em] text-[var(--text)]">Connect your wallet</div>
        <div className="text-[14px] text-[rgba(244,247,251,0.58)]">Link your Stellar wallet to access quests, referrals, and rewards.</div>
        <button type="button" className="btn btn-primary" onClick={connect} style={{ marginTop: 16 }}>
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div>
      <Rise>
        {/* shell: display:grid; grid-template-columns:220px 1fr; align-items:start; */}
        {/* max-[720px]: grid-template-columns:1fr */}
        <div className="grid grid-cols-[220px_1fr] items-start max-[720px]:grid-cols-1">
          <Sidebar tab={tab} setTab={setTab} />
          <div style={{ padding: "clamp(24px, 5vw, 48px)" }}>
            <Rise delay={0.08}>
              {tab === "overview" && <OverviewTab />}
              {tab === "quests" && <MyQuestsTab />}
              {tab === "referrals" && <ReferralsTab />}
              {tab === "social" && <SocialTab />}
            </Rise>
          </div>
        </div>
      </Rise>
    </div>
  );
};

export default Profile;
