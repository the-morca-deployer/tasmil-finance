"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Coins, Flame } from "lucide-react";
import { $, withAuth } from "@/features/quest/lib/kubb-config";
import {
  usersControllerGetMeQueryKey,
  useUsersControllerDailyLogin,
  useUsersControllerGetCheckInStatus,
  useUsersControllerGetMe,
} from "@/gen-quest/hooks";

type QuestProfile = {
  totalPoints?: number;
  loginStreak?: number;
};

export function QuestHeaderBadges() {
  const queryClient = useQueryClient();
  // `$` routes through questApiClient, whose interceptor already unwraps the
  // `{ success, data }` envelope — so `me.data` IS the profile (no extra `.data`).
  const me = useUsersControllerGetMe($);
  const profile = (me.data as QuestProfile | undefined) ?? null;

  // Backend `GET /quest/users/me/check-in-status` returns `{ hasCheckedIn }`
  // (there is no `canCheckIn`); you can check in only when you haven't yet.
  const checkIn = useUsersControllerGetCheckInStatus($);
  const hasCheckedIn =
    (checkIn.data as { hasCheckedIn?: boolean } | undefined)?.hasCheckedIn ?? false;
  const canCheckIn = !hasCheckedIn;

  const dailyLogin = useUsersControllerDailyLogin({
    ...withAuth,
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: usersControllerGetMeQueryKey() }),
    },
  });

  if (!profile) return null;

  return (
    <div className="flex items-center gap-2">
      <span
        data-testid="quest-points-badge"
        className="flex h-9 items-center gap-1.5 rounded-full border border-border px-3 font-bold text-sm"
      >
        <Coins className="h-4 w-4 text-[#67e8f9]" />
        {(profile.totalPoints ?? 0).toLocaleString()}
      </span>
      <button
        type="button"
        data-testid="quest-streak-badge"
        disabled={!canCheckIn || dailyLogin.isPending}
        onClick={() => dailyLogin.mutate()}
        className="flex h-9 items-center gap-1.5 rounded-full border border-border px-3 font-bold text-sm text-orange-400 disabled:opacity-60"
      >
        <Flame className="h-4 w-4" />
        {profile.loginStreak ?? 0}
      </button>
    </div>
  );
}
