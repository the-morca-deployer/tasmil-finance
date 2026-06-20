"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  useUsersControllerDailyLogin,
  useUsersControllerGetCheckInStatus,
  useUsersControllerGetMe,
  usersControllerGetMeQueryKey,
} from "@/gen-quest";
import { $, withAuth } from "../lib/kubb-config";
import { qAvatar } from "../lib/avatar";
import { useQuestAuthStore } from "../store/use-quest-auth";
import { Flame, PtsCoin } from "./icons";

const LINKS = [
  { href: "/quest/quest", label: "Explore" },
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
        toast.success(
          awarded ? `Check-in successful! +${awarded} points` : "Check-in successful!"
        );
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
    <nav className="nav">
      <Link className="nav-brand" href="/quest/quest">
        <span>
          Tasmil <span className="fin">Quest</span>
        </span>
      </Link>
      <div className="nav-links">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            className={`nav-item${isActive(l.href) ? " active" : ""}`}
            href={l.href}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <div className="nav-right">
        <span className="stat-pill pts">
          <PtsCoin style={{ width: 20, height: 20 }} />
          {fmt(points)}
        </span>
        <button
          type="button"
          className={`stat-pill streak${hasCheckedIn ? " checked-in" : ""}`}
          onClick={handleCheckIn}
          disabled={!isAuthenticated || hasCheckedIn || dailyLogin.isPending}
          aria-label={hasCheckedIn ? "Checked in today" : "Daily check-in"}
        >
          <Flame style={{ width: 19, height: 19 }} />
          {fmt(streak)}
        </button>
        {address && (
          <span className="wallet-chip">
            <span className="av" style={{ background: qAvatar(address) }} />
            <span className="addr">{shorten(address)}</span>
          </span>
        )}
      </div>
    </nav>
  );
}
