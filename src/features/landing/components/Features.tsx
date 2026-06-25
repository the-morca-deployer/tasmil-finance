export default function Features() {
  return (
    <>
      <div className="divider"></div>

      <section className="section features" id="features">
        <div className="wrap">
          {/* sec-head kept as CSS class — shared with Security.tsx */}
          <div className="sec-head reveal" style={{ marginBottom: "10px" }}>
            <div>
              <div className="eyebrow">What you can do</div>
              <h2>Four tools. One orbit.</h2>
            </div>
            <p className="rt">
              Chat, swap, farm and track. Every action settles on the same Stellar rails.
            </p>
          </div>

          {/* frow left — class kept for JS .closest(".frow") hook */}
          <div
            className="frow left grid grid-cols-12 items-center border-t border-[var(--line)] gap-[34px] py-[clamp(54px,8vh,100px)] max-[900px]:grid-cols-1 max-[900px]:gap-6 max-[900px]:bg-[var(--surface)] max-[900px]:border max-[900px]:border-[var(--line)] max-[900px]:rounded-[24px] max-[900px]:px-5 max-[900px]:py-[26px] max-[900px]:mb-[18px] max-[900px]:last:mb-0 max-[560px]:px-[18px] max-[560px]:py-6 max-[900px]:sticky max-[900px]:top-[calc(72px+0*14px)] max-[900px]:shadow-[0_-1px_0_rgba(255,255,255,0.05)_inset,0_30px_64px_-38px_rgba(0,0,0,0.92)]"
            style={{ "--i": "0" } as React.CSSProperties}
          >
            {/* fviz: col 1-6 on desktop, full-width on mobile */}
            <div className="fviz reveal col-span-6 min-w-0 max-[900px]:col-span-full">
              {/* panel */}
              <div className="min-w-0 border border-[var(--line-2)] rounded-[22px] bg-[linear-gradient(160deg,rgba(24,33,47,0.66),rgba(9,13,20,0.62))] overflow-hidden relative shadow-[0_30px_80px_-50px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.045)] transition-[border-color,box-shadow] duration-500">
                {/* panel-cap */}
                <div className="flex justify-between items-center px-5 py-[14px] border-b border-[var(--line)] font-[var(--mono)] text-[11px] tracking-[0.12em] uppercase bg-white/[0.03]">
                  {/* cap-line */}
                  <span className="font-[var(--font)] text-[16px] font-semibold tracking-[-0.01em] normal-case bg-[linear-gradient(100deg,#fff_0%,var(--accent)_100%)] bg-clip-text text-transparent">
                    Plain English, on-chain.
                  </span>
                </div>
                {/* panel-pad */}
                <div className="p-[clamp(26px,4vw,46px)] max-[560px]:p-5">
                  <div className="chat" id="chat">
                    <div className="chat-thread" id="chatThread">
                      <div className="cmsg user" data-c="1">
                        <div className="bub">Supply 500 USDC to Blend at the best rate.</div>
                      </div>
                      <div className="cmsg bot" data-c="2">
                        <img className="c-av bot" src="/tasmil-logo.png" alt="Tasmil" />
                        <div className="bub typing">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                      <div className="cmsg bot" data-c="3">
                        <img className="c-av bot" src="/tasmil-logo.png" alt="Tasmil" />
                        <div className="plan-card">
                          <div className="pc-h">Planned route</div>
                          <div className="pc-step">
                            <span className="pc-i">1</span>Quote best USDC supply venue
                          </div>
                          <div className="pc-step">
                            <span className="pc-i">2</span>Supply 500.00 USDC → Blend
                          </div>
                          <div className="pc-foot">
                            <span className="pc-apy">8.76% APY</span>
                            <span className="pc-go" id="pcGo">
                              Approve →
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="cmsg user" data-c="4">
                        <div className="bub sm">Approve</div>
                      </div>
                      <div className="cmsg bot" data-c="5">
                        <img className="c-av bot" src="/tasmil-logo.png" alt="Tasmil" />
                        <div className="supply-card">
                          <div className="sc-h">
                            Confirm Supply<span>Review details before signing</span>
                          </div>
                          <div className="sc-row">
                            <span className="sc-l">Amount to supply</span>
                            <span className="sc-v">500.00 USDC</span>
                          </div>
                          <div className="sc-row">
                            <span className="sc-l">Best venue</span>
                            <span className="sc-v">Blend Fixed Pool</span>
                          </div>
                          <div className="sc-row">
                            <span className="sc-l">Supply APY</span>
                            <span className="sc-v grad">8.76%</span>
                          </div>
                          <div className="sc-row">
                            <span className="sc-l">Est. yearly earnings</span>
                            <span className="sc-v pos">+43.80 USDC</span>
                          </div>
                          <div className="sc-row">
                            <span className="sc-l">Network fee</span>
                            <span className="sc-v">~$0.001</span>
                          </div>
                          <button className="sc-sign" id="scSign" type="button">
                            Sign transaction
                          </button>
                        </div>
                      </div>
                      <div className="cmsg receipt" data-c="6">
                        <div className="rc">
                          <span className="rc-ck">✓</span>500 USDC supplied to Blend in ~5s
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* ftext: col 8-12 on desktop, full-width + reordered first on mobile */}
            <div className="ftext reveal d1 col-start-8 col-end-13 min-w-0 max-[900px]:col-span-full max-[900px]:-order-1">
              {/* fhead */}
              <div className="flex items-baseline gap-4 mb-[22px]">
                <span className="font-[var(--mono)] text-[17px] font-bold text-[var(--accent)]">01.</span>
                <span className="font-[var(--mono)] text-[17px] font-bold tracking-[0.18em] uppercase bg-[linear-gradient(100deg,#fff_0%,var(--accent)_100%)] bg-clip-text text-transparent">
                  Chat
                </span>
              </div>
              <h3 className="text-[clamp(27px,3.3vw,44px)] font-bold tracking-[-0.035em] leading-[1.03] mb-[18px]">
                Talk to DeFi
                <br />
                like a person.
              </h3>
              <p className="fp text-[16px] text-[var(--muted)] leading-[1.62] max-w-[42ch] mb-[26px] max-[560px]:max-w-none">
                Describe the outcome in plain words. Agents plan the route — you approve before
                anything signs.
              </p>
              {/* flist */}
              <div className="flex flex-col gap-[11px]">
                <div className="flex items-center gap-3 text-[14.5px] text-[var(--text)] max-[560px]:text-[14px]">
                  <svg viewBox="0 0 16 16" fill="none" className="w-[15px] h-[15px] shrink-0">
                    <path
                      d="M3.5 8.5l3 3 6-7"
                      stroke="var(--accent)"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                  Natural-language intents
                </div>
                <div className="flex items-center gap-3 text-[14.5px] text-[var(--text)] max-[560px]:text-[14px]">
                  <svg viewBox="0 0 16 16" fill="none" className="w-[15px] h-[15px] shrink-0">
                    <path
                      d="M3.5 8.5l3 3 6-7"
                      stroke="var(--accent)"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                  Human-in-the-loop approval
                </div>
              </div>
            </div>
          </div>

          {/* frow right */}
          <div
            className="frow right grid grid-cols-12 items-center border-t border-[var(--line)] gap-[34px] py-[clamp(54px,8vh,100px)] max-[900px]:grid-cols-1 max-[900px]:gap-6 max-[900px]:bg-[var(--surface)] max-[900px]:border max-[900px]:border-[var(--line)] max-[900px]:rounded-[24px] max-[900px]:px-5 max-[900px]:py-[26px] max-[900px]:mb-[18px] max-[900px]:last:mb-0 max-[560px]:px-[18px] max-[560px]:py-6 max-[900px]:sticky max-[900px]:top-[calc(72px+1*14px)] max-[900px]:shadow-[0_-1px_0_rgba(255,255,255,0.05)_inset,0_30px_64px_-38px_rgba(0,0,0,0.92)]"
            style={{ "--i": "1" } as React.CSSProperties}
          >
            {/* ftext: col 1-5 on desktop */}
            <div className="ftext reveal col-start-1 col-end-6 min-w-0 max-[900px]:col-span-full max-[900px]:-order-1">
              {/* fhead */}
              <div className="flex items-baseline gap-4 mb-[22px]">
                <span className="font-[var(--mono)] text-[17px] font-bold text-[var(--accent)]">02.</span>
                <span className="font-[var(--mono)] text-[17px] font-bold tracking-[0.18em] uppercase bg-[linear-gradient(100deg,#fff_0%,var(--accent)_100%)] bg-clip-text text-transparent">
                  Aggregator
                </span>
              </div>
              <h3 className="text-[clamp(27px,3.3vw,44px)] font-bold tracking-[-0.035em] leading-[1.03] mb-[18px]">
                Best price,
                <br />
                found for you.
              </h3>
              <p className="fp text-[16px] text-[var(--muted)] leading-[1.62] max-w-[42ch] mb-[26px] max-[560px]:max-w-none">
                One pass quotes Soroswap, SDEX and Aquarius, then routes your swap through the
                cheapest path.
              </p>
              {/* flist */}
              <div className="flex flex-col gap-[11px]">
                <div className="flex items-center gap-3 text-[14.5px] text-[var(--text)] max-[560px]:text-[14px]">
                  <svg viewBox="0 0 16 16" fill="none" className="w-[15px] h-[15px] shrink-0">
                    <path
                      d="M3.5 8.5l3 3 6-7"
                      stroke="var(--accent)"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                  Multi-venue quote comparison
                </div>
                <div className="flex items-center gap-3 text-[14.5px] text-[var(--text)] max-[560px]:text-[14px]">
                  <svg viewBox="0 0 16 16" fill="none" className="w-[15px] h-[15px] shrink-0">
                    <path
                      d="M3.5 8.5l3 3 6-7"
                      stroke="var(--accent)"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                  Cross-chain bridging built in
                </div>
              </div>
            </div>
            {/* fviz: col 7-12 on desktop */}
            <div className="fviz reveal d1 col-start-7 col-end-13 min-w-0 max-[900px]:col-span-full">
              {/* panel */}
              <div className="min-w-0 border border-[var(--line-2)] rounded-[22px] bg-[linear-gradient(160deg,rgba(24,33,47,0.66),rgba(9,13,20,0.62))] overflow-hidden relative shadow-[0_30px_80px_-50px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.045)] transition-[border-color,box-shadow] duration-500">
                {/* panel-cap */}
                <div className="flex justify-between items-center px-5 py-[14px] border-b border-[var(--line)] font-[var(--mono)] text-[11px] tracking-[0.12em] uppercase bg-white/[0.03]">
                  {/* cap-line */}
                  <span className="font-[var(--font)] text-[16px] font-semibold tracking-[-0.01em] normal-case bg-[linear-gradient(100deg,#fff_0%,var(--accent)_100%)] bg-clip-text text-transparent">
                    One pass, best price.
                  </span>
                </div>
                {/* panel-pad */}
                <div className="swap-pad p-[clamp(26px,4vw,46px)] max-[560px]:p-5">
                  <div className="swap-field">
                    <div className="sf-top">
                      <span className="sf-label">You pay</span>
                      <span className="sf-acct">
                        GDQI7L…3I6R
                        <svg viewBox="0 0 12 12" fill="none">
                          <path
                            d="M3 4.5 6 7.5 9 4.5"
                            stroke="currentColor"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          ></path>
                        </svg>
                      </span>
                    </div>
                    <div className="sf-mid">
                      <div className="sf-amt zero" id="payAmt">
                        0
                      </div>
                      <span className="tok">
                        <span className="tok-badge xlm">
                          <img src="/tokens/xlm.svg" alt="XLM" />
                        </span>
                        <span className="tok-meta">
                          <b>XLM</b>
                          <i>Stellar</i>
                        </span>
                        <svg className="tok-cv" viewBox="0 0 12 12" fill="none">
                          <path
                            d="M3 4.5 6 7.5 9 4.5"
                            stroke="currentColor"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          ></path>
                        </svg>
                      </span>
                    </div>
                    <div className="sf-sub">
                      <span id="payUsd">$0</span>
                      <span className="sf-bal">Balance 4.247 XLM</span>
                    </div>
                  </div>
                  <div className="swap-mid">
                    <button
                      className="swap-flip"
                      id="swapFlip"
                      type="button"
                      aria-label="Swap direction"
                    >
                      <svg viewBox="0 0 16 16" fill="none">
                        <path
                          d="M5 3v8M3 9l2 2 2-2M11 13V5M9 7l2-2 2 2"
                          stroke="currentColor"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>
                      </svg>
                    </button>
                  </div>
                  <div className="swap-field">
                    <div className="sf-top">
                      <span className="sf-label">You receive</span>
                      <span className="sf-add">+ Add Address</span>
                    </div>
                    <div className="sf-mid">
                      <div className="sf-amt zero" id="recvAmt">
                        0
                      </div>
                      <span className="tok">
                        <span className="tok-badge usdc">
                          <img src="/tokens/usdc.svg" alt="USDC" />
                        </span>
                        <span className="tok-meta">
                          <b>USDC</b>
                          <i>Stellar</i>
                        </span>
                        <svg className="tok-cv" viewBox="0 0 12 12" fill="none">
                          <path
                            d="M3 4.5 6 7.5 9 4.5"
                            stroke="currentColor"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          ></path>
                        </svg>
                      </span>
                    </div>
                    <div className="sf-sub">
                      <span id="recvUsd">$0</span>
                      <span className="sf-route" id="recvRoute"></span>
                    </div>
                  </div>
                  <button className="swap-cta" id="swapCta" type="button">
                    Enter amount
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* frow left */}
          <div
            className="frow left grid grid-cols-12 items-center border-t border-[var(--line)] gap-[34px] py-[clamp(54px,8vh,100px)] max-[900px]:grid-cols-1 max-[900px]:gap-6 max-[900px]:bg-[var(--surface)] max-[900px]:border max-[900px]:border-[var(--line)] max-[900px]:rounded-[24px] max-[900px]:px-5 max-[900px]:py-[26px] max-[900px]:mb-[18px] max-[900px]:last:mb-0 max-[560px]:px-[18px] max-[560px]:py-6 max-[900px]:sticky max-[900px]:top-[calc(72px+2*14px)] max-[900px]:shadow-[0_-1px_0_rgba(255,255,255,0.05)_inset,0_30px_64px_-38px_rgba(0,0,0,0.92)]"
            style={{ "--i": "2" } as React.CSSProperties}
          >
            {/* fviz: col 1-6 on desktop */}
            <div className="fviz reveal col-span-6 min-w-0 max-[900px]:col-span-full">
              {/* panel */}
              <div className="min-w-0 border border-[var(--line-2)] rounded-[22px] bg-[linear-gradient(160deg,rgba(24,33,47,0.66),rgba(9,13,20,0.62))] overflow-hidden relative shadow-[0_30px_80px_-50px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.045)] transition-[border-color,box-shadow] duration-500">
                {/* panel-cap */}
                <div className="flex justify-between items-center px-5 py-[14px] border-b border-[var(--line)] font-[var(--mono)] text-[11px] tracking-[0.12em] uppercase bg-white/[0.03]">
                  {/* cap-line */}
                  <span className="font-[var(--font)] text-[16px] font-semibold tracking-[-0.01em] normal-case bg-[linear-gradient(100deg,#fff_0%,var(--accent)_100%)] bg-clip-text text-transparent">
                    Presets that rebalance for you.
                  </span>
                </div>
                {/* panel-pad */}
                <div className="p-[clamp(26px,4vw,46px)] max-[560px]:p-5">
                  <div className="farm-ui">
                    <div className="farm-presets" id="farmPresets">
                      <span className="fp-thumb" id="fpThumb"></span>
                      <button className="fp-opt" type="button">
                        Safe
                      </button>
                      <button className="fp-opt active" type="button">
                        Balanced
                      </button>
                      <button className="fp-opt" type="button">
                        Aggressive
                      </button>
                    </div>
                    <div className="farm-summary">
                      <div className="fs-apy">
                        <span className="fs-label">Net APY</span>
                        <span className="fs-apyval" id="farmApy">
                          8.4%
                        </span>
                      </div>
                      <div className="fs-val">
                        <span className="fs-label">Value now</span>
                        <span className="fs-valval" id="farmVal">
                          $1,084.20
                        </span>
                      </div>
                    </div>
                    <div className="farm-alloc">
                      <div className="fa-row">
                        <span className="fa-name">
                          <i className="fa-dot blend"></i>Blend
                        </span>
                        <span className="fa-bar">
                          <i id="fb0" style={{ width: "40%", background: "var(--c-blend)" }}></i>
                        </span>
                        <span className="fa-pct" id="fp0">
                          40%
                        </span>
                      </div>
                      <div className="fa-row">
                        <span className="fa-name">
                          <i className="fa-dot soroswap"></i>Soroswap
                        </span>
                        <span className="fa-bar">
                          <i id="fb1" style={{ width: "28%", background: "var(--c-soroswap)" }}></i>
                        </span>
                        <span className="fa-pct" id="fp1">
                          28%
                        </span>
                      </div>
                      <div className="fa-row">
                        <span className="fa-name">
                          <i className="fa-dot aquarius"></i>Aquarius
                        </span>
                        <span className="fa-bar">
                          <i id="fb2" style={{ width: "20%", background: "var(--c-aquarius)" }}></i>
                        </span>
                        <span className="fa-pct" id="fp2">
                          20%
                        </span>
                      </div>
                      <div className="fa-row">
                        <span className="fa-name">
                          <i className="fa-dot phoenix"></i>Phoenix
                        </span>
                        <span className="fa-bar">
                          <i id="fb3" style={{ width: "12%", background: "var(--c-phoenix)" }}></i>
                        </span>
                        <span className="fa-pct" id="fp3">
                          12%
                        </span>
                      </div>
                    </div>
                    <div className="farm-foot">
                      <span>Rebalances every 10 min</span>
                      <span className="farm-live">
                        <i></i>Live
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* ftext: col 8-12 on desktop */}
            <div className="ftext reveal d1 col-start-8 col-end-13 min-w-0 max-[900px]:col-span-full max-[900px]:-order-1">
              {/* fhead */}
              <div className="flex items-baseline gap-4 mb-[22px]">
                <span className="font-[var(--mono)] text-[17px] font-bold text-[var(--accent)]">03.</span>
                <span className="font-[var(--mono)] text-[17px] font-bold tracking-[0.18em] uppercase bg-[linear-gradient(100deg,#fff_0%,var(--accent)_100%)] bg-clip-text text-transparent">
                  Farming
                </span>
              </div>
              <h3 className="text-[clamp(27px,3.3vw,44px)] font-bold tracking-[-0.035em] leading-[1.03] mb-[18px]">
                Set a preset.
                <br />
                Let it run.
              </h3>
              <p className="fp text-[16px] text-[var(--muted)] leading-[1.62] max-w-[42ch] mb-[26px] max-[560px]:max-w-none">
                Pick Safe, Balanced or Aggressive. The engine spreads and rebalances your deposit
                every 10 minutes.
              </p>
              {/* flist */}
              <div className="flex flex-col gap-[11px]">
                <div className="flex items-center gap-3 text-[14.5px] text-[var(--text)] max-[560px]:text-[14px]">
                  <svg viewBox="0 0 16 16" fill="none" className="w-[15px] h-[15px] shrink-0">
                    <path
                      d="M3.5 8.5l3 3 6-7"
                      stroke="var(--accent)"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                  Three risk presets
                </div>
                <div className="flex items-center gap-3 text-[14.5px] text-[var(--text)] max-[560px]:text-[14px]">
                  <svg viewBox="0 0 16 16" fill="none" className="w-[15px] h-[15px] shrink-0">
                    <path
                      d="M3.5 8.5l3 3 6-7"
                      stroke="var(--accent)"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                  Auto-compounding rewards
                </div>
              </div>
            </div>
          </div>

          {/* frow right */}
          <div
            className="frow right grid grid-cols-12 items-center border-t border-[var(--line)] gap-[34px] py-[clamp(54px,8vh,100px)] max-[900px]:grid-cols-1 max-[900px]:gap-6 max-[900px]:bg-[var(--surface)] max-[900px]:border max-[900px]:border-[var(--line)] max-[900px]:rounded-[24px] max-[900px]:px-5 max-[900px]:py-[26px] max-[900px]:mb-[18px] max-[900px]:last:mb-0 max-[560px]:px-[18px] max-[560px]:py-6 max-[900px]:sticky max-[900px]:top-[calc(72px+3*14px)] max-[900px]:shadow-[0_-1px_0_rgba(255,255,255,0.05)_inset,0_30px_64px_-38px_rgba(0,0,0,0.92)]"
            style={{ "--i": "3" } as React.CSSProperties}
          >
            {/* ftext: col 1-5 on desktop */}
            <div className="ftext reveal col-start-1 col-end-6 min-w-0 max-[900px]:col-span-full max-[900px]:-order-1">
              {/* fhead */}
              <div className="flex items-baseline gap-4 mb-[22px]">
                <span className="font-[var(--mono)] text-[17px] font-bold text-[var(--accent)]">04.</span>
                <span className="font-[var(--mono)] text-[17px] font-bold tracking-[0.18em] uppercase bg-[linear-gradient(100deg,#fff_0%,var(--accent)_100%)] bg-clip-text text-transparent">
                  Portfolio
                </span>
              </div>
              <h3 className="text-[clamp(27px,3.3vw,44px)] font-bold tracking-[-0.035em] leading-[1.03] mb-[18px]">
                Everything,
                <br />
                one screen.
              </h3>
              <p className="fp text-[16px] text-[var(--muted)] leading-[1.62] max-w-[42ch] mb-[26px] max-[560px]:max-w-none">
                Every position and balance across your wallet on one screen — no tabs, no block
                explorers.
              </p>
              {/* flist */}
              <div className="flex flex-col gap-[11px]">
                <div className="flex items-center gap-3 text-[14.5px] text-[var(--text)] max-[560px]:text-[14px]">
                  <svg viewBox="0 0 16 16" fill="none" className="w-[15px] h-[15px] shrink-0">
                    <path
                      d="M3.5 8.5l3 3 6-7"
                      stroke="var(--accent)"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                  Unified balances &amp; history
                </div>
                <div className="flex items-center gap-3 text-[14.5px] text-[var(--text)] max-[560px]:text-[14px]">
                  <svg viewBox="0 0 16 16" fill="none" className="w-[15px] h-[15px] shrink-0">
                    <path
                      d="M3.5 8.5l3 3 6-7"
                      stroke="var(--accent)"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                  Live per-asset performance
                </div>
              </div>
            </div>
            {/* fviz: col 7-12 on desktop */}
            <div className="fviz reveal d1 col-start-7 col-end-13 min-w-0 max-[900px]:col-span-full">
              {/* panel */}
              <div className="min-w-0 border border-[var(--line-2)] rounded-[22px] bg-[linear-gradient(160deg,rgba(24,33,47,0.66),rgba(9,13,20,0.62))] overflow-hidden relative shadow-[0_30px_80px_-50px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.045)] transition-[border-color,box-shadow] duration-500">
                {/* panel-cap */}
                <div className="flex justify-between items-center px-5 py-[14px] border-b border-[var(--line)] font-[var(--mono)] text-[11px] tracking-[0.12em] uppercase bg-white/[0.03]">
                  {/* cap-line */}
                  <span className="font-[var(--font)] text-[16px] font-semibold tracking-[-0.01em] normal-case bg-[linear-gradient(100deg,#fff_0%,var(--accent)_100%)] bg-clip-text text-transparent">
                    All your positions, unified.
                  </span>
                </div>
                {/* panel-pad */}
                <div className="p-[clamp(26px,4vw,46px)] max-[560px]:p-5">
                  <div className="port" id="port">
                    <div className="pf-top">
                      <div>
                        <div className="pf-lbl">Total value</div>
                        <div className="pf-val" id="pfVal">
                          $925.20
                        </div>
                      </div>
                      <div className="pf-chg">▲ 6.4% past 30d</div>
                    </div>
                    <svg
                      className="pf-chart"
                      id="pfChart"
                      viewBox="0 0 320 92"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient id="pfStroke" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0" stopColor="#A5F3FC"></stop>
                          <stop offset="1" stopColor="#0EA5E9"></stop>
                        </linearGradient>
                        <linearGradient id="pfFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0" stopColor="rgba(103,232,249,.30)"></stop>
                          <stop offset="1" stopColor="rgba(103,232,249,0)"></stop>
                        </linearGradient>
                      </defs>
                      <path
                        className="pf-area"
                        id="pfArea"
                        fill="url(#pfFill)"
                        d="M0 74 L26 70 L52 72 L78 60 L104 64 L130 50 L156 54 L182 40 L208 44 L234 30 L260 34 L286 20 L320 14 L320 92 L0 92 Z"
                      ></path>
                      <path
                        className="pf-line"
                        id="pfLine"
                        d="M0 74 L26 70 L52 72 L78 60 L104 64 L130 50 L156 54 L182 40 L208 44 L234 30 L260 34 L286 20 L320 14"
                      ></path>
                      <circle
                        className="pf-dot"
                        id="pfDot"
                        cx="320"
                        cy="14"
                        r="4"
                        fill="#fff"
                        stroke="#0EA5E9"
                        strokeWidth="2"
                      ></circle>
                    </svg>
                    <div className="port-sec">Positions</div>
                    <div className="pos-deck" id="posDeck">
                      <div className="pos-track" id="posTrack">
                        <div className="pos-group">
                          <div className="pg-head">
                            <img className="pg-ic" src="/partners/aquarius.svg" alt="" />
                            <span className="pg-name">Aquarius</span>
                            <span className="pg-count">1 position</span>
                            <span className="pg-val">$0.66</span>
                            <svg className="pg-cv" viewBox="0 0 12 12" fill="none">
                              <path
                                d="M3 4.5 6 7.5 9 4.5"
                                stroke="currentColor"
                                strokeWidth="1.3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              ></path>
                            </svg>
                          </div>
                          <div className="pos-row">
                            <span className="pr-badge usdc">
                              <img src="/tokens/usdc.svg" alt="USDC" />
                            </span>
                            <div className="pr-main">
                              <div className="pr-name">
                                XLM/USDC <i>Volatile</i> <span className="pr-type lp">LP</span>
                              </div>
                              <div className="pr-stats">
                                <span>
                                  <b>APY</b>0.00%
                                </span>
                                <span>
                                  <b>Rewards</b>
                                  <span className="rew">0.3654365 AQUA</span>
                                </span>
                                <span>
                                  <b>Amount</b>2.0748 XLM, 0.3302 USDC
                                </span>
                              </div>
                            </div>
                            <div className="pr-right">
                              <div className="pr-val">$0.66</div>
                              <div className="pr-day">+0.0173/day</div>
                            </div>
                          </div>
                        </div>
                        <div className="pos-group">
                          <div className="pg-head">
                            <img className="pg-ic" src="/partners/blend.svg" alt="" />
                            <span className="pg-name">Blend Protocol</span>
                            <span className="pg-count">1 position</span>
                            <span className="pg-val">$0.02</span>
                            <svg className="pg-cv" viewBox="0 0 12 12" fill="none">
                              <path
                                d="M3 4.5 6 7.5 9 4.5"
                                stroke="currentColor"
                                strokeWidth="1.3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              ></path>
                            </svg>
                          </div>
                          <div className="pg-sub-pool">
                            Fixed Pool <span>1 position</span>
                          </div>
                          <div className="pos-row">
                            <span className="pr-badge xlm">
                              <img src="/tokens/xlm.svg" alt="XLM" />
                            </span>
                            <div className="pr-main">
                              <div className="pr-name">
                                XLM Collateral <span className="pr-type supply">Supply</span>
                              </div>
                              <div className="pr-stats">
                                <span>
                                  <b>APY</b>0.00%
                                </span>
                                <span>
                                  <b>Rewards</b>
                                  <span className="rew">0.0000043 BLND</span>
                                </span>
                                <span>
                                  <b>Amount</b>0.1 XLM
                                </span>
                              </div>
                            </div>
                            <div className="pr-right">
                              <div className="pr-val">$0.02</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pos-pager" id="posPager">
                      <i className="on"></i>
                      <i></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider"></div>
    </>
  );
}
