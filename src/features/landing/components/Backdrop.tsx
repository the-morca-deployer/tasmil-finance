// @ts-nocheck
export default function Backdrop() {
  return (
    <>
      <div className="page-amb"></div>
      <div className="stars"></div>
      <div className="page-overlay"></div>
      <div className="prog" id="prog"></div>
      <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
        <defs>
          <filter id="tasmilCyan" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0"
            ></feColorMatrix>
            <feComponentTransfer>
              <feFuncR type="table" tableValues="0.02 0.07 0.42 0.86"></feFuncR>
              <feFuncG type="table" tableValues="0.16 0.56 0.89 1.00"></feFuncG>
              <feFuncB type="table" tableValues="0.26 0.76 0.98 1.00"></feFuncB>
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
    </>
  );
}
