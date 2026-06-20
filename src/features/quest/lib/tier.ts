export type Tier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export function tierFromVolume(usd: number): Tier {
  if (usd >= 10_000) return "diamond";
  if (usd >= 2_000) return "platinum";
  if (usd >= 500) return "gold";
  if (usd >= 100) return "silver";
  return "bronze";
}

export const TIER_STYLES: Record<Tier, { label: string; bg: string; text: string }> = {
  bronze: { label: "Bronze", bg: "bg-amber-700/20", text: "text-amber-300" },
  silver: { label: "Silver", bg: "bg-slate-300/20", text: "text-slate-200" },
  gold: { label: "Gold", bg: "bg-yellow-400/20", text: "text-yellow-300" },
  platinum: { label: "Platinum", bg: "bg-cyan-300/20", text: "text-cyan-200" },
  diamond: { label: "Diamond", bg: "bg-blue-400/20", text: "text-blue-200" },
};

// ─── Quest tier display (points-based, Phase 2) ──────────────────────────────
// Separate concern from `tierFromVolume` above: maps quest POINTS to a display
// tier plus progress metadata for the Profile level bar.
export type QuestTier = "Bronze" | "Silver" | "Gold" | "Diamond";

export interface TierDisplay {
  tier: QuestTier;
  nextTier: QuestTier | null;
  progress: number;
  toNext: number;
}

const TIER_BANDS: { tier: QuestTier; min: number; max: number | null }[] = [
  { tier: "Bronze", min: 0, max: 500 },
  { tier: "Silver", min: 500, max: 2500 },
  { tier: "Gold", min: 2500, max: 5000 },
  { tier: "Diamond", min: 5000, max: null },
];

export function tierDisplay(points: number): TierDisplay {
  const p = Number.isFinite(points) ? Math.max(0, points) : 0;
  const idx = TIER_BANDS.findIndex((b) => p >= b.min && (b.max === null || p < b.max));
  const band = TIER_BANDS[idx];
  if (band.max === null) {
    return { tier: band.tier, nextTier: null, progress: 1, toNext: 0 };
  }
  const next = TIER_BANDS[idx + 1];
  const span = band.max - band.min;
  return {
    tier: band.tier,
    nextTier: next.tier,
    progress: (p - band.min) / span,
    toNext: band.max - p,
  };
}
