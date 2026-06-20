"use client";

import React, { useMemo, useState } from "react";
import { Wallet } from "lucide-react";
import {
  useSeasonsControllerMyResult,
  useSocialAccountsControllerFindAll,
  useUsersControllerGetMe,
} from "@/gen-quest";
import { tierDisplay } from "@/features/quest/lib/tier";
import { qAvatar } from "@/features/quest/lib/avatar";
import { Flame, PtsCoin } from "@/features/quest/components/icons";
import { useWallet } from "@/features/quest/context/wallet-context";
import { type SeasonMeResult, unwrapEnvelope } from "@/features/quest/lib/season-types";
import { PayoutStatusBadge } from "./PayoutStatusBadge";
import { Referrals } from "./Referrals";
import { SocialConnectSection } from "./social/SocialConnectButtons";

type ProfileTab = "overview" | "referrals" | "social";

interface MeFields {
  totalPoints?: number;
  loginStreak?: number;
  completedQuests?: number;
  walletAddress?: string;
}

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);

const shorten = (addr: string) =>
  addr.length > 12 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;

const Profile: React.FC = () => {
  const { isAuthenticated, address, connect } = useWallet();
  const [tab, setTab] = useState<ProfileTab>("overview");

  const { data } = useUsersControllerGetMe();
  const me = ((data as { data?: MeFields } | undefined)?.data ?? {}) as MeFields;
  const points = me.totalPoints ?? 0;
  const streak = me.loginStreak ?? 0;
  const completedQuests = me.completedQuests ?? 0;
  const walletAddress = me.walletAddress ?? address ?? "";

  const tier = useMemo(() => tierDisplay(points), [points]);

  // Latest ended-season result (rank + USDC payout status), if any.
  const { data: seasonData } = useSeasonsControllerMyResult();
  const seasonResult = useMemo(
    () => unwrapEnvelope<SeasonMeResult>(seasonData),
    [seasonData]
  );

  // Social accounts for the Social tab.
  const { data: socialData, refetch: refetchSocial } = useSocialAccountsControllerFindAll();
  const socialAccounts = useMemo(() => {
    const raw = (socialData as { data?: unknown } | undefined)?.data ?? socialData ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [socialData]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 text-center max-w-sm px-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Connect your wallet</h2>
            <p className="text-muted-foreground">View your quests, points, and rewards.</p>
          </div>
          <button
            type="button"
            onClick={connect}
            className="btn btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-full"
          >
            <Wallet size={18} />
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quest-scope pt-8 pb-12 space-y-8 animate-in fade-in duration-500">
      {/* Profile header */}
      <header className="ph1 flex items-center gap-4">
        <span
          className="av-lg block w-16 h-16 rounded-full"
          style={{ background: qAvatar(walletAddress || "anon") }}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className={`tier-badge tier-${tier.tier.toLowerCase()}`}>{tier.tier}</span>
            <span className="addr font-mono text-sm text-muted">{shorten(walletAddress)}</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="pnav flex items-center gap-2 border-b border-line">
        <button
          type="button"
          onClick={() => setTab("overview")}
          className={`pnav-item${tab === "overview" ? " active" : ""}`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setTab("referrals")}
          className={`pnav-item${tab === "referrals" ? " active" : ""}`}
        >
          Referrals
        </button>
        <button
          type="button"
          onClick={() => setTab("social")}
          className={`pnav-item${tab === "social" ? " active" : ""}`}
        >
          Social
        </button>
      </nav>

      {tab === "overview" && (
        <section className="space-y-8">
          {/* Level / tier progress */}
          <div className="lvl-card p-6 rounded-2xl border border-line space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-accent">Level Progress</span>
              <span className="text-sm font-bold">{fmt(points)} PTS</span>
            </div>
            <div className="lvl-track h-3 rounded-full bg-surface overflow-hidden">
              <div
                className="lvl-fill h-full rounded-full"
                style={{ width: `${Math.round(tier.progress * 100)}%` }}
              />
            </div>
            <div className="lvl-meta text-xs text-muted">
              {tier.nextTier ? (
                <span>
                  {fmt(tier.toNext)} PTS to reach <strong>{tier.nextTier}</strong>
                </span>
              ) : (
                <span>Max tier reached — {tier.tier}</span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="stat-card p-5 rounded-2xl border border-line">
              <div className="text-xs uppercase tracking-wide text-muted">Points</div>
              <div className="text-2xl font-bold flex items-center gap-2">
                <PtsCoin style={{ width: 22, height: 22 }} />
                {fmt(points)}
              </div>
            </div>
            <div className="stat-card p-5 rounded-2xl border border-line">
              <div className="text-xs uppercase tracking-wide text-muted">Streak</div>
              <div className="text-2xl font-bold flex items-center gap-2">
                <Flame style={{ width: 21, height: 21 }} />
                {fmt(streak)}
              </div>
            </div>
            <div className="stat-card p-5 rounded-2xl border border-line">
              <div className="text-xs uppercase tracking-wide text-muted">Quests Completed</div>
              <div className="text-2xl font-bold">{fmt(completedQuests)}</div>
            </div>
          </div>

          {seasonResult && (
            <div className="lvl-card space-y-3 rounded-2xl border border-line p-6">
              <div className="flex items-center justify-between">
                <span className="font-medium text-accent text-sm">
                  {seasonResult.season.name} Result
                </span>
                <span className="font-bold text-sm">Rank #{seasonResult.finalRank}</span>
              </div>
              {Number(seasonResult.usdcReward) > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">USDC Payout — {seasonResult.usdcReward} USDC</span>
                  <PayoutStatusBadge
                    status={seasonResult.payoutStatus}
                  />
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {tab === "referrals" && (
        <section>
          <Referrals />
        </section>
      )}

      {tab === "social" && (
        <section>
          <SocialConnectSection socialAccounts={socialAccounts} onRefetch={refetchSocial} />
        </section>
      )}
    </div>
  );
};

export default Profile;
