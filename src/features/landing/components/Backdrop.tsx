export default function Backdrop() {
  return (
    <>
      {/* Ambient radial-gradient glow behind the page */}
      <div className="page-ambient fixed [-inset:10px] z-[-2] pointer-events-none blur-[10px]" />

      {/* Stars field */}
      <div className="stars-field fixed inset-0 z-[-1] pointer-events-none opacity-50" />

      {/* Dark overlay */}
      <div className="fixed inset-0 z-[-1] pointer-events-none bg-black/45" />

      {/* Scroll-progress bar — width set by useLandingScripts via inline style */}
      <div
        id="prog"
        className="fixed top-0 left-0 h-[2px] w-0 z-[120] [background:var(--grad)] [box-shadow:0_0_12px_var(--accent-glow)]"
      />

      {/* SVG colour-matrix filter used by StellarReel and other visuals */}
      <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
        <defs>
          <filter id="tasmilCyan" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0"
            />
            <feComponentTransfer>
              <feFuncR type="table" tableValues="0.02 0.07 0.42 0.86" />
              <feFuncG type="table" tableValues="0.16 0.56 0.89 1.00" />
              <feFuncB type="table" tableValues="0.26 0.76 0.98 1.00" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
    </>
  );
}
