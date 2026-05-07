"use client";

import { Activity, Check, Copy, Gift, Share2, Sparkles, Twitter, Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useWallet } from "@/shared/context/wallet-context";
import { Button } from "@/shared/ui/button";
import { useAuthStore } from "@/store/use-auth";
import { useReferralSnapshot } from "../hooks/use-referral-snapshot";
import type { ReferralEvent } from "../lib/fetch-referral";
import { LinkXDialog } from "./link-x-dialog";
import { VerifyShareDialog } from "./verify-share-dialog";

const SHARE_BASE_URL = "https://tasmil.finance/r";

function buildShareUrl(code: string): string {
  return `${SHARE_BASE_URL}/${code}`;
}

function buildTweetIntent(code: string): string {
  const text = `I'm using @TasmilFinance — try it: ${buildShareUrl(code)}`;
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMo = Math.floor(diffDay / 30);
  if (diffMo < 12) return `${diffMo}mo ago`;
  const diffYr = Math.floor(diffMo / 12);
  return `${diffYr}y ago`;
}

function formatKind(kind: ReferralEvent["kind"]): string {
  switch (kind) {
    case "JOIN":
      return "Join bonus";
    case "X_SHARE":
      return "X share";
    default:
      return kind;
  }
}

function KindIcon({ kind }: { kind: ReferralEvent["kind"] }) {
  if (kind === "JOIN") return <Gift className="h-4 w-4 text-primary" />;
  if (kind === "X_SHARE") return <Twitter className="h-4 w-4 text-primary" />;
  return <Activity className="h-4 w-4 text-muted-foreground" />;
}

export function ReferralsBody() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isExpired = useAuthStore((s) => s.isTokenExpired());
  const isAuthed = !!accessToken && !isExpired;
  const snapshot = useReferralSnapshot();
  const { connect } = useWallet();
  const [copied, setCopied] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [verifyShareDialogOpen, setVerifyShareDialogOpen] = useState(false);

  // ─── UNAUTHED — Center-aligned hero, no giant box ──────────
  if (!isAuthed) {
    return (
      <div
        data-testid="referrals-unauthed"
        className="flex w-full flex-col items-center gap-5 py-14 text-center"
      >
        {/* Subtle wallet glyph in a small rounded square */}
        <div className="flex h-12 w-12 items-center justify-center rounded-md border border-[#262626] bg-[#171717]">
          <Wallet className="h-5 w-5 text-[#59C3FF]" strokeWidth={1.75} />
        </div>

        {/* Heading — solid blue accent, no gradient */}
        <div className="flex flex-col gap-2">
          <h1 className="font-semibold text-3xl text-white leading-[1.15] tracking-tight md:text-4xl">
            Activate &amp; Share Your <span className="text-[#59C3FF]">Referral Power</span>
          </h1>
          <p className="mx-auto max-w-md text-[#A3A3A3] text-sm leading-relaxed">
            Unlock your unique referral code and start earning bonus points by connecting your
            wallet.
          </p>
        </div>

        {/* Connect Wallet — outline (blue border, blue text) */}
        <button
          type="button"
          onClick={connect}
          data-testid="referrals-connect-wallet"
          className="mt-2 inline-flex h-10 items-center gap-2 rounded-md border border-[#59C3FF] bg-transparent px-5 font-semibold text-[#59C3FF] text-sm transition-colors hover:bg-[#59C3FF]/10"
        >
          <Wallet className="h-4 w-4" strokeWidth={2} />
          Connect Wallet
        </button>

        {/* Benefit pill — thin border, spark icon */}
        <div className="inline-flex items-center gap-1.5 rounded-md border border-[#333333] bg-[#171717] px-2.5 py-1">
          <Sparkles className="h-3 w-3 text-[#59C3FF]" />
          <span className="font-medium text-[#A3A3A3] text-xs">
            Earn 10% of your friends&rsquo; points <span className="text-white">forever</span>
          </span>
        </div>
      </div>
    );
  }

  // ─── LOADING / ERROR ─────────────────────────────────────────
  if (snapshot.isLoading || !snapshot.data) {
    return (
      <div
        data-testid="referrals-loading"
        className="flex w-full items-center gap-2 py-8 text-muted-foreground text-sm"
      >
        <span
          aria-hidden
          className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-primary"
        />
        Loading referrals…
      </div>
    );
  }

  if (snapshot.isError) {
    const message =
      snapshot.error instanceof Error ? snapshot.error.message : "Failed to load referrals";
    return (
      <div data-testid="referrals-error" className="w-full py-6 text-destructive text-sm">
        {message}
      </div>
    );
  }

  const { referralCode, totalEarnedPoints, joinClaimedAt, xLinked, recentEvents } = snapshot.data;
  const hasCode = !!referralCode;
  const shareUrl = hasCode ? buildShareUrl(referralCode as string) : "";

  const handleCopyLink = async () => {
    if (!hasCode) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const handleShareOnX = () => {
    if (!hasCode || typeof window === "undefined") return;
    window.open(buildTweetIntent(referralCode as string), "_blank", "noopener,noreferrer");
  };

  return (
    <div data-testid="referrals-root" className="flex w-full flex-col gap-10">
      <header className="flex flex-col gap-1">
        <h1 className="font-semibold text-2xl text-foreground tracking-tight">Referrals</h1>
        <p className="text-muted-foreground text-sm">
          Share your code, earn points when friends join.
        </p>
      </header>

      {/* Two-column grid: code (left) + stats (right) */}
      <div className="grid grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-[3fr_2fr]">
        {/* SECTION — REFERRAL CODE */}
        <section data-testid="referrals-code-card" className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <SectionLabel>Your referral code</SectionLabel>
            {hasCode && !xLinked && (
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                X not linked
              </span>
            )}
          </div>

          {hasCode ? (
            <>
              <div className="flex items-stretch gap-2">
                <code
                  data-testid="referrals-code"
                  className="flex flex-1 items-center truncate rounded-md bg-muted/40 px-3 py-2 font-mono font-medium text-foreground text-sm"
                >
                  {shareUrl}
                </code>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyLink}
                  data-testid="referrals-copy-link"
                  aria-label="Copy referral link"
                  className="shrink-0"
                >
                  {copied ? (
                    <>
                      <Check />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy />
                      Copy
                    </>
                  )}
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {xLinked ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      data-testid="referrals-share-x"
                      onClick={handleShareOnX}
                    >
                      <Share2 />
                      Share on X
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      data-testid="referrals-verify-share"
                      onClick={() => setVerifyShareDialogOpen(true)}
                    >
                      Verify your tweet
                      <span className="ml-1 font-mono font-semibold text-primary text-xs tabular-nums">
                        +30
                      </span>
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    data-testid="referrals-link-x"
                    onClick={() => setLinkDialogOpen(true)}
                  >
                    <Twitter />
                    Link your X account
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div data-testid="referrals-empty" className="flex flex-col gap-4">
              <p className="text-muted-foreground text-sm leading-relaxed">
                No referral code yet — complete waitlist signup to receive one.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <Link href="/waitlist" data-testid="referrals-join-waitlist">
                    Join waitlist
                  </Link>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  data-testid="referrals-link-x"
                  onClick={() => setLinkDialogOpen(true)}
                >
                  <Twitter />
                  Link your X account
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* SECTION — STATS (no inner box-in-box) */}
        <section data-testid="referrals-stats-card" className="flex flex-col gap-6">
          <SectionLabel>Stats</SectionLabel>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
              Total earned
            </span>
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
              Join bonus
            </span>
            <div className="flex items-baseline gap-1.5">
              <span
                data-testid="referrals-total-credits"
                className="font-semibold text-2xl text-foreground tabular-nums"
              >
                {totalEarnedPoints.toLocaleString()}
              </span>
              <span className="text-muted-foreground text-xs">points</span>
            </div>
            <div className="flex items-center pt-1">
              <span
                data-testid="referrals-join-badge"
                className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 font-medium text-xs ${
                  joinClaimedAt ? "bg-primary/15 text-primary" : "bg-muted/60 text-muted-foreground"
                }`}
              >
                <span
                  aria-hidden
                  className={`h-1.5 w-1.5 rounded-full ${
                    joinClaimedAt ? "bg-primary" : "bg-muted-foreground/60"
                  }`}
                />
                {joinClaimedAt ? "Claimed" : "Not yet"}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* SECTION — RECENT ACTIVITY (data-table style, no outer box) */}
      <section data-testid="referrals-events-card" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <SectionLabel>Recent activity</SectionLabel>
          {recentEvents.length > 0 && (
            <span className="font-mono text-muted-foreground text-xs tabular-nums">
              {recentEvents.length} {recentEvents.length === 1 ? "event" : "events"}
            </span>
          )}
        </div>

        <div className="flex flex-col">
          <div className="grid grid-cols-[1fr_1.2fr_1fr_auto] gap-4 border-b border-zinc-800 pb-2 text-[11px] text-muted-foreground uppercase tracking-wider">
            <span>Date</span>
            <span>User</span>
            <span>Action</span>
            <span className="justify-self-end">Points earned</span>
          </div>

          {recentEvents.length === 0 ? (
            <div
              data-testid="referrals-events-empty"
              className="flex min-h-[200px] flex-col items-center justify-center gap-1 text-center"
            >
              <Activity className="mb-1 h-4 w-4 text-muted-foreground/50" />
              <p className="text-muted-foreground text-sm">
                No referral events yet. Share your code to see activity here.
              </p>
            </div>
          ) : (
            <ul data-testid="referrals-events-table" className="divide-y divide-border/40">
              {recentEvents.map((event, idx) => (
                <li
                  key={`${event.kind}-${event.occurredAt}-${idx}`}
                  data-testid={`referrals-events-row-${event.kind}`}
                  className="grid grid-cols-[1fr_1.2fr_1fr_auto] items-center gap-4 py-3 text-sm transition-colors hover:bg-muted/20"
                >
                  <span className="text-muted-foreground text-xs">
                    {relativeTime(event.occurredAt)}
                  </span>
                  <span className="truncate text-muted-foreground">—</span>
                  <span className="flex items-center gap-2 truncate font-medium text-foreground">
                    <KindIcon kind={event.kind} />
                    {formatKind(event.kind)}
                  </span>
                  <span
                    className={`justify-self-end font-mono font-semibold tabular-nums ${
                      event.creditsAwarded > 0 ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {event.creditsAwarded > 0 ? `+${event.creditsAwarded}` : event.creditsAwarded}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <LinkXDialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen} />
      <VerifyShareDialog open={verifyShareDialogOpen} onOpenChange={setVerifyShareDialogOpen} />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.12em]">
      {children}
    </h2>
  );
}

export function ReferralsPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <ReferralsBody />
    </main>
  );
}
