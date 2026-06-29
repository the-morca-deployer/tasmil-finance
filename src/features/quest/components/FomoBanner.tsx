"use client";

import { useCountdown } from "@/features/quest/hooks/use-countdown";
import type { FomoActive } from "@/features/quest/lib/fomo-types";
import { $ } from "@/features/quest/lib/kubb-config";
import { unwrapEnvelope } from "@/features/quest/lib/season-types";
import { useFomoControllerGetActive } from "@/gen-quest";

export default function FomoBanner() {
  const { data } = useFomoControllerGetActive($);
  const active = unwrapEnvelope<FomoActive>(data);
  const cd = useCountdown(active?.endAt);
  if (!active || cd.ended) return null;

  return (
    <div
      className={`flex items-center justify-between rounded-quest-card px-4 py-3 mb-4 ${
        active.isInCountdown
          ? "bg-quest-amber/15 border border-quest-amber"
          : "bg-[var(--surface)] border border-[var(--line-2)]"
      }`}
    >
      <div className="flex items-center gap-2 font-semibold text-[14px]">
        <span className={active.isInCountdown ? "text-quest-amber" : "text-quest-text"}>
          {active.title}
        </span>
        <span className="rounded-quest-pill bg-quest-amber px-2 py-0.5 text-[12px] font-bold text-black">
          ×{active.multiplier}
        </span>
      </div>
      <div
        className={`tabular-nums text-[13px] font-mono font-semibold ${
          active.isInCountdown ? "text-quest-amber" : "text-quest-muted"
        }`}
      >
        {cd.d}d {cd.h}:{cd.m}:{cd.s}
      </div>
    </div>
  );
}
