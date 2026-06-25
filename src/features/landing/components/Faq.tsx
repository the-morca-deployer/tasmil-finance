export default function Faq() {
  const items = [
    {
      q: "What is Tasmil Finance?",
      a: (
        <>
          Tasmil Finance is an automated DeFi yield protocol built on Stellar. Deposit USDC or
          XLM, choose a risk preset, and the rebalance engine spreads your capital across
          Stellar&apos;s top protocols (Blend, Soroswap, Aquarius and Phoenix), compounding yield
          every ten minutes while you stay fully non-custodial.
        </>
      ),
    },
    {
      q: "Is Tasmil Finance non-custodial?",
      a: (
        <>
          Yes. Your funds never leave your control. Tasmil Finance operates through a scoped
          session key that can only rebalance between registered strategies and harvest rewards
          back to your vault. It can never send funds to external addresses or touch your private
          key. Revoke access anytime with a single signature.
        </>
      ),
    },
    {
      q: "Which assets can I deposit?",
      a: (
        <>
          Tasmil Finance accepts USDC and XLM today. Deposits are routed into the protocols that
          best fit your chosen preset, and the built-in aggregator quotes Soroswap, SDEX and
          Aquarius to convert at the cheapest available rate when a strategy requires it.
        </>
      ),
    },
    {
      q: "How does auto-rebalancing work?",
      a: (
        <>
          Pick Safe, Balanced or Aggressive. The engine spreads your deposit across protocols
          according to that preset, then re-checks yields every ten minutes, shifting allocations
          on Stellar rails that settle in about five seconds for a fraction of a cent. Rewards are
          automatically reinvested so your position compounds without any action from you.
        </>
      ),
    },
    {
      q: "What does it cost?",
      a: (
        <>
          There are no deposit fees, no withdrawal fees and no subscription. You pay only Stellar
          network gas, roughly $0.001 per action. A performance fee on profits above your
          all-time high is planned but not yet active; when it ships, you&apos;ll see it clearly
          before you ever opt in.
        </>
      ),
    },
    {
      q: "How secure is the protocol?",
      a: (
        <>
          Permissions are enforced on-chain through session keys, an automatic circuit breaker
          halts activity on anomalies, and you can revoke the bot&apos;s access at any time. The
          agent plans routes, but you approve every transaction before it signs. There is no path
          for it to bypass on-chain rate limits or move funds out of your vault.
        </>
      ),
    },
    {
      q: "Can I withdraw anytime?",
      a: (
        <>
          Always. Your capital is never locked. Withdraw all or part of your vault whenever you
          like, and the engine unwinds the necessary positions and settles back to your wallet in
          seconds, with no exit fees beyond network gas.
        </>
      ),
    },
    {
      q: "How do I get started?",
      a: (
        <>
          Connect a Stellar wallet, deploy your vault, and pick a preset. Your capital starts
          compounding within minutes. No coding, no protocol-hopping, no spreadsheets.{" "}
          <a
            href="#start"
            className="text-[var(--accent)] border-b border-[var(--accent-line)] transition-[border-color] duration-[250ms] hover:border-[var(--accent)]"
          >
            Launch the app
          </a>{" "}
          to begin.
        </>
      ),
    },
  ];

  return (
    <section className="section faq" id="faq">
      <div className="wrap">
        {/* Head */}
        <div className="faq-head reveal text-center max-w-[720px] mx-auto mb-[46px]">
          <div className="eyebrow mb-[22px]">FAQ</div>
          <h2
            className={[
              "text-[clamp(30px,4.8vw,58px)] font-bold tracking-[-0.035em] leading-[1.05]",
            ].join(" ")}
          >
            Answering your{" "}
            <em
              className="not-italic [background-image:var(--grad)] bg-clip-text text-transparent"
            >
              most common
            </em>{" "}
            questions
          </h2>
          <p
            className={[
              "fsub mt-[20px] text-[clamp(15px,1.6vw,18px)] text-[var(--muted)] leading-[1.55]",
            ].join(" ")}
          >
            Everything you need to know before you deploy your first vault.
          </p>

          {/* Search */}
          <div className="faq-search relative max-w-[430px] mx-auto mt-[30px]">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              className="absolute left-[18px] top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--dim)] pointer-events-none"
            >
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M11 11l3 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <input
              id="faqSearch"
              type="text"
              placeholder="Search questions"
              autoComplete="off"
              aria-label="Search FAQ"
              className={[
                "w-full py-[14px] pl-[46px] pr-[18px] rounded-full",
                "bg-white/[0.04] border border-[var(--line-2)]",
                "text-[var(--text)] font-[var(--font)] text-[15px] tracking-[-0.01em]",
                "outline-none transition-[border-color,background,box-shadow] duration-300",
                "placeholder:text-[var(--dim)]",
                "focus:border-[var(--accent)] focus:bg-[rgba(103,232,249,0.05)]",
                "focus:shadow-[0_0_0_4px_var(--accent-soft)]",
              ].join(" ")}
            />
          </div>
        </div>

        {/* List */}
        <div className="faq-list reveal d1 max-w-[880px] mx-auto mt-[8px]" id="faqList">
          {items.map((item, i) => (
            <div
              key={item.q}
              className={[
                "faq-item group relative",
                // top divider on every item
                "before:absolute before:top-0 before:left-0 before:right-0 before:h-px",
                "before:bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.16)_16%,rgba(255,255,255,0.16)_84%,transparent_100%)]",
                // bottom divider on last item
                "last-of-type:after:absolute last-of-type:after:bottom-0",
                "last-of-type:after:left-0 last-of-type:after:right-0 last-of-type:after:h-px",
                "last-of-type:after:bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.16)_16%,rgba(255,255,255,0.16)_84%,transparent_100%)]",
              ].join(" ")}
              data-open={i === 0 ? "true" : "false"}
            >
              <button
                className={[
                  "faq-q w-full flex items-center justify-between gap-6",
                  "py-[27px] px-[4px] bg-none border-0 cursor-pointer text-left",
                  "font-[var(--font)] text-[var(--text)]",
                  "text-[clamp(17px,2vw,21px)] font-semibold tracking-[-0.02em]",
                  "transition-colors duration-300 hover:text-[var(--accent)]",
                ].join(" ")}
                type="button"
              >
                {item.q}
                {/* ± toggle icon */}
                <span
                  className={[
                    "faq-toggle flex-none w-[30px] h-[30px] rounded-full relative",
                    "border border-[var(--line-2)]",
                    "transition-[border-color,background] duration-300",
                    // open state: accent border + soft bg
                    "group-data-[open=true]:border-[var(--accent)]",
                    "group-data-[open=true]:bg-[var(--accent-soft)]",
                    // horizontal bar (always visible)
                    "before:absolute before:left-1/2 before:top-1/2",
                    "before:w-[11px] before:h-[1.7px] before:rounded-[2px]",
                    "before:bg-[var(--muted)] before:-translate-x-1/2 before:-translate-y-1/2",
                    "before:transition-[transform,background] before:duration-[350ms] before:[transition-timing-function:var(--ease)]",
                    // vertical bar (disappears when open)
                    "after:absolute after:left-1/2 after:top-1/2",
                    "after:w-[1.7px] after:h-[11px] after:rounded-[2px]",
                    "after:bg-[var(--muted)] after:-translate-x-1/2 after:-translate-y-1/2",
                    "after:transition-[transform,background] after:duration-[350ms] after:[transition-timing-function:var(--ease)]",
                    // open: collapse the vertical bar
                    "group-data-[open=true]:after:scale-y-0",
                    // hover: accent bars
                    "group-hover:before:bg-[var(--accent)] group-hover:after:bg-[var(--accent)]",
                    // open: accent bars
                    "group-data-[open=true]:before:bg-[var(--accent)]",
                    "group-data-[open=true]:after:bg-[var(--accent)]",
                  ].join(" ")}
                  aria-hidden="true"
                />
              </button>

              {/* Answer — grid expand */}
              <div
                className={[
                  "faq-a grid transition-[grid-template-rows] duration-[450ms]",
                  "[transition-timing-function:var(--ease)]",
                  "grid-rows-[0fr]",
                  "group-data-[open=true]:grid-rows-[1fr]",
                ].join(" ")}
              >
                <div
                  className={[
                    "faq-a-inner overflow-hidden min-h-0",
                    "pl-[4px] pr-[100px] max-[560px]:pr-[38px]",
                    "text-[clamp(15px,1.6vw,16.5px)] text-[var(--muted)] leading-[1.66]",
                    "transition-[padding-bottom] duration-[450ms] [transition-timing-function:var(--ease)]",
                    "group-data-[open=true]:pb-[28px]",
                  ].join(" ")}
                >
                  {item.a}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        <div
          id="faqEmpty"
          data-show="false"
          className={[
            "hidden text-center text-[var(--dim)] py-[44px] text-[15px]",
            "data-[show=true]:block",
          ].join(" ")}
        >
          No questions match your search.
        </div>

        {/* Footer */}
        <p
          className={[
            "faq-foot reveal text-center mt-[44px] text-[15px] text-[var(--muted)]",
          ].join(" ")}
        >
          Still have a question?{" "}
          <a
            href="#start"
            className="text-[var(--accent)] border-b border-[var(--accent-line)] transition-[border-color] duration-[250ms] hover:border-[var(--accent)]"
          >
            Reach out to the team →
          </a>
        </p>
      </div>
    </section>
  );
}
