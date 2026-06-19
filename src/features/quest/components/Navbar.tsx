"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Coins, Copy, Flame, Loader2, LogOut, Menu, Wallet, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";
import { useWallet } from "@/features/quest/context/wallet-context";
import { withAuth } from "@/features/quest/lib/kubb-config";
import {
  usersControllerGetMeQueryKey,
  useUsersControllerDailyLogin,
  useUsersControllerGetCheckInStatus,
} from "@/gen-quest/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button-v2";
import { Typography } from "@/shared/ui/typography";

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
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

  // Get streak from user
  const streak = user?.loginStreak || 0;

  // Check if user has checked in today
  const { data: checkInStatus, refetch: refetchCheckInStatus } = useUsersControllerGetCheckInStatus(
    {
      ...withAuth,
      query: {
        enabled: isAuthenticated && !!user,
        refetchOnWindowFocus: false,
        staleTime: 0, // Always consider data stale - force refetch
        gcTime: 0, // Don't cache the result in React Query
      },
    }
  );

  const hasCheckedIn = checkInStatus?.data?.hasCheckedIn ?? false;

  // Daily login mutation
  const dailyLoginMutation = useUsersControllerDailyLogin({
    ...withAuth,
    mutation: {
      onSuccess: async (data) => {
        // Invalidate and refetch user data to get updated points and streak
        await queryClient.invalidateQueries({
          queryKey: usersControllerGetMeQueryKey(),
          refetchType: "active", // Force refetch even if data is fresh
        });
        // Also refetch directly to ensure immediate update
        await queryClient.refetchQueries({
          queryKey: usersControllerGetMeQueryKey(),
        });
        // Refetch check-in status
        await refetchCheckInStatus();

        if (data?.data && typeof data.data === "object" && "pointsAwarded" in data.data) {
          toast.success(
            `Check-in successful! You earned ${(data.data as { pointsAwarded?: number }).pointsAwarded} points! 🔥`
          );
        } else {
          toast.success("Check-in successful! 🔥");
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

  const handleCheckIn = () => {
    if (dailyLoginMutation.isPending) return;
    dailyLoginMutation.mutate(undefined);
  };

  // Get avatar URL - use user's avatar or fallback to dicebear
  const getAvatarUrl = (walletAddress?: string) => {
    if (user?.avatarUrl) return user.avatarUrl;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletAddress || "default"}`;
  };

  const isActive = (path: string) =>
    pathname === path
      ? "text-primary font-semibold"
      : "text-muted hover:text-primary transition-colors";

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
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-surface/80 backdrop-blur-md h-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link className="flex flex-row items-center gap-2" href="/">
            <div className="relative flex h-8 w-8 items-center justify-center md:h-10 md:w-10">
              <Image alt="logo" height={40} src="/logo.png" width={40} />
            </div>
            <Typography
              className="text-xl transition-all duration-300"
              gradient={true}
              weight="bold"
            >
              Tasmil Finance
            </Typography>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className={isActive("/")}>
              Explore
            </Link>
            <Link href="/campaigns" className={isActive("/campaigns")}>
              Campaigns
            </Link>
            <Link href="/leaderboard" className={isActive("/leaderboard")}>
              Leaderboard
            </Link>
            <Link href="/profile" className={isActive("/profile")}>
              My Quests
            </Link>
          </div>

          {/* Right Side - Wallet Connection */}
          <div className="hidden md:flex items-center gap-4">
            {!isConnected ? (
              <Button
                variant="gradient"
                onClick={connect}
                disabled={isAuthenticating}
                className="gap-2"
              >
                <Wallet size={18} />
                <span>{isAuthenticating ? "Connecting..." : "Connect Wallet"}</span>
              </Button>
            ) : isAuthenticating ? (
              <div className="flex items-center gap-3 animate-in fade-in duration-300">
                <div className="bg-card border border-border rounded-full px-4 py-1.5 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-brand-mid" />
                  <span className="text-muted text-sm">Authenticating...</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 animate-in fade-in duration-300">
                {/* Points Display */}
                <div className="bg-card border border-border rounded-full px-4 py-1.5 flex items-center gap-2">
                  <Coins size={16} className="text-[#C7FF2C]" />
                  <span className="text-[#C7FF2C] font-bold text-sm">
                    {points.toLocaleString()}
                  </span>
                </div>

                {/* Streak Display with Check-in Button */}
                {!hasCheckedIn ? (
                  <Button
                    onClick={handleCheckIn}
                    disabled={dailyLoginMutation.isPending}
                    variant="ghost"
                    size="sm"
                  >
                    {dailyLoginMutation.isPending ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-sm font-bold">Checking in...</span>
                      </>
                    ) : (
                      <>
                        <Flame size={16} />
                        <span className="text-sm font-bold">Check-in</span>
                        <span className="text-sm font-bold">({streak})</span>
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="bg-card border border-border rounded-full px-4 py-1.5 flex items-center gap-2">
                    <Flame size={16} className="text-orange-500" />
                    <span className="text-orange-500 font-bold text-sm">{streak}</span>
                  </div>
                )}

                {/* Account Dropdown */}
                <div className="relative group">
                  <button className="bg-white/[0.05] hover:bg-white/[0.09] border border-border rounded-full pl-1 pr-4 py-1 flex items-center gap-2 transition-all">
                    <Avatar className="h-8 w-8 ring-2 ring-brand-mid/20">
                      <AvatarImage src={getAvatarUrl(address ?? undefined)} />
                      <AvatarFallback>
                        {displayAddress?.charAt(2).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium font-mono">{displayAddress}</span>
                  </button>

                  {/* Dropdown for Actions */}
                  <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform translate-y-2 group-hover:translate-y-0">
                    <div className="p-1">
                      <button
                        onClick={copyAddress}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted hover:text-white hover:bg-white/5 flex items-center gap-2"
                      >
                        <Copy size={14} /> Copy Address
                      </button>
                      <button
                        onClick={disconnect}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-danger hover:bg-danger/10 flex items-center gap-2"
                      >
                        <LogOut size={14} /> Disconnect
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-muted"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-20 left-0 w-full h-[calc(100vh-80px)] bg-background/95 backdrop-blur-xl border-t border-border z-40 flex flex-col animate-in slide-in-from-right-10 duration-200 overflow-y-auto">
          <div className="flex flex-col p-6 gap-6">
            <nav className="flex flex-col gap-4">
              <Link
                href="/"
                className="text-2xl font-bold py-2 border-b border-white/5"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Explore
              </Link>
              <Link
                href="/campaigns"
                className="text-2xl font-bold py-2 border-b border-white/5"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Campaigns
              </Link>
              <Link
                href="/leaderboard"
                className="text-2xl font-bold py-2 border-b border-white/5"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Leaderboard
              </Link>
              <Link
                href="/profile"
                className="text-2xl font-bold py-2 border-b border-white/5"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                My Quests
              </Link>
            </nav>

            <div className="mt-auto pt-6">
              {!isConnected ? (
                <Button
                  variant="gradient"
                  className="!rounded-full w-full"
                  onClick={() => {
                    connect();
                    setIsMobileMenuOpen(false);
                  }}
                  disabled={isAuthenticating}
                >
                  <Wallet className="mr-2" />{" "}
                  {isAuthenticating ? "Connecting..." : "Connect Wallet"}
                </Button>
              ) : isAuthenticating ? (
                <div className="flex items-center justify-center gap-3 py-8">
                  <Loader2 size={24} className="animate-spin text-brand-mid" />
                  <span className="text-muted">Authenticating...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Points */}
                  <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border">
                    <div className="flex items-center gap-2">
                      <Coins size={20} className="text-[#C7FF2C]" />
                      <span className="text-muted font-medium">Points</span>
                    </div>
                    <span className="text-[#C7FF2C] font-bold text-lg">
                      {points.toLocaleString()}
                    </span>
                  </div>

                  {/* Streak with Check-in Button */}
                  {!hasCheckedIn ? (
                    <Button
                      onClick={handleCheckIn}
                      disabled={dailyLoginMutation.isPending}
                      variant="ghost"
                      size="lg"
                      className="w-full"
                    >
                      {dailyLoginMutation.isPending ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          <span className="font-bold">Checking in...</span>
                        </>
                      ) : (
                        <>
                          <Flame size={20} />
                          <span className="font-bold">Check-in</span>
                          <span className="font-bold">({streak})</span>
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border">
                      <div className="flex items-center gap-2">
                        <Flame size={20} className="text-orange-500" />
                        <span className="text-muted font-medium">Streak</span>
                      </div>
                      <span className="text-orange-500 font-bold text-lg">{streak}</span>
                    </div>
                  )}

                  {/* Account */}
                  <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border">
                    <span className="text-muted font-medium">Account</span>
                    <span className="text-white font-mono">{displayAddress}</span>
                  </div>

                  <Button
                    variant="destructive"
                    size="lg"
                    onClick={() => {
                      disconnect();
                      setIsMobileMenuOpen(false);
                    }}
                    className="bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20 w-full"
                  >
                    Disconnect
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
