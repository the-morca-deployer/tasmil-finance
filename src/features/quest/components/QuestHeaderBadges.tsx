"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { $, withAuth } from "@/features/quest/lib/kubb-config";
import {
  usersControllerGetMeQueryKey,
  useUsersControllerDailyLogin,
  useUsersControllerGetCheckInStatus,
  useUsersControllerGetMe,
} from "@/gen-quest/hooks";
import { cn } from "@/lib/utils";
import { Flame, PtsCoin } from "./icons";

type QuestProfile = {
  totalPoints?: number;
  loginStreak?: number;
};

// Shared chip base — mirrors QuestNav so the PTS, streak and wallet chips in the
// main-app top bar render identically (same height, radius, border, surface).
const CHIP_BASE = cn(
  "inline-flex h-10 items-center gap-[7px]",
  "px-[14px] text-[13.5px] font-semibold",
  "rounded-quest-pill bg-quest-surface border border-quest-line-2",
  "transition-colors"
);

// Hover card — same visual language as the gas-sponsor indicator tooltip
// (dark surface, glow ring, uppercase eyebrow, fade + slide on reveal).
function HoverCard({
  show,
  accent,
  eyebrow,
  meta,
  title,
  body,
}: {
  show: boolean;
  accent: string;
  eyebrow: string;
  meta?: string;
  title: string;
  body: string;
}) {
  return (
    <span
      style={{
        position: "absolute",
        top: "calc(100% + 10px)",
        right: 0,
        zIndex: 50,
        width: 240,
        padding: "12px 14px",
        borderRadius: 12,
        background: "rgba(15,17,21,0.96)",
        border: "1px solid rgba(255,255,255,0.14)",
        boxShadow: "0 14px 32px -10px #000, 0 0 24px -10px rgba(103,232,249,0.4)",
        opacity: show ? 1 : 0,
        pointerEvents: show ? "auto" : "none",
        transform: show ? "translateY(0)" : "translateY(-4px)",
        transition: "opacity .18s ease, transform .18s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: accent,
          }}
        >
          {eyebrow}
        </span>
        {meta ? (
          <span
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 11,
              color: "rgba(244,247,251,0.58)",
            }}
          >
            {meta}
          </span>
        ) : null}
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: "#F4F7FB", marginBottom: 2 }}>
        {title}
      </div>
      <div style={{ fontSize: 12.5, color: "rgba(244,247,251,0.58)", lineHeight: 1.4 }}>{body}</div>
    </span>
  );
}

export function QuestHeaderBadges() {
  const queryClient = useQueryClient();
  const [ptsHover, setPtsHover] = useState(false);
  const [streakHover, setStreakHover] = useState(false);
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

  const points = profile.totalPoints ?? 0;
  const streak = profile.loginStreak ?? 0;

  return (
    <div className="flex items-center gap-3">
      <span
        className="relative"
        onMouseEnter={() => setPtsHover(true)}
        onMouseLeave={() => setPtsHover(false)}
      >
        <span
          data-testid="quest-points-badge"
          className={cn(CHIP_BASE, "text-quest-accent [&_svg]:text-quest-accent")}
        >
          <PtsCoin style={{ width: 20, height: 20 }} />
          {points.toLocaleString()}
        </span>
        <HoverCard
          show={ptsHover}
          accent="#67E8F9"
          eyebrow="Quest Points"
          title={`${points.toLocaleString()} PTS`}
          body="Earned from quests, campaigns and daily check-ins. Spend them on rewards."
        />
      </span>

      <span
        className="relative"
        onMouseEnter={() => setStreakHover(true)}
        onMouseLeave={() => setStreakHover(false)}
      >
        <button
          type="button"
          data-testid="quest-streak-badge"
          disabled={!canCheckIn || dailyLogin.isPending}
          onClick={() => dailyLogin.mutate()}
          className={cn(
            CHIP_BASE,
            "text-quest-amber [&_svg]:text-quest-amber",
            "hover:bg-white/[0.05] disabled:cursor-default disabled:hover:bg-quest-surface"
          )}
        >
          <Flame style={{ width: 19, height: 19 }} />
          {streak}
        </button>
        <HoverCard
          show={streakHover}
          accent="#FBBF24"
          eyebrow="Daily Streak"
          meta={`${streak}d`}
          title={hasCheckedIn ? "Checked in today" : "Check-in available"}
          body={
            hasCheckedIn
              ? "Come back tomorrow to keep your streak alive."
              : "Click the flame to check in and earn bonus points."
          }
        />
      </span>
    </div>
  );
}
