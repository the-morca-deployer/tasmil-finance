"use client";

interface StatRingProps {
  value: number; // 0..100 for the arc
  label: string; // e.g. "RANK"
  display: string; // e.g. "#42"
  size?: number; // px
}

export function StatRing({ value, label, display, size = 140 }: StatRingProps) {
  const strokeWidth = 8;
  const r = (size - strokeWidth) / 2;
  const C = 2 * Math.PI * r;
  const arcLen = (Math.max(0, Math.min(100, value)) / 100) * C;
  return (
    // stat-ring: was undefined in quest.css — inline size via style
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      {/* stat-ring-svg: was undefined in quest.css — full-size absolute svg */}
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 block"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--line-2, rgba(255,255,255,0.14))"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--accent, #67e8f9)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${arcLen} ${C}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {/* stat-ring-text: centered overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        {/* stat-ring-value */}
        <div className="text-[22px] font-extrabold font-mono tracking-[-0.03em] leading-none text-[var(--text)]">{display}</div>
        {/* stat-ring-label */}
        <div className="text-[10px] font-bold tracking-[0.16em] uppercase text-[rgba(244,247,251,0.34)] mt-1">{label}</div>
      </div>
    </div>
  );
}
