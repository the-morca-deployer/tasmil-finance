export default function Convergence() {
  return (
    <section
      id="converge"
      className="section relative text-center"
    >
      <div className="wrap">
        {/* Eyebrow — .ix gradient label */}
        <span className="ix reveal inline-block text-[14.5px] font-bold tracking-[0.2em] uppercase bg-[linear-gradient(100deg,#a5f3fc_0%,var(--accent-2)_100%)] bg-clip-text text-transparent">
          Convergence
        </span>

        {/* Heading */}
        <h2 className="reveal d1 text-[clamp(36px,6vw,84px)] font-bold tracking-[-0.045em] leading-[0.98] mt-[28px]">
          Every protocol.
          <br />
          One vault.
        </h2>

        {/* Lead paragraph */}
        <p className="lead reveal d2 text-[18px] text-[var(--muted)] max-w-[44ch] mx-auto mt-[26px] leading-[1.55]">
          Stellar's top DeFi protocols come fragmented, with separate liquidity, dashboards and
          risk. Tasmil Finance folds them into a single position you control.
        </p>

        {/* Animation stage */}
        <div
          id="convStage"
          className="conv-stage reveal d2 relative w-full max-w-[880px] h-[240px] mx-auto mt-[54px]"
          aria-hidden="true"
        >
          {/* Lane line */}
          <div className="conv-lane absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 bg-[linear-gradient(90deg,transparent,var(--line-2)_14%,var(--line-2)_86%,transparent)]" />

          {/* Vault — must keep .conv-vault class: queried by JS via stage.querySelector(".conv-vault") */}
          <div
            className="conv-vault group absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[112px] h-[112px] rounded-full grid place-items-center bg-[radial-gradient(circle_at_50%_40%,rgba(103,232,249,0.22),rgba(13,17,26,0.7))] border border-[var(--accent-line)] shadow-[0_0_40px_-8px_var(--accent-glow)_inset] z-[3]"
            data-pulse="false"
          >
            {/* Ring — pulses when data-pulse="true" on vault */}
            <div className="cv-ring absolute inset-[-7px] rounded-full border border-[var(--accent)] opacity-0 pointer-events-none group-data-[pulse=true]:animate-[cvPulse_0.7s_cubic-bezier(0.22,1,0.36,1)]" />

            <img src="/tasmil-logo.png" alt="" className="w-[64px] h-[64px] object-contain" />

            <span className="absolute bottom-[-26px] left-1/2 -translate-x-1/2 font-[var(--mono)] text-[11px] tracking-[0.18em] uppercase text-[var(--muted)] whitespace-nowrap">
              Tasmil Vault
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
