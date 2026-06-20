"use client";

export function WalletAnim() {
  return (
    <div className="wallet-anim" aria-hidden="true">
      <span className="wa-glow" />
      <svg
        className="wa-svg"
        viewBox="0 0 120 120"
        fill="none"
        style={{ width: 96, height: 96, position: "relative", zIndex: 1, overflow: "visible" }}
      >
        <defs>
          <linearGradient
            id="wa-card-grad"
            x1="34"
            y1="22"
            x2="86"
            y2="56"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#ffffff" />
            <stop offset="1" stopColor="oklch(0.87 0.12 192)" />
          </linearGradient>
          <clipPath id="wa-clip">
            <rect x="20" y="20" width="80" height="46" rx="6" />
          </clipPath>
        </defs>
        <g clipPath="url(#wa-clip)">
          <g className="wa-card">
            <rect x="38" y="18" width="44" height="29" rx="6" fill="url(#wa-card-grad)" />
            <rect x="44" y="36" width="15" height="3" rx="1.5" fill="rgba(0,0,0,0.32)" />
            <circle cx="74" cy="26" r="3.4" fill="rgba(0,0,0,0.22)" />
          </g>
        </g>
        <g
          style={{ filter: "drop-shadow(0 8px 18px rgba(0,0,0,0.55))" }}
          stroke="oklch(0.87 0.12 192)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="26" y="50" width="68" height="46" rx="13" fill="#0B0F18" />
          <path d="M26 64 H94" />
          <circle cx="80" cy="80" r="4.2" fill="oklch(0.87 0.12 192)" stroke="none" />
        </g>
      </svg>
    </div>
  );
}

export function MailAnim() {
  return (
    <div className="bell-anim" aria-hidden="true">
      <span className="wa-glow" />
      <svg
        className="bell-svg"
        viewBox="0 0 120 120"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: 96, height: 96 }}
      >
        <g className="bell-swing">
          <circle cx="60" cy="26" r="3.4" fill="currentColor" stroke="none" />
          <path d="M42 78 V52 a18 18 0 0 1 36 0 V78 l4 7 H38 Z" fill="#0B0F18" />
          <circle cx="60" cy="90" r="4.6" fill="currentColor" stroke="none" />
        </g>
      </svg>
    </div>
  );
}

export function ScanAnim() {
  return (
    <div className="scan-anim" aria-hidden="true">
      <svg viewBox="0 0 120 120" fill="none" style={{ width: 96, height: 96 }}>
        <defs>
          <linearGradient
            id="scan-grad"
            x1="60"
            y1="60"
            x2="60"
            y2="16"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="var(--accent)" stopOpacity="0.55" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="42" stroke="var(--accent-line)" strokeWidth="1.4" />
        <circle cx="60" cy="60" r="28" stroke="var(--line-2)" strokeWidth="1.4" />
        <circle cx="60" cy="60" r="14" stroke="var(--line-2)" strokeWidth="1.4" />
        <g className="scan-sweep">
          <path d="M60 60 L60 18 A42 42 0 0 1 98 44 Z" fill="url(#scan-grad)" />
          <line x1="60" y1="60" x2="60" y2="18" stroke="var(--accent)" strokeWidth="2" />
        </g>
        <circle className="scan-blip" cx="78" cy="42" r="3.2" fill="var(--accent)" />
        <circle cx="60" cy="60" r="5" fill="var(--accent)" />
      </svg>
    </div>
  );
}

export function KeyAnim() {
  return (
    <div className="key-anim" aria-hidden="true">
      <span className="wa-glow" />
      <svg
        viewBox="0 0 120 120"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: 96, height: 96 }}
      >
        <circle cx="60" cy="60" r="44" stroke="var(--accent-line)" strokeWidth="1.6" />
        <g className="key-spin">
          <circle cx="60" cy="44" r="12" />
          <circle cx="60" cy="44" r="4" fill="currentColor" stroke="none" />
          <line x1="60" y1="56" x2="60" y2="86" />
          <line x1="60" y1="78" x2="71" y2="78" />
          <line x1="60" y1="86" x2="68" y2="86" />
        </g>
      </svg>
    </div>
  );
}

export function PopperAnim() {
  const pieces = Array.from({ length: 13 }, (_, i) => i);
  const colors = ["var(--accent)", "var(--accent-2)", "#ffffff", "var(--ok)", "var(--accent-deep)"];
  const n = pieces.length;
  return (
    <div className="popper-anim" aria-hidden="true">
      <span className="wa-glow" />
      {pieces.map((i) => {
        const ang = -12 + (i / (n - 1)) * 112;
        const dist = 28 + (i % 3) * 11;
        return (
          <span
            className="pp-piece"
            key={i}
            style={
              {
                "--pang": `${ang}deg`,
                "--pdist": `${dist}px`,
                "--pdelay": `${(i % 4) * 0.04}s`,
                background: colors[i % colors.length],
                width: `${i % 2 ? 5 : 4}px`,
                height: `${i % 3 ? 8 : 5}px`,
              } as React.CSSProperties
            }
          />
        );
      })}
      <svg
        className="pp-cone-svg"
        viewBox="0 0 120 120"
        fill="none"
        style={{ width: 96, height: 96 }}
      >
        <defs>
          <linearGradient
            id="pp-cone-grad"
            x1="30"
            y1="92"
            x2="80"
            y2="48"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="var(--accent-2)" />
            <stop offset="1" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        <g className="pp-cone">
          <path d="M28 92 L62 46 L84 74 Z" fill="url(#pp-cone-grad)" />
          <path
            d="M40 80 L57 58"
            stroke="var(--accent-deep)"
            strokeWidth="4.5"
            strokeLinecap="round"
            opacity="0.5"
          />
          <path
            d="M52 87 L70 66"
            stroke="var(--accent-deep)"
            strokeWidth="4.5"
            strokeLinecap="round"
            opacity="0.5"
          />
          <ellipse cx="73" cy="60" rx="6" ry="17.5" fill="#05070C" transform="rotate(-38 73 60)" />
          <ellipse
            cx="73"
            cy="60"
            rx="6"
            ry="17.5"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            opacity="0.6"
            transform="rotate(-38 73 60)"
          />
        </g>
      </svg>
    </div>
  );
}

export function CheckAnim({ ok = false }: { ok?: boolean }) {
  return (
    <div className={`check-anim${ok ? " ok" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 120 120" fill="none" style={{ width: 96, height: 96 }}>
        <circle className="ca-disc" cx="60" cy="60" r="40" />
        <circle className="ca-ring" cx="60" cy="60" r="40" pathLength="100" />
        <path
          className="ca-check"
          d="M41 61 L54 74 L80 47"
          pathLength="100"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
