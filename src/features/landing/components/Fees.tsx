export default function Fees() {
  return (
    <>
      <section
        id="fees"
        className="section relative overflow-hidden text-center"
        style={{ paddingBottom: "clamp(220px, 30vh, 360px)" }}
      >
        {/* Radial glow at bottom */}
        <div
          className="pointer-events-none absolute bottom-[-4%] left-1/2 z-0 h-[62%] w-[140%] -translate-x-1/2 [filter:blur(24px)]"
          style={{
            background:
              "radial-gradient(58% 100% at 50% 100%, rgba(14,165,233,0.3), rgba(103,232,249,0.1) 42%, transparent 72%)",
          }}
        />

        {/* Orb image centered */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 z-[1] aspect-square -translate-x-1/2 -translate-y-1/2 select-none"
          style={{ width: "min(720px, 80vw)" }}
        >
          <img
            src="/tasmil-orb.png"
            alt=""
            aria-hidden="true"
            className="block h-full w-full object-contain"
            style={{ filter: "blur(2px) brightness(0.6)", mixBlendMode: "screen" }}
          />
        </div>

        {/* Bottom fade to background */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 z-[2] h-[160px]"
          style={{ background: "linear-gradient(to top, var(--bg), transparent)" }}
        />

        {/* Content wrap */}
        <div className="wrap relative z-[3]">
          <div className="eyebrow reveal" style={{ marginBottom: "30px" }}>
            Fees
          </div>

          <h2
            className="reveal d1 fees-rot block"
            aria-label="No deposit, withdrawal, or subscription fee."
            style={{
              fontSize: "clamp(34px, 5.4vw, 76px)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.02,
            }}
          >
            No{" "}
            {/*
             * .fr: inline-block, overflow:hidden, height:1.06em, vertical-align:bottom, width:0
             * JS sets fr.style.width dynamically and fr.style.transition.
             * .fr-track and .fr-i CLASSES must stay — JS queries them.
             */}
            <span
              className="fr transition-[width] duration-[620ms] [transition-timing-function:cubic-bezier(0.7,0,0.2,1)]"
              id="feesFr"
              style={{
                display: "inline-block",
                overflow: "hidden",
                height: "1.06em",
                verticalAlign: "bottom",
                width: 0,
              }}
            >
              <span
                className="fr-track transition-[transform] duration-[620ms] [transition-timing-function:cubic-bezier(0.7,0,0.2,1)]"
                aria-hidden="true"
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Each .fr-i: block, height 1.7em, line-height 1.7em — the 1.7em rhythm the
                    JS relies on: translateY(-(i*1.7+0.32)em) */}
                <span
                  className="fr-i"
                  style={{
                    display: "block",
                    height: "1.7em",
                    lineHeight: "1.7em",
                    whiteSpace: "nowrap",
                    width: "max-content",
                    alignSelf: "flex-start",
                  }}
                >
                  <em
                    style={{
                      fontStyle: "normal",
                      background: "var(--grad)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    deposit
                  </em>
                </span>
                <span
                  className="fr-i"
                  style={{
                    display: "block",
                    height: "1.7em",
                    lineHeight: "1.7em",
                    whiteSpace: "nowrap",
                    width: "max-content",
                    alignSelf: "flex-start",
                  }}
                >
                  <em
                    style={{
                      fontStyle: "normal",
                      background: "var(--grad)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    withdrawal
                  </em>
                </span>
                <span
                  className="fr-i"
                  style={{
                    display: "block",
                    height: "1.7em",
                    lineHeight: "1.7em",
                    whiteSpace: "nowrap",
                    width: "max-content",
                    alignSelf: "flex-start",
                  }}
                >
                  <em
                    style={{
                      fontStyle: "normal",
                      background: "var(--grad)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    subscription
                  </em>
                </span>
              </span>
            </span>{" "}
            <em
              style={{
                fontStyle: "normal",
                background: "var(--grad)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              fee.
            </em>
          </h2>

          <p
            className="reveal d2"
            style={{
              fontSize: "18px",
              color: "var(--muted)",
              maxWidth: "54ch",
              margin: "30px auto 0",
              lineHeight: 1.6,
            }}
          >
            You pay only Stellar network gas, about $0.001 per action. A performance fee on
            profits above your all-time high is planned, not yet active. When it ships, you&apos;ll
            see it before you ever opt in.
          </p>

          <div
            className="reveal d3 flex flex-wrap justify-center"
            style={{ gap: "12px", marginTop: "40px" }}
          >
            <span
              className="inline-flex items-center"
              style={{
                gap: "9px",
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--text)",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--line-2)",
                padding: "11px 20px",
                borderRadius: "100px",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              <svg
                viewBox="0 0 16 16"
                fill="none"
                style={{ width: "15px", height: "15px", flex: "none" }}
              >
                <path
                  d="M3.5 8.5l3 3 6-7"
                  stroke="var(--accent)"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Deposit{" "}
              <span style={{ color: "var(--muted)", fontWeight: 500 }}>$0</span>
            </span>

            <span
              className="inline-flex items-center"
              style={{
                gap: "9px",
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--text)",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--line-2)",
                padding: "11px 20px",
                borderRadius: "100px",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              <svg
                viewBox="0 0 16 16"
                fill="none"
                style={{ width: "15px", height: "15px", flex: "none" }}
              >
                <path
                  d="M3.5 8.5l3 3 6-7"
                  stroke="var(--accent)"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Withdrawal{" "}
              <span style={{ color: "var(--muted)", fontWeight: 500 }}>$0</span>
            </span>

            <span
              className="inline-flex items-center"
              style={{
                gap: "9px",
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--text)",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--line-2)",
                padding: "11px 20px",
                borderRadius: "100px",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              <svg
                viewBox="0 0 16 16"
                fill="none"
                style={{ width: "15px", height: "15px", flex: "none" }}
              >
                <path
                  d="M3.5 8.5l3 3 6-7"
                  stroke="var(--accent)"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Network gas{" "}
              <span style={{ color: "var(--muted)", fontWeight: 500 }}>~$0.001</span>
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
