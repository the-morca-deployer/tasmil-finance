export default function Security() {
  return (
    <>
      <section
        className="section bg-[var(--bg)] border-t border-[var(--line)] [--deny:#fca5a5] [--deny-soft:rgba(252,165,165,0.1)] [--deny-line:rgba(252,165,165,0.26)]"
        id="security"
      >
        <div className="wrap">
          <div className="sec-head reveal" style={{ marginBottom: "0" }}>
            <div>
              <div className="eyebrow">Security</div>
              <h2>
                Non-custodial.
                <br />
                The bot has limits.
              </h2>
            </div>
            <p className="rt">
              A scoped session key can optimize, never escape. Your owner key always wins.
            </p>
          </div>

          {/* Ledger — permission boundary */}
          <div
            className={[
              "reveal relative isolate mt-[50px]",
              "grid grid-cols-2 max-[760px]:grid-cols-1",
              "border border-[var(--line-2)] rounded-[24px]",
              "bg-[var(--surface)] overflow-hidden",
              // glowing central boundary line
              "before:content-[''] before:absolute before:top-[22px] before:bottom-[22px]",
              "before:left-1/2 before:w-px before:-translate-x-1/2",
              "before:bg-[linear-gradient(180deg,var(--accent)_0%,rgba(255,255,255,0.12)_50%,var(--deny)_100%)]",
              "before:opacity-55 before:z-[1]",
              "max-[760px]:before:hidden",
            ].join(" ")}
          >
            {/* Allow column */}
            <div className="relative p-[32px_34px] max-[760px]:p-[28px_26px] pr-[46px] max-[760px]:pr-[26px]">
              <div
                className={[
                  "flex items-center gap-[10px] mb-1",
                  "font-[var(--mono)] text-[12px] font-medium tracking-[0.18em] uppercase",
                  "text-[var(--accent)]",
                ].join(" ")}
              >
                <span
                  className="w-[7px] h-[7px] rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent-glow)]"
                  aria-hidden="true"
                />
                The bot can
              </div>
              <div className="text-[13px] text-[var(--dim)] mb-4">Inside the scoped session key</div>

              {/* Allow rows */}
              {[
                "Rebalance between registered strategies",
                "Harvest rewards back to your vault",
                "Sign within a scoped session key",
              ].map((text) => (
                <div
                  key={text}
                  className={[
                    "flex items-center gap-[14px] px-[14px] py-[13px] -mx-[14px]",
                    "text-[16px] rounded-[12px]",
                    "transition-[background,transform] duration-[250ms] [transition-timing-function:var(--ease)]",
                    "hover:bg-[var(--accent-soft)] hover:translate-x-[2px]",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "w-[30px] h-[30px] flex-none rounded-[9px]",
                      "grid place-items-center border border-[var(--accent-line)]",
                      "bg-[var(--accent-soft)] shadow-[0_0_16px_-5px_var(--accent-glow)]",
                    ].join(" ")}
                  >
                    <svg viewBox="0 0 18 18" fill="none" className="w-[16px] h-[16px]">
                      <path
                        d="M4 9.5l3 3 7-7.5"
                        stroke="var(--accent)"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  {text}
                </div>
              ))}
            </div>

            {/* Central lock seal */}
            <div
              className={[
                "max-[760px]:hidden",
                "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                "w-[48px] h-[48px] grid place-items-center rounded-full z-[2]",
                "text-[var(--text)] bg-[var(--bg-2)]",
                "border border-[var(--line-2)]",
                "shadow-[0_0_0_6px_var(--bg),0_10px_34px_rgba(0,0,0,0.6),0_0_26px_-8px_var(--accent-glow)]",
              ].join(" ")}
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-[20px] h-[20px]">
                <rect
                  x="5"
                  y="10.5"
                  width="14"
                  height="9.5"
                  rx="2.2"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
                <path
                  d="M8 10.5V8a4 4 0 0 1 8 0v2.5"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="15" r="1.3" fill="currentColor" />
              </svg>
            </div>

            {/* Deny column */}
            <div
              className={[
                "relative p-[32px_34px] max-[760px]:p-[28px_26px]",
                "pl-[46px] max-[760px]:pl-[26px]",
                "max-[760px]:border-t max-[760px]:border-[var(--line)]",
              ].join(" ")}
            >
              <div
                className={[
                  "flex items-center gap-[10px] mb-1",
                  "font-[var(--mono)] text-[12px] font-medium tracking-[0.18em] uppercase",
                  "text-[var(--deny)]",
                ].join(" ")}
              >
                <span
                  className="w-[7px] h-[7px] rounded-full bg-[var(--deny)] shadow-[0_0_10px_rgba(252,165,165,0.5)]"
                  aria-hidden="true"
                />
                The bot cannot
              </div>
              <div className="text-[13px] text-[var(--dim)] mb-4">Hard-blocked on-chain</div>

              {/* Deny rows */}
              {[
                "Send funds to external addresses",
                "Touch your private key",
                "Bypass on-chain rate limits",
              ].map((text) => (
                <div
                  key={text}
                  className={[
                    "flex items-center gap-[14px] px-[14px] py-[13px] -mx-[14px]",
                    "text-[16px] rounded-[12px] text-[var(--muted)]",
                    "transition-[background,transform] duration-[250ms] [transition-timing-function:var(--ease)]",
                    "hover:bg-[var(--deny-soft)] hover:-translate-x-[2px]",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "w-[30px] h-[30px] flex-none rounded-[9px]",
                      "grid place-items-center border border-[var(--deny-line)]",
                      "bg-[var(--deny-soft)]",
                    ].join(" ")}
                  >
                    <svg viewBox="0 0 18 18" fill="none" className="w-[16px] h-[16px]">
                      <path
                        d="M5.5 5.5l7 7M12.5 5.5l-7 7"
                        stroke="var(--deny)"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Guard cards */}
          <div
            className={[
              "reveal d1",
              "grid grid-cols-3 max-[760px]:grid-cols-1 gap-[18px] mt-[18px]",
            ].join(" ")}
          >
            {[
              {
                title: "Session keys",
                label: "Permissions enforced on-chain",
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" className="w-[21px] h-[21px]">
                    <circle cx="8" cy="8" r="4.2" stroke="currentColor" strokeWidth="1.7" />
                    <path
                      d="M11 11l8 8M16 16l2.5-2.5M14 14l2.5-2.5"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ),
              },
              {
                title: "Circuit breaker",
                label: "Auto-halts on anomalies",
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" className="w-[21px] h-[21px]">
                    <path
                      d="M13 3L5 13h6l-2 8 10-12h-7l1-6z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                  </svg>
                ),
              },
              {
                title: "Revoke anytime",
                label: "One signature kills access",
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" className="w-[21px] h-[21px]">
                    <path
                      d="M4 12a8 8 0 1 1 2.3 5.6"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                    <path
                      d="M6 18v-3.5H9.5"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ),
              },
            ].map(({ title, label, icon }) => (
              <div
                key={title}
                className={[
                  "flex items-center gap-[16px]",
                  "border border-[var(--line)] rounded-[20px]",
                  "bg-[var(--surface)] px-[24px] py-[22px]",
                  "transition-[border-color,transform] duration-300 [transition-timing-function:var(--ease)]",
                  "hover:bg-[rgba(255,255,255,0.04)]",
                ].join(" ")}
              >
                <span
                  className={[
                    "w-[42px] h-[42px] flex-none rounded-[12px]",
                    "grid place-items-center",
                    "bg-[var(--accent-soft)] border border-[var(--accent-line)]",
                    "text-[var(--accent)]",
                  ].join(" ")}
                >
                  {icon}
                </span>
                <div>
                  <div className="text-[17px] font-bold tracking-[-0.02em] mb-1">{title}</div>
                  <div className="text-[13.5px] text-[var(--muted)] leading-[1.4]">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
