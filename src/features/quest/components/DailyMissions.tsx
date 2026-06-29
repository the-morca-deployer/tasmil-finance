"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useDailyMissionsControllerList,
  useDailyMissionsControllerComplete,
  dailyMissionsControllerListQueryKey,
  usersControllerGetMeQueryKey,
} from "@/gen-quest";
import { $, withAuth } from "@/features/quest/lib/kubb-config";
import { unwrapEnvelope } from "@/features/quest/lib/season-types";
import type { DailyMission } from "@/features/quest/lib/fomo-types";

const SKEL_LINE = "h-[14px] rounded-md bg-white/5";

export default function DailyMissions() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useDailyMissionsControllerList($);
  const missions = unwrapEnvelope<DailyMission[]>(data) ?? [];

  const complete = useDailyMissionsControllerComplete({
    ...withAuth,
    mutation: {
      onSuccess: async (res) => {
        await queryClient.invalidateQueries({ queryKey: dailyMissionsControllerListQueryKey() });
        await queryClient.invalidateQueries({ queryKey: usersControllerGetMeQueryKey() });
        const awarded = (res as { data?: { pointsAwarded?: number } } | undefined)?.data
          ?.pointsAwarded;
        toast.success(awarded ? `Mission complete! +${awarded} points` : "Mission complete!");
      },
      onError: (error: Error) => {
        toast.error(error.message || "Could not complete mission");
      },
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse overflow-hidden rounded-quest-card border border-[var(--line-2)] bg-[var(--surface)] px-4 py-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-2" style={{ flex: 1 }}>
                <div className={SKEL_LINE} style={{ width: "55%" }} />
                <div className={SKEL_LINE} style={{ width: "80%" }} />
              </div>
              <div className="ml-4 h-9 w-20 rounded-quest-pill bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (missions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-[14px] px-5 py-20 text-center">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-14 w-14 text-quest-faint"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </svg>
        <div className="text-[18px] font-bold tracking-[-0.02em] text-quest-text">
          No missions today
        </div>
        <div className="text-[14px] text-quest-muted">Check back tomorrow for new daily missions.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {missions.map((m) => (
        <div
          key={m.id}
          className="flex items-center justify-between rounded-quest-card border border-[var(--line-2)] bg-[var(--surface)] px-4 py-3"
        >
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-quest-text">{m.title}</div>
            {m.description ? (
              <div className="mt-0.5 text-sm text-quest-muted">{m.description}</div>
            ) : null}
          </div>
          <button
            type="button"
            className="ml-4 shrink-0 rounded-quest-pill border border-[var(--line-2)] bg-transparent px-4 py-2 text-sm font-semibold text-quest-amber transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            disabled={m.completedToday || complete.isPending}
            onClick={() => complete.mutate({ code: m.code })}
          >
            {m.completedToday ? "Done" : `+${m.pointReward}`}
          </button>
        </div>
      ))}
    </div>
  );
}
