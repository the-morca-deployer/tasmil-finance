"use client";

import { useState } from "react";
import { useSeasonsControllerMyResult, useSeasonsControllerRevealAck } from "@/gen-quest";
import { useQuestAuthStore } from "../store/use-quest-auth";
import { type SeasonMeResult, unwrapEnvelope } from "../lib/season-types";
import { RankReveal } from "./RankReveal";

/**
 * Shows the {@link RankReveal} overlay exactly once per ENDED season — when the
 * current user's season result has `revealed === false`. On claim it fires the
 * idempotent reveal-ack mutation and hides the overlay for the rest of the session.
 */
export function RankRevealGate() {
  const isAuthenticated = useQuestAuthStore((s) => s.isAuthenticated);
  const { data: raw } = useSeasonsControllerMyResult({
    query: { enabled: isAuthenticated },
  });
  const ack = useSeasonsControllerRevealAck();
  const [dismissed, setDismissed] = useState(false);

  const result = unwrapEnvelope<SeasonMeResult>(raw);

  if (!isAuthenticated || !result || result.revealed || dismissed) {
    return null;
  }

  return (
    <RankReveal
      rank={result.finalRank}
      usdcReward={result.usdcReward}
      pointsReward={result.pointsReward}
      badge={result.badge}
      seasonName={result.season.name}
      onClaim={() => {
        ack.mutate();
        setDismissed(true);
      }}
      onClose={() => setDismissed(true)}
    />
  );
}
