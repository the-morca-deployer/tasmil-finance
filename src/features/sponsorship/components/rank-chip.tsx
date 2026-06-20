import type { SVGProps } from "react";

export function RankChip({
  rank,
  cohortSize,
}: {
  rank: number;
  cohortSize: number;
}) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-2 font-mono text-[13px] font-semibold tracking-wide bg-sponsor-accent-soft border border-sponsor-accent-line text-sponsor-accent"
      aria-label={`Rank ${String(rank).padStart(2, "0")} of ${cohortSize}`}
    >
      <TrophyIcon className="w-3.5 h-3.5" />
      <span>
        <span className="text-white font-bold">
          {String(rank).padStart(2, "0")}
        </span>
        <span className="text-white/30">/{cohortSize}</span>
      </span>
    </span>
  );
}

function TrophyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M6 4h12v3a6 6 0 0 1-12 0V4Z" />
      <path d="M6 6H3.5v.5A2.5 2.5 0 0 0 6 9" />
      <path d="M18 6h2.5v.5A2.5 2.5 0 0 1 18 9" />
      <path d="M9.5 18h5" />
      <path d="M12 14v4" />
    </svg>
  );
}
