"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Coins, Copy, Flame, Loader2, LogOut, Menu, Wallet, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";
import { Button, buttonClasses } from "@/features/quest/components/ui/button";
import { WalletRankInfo } from "@/features/quest/components/WalletRankInfo";
import { useWallet } from "@/features/quest/context/wallet-context";
import { variantFromAvatarUrl } from "@/features/quest/lib/avatar";
import { withAuth } from "@/features/quest/lib/kubb-config";
import {
  usersControllerGetMeQueryKey,
  useUsersControllerDailyLogin,
  useUsersControllerGetCheckInStatus,
  useUsersControllerGetMyCampaigns,
} from "@/gen-quest/hooks";
import { cn } from "@/lib/utils";
import { TasmilAvatar } from "@/shared/components/tasmil-avatar";

// Shared chip base — mirrors the quest navbar (QuestNav) so the PTS, streak
// and wallet chips render identically (same height, radius, border, surface).
const CHIP_BASE = cn(
  "inline-flex h-10 items-center gap-[7px]",
  "px-[14px] text-[13.5px] font-semibold",
  "rounded-quest-pill bg-quest-surface border border-quest-line-2",
  "transition-colors"
);

// ─── NavItem ─────────────────────────────────────────────────────────────────

function NavItem({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/quest" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={cn(
        "relative text-[14.5px] font-medium px-4 py-[9px] rounded-[100px] transition-colors duration-200",
        active ? "text-foreground" : "text-muted hover:text-foreground hover:bg-white/[0.05]",
        active &&
          "after:content-[''] after:absolute after:left-[15px] after:right-[15px] after:bottom-px after:h-[2px] after:rounded-sm after:bg-accent after:shadow-[0_0_10px_var(--accent-glow)]"
      )}
    >
      {label}
    </Link>
  );
}

// ─── Navbar ──────────────────────────────────────────────────────────────────

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const {
    isAuthenticating,
    address,
    displayAddress,
    points,
    user,
    connect,
    disconnect,
    isAuthenticated,
    isConnected,
  } = useWallet();

  const queryClient = useQueryClient();

  // Streak lives on the user object from the auth store
  const streak = user?.loginStreak ?? 0;

  // Check-in status
  const { data: checkInStatus, refetch: refetchCheckInStatus } = useUsersControllerGetCheckInStatus(
    {
      ...withAuth,
      query: {
        enabled: isAuthenticated && !!user,
        refetchOnWindowFocus: false,
        staleTime: 0,
        gcTime: 0,
      },
    }
  );

  const hasCheckedIn =
    (checkInStatus?.data as { hasCheckedIn?: boolean } | undefined)?.hasCheckedIn ?? false;

  // Daily login mutation
  const dailyLoginMutation = useUsersControllerDailyLogin({
    ...withAuth,
    mutation: {
      onSuccess: async (data) => {
        await queryClient.invalidateQueries({
          queryKey: usersControllerGetMeQueryKey(),
          refetchType: "active",
        });
        await queryClient.refetchQueries({
          queryKey: usersControllerGetMeQueryKey(),
        });
        await refetchCheckInStatus();

        if (data?.data && typeof data.data === "object" && "pointsAwarded" in data.data) {
          toast.success(
            `Check-in successful! You earned ${(data.data as { pointsAwarded?: number }).pointsAwarded} points!`
          );
        } else {
          toast.success("Check-in successful!");
        }
      },
      onError: (error: Error) => {
        const errorMessage =
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          error?.message ||
          "Failed to check in. Please try again.";
        toast.error(errorMessage);
      },
    },
  });

  // Sponsor badge — first joined campaign with metadata.sponsor
  const myCampaigns = useUsersControllerGetMyCampaigns();
  const sponsoredName = (
    (myCampaigns.data?.data as { metadata?: { sponsor?: string } }[] | undefined) ?? []
  )
    .map((c) => c.metadata?.sponsor)
    .find((s): s is string => Boolean(s));

  const handleCheckIn = () => {
    if (dailyLoginMutation.isPending) return;
    dailyLoginMutation.mutate(undefined);
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success("Address copied!");
    }
  };

  React.useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  return (
    // .nav: sticky top:0; z-index:50; grid 1fr auto 1fr; align-items:center; padding:16px clamp(20px,5vw,56px);
    //       background:rgba(20,20,25,0.72); backdrop-filter:blur(18px); border-bottom:1px solid var(--line)
    // NOTE: original component used flex justify-between (not grid); preserving that layout for mobile compat
    <header
      className="sticky top-0 z-50 flex items-center justify-between"
      style={{
        padding: "16px clamp(20px, 5vw, 56px)",
        background: "rgba(20,20,25,0.72)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      {/* Brand */}
      {/* .nav-brand: flex; align-items:center; gap:15px; font-weight:800; font-size:30px; letter-spacing:-0.03em */}
      {/* .brand (footer/nav): flex; align-items:center; gap:12px; font-weight:700; font-size:22px; letter-spacing:-0.03em */}
      {/* .brand-name: gradient text */}
      {/* .mk (nav): width:48px; height:48px */}
      <div className="flex items-center">
        <Link
          href="/quest/explore"
          className="flex items-center gap-[15px] font-extrabold no-underline"
          style={{ fontSize: "30px", letterSpacing: "-0.03em" }}
        >
          <img
            src="/tasmil-tf-logo.png"
            alt="Tasmil"
            width="48"
            height="48"
            className="flex-none"
            style={{ width: "48px", height: "48px" }}
          />
          <span
            style={{
              background: "linear-gradient(100deg,#fff 0%,var(--accent) 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Tasmil Quest
          </span>
        </Link>

        {sponsoredName ? (
          <span
            data-testid="quest-sponsor-badge"
            className="ml-3 flex h-7 items-center gap-1.5 rounded-full border border-[var(--accent-line)] bg-[var(--accent-soft)] px-2.5 font-medium text-[var(--accent)] text-xs"
          >
            Sponsored · {sponsoredName}
          </span>
        ) : null}
      </div>

      {/* Desktop nav links — .nav-links: flex; gap:2px */}
      <nav className="hidden md:flex gap-[2px]">
        <NavItem href="/quest/explore" label="Explore" />
        <NavItem href="/quest/campaigns" label="Campaigns" />
        <NavItem href="/quest/leaderboard" label="Leaderboard" />
        <NavItem href="/quest/profile" label="Profile" />
      </nav>

      {/* Right side — .nav-right: flex; align-items:center; gap:12px */}
      <div className="hidden md:flex items-center gap-3">
        {!isConnected ? (
          <Button
            type="button"
            onClick={connect}
            disabled={isAuthenticating}
            variant="primary"
            size="sm"
            className="gap-2"
          >
            <Wallet size={16} />
            <span>{isAuthenticating ? "Connecting..." : "Connect Wallet"}</span>
          </Button>
        ) : isAuthenticating ? (
          <div className="flex items-center gap-3">
            {/* .stat-pill.pts: inline-flex; align-items:center; gap:7px; font-size:13.5px; font-weight:600;
                 padding:8px 14px; border-radius:var(--r-pill); background:var(--surface); border:1px solid var(--line-2); color:var(--green) */}
            <span className={cn(CHIP_BASE, "text-quest-green [&_svg]:text-quest-green")}>
              <Loader2 className="w-[14px] h-[14px] animate-spin" />
              Authenticating...
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {/* Points pill — .stat-pill.pts: color:var(--green) */}
            <span className={cn(CHIP_BASE, "text-quest-green [&_svg]:text-quest-green")}>
              <Coins className="w-[14px] h-[14px]" />
              {points.toLocaleString()}
            </span>

            {/* Streak pill — with check-in button if not yet checked in today */}
            {!hasCheckedIn ? (
              <button
                type="button"
                onClick={handleCheckIn}
                disabled={dailyLoginMutation.isPending}
                className={cn(
                  CHIP_BASE,
                  "text-quest-amber [&_svg]:text-quest-amber",
                  "hover:bg-white/[0.05] disabled:cursor-default disabled:hover:bg-quest-surface"
                )}
              >
                {dailyLoginMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Checking in...
                  </>
                ) : (
                  <>
                    <Flame size={14} />
                    Check-in ({streak}d)
                  </>
                )}
              </button>
            ) : (
              /* .stat-pill.streak: color:var(--amber) */
              <span className={cn(CHIP_BASE, "text-quest-amber [&_svg]:text-quest-amber")}>
                <Flame className="w-[14px] h-[14px]" />
                {streak}d
              </span>
            )}

            {/* Wallet chip — .wallet-chip: inline-flex; align-items:center; gap:10px; padding:5px 14px 5px 6px;
                 border-radius:var(--r-pill); background:var(--surface); border:1px solid var(--line-2) */}
            <div className="relative group">
              <span className={cn(CHIP_BASE, "cursor-pointer gap-[10px] pl-[6px] text-quest-text")}>
                {/* .av: block; width:30px; height:30px; border-radius:50%; flex:none */}
                <TasmilAvatar
                  seed={address ?? ""}
                  variant={variantFromAvatarUrl(user?.avatarUrl)}
                  size={30}
                  className="flex-none"
                />
                {/* .addr: font-family:var(--font-mono); font-size:13px; color:var(--text) */}
                <span
                  className="text-[13px] text-quest-text"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {displayAddress}
                </span>
              </span>

              {/* Hover dropdown */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all translate-y-2 group-hover:translate-y-0">
                <WalletRankInfo />
                <div className="p-1">
                  <button
                    onClick={copyAddress}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted hover:text-white hover:bg-white/5 flex items-center gap-2"
                  >
                    <Copy size={14} /> Copy Address
                  </button>
                  <button
                    onClick={disconnect}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2"
                  >
                    <LogOut size={14} /> Disconnect
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile hamburger */}
      <button
        className="md:hidden p-2 text-muted"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile menu drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-[var(--navbar-h,64px)] left-0 w-full h-[calc(100vh-64px)] bg-background/95 backdrop-blur-xl border-t border-border z-40 flex flex-col animate-in slide-in-from-right-10 duration-200 overflow-y-auto">
          <div className="flex flex-col p-6 gap-6">
            <nav className="flex flex-col gap-4">
              <Link
                href="/quest/explore"
                className="text-2xl font-bold py-2 border-b border-white/5"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Explore
              </Link>
              <Link
                href="/quest/campaigns"
                className="text-2xl font-bold py-2 border-b border-white/5"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Campaigns
              </Link>
              <Link
                href="/quest/leaderboard"
                className="text-2xl font-bold py-2 border-b border-white/5"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Leaderboard
              </Link>
              <Link
                href="/quest/profile"
                className="text-2xl font-bold py-2 border-b border-white/5"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Profile
              </Link>
            </nav>

            <div className="mt-auto pt-6">
              {!isConnected ? (
                <Button
                  type="button"
                  variant="primary"
                  block
                  onClick={() => {
                    connect();
                    setIsMobileMenuOpen(false);
                  }}
                  disabled={isAuthenticating}
                >
                  <Wallet className="mr-2" size={18} />
                  {isAuthenticating ? "Connecting..." : "Connect Wallet"}
                </Button>
              ) : isAuthenticating ? (
                <div className="flex items-center justify-center gap-3 py-8">
                  <Loader2 size={24} className="animate-spin text-accent" />
                  <span className="text-muted">Authenticating...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Points */}
                  <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border">
                    <div className="flex items-center gap-2">
                      <Coins size={18} className="text-[var(--green)]" />
                      <span className="text-muted font-medium">Points</span>
                    </div>
                    <span className="font-bold text-lg" style={{ color: "var(--green)" }}>
                      {points.toLocaleString()}
                    </span>
                  </div>

                  {/* Streak */}
                  {!hasCheckedIn ? (
                    <Button
                      type="button"
                      onClick={handleCheckIn}
                      disabled={dailyLoginMutation.isPending}
                      variant="ghost"
                      size="lg"
                      block
                      className="gap-2"
                    >
                      {dailyLoginMutation.isPending ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span className="font-semibold">Checking in...</span>
                        </>
                      ) : (
                        <>
                          <Flame size={18} />
                          <span className="font-semibold">Check-in ({streak}d)</span>
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border">
                      <div className="flex items-center gap-2">
                        <Flame size={18} style={{ color: "var(--amber)" }} />
                        <span className="text-muted font-medium">Streak</span>
                      </div>
                      <span className="font-bold text-lg" style={{ color: "var(--amber)" }}>
                        {streak}d
                      </span>
                    </div>
                  )}

                  {/* Account */}
                  <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border">
                    <span className="text-muted font-medium">Account</span>
                    <span className="text-foreground font-mono text-sm">{displayAddress}</span>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={copyAddress}
                    >
                      <Copy size={14} /> Copy Address
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        disconnect();
                        setIsMobileMenuOpen(false);
                      }}
                      className={buttonClasses({
                        variant: "ghost",
                        size: "sm",
                        className:
                          "flex-1 gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:translate-y-0 hover:border-transparent",
                      })}
                    >
                      <LogOut size={14} /> Disconnect
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
