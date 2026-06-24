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

  return (
    <div className="pside">
      <div className="uc">
        <div className="uc-av-wrap">
          <div className="uc-av" style={{ background: user?.avatarUrl ? `url(${user.avatarUrl})` : avatarBg(user?.walletAddress ?? "default") }} />
          <button className="uc-av-edit" onClick={() => setShowAvPicker(!showAvPicker)} aria-label="Change avatar">
            <Edit2 size={15} />
          </button>
        </div>

        {editingName ? (
          <div className="uc-name-row">
            <input className="input" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ fontSize: 14, padding: "6px 10px" }} autoFocus onBlur={handleSaveName} onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); }} />
          </div>
        ) : (
          <div className="uc-name-row">
            <span className="uc-name">{user?.username ?? "Quester"}</span>
            <button className="uc-pencil" onClick={() => { setNewName(user?.username ?? ""); setEditingName(true); }} aria-label="Edit username">
              <Edit2 size={13} />
            </button>
          </div>
        )}

        <button className="uc-addr" onClick={() => { navigator.clipboard?.writeText(user?.walletAddress ?? ""); setCopied(true); setTimeout(() => setCopied(false), 1400); }}>
          {shortAddr(user?.walletAddress)} {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
        </button>

        <span className={`tier-badge tier-${(user?.tier?.toLowerCase() ?? "bronze")}`}>
          <img className="badge-crown" src={`/ranks/${user?.tier?.toLowerCase() ?? "bronze"}.png`} alt="" />
          {user?.tier ?? "Bronze"}
        </span>
      </div>

      <div className="pside-div" />

      {/* Avatar picker popup */}
      {showAvPicker && (
        <div>
          <div className="av-grid">
            {AV_COLORS.map((bg, i) => (
              <button key={i} className="av-opt" style={{ background: bg }} onClick={() => { updateUser({ avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=quest${i}` }); setShowAvPicker(false); }} />
            ))}
          </div>
        </div>
      )}

      <nav className="pnav">
        {items.map((it) => (
          <button key={it.id} className={`pnav-item${tab === it.id ? " active" : ""}`} onClick={() => setTab(it.id)} type="button">
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
      <div className="ov-grid">
        <div className="ov-left">
          {/* Hero: points + ladder */}
          <div className="card hero2" style={{ padding: 26 }}>
            <div className="hero2-points">
              <div className="hero2-head">
                <div className="hh-lab">Current Points</div>
                <span className={`tier-badge tier-${t}`}>
                  <img className="badge-crown" src={mapTier[t] ?? mapTier.bronze} alt="" />
                  {user?.tier ?? "Bronze"} tier
                </span>
              </div>
              <div className="hero2-row">
                <div className="hh-pts">{fmt(points)}</div>
                <div className="tier-strip ladder">
                  {tierStrip.map(([label, key, on]) => (
                    <div key={key as string} className={`ts-chip ${key}${on ? " on" : ""}`}>
                      <img className="badge-crown" src={mapTier[key as string] ?? mapTier.bronze} alt="" style={{ width: 16, height: 16 }} />
                      {label as string}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="level-bar" style={{ marginTop: 20 }}>
              <div className="lvl-track-wrap">
                <div className="lvl-track">
                  <div className="lvl-fill" style={{ width: `${progress * 100}%` }} />
                </div>
                <div className="lvl-meta">
                  <b>{fmt(toP - points)}<Pts /></b> to reach {nextT}
                </div>
              </div>
            </div>
          </div>

          {/* Mini stats */}
          <div className="mini-grid" style={{ marginTop: 20 }}>
            <div className="card mini" style={{ padding: 18 }}>
              <div className="hh-lab">Daily Streak</div>
              <div className="mini-big" style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--font-mono)", display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <svg viewBox="0 0 24 24" width="30" height="30" fill="none" aria-hidden="true">
                  <linearGradient id="fg" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0" stopColor="#FCD34D"/><stop offset="0.5" stopColor="#FB923C"/><stop offset="1" stopColor="#F43F5E"/></linearGradient>
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" fill="url(#fg)"/>
                </svg>
                {user?.loginStreak ?? 7}
              </div>
              <div className="st-sub">day streak</div>
            </div>
            <div className="card mini" style={{ padding: 18 }}>
              <div className="hh-lab">Quests Done</div>
              <div className="st-sub" style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--font-mono)", marginTop: 8 }}>{(user?.loginStreak ?? 7) * 6}</div>
              <div className="st-sub">total quests</div>
            </div>
          </div>
        </div>

        {/* Referral card (same as reference) */}
        <div className="card qref" style={{ padding: 24 }}>
          <div className="sec-lab" style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--dim)" }}>Referral Program</div>
          <div className="hh-lab" style={{ marginTop: 18 }}>Your Code</div>
          <div className="qref-code" style={{ marginTop: 10 }}>{user?.referralCode ?? "TASMIL-X7K9"}</div>
          <div className="qref-actions" style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="btn btn-primary btn-sm btn-block" onClick={() => { navigator.clipboard?.writeText(user?.referralCode ?? ""); toast.success("Copied!"); }}><Copy size={13} /> Copy Code</button>
            <button className="btn btn-ghost btn-sm btn-block"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v13"/></svg> Share Link</button>
          </div>
          <div className="qref-block" style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
            <div className="hh-lab">Total Earned From Refs</div>
            <div className="qref-earned" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 28, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--accent)", marginTop: 8 }}>1,250<Pts /></div>
            <div className="qref-stats" style={{ display: "flex", gap: 24, marginTop: 12 }}>
              <div><div className="qs-num" style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--accent)", lineHeight: 1 }}>14</div><div className="qs-lab" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--dim)", marginTop: 4 }}>Total invited</div></div>
              <div><div className="qs-num" style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--green)", lineHeight: 1 }}>9</div><div className="qs-lab" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--dim)", marginTop: 4 }}>Active</div></div>
            </div>
          </div>
          <div className="qref-block" style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
            <div className="st-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="hh-lab" style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--dim)" }}>Referral Rates</span>
            </div>
            <div className="rate3" style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[[1, "10%", "Direct"], [2, "3%", "Indirect"], [3, "1%", "3rd"]].map(([layer, pct, sub]) => (
                <div key={layer} className="rate-item" style={{ border: "1px solid var(--line)", borderRadius: "var(--r-sm)", background: "var(--surface)", padding: 14, textAlign: "center" }}>
                  <div className="rate-pct" style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--accent)" }}>{pct}</div>
                  <div className="rate-lab" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--dim)", marginTop: 4 }}>L{layer} {sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Referral code block */}
      {user?.referralCode && (
        <div className="qref">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Your Referral Code</div>
          <div className="qref-code">
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
      <div className="subtabs" style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--line)", marginBottom: 20 }}>
        {(["pending", "claimable", "claimed"] as const).map((s) => (
          <button key={s} className={`subtab${subtab === s ? " active" : ""}`} onClick={() => setSubtab(s)}
            style={{ position: "relative", fontSize: 14, fontWeight: 600, color: subtab === s ? "var(--accent)" : "var(--muted)", background: "none", border: "none", padding: "10px 16px", cursor: "pointer" }}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="cnt" style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--dim)", marginLeft: 6 }}>{items.length}</span>
            {subtab === s && <span style={{ position: "absolute", left: 12, right: 12, bottom: -1, height: 2, background: "var(--accent)", borderRadius: 2 }} />}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p style={{ color: "var(--muted)", padding: 20 }}>Loading quests...</p>
      ) : items.length === 0 ? (
        <div className="empty" style={{ padding: 40 }}>
          <div className="et">No {subtab} quests</div>
          <div className="es">{subtab === "pending" ? "Join campaigns to start earning." : "Complete tasks to claim rewards."}</div>
        </div>
      ) : (
        <div className="quest-grid">
          {items.map((c) => {
            const ct = c as unknown as Record<string, unknown>;
            const coverLabel = (ct.logoUrl as string) ? null : "cover";
            const pts = ct.rewardPoints as number ?? 0;
            return (
              <Link key={c.id} href={`/quest/campaign/${c.id}`} className="quest-card" style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 16px", border: "1px solid var(--line)", borderRadius: "var(--r-sm)", background: "var(--surface-2)" }}>
                <div className="qc-cover" style={{ width: 56, height: 56, borderRadius: 12, flex: "none", display: "grid", placeItems: "center", background: `var(--accent-soft)`, border: "1px solid var(--line)", position: "relative" }}>
                  {coverLabel && <span className="ph" style={{ fontSize: 9, color: "var(--dim)", textTransform: "uppercase" }}>cover</span>}
                  <span className="qc-pts" style={{ position: "absolute", bottom: 6, right: 6, fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--accent)", fontWeight: 700 }}>+{pts}</span>
                </div>
                <div className="qc-body" style={{ flex: 1 }}>
                  <div className="qc-title" style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>{ct.title as string}</div>
                  <div className="qc-desc" style={{ fontSize: 13, color: "var(--muted)", marginTop: 3 }}>{ct.description as string ?? ""}</div>
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
      <div className="codebox" style={{ marginBottom: 24 }}>
        <div className="codebox-head">
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--dim)" }}>Your Code</span>
          <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard?.writeText((refDataObj as { code?: string })?.code ?? ""); toast.success("Copied!"); }}>
            <Copy size={14} /> Copy
          </button>
        </div>
        <div className="code">{(refDataObj as { code?: string })?.code ?? "TASMIL-X7K9"}</div>
      </div>

      <div className="qref-earned" style={{ marginBottom: 28 }}>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div className="qs-num">{fmt((refDataObj as { totalEarned?: number })?.totalEarned ?? 1250)}</div>
          <div className="qs-lab">Points Earned</div>
        </div>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div className="qs-num">{(refDataObj as { totalReferrals?: number })?.totalReferrals ?? 14}</div>
          <div className="qs-lab">Total Refs</div>
        </div>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div className="qs-num" style={{ color: "var(--green)" }}>{(refDataObj as { activeReferrals?: number })?.activeReferrals ?? 9}</div>
          <div className="qs-lab">Active</div>
        </div>
      </div>

      {/* Rate tiers */}
      {((refDataObj as { rates?: { layer: number; rateBps: number }[] })?.rates?.length ?? 0) > 0 && (
        <div className="rate3" style={{ marginBottom: 28 }}>
          {((refDataObj as { rates: { layer: number; rateBps: number }[] })?.rates ?? []).map((r) => (
            <div key={r.layer} className="rate-item">
              <div className="rate-pct">{r.rateBps / 100}%</div>
              <div className="rate-lab">Layer {r.layer}</div>
            </div>
          ))}
        </div>
      )}

      {/* Referral list */}
      {refs.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Your Referrals</div>
          <div className="reflist">
            <div className="rl-head">
              <span>Username</span><span>Layer</span><span className="rt-right">Quest PTS</span><span className="rt-right">PTS Earned</span>
            </div>
            {refs.map((r, i) => (
              <div key={i} className="rl-row">
                <div className="rl-user">
                  <span className="rl-av" style={{ width: 30, height: 30, borderRadius: "50%", background: avatarBg(r.username ?? "u") }} />
                  <span className="rl-name" style={{ fontWeight: 600 }}>{r.username ?? "User"}</span>
                  <span className={`statusb ${r.status ?? "active"}`} style={{ display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 10px", borderRadius: "var(--r-pill)", color: r.status === "active" ? "var(--green)" : "var(--dim)", background: r.status === "active" ? "var(--green-soft)" : "rgba(255,255,255,0.04)", border: `1px solid ${r.status === "active" ? "var(--green-line)" : "var(--line)"}` }}>
                    {r.status ?? "active"}
                  </span>
                </div>
                <span className="layerb">L{r.layer ?? 1}</span>
                <span className="rl-num">{(r.questPoints ?? 0).toLocaleString()}<Pts /></span>
                <span className="rl-num earn">{(r.ptsEarned ?? 0).toLocaleString()}<Pts /></span>
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
    <div className="social-list">
      {socials.map((s) => {
        const connected = isConnected(s.platform);
        const acc = accounts.find((a) => a.platform === s.platform);
        return (
          <div key={s.platform} className="soc-card">
            <div className="soc-ico">{s.icon}</div>
            <div className="soc-meta">
              <div className="soc-name">{connected ? (acc?.username ?? s.platform) : s.label}</div>
              <div className={`soc-sub${connected ? " connected" : ""}`}>
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
    return (
      <div className="empty" style={{ minHeight: "50vh", justifyContent: "center" }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 48, height: 48, color: "var(--dim)" }}>
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <path d="M22 10h-4a2 2 0 0 0 0 4h4" />
          <circle cx="15" cy="12" r="1" />
        </svg>
        <div className="et">Connect your wallet</div>
        <div className="es">Link your Stellar wallet to access quests, referrals, and rewards.</div>
        <button type="button" className="btn btn-primary" onClick={connect} style={{ marginTop: 16 }}>
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div>
      <Rise>
        <div className="shell">
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
