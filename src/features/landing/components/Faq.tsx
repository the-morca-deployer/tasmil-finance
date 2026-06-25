// @ts-nocheck
export default function Faq() {
  return (
    <>
      <section className="section faq" id="faq">
        <div className="wrap">
          <div className="faq-head reveal">
            <div className="eyebrow">FAQ</div>
            <h2>
              Answering your <em>most common</em> questions
            </h2>
            <p className="fsub">Everything you need to know before you deploy your first vault.</p>
            <div className="faq-search">
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"></circle>
                <path
                  d="M11 11l3 3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                ></path>
              </svg>
              <input
                id="faqSearch"
                type="text"
                placeholder="Search questions"
                autoComplete="off"
                aria-label="Search FAQ"
              />
            </div>
          </div>

          <div className="faq-list reveal d1" id="faqList">
            <div className="faq-item open">
              <button className="faq-q" type="button">
                What is Tasmil Finance?<span className="faq-toggle" aria-hidden="true"></span>
              </button>
              <div className="faq-a">
                <div className="faq-a-inner">
                  Tasmil Finance is an automated DeFi yield protocol built on Stellar. Deposit USDC
                  or XLM, choose a risk preset, and the rebalance engine spreads your capital across
                  Stellar's top protocols (Blend, Soroswap, Aquarius and Phoenix), compounding yield
                  every ten minutes while you stay fully non-custodial.
                </div>
              </div>
            </div>
            <div className="faq-item">
              <button className="faq-q" type="button">
                Is Tasmil Finance non-custodial?
                <span className="faq-toggle" aria-hidden="true"></span>
              </button>
              <div className="faq-a">
                <div className="faq-a-inner">
                  Yes. Your funds never leave your control. Tasmil Finance operates through a scoped
                  session key that can only rebalance between registered strategies and harvest
                  rewards back to your vault. It can never send funds to external addresses or touch
                  your private key. Revoke access anytime with a single signature.
                </div>
              </div>
            </div>
            <div className="faq-item">
              <button className="faq-q" type="button">
                Which assets can I deposit?<span className="faq-toggle" aria-hidden="true"></span>
              </button>
              <div className="faq-a">
                <div className="faq-a-inner">
                  Tasmil Finance accepts USDC and XLM today. Deposits are routed into the protocols
                  that best fit your chosen preset, and the built-in aggregator quotes Soroswap,
                  SDEX and Aquarius to convert at the cheapest available rate when a strategy
                  requires it.
                </div>
              </div>
            </div>
            <div className="faq-item">
              <button className="faq-q" type="button">
                How does auto-rebalancing work?
                <span className="faq-toggle" aria-hidden="true"></span>
              </button>
              <div className="faq-a">
                <div className="faq-a-inner">
                  Pick Safe, Balanced or Aggressive. The engine spreads your deposit across
                  protocols according to that preset, then re-checks yields every ten minutes,
                  shifting allocations on Stellar rails that settle in about five seconds for a
                  fraction of a cent. Rewards are automatically reinvested so your position
                  compounds without any action from you.
                </div>
              </div>
            </div>
            <div className="faq-item">
              <button className="faq-q" type="button">
                What does it cost?<span className="faq-toggle" aria-hidden="true"></span>
              </button>
              <div className="faq-a">
                <div className="faq-a-inner">
                  There are no deposit fees, no withdrawal fees and no subscription. You pay only
                  Stellar network gas, roughly $0.001 per action. A performance fee on profits above
                  your all-time high is planned but not yet active; when it ships, you'll see it
                  clearly before you ever opt in.
                </div>
              </div>
            </div>
            <div className="faq-item">
              <button className="faq-q" type="button">
                How secure is the protocol?<span className="faq-toggle" aria-hidden="true"></span>
              </button>
              <div className="faq-a">
                <div className="faq-a-inner">
                  Permissions are enforced on-chain through session keys, an automatic circuit
                  breaker halts activity on anomalies, and you can revoke the bot's access at any
                  time. The agent plans routes, but you approve every transaction before it signs.
                  There is no path for it to bypass on-chain rate limits or move funds out of your
                  vault.
                </div>
              </div>
            </div>
            <div className="faq-item">
              <button className="faq-q" type="button">
                Can I withdraw anytime?<span className="faq-toggle" aria-hidden="true"></span>
              </button>
              <div className="faq-a">
                <div className="faq-a-inner">
                  Always. Your capital is never locked. Withdraw all or part of your vault whenever
                  you like, and the engine unwinds the necessary positions and settles back to your
                  wallet in seconds, with no exit fees beyond network gas.
                </div>
              </div>
            </div>
            <div className="faq-item">
              <button className="faq-q" type="button">
                How do I get started?<span className="faq-toggle" aria-hidden="true"></span>
              </button>
              <div className="faq-a">
                <div className="faq-a-inner">
                  Connect a Stellar wallet, deploy your vault, and pick a preset. Your capital
                  starts compounding within minutes. No coding, no protocol-hopping, no
                  spreadsheets. <a href="#start">Launch the app</a> to begin.
                </div>
              </div>
            </div>
          </div>

          <div className="faq-empty" id="faqEmpty">
            No questions match your search.
          </div>

          <p className="faq-foot reveal">
            Still have a question? <a href="#start">Reach out to the team →</a>
          </p>
        </div>
      </section>
    </>
  );
}
