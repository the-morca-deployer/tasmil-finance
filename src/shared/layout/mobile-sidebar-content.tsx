"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Check, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { Flame, PtsCoin } from "@/features/quest/components/icons";
import { $, withAuth } from "@/features/quest/lib/kubb-config";
import { RANK_STYLES, rankFromPoints } from "@/features/quest/lib/tier";
import {
  usersControllerGetMeQueryKey,
  useUsersControllerDailyLogin,
  useUsersControllerGetCheckInStatus,
  useUsersControllerGetMe,
} from "@/gen-quest/hooks";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/shared/components/brand-logo";
import { ConnectWalletButton } from "@/shared/components/connect-wallet-button";
import { TasmilAvatar } from "@/shared/components/tasmil-avatar";
import { useWallet } from "@/shared/context/wallet-context";
import { sidebarData } from "@/shared/layout/sidebar-data";
import { Badge } from "@/shared/ui/badge";

type QuestProfile = {
  totalPoints?: number;
  loginStreak?: number;
};

export function MobileSidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { isConnected, address, displayAddress, disconnect } = useWallet();
  const queryClient = useQueryClient();

  // `$` routes through questApiClient, whose interceptor already unwraps the
  // `{ success, data }` envelope — so `me.data` IS the profile (no extra `.data`).
  const me = useUsersControllerGetMe($);
  const profile = (me.data as QuestProfile | undefined) ?? null;
  const points = profile?.totalPoints ?? 0;
  const streak = profile?.loginStreak ?? 0;
  const rankStyle = RANK_STYLES[rankFromPoints(points).rank];

  const checkIn = useUsersControllerGetCheckInStatus($);
  const hasCheckedIn =
    (checkIn.data as { hasCheckedIn?: boolean } | undefined)?.hasCheckedIn ?? false;

  const dailyLogin = useUsersControllerDailyLogin({
    ...withAuth,
    mutation: {
      onSuccess: (result) => {
        void queryClient.invalidateQueries({ queryKey: usersControllerGetMeQueryKey() });
        const awarded = (result as { pointsAwarded?: number } | undefined)?.pointsAwarded;
        toast.success(awarded ? `Check-in successful! +${awarded} points` : "Check-in successful!");
      },
      onError: (error: unknown) => {
        const envelope = error as { response?: { status?: number } };
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
    dailyLogin.mutate();
  };

  const items = sidebarData.navGroups.flatMap((g) => g.items);

  return (
    <div className="flex h-full w-full flex-col bg-sidebar">
      {/* Header — brand + network badge (the parent renders the X close button) */}
      <div className="flex-shrink-0 border-border border-b p-4">
        <BrandLogo
          href="/chat/new"
          logoSrc={sidebarData.header.logo_url}
          text={sidebarData.header.brand_name}
          alt={sidebarData.header.brand_name}
          size="sm"
          onClick={onClose}
          trailing={
            <Badge
              className="h-4 rounded-full border-0 bg-[image:var(--brand-grad)] px-1.5 py-0 font-bold text-[8px] text-black"
              variant="outline"
            >
              {process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet" ? "MAINNET" : "TESTNET"}
            </Badge>
          }
        />
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-4">
        {/* Profile — flat (only the stat tiles are bordered) */}
        {isConnected && address && (
          <div className="flex flex-col gap-3 border-border border-b pb-4">
            <div className="flex items-center gap-2.5">
              <TasmilAvatar seed={address} size={36} className="flex-none" />
              <div className="flex min-w-0 flex-col">
                <span className="font-mono text-quest-text text-sm">{displayAddress}</span>
                <span className="mt-0.5 flex items-center gap-1.5">
                  <img
                    src={rankStyle.asset}
                    alt={rankStyle.label}
                    width={16}
                    height={16}
                    className="flex-none object-contain [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.4))]"
                  />
                  <span className="text-quest-muted text-xs">{rankStyle.label}</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-[12px] border border-quest-line-2 bg-quest-surface px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <PtsCoin style={{ width: 18, height: 18 }} />
                  <span className="font-semibold text-[16px] text-quest-accent">
                    {points.toLocaleString()}
                  </span>
                </div>
                <span className="mt-0.5 block text-[10px] text-quest-muted uppercase tracking-[0.12em]">
                  Points
                </span>
              </div>
              <div className="rounded-[12px] border border-quest-line-2 bg-quest-surface px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <Flame style={{ width: 18, height: 18 }} />
                  <span className="font-semibold text-[16px] text-quest-amber">{streak}d</span>
                </div>
                <span className="mt-0.5 block text-[10px] text-quest-muted uppercase tracking-[0.12em]">
                  Streak
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckIn}
              disabled={hasCheckedIn || dailyLogin.isPending}
              className={cn(
                "inline-flex w-full items-center justify-center gap-2 rounded-[10px] border py-2 font-semibold text-[13px] transition-opacity",
                hasCheckedIn
                  ? "border-quest-line-2 bg-quest-surface text-quest-muted disabled:cursor-default"
                  : "border-quest-accent-line bg-quest-accent-soft text-quest-accent hover:opacity-90 disabled:opacity-60"
              )}
            >
              {hasCheckedIn ? (
                <>
                  <Check className="h-4 w-4" />
                  Checked in today
                </>
              ) : (
                "Daily check-in"
              )}
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex flex-col gap-1">
          <span className="px-1 pb-1 text-[11px] text-quest-muted uppercase tracking-[0.14em]">
            Navigate
          </span>
          {items.map((item) => {
            const isExternal = item.url.startsWith("http");
            const isActive =
              !isExternal &&
              (pathname === item.url ||
                pathname.startsWith(`${item.url}/`) ||
                (item.url === "/chat/new" && pathname.startsWith("/chat/")));
            return (
              <Link
                key={item.url}
                href={item.url}
                {...(onClose && { onClick: onClose })}
                {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className={cn(
                  "relative flex items-center gap-3 rounded-[10px] px-3 py-3 font-medium text-sm transition-colors",
                  isActive
                    ? "bg-quest-accent-soft font-semibold text-quest-accent"
                    : "text-sidebar-foreground hover:bg-white/[0.05] hover:text-foreground"
                )}
              >
                {isActive && (
                  <span className="absolute top-2 bottom-2 left-0 w-[3px] rounded-full bg-quest-accent shadow-[0_0_8px_var(--color-quest-accent-glow)]" />
                )}
                {item.icon && (
                  <item.icon
                    className={cn(
                      "h-5 w-5",
                      isActive ? "text-quest-accent" : "text-sidebar-foreground"
                    )}
                  />
                )}
                {item.title}
              </Link>
            );
          })}
        </nav>

        {/* Disconnected — show only the connect CTA below the nav links */}
        {!isConnected && (
          <div className="mt-1">
            <ConnectWalletButton />
          </div>
        )}
      </div>

      {/* Disconnect footer — pinned bottom, only when connected */}
      {isConnected && (
        <div className="flex-shrink-0 border-border border-t p-3">
          <button
            type="button"
            onClick={() => {
              void disconnect();
              onClose?.();
            }}
            className="inline-flex w-full items-center gap-2 rounded-[10px] px-3 py-3 text-red-400 text-sm transition-colors hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
