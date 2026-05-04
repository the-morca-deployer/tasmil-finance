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
