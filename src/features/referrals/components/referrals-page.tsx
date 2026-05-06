"use client";

import { Activity, Check, Copy, Gift, Link2, Share2, Sparkles, Twitter, Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useWallet } from "@/shared/context/wallet-context";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Button as ButtonV2 } from "@/shared/ui/button-v2";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
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

  // ─── UNAUTHED — Hero card matching platform style ─────────────
  if (!isAuthed) {
    return (
      <div data-testid="referrals-unauthed" className="relative w-full">
        {/* Soft ambient glow — single primary tone */}
        <div
          aria-hidden
          className="-z-10 pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="-top-32 -translate-x-1/2 absolute left-1/2 h-72 w-[120%] rounded-full bg-primary/10 blur-[140px]" />
        </div>

        <Card className="relative overflow-hidden border-border/60">
          {/* Subtle inner top highlight matching the brand glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
          />

          {/* Decorative corner label */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-6 right-8 font-mono text-[10px] text-muted-foreground/50 uppercase tracking-[0.4em]"
          >
            REFERRAL · 01
          </div>

          <div className="relative flex flex-col items-center gap-7 px-8 py-14 text-center md:px-16 md:py-20">
            {/* Wallet emblem — primary brand color, no violet */}
            <div className="relative">
              <div
                aria-hidden
                className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-2xl"
              />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-md">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-card shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <Wallet className="h-7 w-7 text-primary" strokeWidth={1.75} />
                </div>
              </div>
            </div>

            {/* Headline */}
            <div className="flex flex-col gap-3">
              <h1 className="font-semibold text-3xl text-foreground leading-[1.1] tracking-tight md:text-4xl">
                Activate &amp; Share Your{" "}
                <span className="text-primary">Referral Power</span>
              </h1>
              <p className="mx-auto max-w-md text-muted-foreground text-sm leading-relaxed md:text-base">
                Unlock your unique referral code and start earning bonus points by connecting
                your wallet.
              </p>
            </div>

            {/* Connect button — uses the platform's existing gradient variant */}
            <ButtonV2
              variant="gradient"
              onClick={connect}
              data-testid="referrals-connect-wallet"
              className="h-11 rounded-full px-7 text-[15px]"
            >
              <Wallet className="mr-2 h-4 w-4" strokeWidth={2.25} />
              Connect Wallet
            </ButtonV2>

            {/* Benefit pill — primary tinted, single color */}
            <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5">
              <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              <span className="font-medium text-foreground/90 text-xs">
                Earn 10% of your friends&rsquo; points{" "}
                <span className="font-semibold text-primary">forever</span>
              </span>
            </div>
          </div>
        </Card>
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
    <div data-testid="referrals-root" className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-semibold text-2xl text-foreground tracking-tight">Referrals</h1>
        <p className="text-muted-foreground text-sm">
          Share your code, earn points when friends join.
        </p>
      </div>

      {/* CARD 1 — REFERRAL CODE */}
      <Card data-testid="referrals-code-card" className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
        />
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2 font-semibold text-base">
            <Link2 className="h-4 w-4 text-primary" />
            Your referral code
          </CardTitle>
          {hasCode && !xLinked ? (
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
              X not linked
            </Badge>
          ) : null}
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {hasCode ? (
            <>
              <div className="flex items-stretch gap-2 rounded-md border border-border bg-muted/30 p-1.5">
                <code
                  data-testid="referrals-code"
                  className="flex flex-1 items-center truncate px-3 py-1.5 font-mono font-medium text-foreground text-sm"
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
            <div data-testid="referrals-empty" className="flex flex-col gap-3">
              <p className="text-muted-foreground text-sm">
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
        </CardContent>
      </Card>

      {/* CARD 2 — STATS */}
      <Card data-testid="referrals-stats-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 font-semibold text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-border bg-border/60 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 bg-card px-5 py-4">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                Total earned
              </span>
              <div className="flex items-baseline gap-1.5">
                <span
                  data-testid="referrals-total-credits"
                  className="font-semibold text-3xl text-foreground tabular-nums"
                >
                  {totalEarnedPoints.toLocaleString()}
                </span>
                <span className="text-muted-foreground text-sm">points</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 bg-card px-5 py-4">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                Join bonus
              </span>
              <div className="flex items-center gap-2 pt-1">
                <Badge
                  data-testid="referrals-join-badge"
                  variant={joinClaimedAt ? "default" : "secondary"}
                  className={
                    joinClaimedAt
                      ? "bg-primary/15 text-primary hover:bg-primary/15"
                      : "bg-muted text-muted-foreground hover:bg-muted"
                  }
                >
                  <span
                    aria-hidden
                    className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                      joinClaimedAt ? "bg-primary" : "bg-muted-foreground/60"
                    }`}
                  />
                  {joinClaimedAt ? "Claimed" : "Not yet"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CARD 3 — RECENT ACTIVITY */}
      <Card data-testid="referrals-events-card">
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2 font-semibold text-base">
            <Activity className="h-4 w-4 text-primary" />
            Recent activity
          </CardTitle>
          {recentEvents.length > 0 ? (
            <span className="font-mono text-muted-foreground text-xs tabular-nums">
              {recentEvents.length} {recentEvents.length === 1 ? "event" : "events"}
            </span>
          ) : null}
        </CardHeader>

        <CardContent>
          {recentEvents.length === 0 ? (
            <div
              data-testid="referrals-events-empty"
              className="flex flex-col items-center justify-center gap-1 rounded-md border border-border border-dashed py-10 text-center"
            >
              <Activity className="mb-1 h-5 w-5 text-muted-foreground/60" />
              <p className="font-medium text-foreground text-sm">No referral events yet</p>
              <p className="text-muted-foreground text-xs">
                Share your code to see activity here.
              </p>
            </div>
          ) : (
            <ul data-testid="referrals-events-table" className="-mx-2 divide-y divide-border/60">
              {recentEvents.map((event, idx) => (
                <li
                  key={`${event.kind}-${event.occurredAt}-${idx}`}
                  data-testid={`referrals-events-row-${event.kind}`}
                  className="flex items-center justify-between gap-4 rounded-md px-2 py-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <KindIcon kind={event.kind} />
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-medium text-foreground text-sm">
                        {formatKind(event.kind)}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {relativeTime(event.occurredAt)}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`font-mono font-semibold text-sm tabular-nums ${
                      event.creditsAwarded > 0 ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {event.creditsAwarded > 0
                      ? `+${event.creditsAwarded}`
                      : event.creditsAwarded}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <LinkXDialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen} />
      <VerifyShareDialog open={verifyShareDialogOpen} onOpenChange={setVerifyShareDialogOpen} />
    </div>
  );
}

export function ReferralsPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <ReferralsBody />
    </main>
  );
}
