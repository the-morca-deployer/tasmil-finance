"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Copy, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useWallet } from "@/features/quest/context/wallet-context";
import {
  usersControllerGetMeQueryKey,
  useUsersControllerDailyLogin,
  useUsersControllerGetCheckInStatus,
  useUsersControllerGetMe,
} from "@/gen-quest";
import { cn } from "@/lib/utils";
import { AddressAvatar } from "@/shared/components/connect-wallet-button";
import { Button } from "@/shared/ui/button";
import { $, withAuth } from "../lib/kubb-config";
import { useQuestAuthStore } from "../store/use-quest-auth";
import { Flame, PtsCoin } from "./icons";

const LINKS = [
  { href: "/quest", label: "Explore" },
  { href: "/quest/campaigns", label: "Campaigns" },
  { href: "/quest/leaderboard", label: "Leaderboard" },
  { href: "/quest/profile", label: "My Quests" },
];

interface MeFields {
  totalPoints?: number;
  loginStreak?: number;
  walletAddress?: string;
}

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);

const shorten = (addr: string) =>
  addr.length > 12 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;

// Shared base so the PTS, check-in and wallet chips render identically
// (same height, radius, border, surface and text size). Each chip layers
// its own accent color on top.
const CHIP_BASE = cn(
  "inline-flex h-10 items-center gap-[7px]",
  "px-[14px] text-[13.5px] font-semibold",
  "rounded-quest-pill bg-[var(--surface)] border border-[var(--line-2)]",
  "transition-colors"
);

export function QuestNav() {
  const path = usePathname() ?? "";
  const { user, isAuthenticated } = useQuestAuthStore();
  const { data } = useUsersControllerGetMe({
    ...$,
    query: { ...$.query, enabled: isAuthenticated },
  });
  const queryClient = useQueryClient();

  const { connect, disconnect, isAuthenticating } = useWallet();
  // `$` routes through questApiClient, whose interceptor already unwraps the
  // `{ success, data }` envelope — so `data` IS the profile (no extra `.data`).
  const me = ((data as MeFields | undefined) ?? {}) as MeFields;
  const points = me.totalPoints ?? 0;
  const streak = me.loginStreak ?? 0;
  const address = me.walletAddress ?? user?.walletAddress ?? "";

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    toast.success("Address copied");
  };

  // Check-in status from the simple endpoint
  const { data: checkInStatusData, refetch: refetchCheckInStatus } =
    useUsersControllerGetCheckInStatus({
      ...$,
      query: { ...$.query, enabled: isAuthenticated, staleTime: 0, gcTime: 0 },
    });
  const hasCheckedIn =
    (checkInStatusData as { hasCheckedIn?: boolean } | undefined)?.hasCheckedIn ?? false;

  // Daily login mutation
  const dailyLogin = useUsersControllerDailyLogin({
    ...withAuth,
    mutation: {
      onSuccess: async (result) => {
        await queryClient.invalidateQueries({ queryKey: usersControllerGetMeQueryKey() });
        await refetchCheckInStatus();
        const awarded = (result as { pointsAwarded?: number } | undefined)?.pointsAwarded;
        toast.success(awarded ? `Check-in successful! +${awarded} points` : "Check-in successful!");
      },
      onError: (error: unknown) => {
        const envelope = error as { response?: { status?: number; data?: { message?: string } } };
        if (envelope.response?.status === 409) {
          toast.info("Already checked in today");
        } else {
          toast.error("Failed to check in. Please try again.");
        }
      },
    },
  });

  const handleCheckIn = () => {
    if (dailyLogin.isPending || hasCheckedIn) return;
    dailyLogin.mutate(undefined);
  };

  const isActive = (href: string) => {
    if (href === "/quest") {
      return path === "/quest" || path.startsWith("/quest/explore");
    }
    if (href === "/quest/campaigns") {
      return path.startsWith("/quest/campaigns") || path.startsWith("/quest/campaign");
    }
    return path === href || path.startsWith(`${href}/`);
  };

  return (
    <nav
      className={cn(
        "sticky top-0 z-50",
        "grid grid-cols-[1fr_auto_1fr] items-center",
        "px-[clamp(20px,5vw,56px)] py-4",
        "bg-[rgba(20,20,25,0.72)] backdrop-blur-[18px]",
        "border-b border-[var(--line)]"
      )}
    >
      {/* Brand — .brand + .mk + .brand-name */}
      <Link
        className={cn(
          "flex items-center gap-3",
          "font-bold text-[22px] tracking-[-0.03em]",
          "justify-self-start no-underline text-inherit",
          "max-[680px]:text-[15px] max-[680px]:gap-2"
        )}
        href="/quest"
      >
        <img
          className="w-[34px] h-[34px] flex-none block"
          src="/tasmil-tf-logo.png"
          alt="Tasmil"
          width="34"
          height="34"
        />
        <span
          className={cn(
            "bg-[linear-gradient(100deg,#fff_0%,#67e8f9_100%)]",
            "bg-clip-text text-transparent"
          )}
        >
          Tasmil Quest
        </span>
      </Link>

      {/* Nav links — .nav-links + .nav-item + .nav-item.active */}
      <div className="flex gap-0.5 justify-self-center max-[680px]:hidden">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            className={cn(
              "relative text-[16px] font-semibold px-4 py-[9px] rounded-quest-pill",
              "transition-[color,background] duration-[250ms] cursor-pointer",
              isActive(l.href)
                ? [
                    "text-[var(--text)]",
                    "after:content-[''] after:absolute after:left-[15px] after:right-[15px]",
                    "after:bottom-[1px] after:h-0.5 after:rounded-[2px]",
                    "after:bg-[var(--accent)]",
                    "after:shadow-[0_0_10px_var(--accent-glow)]",
                  ].join(" ")
                : ["text-[var(--muted)]", "hover:text-[var(--text)] hover:bg-white/[0.05]"].join(
                    " "
                  )
            )}
            href={l.href}
          >
            {l.label}
          </Link>
        ))}
      </div>

      {/* Right side — .nav-right */}
      <div className="flex items-center gap-3 justify-self-end">
        {/* PTS + streak chips only make sense once the wallet is connected/authenticated */}
        {isAuthenticated && (
          <>
            {/* .stat-pill.pts */}
            <span
              className={cn(
                CHIP_BASE,
                "text-quest-accent [&_svg]:text-quest-accent",
                "max-[680px]:hidden"
              )}
            >
              <PtsCoin style={{ width: 20, height: 20 }} />
              {fmt(points)}
            </span>

            {/* .stat-pill.streak — same color; text shows whether check-in is due */}
            <button
              type="button"
              className={cn(
                CHIP_BASE,
                "text-quest-amber [&_svg]:text-quest-amber",
                "hover:bg-white/[0.05] disabled:cursor-default disabled:hover:bg-[var(--surface)]",
                "max-[680px]:hidden"
              )}
              onClick={handleCheckIn}
              disabled={hasCheckedIn || dailyLogin.isPending}
              aria-label={hasCheckedIn ? "Checked in today" : "Daily check-in"}
              title={hasCheckedIn ? "Checked in today" : "Click to check in (+points)"}
            >
              <Flame style={{ width: 19, height: 19 }} />
              {dailyLogin.isPending ? "…" : hasCheckedIn ? `${fmt(streak)}` : "Check in"}
            </button>
          </>
        )}

        {/* Wallet chip — matches main /chat navbar (TopbarWallet) */}
        {address && (
          <div className="group relative">
            <button
              type="button"
              data-testid="wallet-connected"
              className={cn(CHIP_BASE, "text-[var(--text)] hover:bg-white/[0.05]")}
            >
              <AddressAvatar address={address} size="size-5" iconSize="size-3" />
              <span className="max-[680px]:hidden">{shorten(address)}</span>
              <ChevronDown className="h-4 w-4 opacity-60" />
            </button>

            {/* Hover dropdown (Copy Address / Disconnect) */}
            <div className="invisible absolute right-0 top-full z-50 mt-2 w-48 translate-y-2 rounded-xl border border-border bg-popover opacity-0 shadow-lg transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              <div className="p-1">
                <button
                  type="button"
                  onClick={copyAddress}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-muted-foreground text-sm hover:bg-accent hover:text-foreground"
                >
                  <Copy size={14} /> Copy Address
                </button>
                <button
                  type="button"
                  onClick={() => disconnect()}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-red-400 text-sm hover:bg-red-500/10"
                >
                  <LogOut size={14} /> Disconnect
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Connect Wallet — matches main navbar gradient button */}
        {!address && (
          <Button
            size="sm"
            variant="gradient"
            onClick={() => connect()}
            disabled={isAuthenticating}
            data-testid="connect-wallet"
            className="h-9 rounded-full px-4 font-bold text-sm"
          >
            {isAuthenticating ? "Connecting..." : "Connect Wallet"}
          </Button>
        )}
      </div>
    </nav>
  );
}
