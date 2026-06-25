export default function StellarReel() {
  return (
    <>
      <section
        id="backed"
        aria-label="Backed by Stellar"
        className="relative bg-background text-center overflow-hidden min-h-svh flex flex-col justify-center pt-[clamp(30px,5vh,60px)] pb-[clamp(50px,8vh,90px)]"
      >
        {/* sr-stage */}
        <div className="relative h-[min(46vh,440px)] mb-[clamp(-30px,-4vh,-16px)] max-[760px]:h-[38vh] max-[760px]:mb-0">
          {/* sr-vid */}
          <video
            className="absolute inset-0 w-full h-full object-contain z-[1] pointer-events-none mix-blend-screen opacity-[0.96]"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
          >
            <source src="/tasmil-coins.webm" type="video/webm" />
          </video>
          {/* sr-fade */}
          <div className="absolute left-0 right-0 bottom-0 h-[46%] z-[2] pointer-events-none bg-[linear-gradient(to_top,#000_6%,transparent)]" />
        </div>

        {/* sr-copy */}
        <div className="relative z-[3] max-w-[720px] mx-auto px-[clamp(20px,5vw,72px)]">
          <h2 className="text-[clamp(32px,5vw,62px)] font-bold tracking-[-0.04em] leading-none m-0">
            Backed by <span className="grad">Stellar.</span>
          </h2>

          {/* sr-meta */}
          <div className="flex gap-[34px] justify-center flex-wrap mt-7">
            <div className="flex flex-col gap-1">
              <span className="text-[clamp(20px,2.4vw,30px)] font-bold tracking-[-0.03em] font-mono">~5s</span>
              <span className="text-[12px] tracking-[0.12em] uppercase text-white/35">Settlement</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[clamp(20px,2.4vw,30px)] font-bold tracking-[-0.03em] font-mono">$0.001</span>
              <span className="text-[12px] tracking-[0.12em] uppercase text-white/35">Avg. fee</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[clamp(20px,2.4vw,30px)] font-bold tracking-[-0.03em] font-mono">24/7</span>
              <span className="text-[12px] tracking-[0.12em] uppercase text-white/35">On-chain</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
