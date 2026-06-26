import { qAvatar } from "../lib/avatar";

function fmtCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

interface AvatarStackProps {
  /** Stable seed for deterministic fallback gradients (e.g. campaign id). */
  seed: string;
  /** Real avatar image URLs; falls back to gradient circles when empty. */
  avatars?: string[];
  /** Total participant count (drives fallback count + optional label). */
  total: number;
  /** Max circles to render. */
  max?: number;
  /** Show the trailing count label after the circles. */
  showCount?: boolean;
}

/**
 * Overlapping participant avatar stack shared by the explore card and the
 * campaign detail page so they render identically.
 */
export function AvatarStack({
  seed,
  avatars,
  total,
  max = 4,
  showCount = true,
}: AvatarStackProps) {
  const urls = (avatars ?? []).filter(Boolean).slice(0, max);
  const fallbackCount = urls.length === 0 ? Math.min(total, max) : 0;

  return (
    <div className="flex items-center">
      {urls.map((url, i) => (
        <span
          key={`img-${i}`}
          className="h-7 w-7 rounded-full border-2 border-[#0c0c0e] -ml-[9px] first:ml-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${url})` }}
        />
      ))}
      {Array.from({ length: fallbackCount }).map((_, i) => (
        <span
          key={`fb-${i}`}
          className="h-7 w-7 rounded-full border-2 border-[#0c0c0e] -ml-[9px] first:ml-0"
          style={{ background: qAvatar(seed + i) }}
        />
      ))}
      {showCount && (
        <span className="ml-2 font-mono text-[12px] text-quest-muted">{fmtCount(total)}</span>
      )}
    </div>
  );
}
