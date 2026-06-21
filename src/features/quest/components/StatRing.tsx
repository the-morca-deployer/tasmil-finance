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
    <div className="stat-ring" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="stat-ring-svg" aria-hidden="true">
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
      <div className="stat-ring-text">
        <div className="stat-ring-value">{display}</div>
        <div className="stat-ring-label">{label}</div>
      </div>
    </div>
  );
}
