"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Coins, Copy, Flame, Loader2, LogOut, Menu, Wallet, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/features/quest/components/ui/avatar";
import { useWallet } from "@/features/quest/context/wallet-context";
import { withAuth } from "@/features/quest/lib/kubb-config";
import {
  usersControllerGetMeQueryKey,
  useUsersControllerDailyLogin,
  useUsersControllerGetCheckInStatus,
  useUsersControllerGetMyCampaigns,
} from "@/gen-quest/hooks";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function avatarFromAddress(addr: string): string {
  if (!addr) return "linear-gradient(135deg, #67E8F9, #0EA5E9)";
  const hash = Array.from(addr).reduce((a, c) => a + c.charCodeAt(0), 0);
  const h1 = (hash * 7) % 360;
  const h2 = (hash * 13) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 70%, 60%), hsl(${h2}, 70%, 45%))`;
}

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

  const getAvatarUrl = (walletAddress?: string) => {
    if (user?.avatarUrl) return user.avatarUrl;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletAddress ?? "default"}`;
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
    <header
      className="sticky top-0 z-50 flex items-center justify-between"
      style={{
        padding: "16px clamp(20px, 5vw, 56px)",
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderBottom: "1px solid var(--accent-line)",
      }}
    >
      {/* Brand */}
      <div className="flex items-center">
        <Link
          href="/quest"
          className="flex items-center gap-[11px] font-bold text-[19px] tracking-[-0.025em]"
        >
          <Image src="/logo.png" alt="" width={30} height={30} priority />
          <span>
            Tasmil<span className="text-accent">.fin</span>
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

      {/* Desktop nav links */}
      <nav className="hidden md:flex gap-[2px]">
        <NavItem href="/quest" label="Explore" />
        <NavItem href="/quest/campaigns" label="Campaigns" />
        <NavItem href="/quest/leaderboard" label="Leaderboard" />
        <NavItem href="/quest/profile" label="Profile" />
      </nav>

      {/* Right side */}
      <div className="hidden md:flex items-center gap-3">
        {!isConnected ? (
          <button
            type="button"
            onClick={connect}
            disabled={isAuthenticating}
            className="btn btn-primary btn-sm gap-2"
          >
            <Wallet size={16} />
            <span>{isAuthenticating ? "Connecting..." : "Connect Wallet"}</span>
          </button>
        ) : isAuthenticating ? (
          <div className="flex items-center gap-3">
            <span className="stat-pill pts">
              <Loader2 className="w-[14px] h-[14px] animate-spin" />
              Authenticating...
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {/* Points pill */}
            <span className="stat-pill pts">
              <Coins className="w-[14px] h-[14px]" />
              {points.toLocaleString()}
            </span>

            {/* Streak pill — with check-in button if not yet checked in today */}
            {!hasCheckedIn ? (
              <button
                type="button"
                onClick={handleCheckIn}
                disabled={dailyLoginMutation.isPending}
                className="btn btn-ghost btn-sm gap-2"
              >
                {dailyLoginMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span className="text-sm font-semibold">Checking in...</span>
                  </>
                ) : (
                  <>
                    <Flame size={14} />
                    <span className="text-sm font-semibold">Check-in ({streak}d)</span>
                  </>
                )}
              </button>
            ) : (
              <span className="stat-pill streak">
                <Flame className="w-[14px] h-[14px]" />
                {streak}d
              </span>
            )}

            {/* Wallet chip with dropdown */}
            <div className="relative group">
              <span className="wallet-chip cursor-pointer">
                <span className="av" style={{ background: avatarFromAddress(address ?? "") }}>
                  <Avatar className="h-[30px] w-[30px]">
                    <AvatarImage src={getAvatarUrl(address ?? undefined)} />
                    <AvatarFallback>
                      {displayAddress?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                </span>
                <span className="addr">{displayAddress}</span>
              </span>

              {/* Hover dropdown */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all translate-y-2 group-hover:translate-y-0">
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
                href="/quest"
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
                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  onClick={() => {
                    connect();
                    setIsMobileMenuOpen(false);
                  }}
                  disabled={isAuthenticating}
                >
                  <Wallet className="mr-2" size={18} />
                  {isAuthenticating ? "Connecting..." : "Connect Wallet"}
                </button>
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
                    <button
                      type="button"
                      onClick={handleCheckIn}
                      disabled={dailyLoginMutation.isPending}
                      className="btn btn-ghost btn-lg btn-block gap-2"
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
                    </button>
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
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm flex-1 gap-2"
                      onClick={copyAddress}
                    >
                      <Copy size={14} /> Copy Address
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        disconnect();
                        setIsMobileMenuOpen(false);
                      }}
                      className="btn bg-destructive text-destructive-foreground hover:bg-destructive/90 btn-sm flex-1 gap-2"
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
