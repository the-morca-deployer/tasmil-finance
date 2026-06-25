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
                  {/* chat */}
                  <div className="min-w-0 h-[380px] overflow-hidden text-[13.5px] relative" id="chat">
                    {/* chat-thread */}
                    <div className="min-w-0 flex flex-col gap-[13px] transition-transform duration-[550ms] [transition-timing-function:var(--ease)] will-change-transform" id="chatThread">

                      {/* cmsg user msg 1 — default hidden, show/in via data-* */}
                      <div
                        className="hidden items-end gap-[10px] opacity-0 translate-y-3 scale-[0.98] transition-[opacity,transform] duration-[550ms] [transition-timing-function:var(--ease)] flex-row-reverse data-[show=true]:flex data-[in=true]:opacity-100 data-[in=true]:translate-y-0 data-[in=true]:scale-100"
                        data-c="1"
                      >
                        {/* bub user */}
                        <div className="px-[15px] py-[11px] rounded-[16px] leading-[1.45] max-w-[76%] bg-[var(--grad)] text-[#04141a] font-medium rounded-br-[5px]">
                          Supply 500 USDC to Blend at the best rate.
                        </div>
                      </div>

                      {/* cmsg bot msg 2 (typing) */}
                      <div
                        className="hidden items-end gap-[10px] opacity-0 translate-y-3 scale-[0.98] transition-[opacity,transform] duration-[550ms] [transition-timing-function:var(--ease)] data-[show=true]:flex data-[in=true]:opacity-100 data-[in=true]:translate-y-0 data-[in=true]:scale-100"
                        data-c="2"
                      >
                        {/* c-av bot */}
                        <img className="w-[40px] h-[40px] rounded-none bg-none border-none object-contain p-0 flex-none" src="/tasmil-logo.png" alt="Tasmil" />
                        {/* bub typing */}
                        <div className="flex gap-[5px] px-[17px] py-[15px] rounded-[16px] max-w-[76%] bg-white/[0.05] border border-[var(--line-2)] text-[var(--text)] rounded-bl-[5px]">
                          <span className="w-[6px] h-[6px] rounded-full bg-[var(--accent)] motion-safe:animate-[typ_1.25s_infinite]"></span>
                          <span className="w-[6px] h-[6px] rounded-full bg-[var(--accent)] motion-safe:animate-[typ_1.25s_0.16s_infinite]"></span>
                          <span className="w-[6px] h-[6px] rounded-full bg-[var(--accent)] motion-safe:animate-[typ_1.25s_0.32s_infinite]"></span>
                        </div>
                      </div>

                      {/* cmsg bot msg 3 (plan-card) */}
                      <div
                        className="hidden items-end gap-[10px] opacity-0 translate-y-3 scale-[0.98] transition-[opacity,transform] duration-[550ms] [transition-timing-function:var(--ease)] data-[show=true]:flex data-[in=true]:opacity-100 data-[in=true]:translate-y-0 data-[in=true]:scale-100"
                        data-c="3"
                      >
                        {/* c-av bot */}
                        <img className="w-[40px] h-[40px] rounded-none bg-none border-none object-contain p-0 flex-none" src="/tasmil-logo.png" alt="Tasmil" />
                        {/* plan-card */}
                        <div className="flex-1 min-w-0 bg-white/[0.04] border border-[var(--line-2)] rounded-[14px] rounded-bl-[5px] overflow-hidden">
                          {/* pc-h */}
                          <div className="flex items-center gap-[8px] px-[14px] py-[12px] text-[14.5px] font-bold text-[var(--text)] border-b border-[var(--line)]">
                            Planned route
                          </div>
                          {/* pc-step */}
                          <div className="flex items-center gap-[11px] px-[14px] py-[9px] text-[13px] text-[var(--text)] border-b border-[var(--line)]">
                            {/* pc-i */}
                            <span className="w-[18px] h-[18px] rounded-[6px] flex-none grid place-items-center font-[var(--mono)] text-[10px] font-bold bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--accent)]">1</span>
                            Quote best USDC supply venue
                          </div>
                          <div className="flex items-center gap-[11px] px-[14px] py-[9px] text-[13px] text-[var(--text)] border-b border-[var(--line)]">
                            <span className="w-[18px] h-[18px] rounded-[6px] flex-none grid place-items-center font-[var(--mono)] text-[10px] font-bold bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--accent)]">2</span>
                            Supply 500.00 USDC → Blend
                          </div>
                          {/* pc-foot */}
                          <div className="flex items-center justify-between px-[14px] py-[10px]">
                            {/* pc-apy */}
                            <span className="font-[var(--mono)] text-[12px] font-semibold bg-[var(--grad)] bg-clip-text text-transparent">8.76% APY</span>
                            {/* pc-go — pulses when ancestor cmsg has data-in=true */}
                            <span
                              className="text-[12px] font-semibold text-[var(--accent)] bg-[var(--accent-soft)] border border-[var(--accent-line)] px-[12px] py-[5px] rounded-[100px] [[data-in=true]_&]:animate-[pcPulse_1.5s_var(--ease)_infinite]"
                              id="pcGo"
                            >
                              Approve →
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* cmsg user msg 4 (sm bub) */}
                      <div
                        className="hidden items-end gap-[10px] opacity-0 translate-y-3 scale-[0.98] transition-[opacity,transform] duration-[550ms] [transition-timing-function:var(--ease)] flex-row-reverse data-[show=true]:flex data-[in=true]:opacity-100 data-[in=true]:translate-y-0 data-[in=true]:scale-100"
                        data-c="4"
                      >
                        {/* bub sm user */}
                        <div className="px-[14px] py-[8px] rounded-[16px] leading-[1.45] max-w-[76%] text-[13px] bg-[var(--grad)] text-[#04141a] font-medium rounded-br-[5px]">
                          Approve
                        </div>
                      </div>

                      {/* cmsg bot msg 5 (supply-card) */}
                      <div
                        className="hidden items-end gap-[10px] opacity-0 translate-y-3 scale-[0.98] transition-[opacity,transform] duration-[550ms] [transition-timing-function:var(--ease)] data-[show=true]:flex data-[in=true]:opacity-100 data-[in=true]:translate-y-0 data-[in=true]:scale-100"
                        data-c="5"
                      >
                        {/* c-av bot */}
                        <img className="w-[40px] h-[40px] rounded-none bg-none border-none object-contain p-0 flex-none" src="/tasmil-logo.png" alt="Tasmil" />
                        {/* supply-card */}
                        <div className="flex-1 min-w-0 bg-white/[0.04] border border-[var(--line-2)] rounded-[14px] rounded-bl-[5px] overflow-hidden">
                          {/* sc-h */}
                          <div className="flex flex-col gap-[2px] px-[14px] py-[12px] border-b border-[var(--line)] text-[14.5px] font-bold">
                            Confirm Supply
                            <span className="text-[10.5px] font-normal text-[var(--dim)] font-[var(--mono)] tracking-[0.02em]">Review details before signing</span>
                          </div>
                          {/* sc-row */}
                          <div className="flex justify-between items-center gap-[12px] px-[14px] py-[8px] text-[12.5px] border-b border-[var(--line)]">
                            <span className="text-[var(--muted)]">Amount to supply</span>
                            <span className="font-[var(--mono)] font-semibold text-[var(--text)] whitespace-nowrap">500.00 USDC</span>
                          </div>
                          <div className="flex justify-between items-center gap-[12px] px-[14px] py-[8px] text-[12.5px] border-b border-[var(--line)]">
                            <span className="text-[var(--muted)]">Best venue</span>
                            <span className="font-[var(--mono)] font-semibold text-[var(--text)] whitespace-nowrap">Blend Fixed Pool</span>
                          </div>
                          <div className="flex justify-between items-center gap-[12px] px-[14px] py-[8px] text-[12.5px] border-b border-[var(--line)]">
                            <span className="text-[var(--muted)]">Supply APY</span>
                            {/* sc-v grad — .grad is shared, keep class */}
                            <span className="font-[var(--mono)] font-semibold whitespace-nowrap grad">8.76%</span>
                          </div>
                          <div className="flex justify-between items-center gap-[12px] px-[14px] py-[8px] text-[12.5px] border-b border-[var(--line)]">
                            <span className="text-[var(--muted)]">Est. yearly earnings</span>
                            <span className="font-[var(--mono)] font-semibold whitespace-nowrap text-[var(--change-pos)]">+43.80 USDC</span>
                          </div>
                          <div className="flex justify-between items-center gap-[12px] px-[14px] py-[8px] text-[12.5px] border-b border-[var(--line)]">
                            <span className="text-[var(--muted)]">Network fee</span>
                            <span className="font-[var(--mono)] font-semibold text-[var(--text)] whitespace-nowrap">~$0.001</span>
                          </div>
                          {/* sc-sign button */}
                          <button
                            className="block w-[calc(100%-24px)] mx-[12px] my-[11px] py-[11px] rounded-[999px] border border-transparent bg-[var(--grad)] text-[#04141a] font-[var(--font)] font-bold text-[13px] cursor-pointer transition-[background,color,border-color] duration-[350ms] data-[signing=true]:bg-[var(--accent-soft)] data-[signing=true]:text-[var(--accent)] data-[signing=true]:border-[var(--accent-line)]"
                            id="scSign"
                            type="button"
                          >
                            Sign transaction
                          </button>
                        </div>
                      </div>

                      {/* cmsg receipt msg 6 */}
                      <div
                        className="hidden items-end gap-[10px] opacity-0 translate-y-3 scale-[0.98] transition-[opacity,transform] duration-[550ms] [transition-timing-function:var(--ease)] justify-center data-[show=true]:flex data-[in=true]:opacity-100 data-[in=true]:translate-y-0 data-[in=true]:scale-100"
                        data-c="6"
                      >
                        {/* rc */}
                        <div className="inline-flex items-center gap-[9px] font-[var(--mono)] text-[12px] text-[var(--change-pos)] bg-[rgba(134,239,172,0.08)] border border-[rgba(134,239,172,0.28)] px-[16px] py-[9px] rounded-[100px]">
                          {/* rc-ck */}
                          <span className="w-[17px] h-[17px] rounded-full flex-none grid place-items-center text-[11px] bg-[var(--change-pos)] text-[#04141a] font-bold">✓</span>
                          500 USDC supplied to Blend in ~5s
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
                {/* panel-pad / swap-pad */}
                <div className="flex flex-col gap-[9px] p-[clamp(13px,1.9vw,17px)]" id="swapPad">
                  {/* swap-field: pay */}
                  <div className="min-w-0 bg-white/[0.045] border border-[var(--line-2)] rounded-[16px] px-4 pt-[15px] pb-[13px] transition-[border-color] duration-[400ms]">
                    {/* sf-top */}
                    <div className="min-w-0 flex justify-between items-center gap-[10px] mb-[9px]">
                      <span className="text-[13.5px] text-[var(--muted)] whitespace-nowrap">You pay</span>
                      <span className="inline-flex items-center gap-[5px] text-[11.5px] font-[var(--mono)] text-[var(--muted)] bg-white/[0.06] border border-[var(--line-2)] rounded-full px-[9px] py-1 whitespace-nowrap">
                        GDQI7L…3I6R
                        <svg viewBox="0 0 12 12" fill="none" className="w-[11px] h-[11px] flex-none opacity-70">
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
                    {/* sf-mid */}
                    <div className="min-w-0 flex justify-between items-center gap-3">
                      <div
                        className="text-[clamp(28px,4vw,38px)] font-semibold tracking-[-0.02em] [font-variant-numeric:tabular-nums] text-[var(--text)] leading-none min-w-0 overflow-hidden whitespace-nowrap data-[zero=true]:text-[var(--muted)]"
                        id="payAmt"
                        data-zero="true"
                      >
                        0
                      </div>
                      <span className="inline-flex items-center gap-[9px] bg-white/[0.06] border border-[var(--line-2)] rounded-full py-[5px] pl-[5px] pr-[11px] flex-none">
                        <span className="w-[30px] h-[30px] rounded-full grid place-items-center flex-none overflow-hidden bg-[radial-gradient(circle_at_34%_30%,#1c2636,#070b12)] border border-[var(--line-2)]">
                          <img src="/tokens/xlm.svg" alt="XLM" className="w-[17px] h-[17px] object-contain brightness-0 invert" />
                        </span>
                        <span className="flex flex-col leading-[1.12] text-left">
                          <b className="text-[14px] font-bold">XLM</b>
                          <i className="text-[10px] not-italic text-[var(--dim)]">Stellar</i>
                        </span>
                        <svg className="w-3 h-3 text-[var(--dim)] flex-none" viewBox="0 0 12 12" fill="none">
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
                    {/* sf-sub */}
                    <div className="min-w-0 flex justify-between items-center gap-[10px] mt-[10px] text-[12px] font-[var(--mono)] text-[var(--muted)]">
                      <span id="payUsd">$0</span>
                      <span className="text-[var(--muted)]">Balance 4.247 XLM</span>
                    </div>
                  </div>
                  {/* swap-mid */}
                  <div className="flex justify-center relative z-[2] -my-[6px]">
                    <button
                      className="w-9 h-9 rounded-[11px] bg-[#10151f] border border-[var(--line-2)] grid place-items-center cursor-pointer text-[var(--text)] [transition:transform_0.55s_var(--ease),border-color_0.3s,color_0.3s] hover:text-[var(--accent)] data-[spin=true]:rotate-180 motion-reduce:transition-none"
                      id="swapFlip"
                      type="button"
                      aria-label="Swap direction"
                      data-spin="false"
                    >
                      <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
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
                  {/* swap-field: receive */}
                  <div className="min-w-0 bg-white/[0.045] border border-[var(--line-2)] rounded-[16px] px-4 pt-[15px] pb-[13px] transition-[border-color] duration-[400ms]">
                    {/* sf-top */}
                    <div className="min-w-0 flex justify-between items-center gap-[10px] mb-[9px]">
                      <span className="text-[13.5px] text-[var(--muted)] whitespace-nowrap">You receive</span>
                      <span className="inline-flex items-center gap-[5px] text-[11.5px] font-[var(--mono)] text-[var(--accent)] bg-white/[0.06] border border-[var(--accent-line)] rounded-full px-[9px] py-1 whitespace-nowrap">
                        + Add Address
                      </span>
                    </div>
                    {/* sf-mid */}
                    <div className="min-w-0 flex justify-between items-center gap-3">
                      <div
                        className="text-[clamp(28px,4vw,38px)] font-semibold tracking-[-0.02em] [font-variant-numeric:tabular-nums] text-[var(--text)] leading-none min-w-0 overflow-hidden whitespace-nowrap data-[zero=true]:text-[var(--muted)]"
                        id="recvAmt"
                        data-zero="true"
                      >
                        0
                      </div>
                      <span className="inline-flex items-center gap-[9px] bg-white/[0.06] border border-[var(--line-2)] rounded-full py-[5px] pl-[5px] pr-[11px] flex-none">
                        <span className="w-[30px] h-[30px] rounded-full grid place-items-center flex-none overflow-hidden bg-[#0b53bf]">
                          <img src="/tokens/usdc.svg" alt="USDC" className="w-full h-full object-cover" />
                        </span>
                        <span className="flex flex-col leading-[1.12] text-left">
                          <b className="text-[14px] font-bold">USDC</b>
                          <i className="text-[10px] not-italic text-[var(--dim)]">Stellar</i>
                        </span>
                        <svg className="w-3 h-3 text-[var(--dim)] flex-none" viewBox="0 0 12 12" fill="none">
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
                    {/* sf-sub */}
                    <div className="min-w-0 flex justify-between items-center gap-[10px] mt-[10px] text-[12px] font-[var(--mono)] text-[var(--muted)]">
                      <span id="recvUsd">$0</span>
                      <span
                        className="text-[var(--accent)] opacity-0 transition-opacity duration-[400ms] motion-reduce:transition-none"
                        id="recvRoute"
                      ></span>
                    </div>
                  </div>
                  {/* swap-cta */}
                  <button
                    className="mt-[3px] w-full py-[15px] rounded-full border border-[var(--line-2)] bg-white/[0.05] text-[var(--muted)] font-[var(--font)] text-[15px] font-semibold tracking-[-0.01em] cursor-default [transition:background_0.45s_var(--ease),color_0.4s,border-color_0.4s,box-shadow_0.45s] motion-reduce:transition-none data-[state=quoting]:text-[var(--text)] data-[state=ready]:bg-[var(--grad)] data-[state=ready]:text-[#04141a] data-[state=ready]:border-transparent data-[state=ready]:shadow-[0_16px_40px_-18px_var(--accent-glow)]"
                    id="swapCta"
                    type="button"
                    data-state="idle"
                  >
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
                  {/* farm-ui — JS hook: .farm-ui class MUST stay for querySelector */}
                  <div className="farm-ui flex flex-col gap-[15px]">
                    {/* farm-presets */}
                    <div
                      className="relative grid grid-cols-3 gap-0 bg-white/[0.04] border border-[var(--line-2)] rounded-full p-[5px]"
                      id="farmPresets"
                    >
                      {/* fp-thumb: sliding highlight, positioned by JS transform */}
                      <span
                        className="absolute top-[5px] bottom-[5px] left-[5px] w-[calc((100%-10px)/3)] rounded-full bg-[var(--grad)] shadow-[0_4px_16px_-4px_var(--accent-glow)] [transform:translateX(100%)] [transition:transform_0.5s_cubic-bezier(0.55,0.06,0.2,1)] z-0"
                        id="fpThumb"
                      ></span>
                      {/* fp-opt — JS hook: .fp-opt class MUST stay for querySelectorAll */}
                      <button
                        className="fp-opt relative z-[1] py-[11px] px-0 border-none bg-transparent rounded-full text-[var(--muted)] font-[var(--font)] text-[13.5px] font-semibold cursor-pointer transition-colors duration-300 data-[active=true]:text-[#04141a]"
                        type="button"
                        data-active="false"
                      >
                        Safe
                      </button>
                      <button
                        className="fp-opt relative z-[1] py-[11px] px-0 border-none bg-transparent rounded-full text-[var(--muted)] font-[var(--font)] text-[13.5px] font-semibold cursor-pointer transition-colors duration-300 data-[active=true]:text-[#04141a]"
                        type="button"
                        data-active="true"
                      >
                        Balanced
                      </button>
                      <button
                        className="fp-opt relative z-[1] py-[11px] px-0 border-none bg-transparent rounded-full text-[var(--muted)] font-[var(--font)] text-[13.5px] font-semibold cursor-pointer transition-colors duration-300 data-[active=true]:text-[#04141a]"
                        type="button"
                        data-active="false"
                      >
                        Aggressive
                      </button>
                    </div>
                    {/* farm-summary */}
                    <div className="flex gap-3 max-[560px]:gap-[10px]">
                      {/* fs-apy */}
                      <div className="flex-1 bg-white/[0.045] border border-[var(--line-2)] rounded-[14px] p-[13px_16px] flex flex-col gap-[5px]">
                        <span className="text-[11px] font-[var(--mono)] tracking-[0.08em] uppercase text-[var(--dim)]">
                          Net APY
                        </span>
                        <span
                          className="text-[25px] max-[560px]:text-[22px] font-bold font-[var(--mono)] bg-[linear-gradient(110deg,#fff_0%,var(--accent)_55%,var(--accent-2)_100%)] bg-clip-text text-transparent leading-none"
                          id="farmApy"
                        >
                          8.4%
                        </span>
                      </div>
                      {/* fs-val */}
                      <div className="flex-1 bg-white/[0.045] border border-[var(--line-2)] rounded-[14px] p-[13px_16px] flex flex-col gap-[5px]">
                        <span className="text-[11px] font-[var(--mono)] tracking-[0.08em] uppercase text-[var(--dim)]">
                          Value now
                        </span>
                        <span
                          className="text-[25px] max-[560px]:text-[22px] font-bold font-[var(--mono)] text-[var(--change-pos)] leading-none"
                          id="farmVal"
                        >
                          $1,084.20
                        </span>
                      </div>
                    </div>
                    {/* farm-alloc */}
                    <div className="flex flex-col gap-3 py-[2px]">
                      {/* fa-row: Blend */}
                      <div className="grid grid-cols-[104px_1fr_42px] items-center gap-3 text-[13.5px]">
                        <span className="flex items-center gap-[9px] text-[var(--text)] whitespace-nowrap">
                          <i className="w-[9px] h-[9px] rounded-full flex-none bg-[var(--c-blend)]"></i>Blend
                        </span>
                        <span className="h-2 rounded-[99px] bg-white/[0.07] overflow-hidden">
                          <i
                            id="fb0"
                            style={{ width: "40%", background: "var(--c-blend)" }}
                            className="block h-full rounded-[99px] [transition:width_0.8s_var(--ease)]"
                          ></i>
                        </span>
                        <span className="font-[var(--mono)] text-[12.5px] text-[var(--muted)] text-right" id="fp0">
                          40%
                        </span>
                      </div>
                      {/* fa-row: Soroswap */}
                      <div className="grid grid-cols-[104px_1fr_42px] items-center gap-3 text-[13.5px]">
                        <span className="flex items-center gap-[9px] text-[var(--text)] whitespace-nowrap">
                          <i className="w-[9px] h-[9px] rounded-full flex-none bg-[var(--c-soroswap)]"></i>Soroswap
                        </span>
                        <span className="h-2 rounded-[99px] bg-white/[0.07] overflow-hidden">
                          <i
                            id="fb1"
                            style={{ width: "28%", background: "var(--c-soroswap)" }}
                            className="block h-full rounded-[99px] [transition:width_0.8s_var(--ease)]"
                          ></i>
                        </span>
                        <span className="font-[var(--mono)] text-[12.5px] text-[var(--muted)] text-right" id="fp1">
                          28%
                        </span>
                      </div>
                      {/* fa-row: Aquarius */}
                      <div className="grid grid-cols-[104px_1fr_42px] items-center gap-3 text-[13.5px]">
                        <span className="flex items-center gap-[9px] text-[var(--text)] whitespace-nowrap">
                          <i className="w-[9px] h-[9px] rounded-full flex-none bg-[var(--c-aquarius)]"></i>Aquarius
                        </span>
                        <span className="h-2 rounded-[99px] bg-white/[0.07] overflow-hidden">
                          <i
                            id="fb2"
                            style={{ width: "20%", background: "var(--c-aquarius)" }}
                            className="block h-full rounded-[99px] [transition:width_0.8s_var(--ease)]"
                          ></i>
                        </span>
                        <span className="font-[var(--mono)] text-[12.5px] text-[var(--muted)] text-right" id="fp2">
                          20%
                        </span>
                      </div>
                      {/* fa-row: Phoenix */}
                      <div className="grid grid-cols-[104px_1fr_42px] items-center gap-3 text-[13.5px]">
                        <span className="flex items-center gap-[9px] text-[var(--text)] whitespace-nowrap">
                          <i className="w-[9px] h-[9px] rounded-full flex-none bg-[var(--c-phoenix)]"></i>Phoenix
                        </span>
                        <span className="h-2 rounded-[99px] bg-white/[0.07] overflow-hidden">
                          <i
                            id="fb3"
                            style={{ width: "12%", background: "var(--c-phoenix)" }}
                            className="block h-full rounded-[99px] [transition:width_0.8s_var(--ease)]"
                          ></i>
                        </span>
                        <span className="font-[var(--mono)] text-[12.5px] text-[var(--muted)] text-right" id="fp3">
                          12%
                        </span>
                      </div>
                    </div>
                    {/* farm-foot */}
                    <div className="flex justify-between items-center font-[var(--mono)] text-[11.5px] text-[var(--dim)] pt-[3px]">
                      <span>Rebalances every 10 min</span>
                      {/* farm-live */}
                      <span className="text-[var(--change-pos)] inline-flex items-center gap-[7px]">
                        <i className="w-[7px] h-[7px] rounded-full bg-[var(--change-pos)] shadow-[0_0_7px_var(--change-pos)] motion-safe:animate-farm-live-pulse"></i>
                        Live
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
                  {/* port: group anchor for data-[in=true]: ancestor variants */}
                  <div className="group" id="port">
                    {/* pf-top */}
                    <div className="flex items-end justify-between gap-[14px] mb-[6px]">
                      <div>
                        {/* pf-lbl */}
                        <div className="font-[var(--mono)] text-[10.5px] tracking-[0.16em] uppercase text-[var(--dim)] mb-[5px]">
                          Total value
                        </div>
                        {/* pf-val */}
                        <div
                          className="font-[var(--mono)] text-[clamp(24px,3.4vw,32px)] font-semibold tracking-[-0.02em]"
                          id="pfVal"
                        >
                          $925.20
                        </div>
                      </div>
                      {/* pf-chg */}
                      <div className="inline-flex items-center gap-[6px] font-[var(--mono)] text-[12.5px] font-semibold text-[var(--change-pos)] bg-[rgba(134,239,172,0.08)] border border-[rgba(134,239,172,0.26)] px-[11px] py-[6px] rounded-full">
                        ▲ 6.4% past 30d
                      </div>
                    </div>
                    {/* pf-chart: group so pf-area/pf-dot react to #port data-in */}
                    <svg
                      className="w-full h-auto block my-[6px_0_14px] overflow-visible"
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
                      {/* pf-area: hidden until #port gets data-in="true" */}
                      <path
                        className="opacity-0 [transition:opacity_1.1s_var(--ease)] group-data-[in=true]:opacity-100"
                        id="pfArea"
                        fill="url(#pfFill)"
                        d="M0 74 L26 70 L52 72 L78 60 L104 64 L130 50 L156 54 L182 40 L208 44 L234 30 L260 34 L286 20 L320 14 L320 92 L0 92 Z"
                      ></path>
                      {/* pf-line: stroke drawn via JS strokeDashoffset */}
                      <path
                        className="fill-none stroke-[url(#pfStroke)] stroke-2 [stroke-linecap:round] [stroke-linejoin:round] [filter:drop-shadow(0_3px_10px_var(--accent-glow))]"
                        id="pfLine"
                        d="M0 74 L26 70 L52 72 L78 60 L104 64 L130 50 L156 54 L182 40 L208 44 L234 30 L260 34 L286 20 L320 14"
                      ></path>
                      {/* pf-dot: hidden until #port gets data-in="true", delayed 0.9s */}
                      <circle
                        className="opacity-0 [transition:opacity_0.4s_var(--ease)_0.9s] group-data-[in=true]:opacity-100"
                        id="pfDot"
                        cx="320"
                        cy="14"
                        r="4"
                        fill="#fff"
                        stroke="#0EA5E9"
                        strokeWidth="2"
                      ></circle>
                    </svg>
                    {/* port-sec */}
                    <div className="text-[11px] font-[var(--mono)] uppercase tracking-[0.1em] text-[var(--dim)] mt-[16px] mb-[12px]">
                      Positions
                    </div>
                    {/* pos-deck: overflow hidden, height animated by JS */}
                    <div
                      className="overflow-hidden [transition:height_0.55s_var(--ease)]"
                      id="posDeck"
                    >
                      {/* pos-track: flex, transform animated by JS */}
                      <div
                        className="flex [transition:transform_0.55s_var(--ease)] will-change-transform"
                        id="posTrack"
                      >
                        {/* pos-group 1: flex-shrink-0 100% wide for carousel */}
                        <div className="flex-[0_0_100%] border border-[var(--line-2)] rounded-[16px] bg-white/[0.025] overflow-hidden mb-0">
                          {/* pg-head */}
                          <div className="flex items-center gap-[10px] px-[14px] py-[11px] border-b border-[var(--line)]">
                            {/* pg-ic */}
                            <img
                              className="w-[26px] h-[26px] rounded-full flex-none object-contain bg-white/[0.05]"
                              src="/partners/aquarius.svg"
                              alt=""
                            />
                            {/* pg-name */}
                            <span className="font-bold text-[13.5px]">Aquarius</span>
                            {/* pg-count */}
                            <span className="text-[11px] text-[var(--dim)] font-[var(--mono)]">
                              1 position
                            </span>
                            {/* pg-val */}
                            <span className="ml-auto font-[var(--mono)] font-semibold text-[13.5px]">
                              $0.66
                            </span>
                            {/* pg-cv */}
                            <svg
                              className="w-[12px] h-[12px] text-[var(--dim)] flex-none"
                              viewBox="0 0 12 12"
                              fill="none"
                            >
                              <path
                                d="M3 4.5 6 7.5 9 4.5"
                                stroke="currentColor"
                                strokeWidth="1.3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              ></path>
                            </svg>
                          </div>
                          {/* pos-row */}
                          <div className="flex items-start gap-[11px] px-[14px] py-[12px]">
                            {/* pr-badge usdc */}
                            <span className="w-[30px] h-[30px] rounded-full flex-none grid place-items-center overflow-hidden bg-[#0b53bf]">
                              <img
                                className="w-full h-full object-cover"
                                src="/tokens/usdc.svg"
                                alt="USDC"
                              />
                            </span>
                            {/* pr-main */}
                            <div className="flex-1 min-w-0">
                              {/* pr-name */}
                              <div className="flex items-center gap-[8px] font-semibold text-[13.5px] flex-wrap">
                                XLM/USDC{" "}
                                <i className="not-italic text-[11px] text-[var(--dim)] font-[var(--mono)]">
                                  Volatile
                                </i>{" "}
                                {/* pr-type lp */}
                                <span className="text-[10px] font-[var(--mono)] font-semibold px-[7px] py-[2px] rounded-[6px] uppercase tracking-[0.04em] bg-[rgba(234,179,8,0.14)] text-[#facc15] border border-[rgba(234,179,8,0.32)]">
                                  LP
                                </span>
                              </div>
                              {/* pr-stats */}
                              <div className="mt-[8px] flex flex-col gap-[5px] text-[11.5px] font-[var(--mono)]">
                                <span className="text-[var(--text)] flex gap-[8px]">
                                  <b className="flex-none w-[64px] text-[var(--dim)] font-normal">
                                    APY
                                  </b>
                                  0.00%
                                </span>
                                <span className="text-[var(--text)] flex gap-[8px]">
                                  <b className="flex-none w-[64px] text-[var(--dim)] font-normal">
                                    Rewards
                                  </b>
                                  <span className="text-[var(--accent)]">0.3654365 AQUA</span>
                                </span>
                                <span className="text-[var(--text)] flex gap-[8px]">
                                  <b className="flex-none w-[64px] text-[var(--dim)] font-normal">
                                    Amount
                                  </b>
                                  2.0748 XLM, 0.3302 USDC
                                </span>
                              </div>
                            </div>
                            {/* pr-right */}
                            <div className="text-right flex-none">
                              {/* pr-val */}
                              <div className="font-[var(--mono)] font-bold text-[14px]">$0.66</div>
                              {/* pr-day */}
                              <div className="font-[var(--mono)] text-[10.5px] text-[var(--change-pos)] mt-[3px]">
                                +0.0173/day
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* pos-group 2 */}
                        <div className="flex-[0_0_100%] border border-[var(--line-2)] rounded-[16px] bg-white/[0.025] overflow-hidden mb-0">
                          {/* pg-head */}
                          <div className="flex items-center gap-[10px] px-[14px] py-[11px] border-b border-[var(--line)]">
                            {/* pg-ic */}
                            <img
                              className="w-[26px] h-[26px] rounded-full flex-none object-contain bg-white/[0.05]"
                              src="/partners/blend.svg"
                              alt=""
                            />
                            {/* pg-name */}
                            <span className="font-bold text-[13.5px]">Blend Protocol</span>
                            {/* pg-count */}
                            <span className="text-[11px] text-[var(--dim)] font-[var(--mono)]">
                              1 position
                            </span>
                            {/* pg-val */}
                            <span className="ml-auto font-[var(--mono)] font-semibold text-[13.5px]">
                              $0.02
                            </span>
                            {/* pg-cv */}
                            <svg
                              className="w-[12px] h-[12px] text-[var(--dim)] flex-none"
                              viewBox="0 0 12 12"
                              fill="none"
                            >
                              <path
                                d="M3 4.5 6 7.5 9 4.5"
                                stroke="currentColor"
                                strokeWidth="1.3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              ></path>
                            </svg>
                          </div>
                          {/* pg-sub-pool */}
                          <div className="flex items-center gap-[8px] px-[14px] py-[8px] border-b border-[var(--line)] text-[11.5px] font-[var(--mono)] text-[var(--muted)]">
                            Fixed Pool{" "}
                            <span className="text-[var(--dim)]">1 position</span>
                          </div>
                          {/* pos-row */}
                          <div className="flex items-start gap-[11px] px-[14px] py-[12px]">
                            {/* pr-badge xlm */}
                            <span className="w-[30px] h-[30px] rounded-full flex-none grid place-items-center overflow-hidden bg-[radial-gradient(circle_at_34%_30%,#1c2636,#070b12)] border border-[var(--line-2)]">
                              <img
                                className="w-[17px] h-[17px] object-contain brightness-0 invert"
                                src="/tokens/xlm.svg"
                                alt="XLM"
                              />
                            </span>
                            {/* pr-main */}
                            <div className="flex-1 min-w-0">
                              {/* pr-name */}
                              <div className="flex items-center gap-[8px] font-semibold text-[13.5px] flex-wrap">
                                XLM Collateral{" "}
                                {/* pr-type supply */}
                                <span className="text-[10px] font-[var(--mono)] font-semibold px-[7px] py-[2px] rounded-[6px] uppercase tracking-[0.04em] bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-line)]">
                                  Supply
                                </span>
                              </div>
                              {/* pr-stats */}
                              <div className="mt-[8px] flex flex-col gap-[5px] text-[11.5px] font-[var(--mono)]">
                                <span className="text-[var(--text)] flex gap-[8px]">
                                  <b className="flex-none w-[64px] text-[var(--dim)] font-normal">
                                    APY
                                  </b>
                                  0.00%
                                </span>
                                <span className="text-[var(--text)] flex gap-[8px]">
                                  <b className="flex-none w-[64px] text-[var(--dim)] font-normal">
                                    Rewards
                                  </b>
                                  <span className="text-[var(--accent)]">0.0000043 BLND</span>
                                </span>
                                <span className="text-[var(--text)] flex gap-[8px]">
                                  <b className="flex-none w-[64px] text-[var(--dim)] font-normal">
                                    Amount
                                  </b>
                                  0.1 XLM
                                </span>
                              </div>
                            </div>
                            {/* pr-right */}
                            <div className="text-right flex-none">
                              {/* pr-val */}
                              <div className="font-[var(--mono)] font-bold text-[14px]">$0.02</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* pos-pager: dot indicators, data-[on=true]: drives active color */}
                    <div
                      className="flex gap-[6px] justify-center mt-[14px]"
                      id="posPager"
                    >
                      <i
                        className="not-italic w-[20px] h-[3px] rounded-[2px] bg-[var(--line-2)] [transition:background_0.4s] cursor-pointer data-[on=true]:bg-[var(--accent)]"
                        data-on="true"
                      ></i>
                      <i
                        className="not-italic w-[20px] h-[3px] rounded-[2px] bg-[var(--line-2)] [transition:background_0.4s] cursor-pointer data-[on=true]:bg-[var(--accent)]"
                        data-on="false"
                      ></i>
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
