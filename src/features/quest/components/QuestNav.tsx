"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  usersControllerGetMeQueryKey,
  useUsersControllerDailyLogin,
  useUsersControllerGetCheckInStatus,
  useUsersControllerGetMe,
} from "@/gen-quest";
import { cn } from "@/lib/utils";
import { qAvatar } from "../lib/avatar";
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

export function QuestNav() {
  const path = usePathname() ?? "";
  const { data } = useUsersControllerGetMe($);
  const { user, isAuthenticated } = useQuestAuthStore();
  const queryClient = useQueryClient();

  // The /me payload is typed `any` by the generator; read the fields we need.
  const me = ((data as { data?: MeFields } | undefined)?.data ?? {}) as MeFields;
  const points = me.totalPoints ?? 0;
  const streak = me.loginStreak ?? 0;
  const address = me.walletAddress ?? user?.walletAddress ?? "";

  const { data: checkInData, refetch: refetchCheckIn } = useUsersControllerGetCheckInStatus({
    ...withAuth,
    query: {
      enabled: isAuthenticated,
      refetchOnWindowFocus: false,
      staleTime: 0,
      gcTime: 0,
    },
  });
  const hasCheckedIn =
    (checkInData as { data?: { hasCheckedIn?: boolean } } | undefined)?.data?.hasCheckedIn ?? false;

  const dailyLogin = useUsersControllerDailyLogin({
    ...withAuth,
    mutation: {
      onSuccess: async (result) => {
        await queryClient.invalidateQueries({ queryKey: usersControllerGetMeQueryKey() });
        await refetchCheckIn();
        const awarded = (result as { data?: { pointsAwarded?: number } } | undefined)?.data
          ?.pointsAwarded;
        toast.success(awarded ? `Check-in successful! +${awarded} points` : "Check-in successful!");
      },
      onError: (error: Error) => {
        toast.error(error.message || "Failed to check in. Please try again.");
      },
    },
  });

  const handleCheckIn = () => {
    if (dailyLogin.isPending || hasCheckedIn) return;
    dailyLogin.mutate(undefined);
  };

  const isActive = (href: string) => {
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
        "border-b border-[var(--quest-line)]",
      )}
    >
      {/* Brand — .brand + .mk + .brand-name */}
      <Link
        className={cn(
          "flex items-center gap-3",
          "font-bold text-[22px] tracking-[-0.03em]",
          "justify-self-start no-underline text-inherit",
          "max-[680px]:text-[15px] max-[680px]:gap-2",
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
            "bg-clip-text text-transparent",
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
                    "text-[var(--quest-text)]",
                    // .nav-item.active::after
                    "after:content-[''] after:absolute after:left-[15px] after:right-[15px]",
                    "after:bottom-[1px] after:h-0.5 after:rounded-[2px]",
                    "after:bg-[var(--quest-accent)]",
                    "after:shadow-[0_0_10px_var(--quest-accent-glow)]",
                  ].join(" ")
                : [
                    "text-[var(--quest-muted)]",
                    "hover:text-[var(--quest-text)] hover:bg-white/[0.05]",
                  ].join(" "),
            )}
            href={l.href}
          >
            {l.label}
          </Link>
        ))}
      </div>

      {/* Right side — .nav-right */}
      <div className="flex items-center gap-3 justify-self-end">
        {/* .stat-pill.pts */}
        <span
          className={cn(
            "inline-flex items-center gap-[7px] text-[13.5px] font-semibold",
            "px-[14px] py-[8px] rounded-quest-pill",
            "bg-[var(--quest-surface)] border border-[var(--quest-line-2)]",
            "text-quest-green [&_svg]:text-quest-green",
            "max-[680px]:hidden",
          )}
        >
          <PtsCoin style={{ width: 20, height: 20 }} />
          {fmt(points)}
        </span>

        {/* .stat-pill.streak */}
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-[7px] text-[13.5px] font-semibold",
            "px-[14px] py-[8px] rounded-quest-pill",
            "bg-[var(--quest-surface)] border border-[var(--quest-line-2)]",
            "text-quest-amber [&_svg]:text-quest-amber",
            "max-[680px]:hidden",
          )}
          onClick={handleCheckIn}
          disabled={!isAuthenticated || hasCheckedIn || dailyLogin.isPending}
          aria-label={hasCheckedIn ? "Checked in today" : "Daily check-in"}
        >
          <Flame style={{ width: 19, height: 19 }} />
          {fmt(streak)}
        </button>

        {/* .wallet-chip */}
        {address && (
          <span
            className={cn(
              "inline-flex items-center gap-[10px]",
              "py-[5px] pl-[6px] pr-[14px] rounded-quest-pill",
              "bg-[var(--quest-surface)] border border-[var(--quest-line-2)]",
            )}
          >
            {/* .av */}
            <span
              className="block w-[30px] h-[30px] rounded-full flex-none"
              style={{ background: qAvatar(address) }}
            />
            {/* .addr */}
            <span className="font-mono text-[13px] text-[var(--quest-text)] max-[680px]:hidden">
              {shorten(address)}
            </span>
          </span>
        )}
      </div>
    </nav>
  );
}
