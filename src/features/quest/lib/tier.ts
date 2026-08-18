// --- Quest rank (single source of truth) -------------------------------------
// Eight points-based ranks, low → high:
//   Unranked → Bronze → Silver → Gold → Platinum → Emerald → Diamond → Master
// Display rank is derived purely from `totalPoints`. The backend `UserTier`
// enum (5 cohorts) is intentionally NOT used for display - every quest surface
// derives its rank from THIS module so label and progress always agree.

export type QuestRank =
  | "Unranked"
  | "Bronze"
  | "Silver"
  | "Gold"
  | "Platinum"
  | "Emerald"
  | "Diamond"
  | "Master";

// [min inclusive, max exclusive | null].
const RANK_BANDS: { rank: QuestRank; min: number; max: number | null }[] = [
  { rank: "Unranked", min: 0, max: 500 },
  { rank: "Bronze", min: 500, max: 1500 },
  { rank: "Silver", min: 1500, max: 3500 },
  { rank: "Gold", min: 3500, max: 7500 },
  { rank: "Platinum", min: 7500, max: 15000 },
  { rank: "Emerald", min: 15000, max: 30000 },
  { rank: "Diamond", min: 30000, max: 50000 },
  { rank: "Master", min: 50000, max: null },
];

/** Ordered low → high. */
export const RANK_ORDER: QuestRank[] = RANK_BANDS.map((b) => b.rank);

export interface RankDisplay {
  rank: QuestRank;
  /** Next rank up, or null at the top (Master). */
  nextRank: QuestRank | null;
  /** Progress through the current band, 0..1 (1 at the top band). */
  progress: number;
  /** Points remaining until the next rank (0 at the top band). */
  toNext: number;
  /** Band lower bound (inclusive). */
  min: number;
  /** Band upper bound (exclusive), or null at the top band. */
  max: number | null;
}

/** Derive rank + progress metadata from a raw point total. */
export function rankFromPoints(points: number): RankDisplay {
  const p = Number.isFinite(points) ? Math.max(0, points) : 0;
  const idx = RANK_BANDS.findIndex((b) => p >= b.min && (b.max === null || p < b.max));
  const safeIdx = idx === -1 ? RANK_BANDS.length - 1 : idx;
  const band = RANK_BANDS[safeIdx]!;
  if (band.max === null) {
    return { rank: band.rank, nextRank: null, progress: 1, toNext: 0, min: band.min, max: null };
  }
  const next = RANK_BANDS[safeIdx + 1]!;
  const span = band.max - band.min;
  return {
    rank: band.rank,
    nextRank: next.rank,
    progress: span > 0 ? (p - band.min) / span : 1,
    toNext: band.max - p,
    min: band.min,
    max: band.max,
  };
}

/**
 * Per-rank visuals. `cssKey` selects the colour family used by consumers;
 * `asset` is the badge image under /public/ranks for each rank.
 */
export const RANK_STYLES: Record<QuestRank, { label: string; cssKey: string; asset: string }> = {
  Unranked: { label: "Unranked", cssKey: "muted", asset: "/ranks/unrank.png" },
  Bronze: { label: "Bronze", cssKey: "bronze", asset: "/ranks/bronze.png" },
  Silver: { label: "Silver", cssKey: "silver", asset: "/ranks/silver.png" },
  Gold: { label: "Gold", cssKey: "gold", asset: "/ranks/golden.png" },
  Platinum: { label: "Platinum", cssKey: "platinum", asset: "/ranks/platinum.png" },
  Emerald: { label: "Emerald", cssKey: "emerald", asset: "/ranks/emerald.png" },
  Diamond: { label: "Diamond", cssKey: "diamond", asset: "/ranks/diamond.png" },
  Master: { label: "Master", cssKey: "master", asset: "/ranks/master.png" },
};
