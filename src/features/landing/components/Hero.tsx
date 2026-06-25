import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/lib/utils";
import { APP_ENTRY, isWaitlistMode } from "@/lib/waitlist-mode";

export default function Hero() {
  const waitlist = isWaitlistMode();
  return (
    <>
      {/*
        #top is the hero element. It carries:
          data-lit="false"  → set to "true" by useLandingScripts at 200ms → skyline bars rise
          data-done="false" → set to "true" at 2600ms → entrance animations retire
        `group` enables group-data-[lit=true]: and group-data-[done=false]: on descendants.
      */}
      <header
        id="top"
        data-lit="false"
        data-done="false"
        className={cn(
          "group",
          // .hero (landing.css:268): relative, min-height calc(100svh+20px), flex, center, left,
          // padding 130px gutter 90px, overflow hidden
          "relative flex min-h-[calc(100svh+20px)] items-center overflow-hidden text-left",
          "[padding:130px_clamp(20px,5vw,72px)_90px]",
        )}
      >
        {/* .hero-floor (landing.css:277): absolute glow beneath the hero */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute bottom-[-12%] left-1/2 z-[1] h-[380px] w-[135%]",
            "-translate-x-1/2",
            "[background:radial-gradient(ellipse_54%_100%_at_50%_100%,rgba(103,232,249,0.42),rgba(14,165,233,0.15)_42%,transparent_72%)]",
            "[filter:blur(38px)]",
          )}
        />

        {/* .hero-fade (landing.css:334): bottom gradient fade to bg */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute bottom-0 left-0 right-0 z-[2] h-[5%]",
            "[background:linear-gradient(to_bottom,transparent,#000_100%)]",
          )}
        />

        {/*
          .hero-skyline (landing.css:294): absolute skyline bars across full width.
          Mask fades out toward top so bars dissolve into the hero background.
        */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute bottom-0 left-0 right-0 z-[1] flex h-[75%] gap-0 p-0",
            "[-webkit-mask-image:linear-gradient(to_top,#000_18%,transparent_98%)]",
            "[mask-image:linear-gradient(to_top,#000_18%,transparent_98%)]",
          )}
        >
          {/*
            .hs-col (landing.css:308): flex-1, relative.
            ::before (landing.css:312): the bar itself — starts scaleY(0), transitions to
            scaleY(1) when hero is lit via group-data-[lit=true]:.
            Reduced-motion: skip transition, show bar fully from the start.
          */}
          {(["100%", "70%", "40%", "22%", "40%", "70%", "100%"] as const).map((h, i) => (
            <span
              key={i}
              className="relative flex-1"
              style={{ "--h": h } as React.CSSProperties}
            >
              <span
                className={cn(
                  // ::before bar — absolute, bottom-anchored, height from --h custom property
                  "absolute bottom-0 left-0 right-0 [height:var(--h,40%)]",
                  "[background:linear-gradient(to_top,#e0fbff_0%,#a5f3fc_12%,#67e8f9_30%,#0ea5e9_52%,#0369a1_72%,#04243a_88%,transparent_100%)]",
                  "opacity-100 origin-bottom",
                  // Default: scaleY(0) with transition; lit → scaleY(1)
                  "scale-y-0 transition-transform duration-[1100ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
                  // When ancestor #top has data-lit="true" → scale to full
                  "group-data-[lit=true]:scale-y-100",
                  // Reduced motion: skip animation, always show full bar
                  "motion-reduce:scale-y-100 motion-reduce:transition-none",
                )}
              />
            </span>
          ))}
        </div>

        {/*
          .hero-inner2 (landing.css:378): two-column grid (text left, object right), centered,
          max-width constrained.
        */}
        <div
          className={cn(
            "relative z-[3] mx-auto w-full [max-width:1280px]",
            "grid [grid-template-columns:1.04fr_0.96fr] [gap:clamp(30px,5vw,70px)] items-center",
            // .hero-inner2 responsive (landing.css:543): single column on ≤900px
            "max-[900px]:[grid-template-columns:1fr] max-[900px]:[gap:22px] max-[900px]:text-center",
          )}
        >
          {/* .hero-text (landing.css:389): left column text block */}
          <div className="max-w-[620px] max-[900px]:mx-auto max-[900px]:max-w-none">
            {/*
              .hero-pill (landing.css:392): eyebrow badge.
              Badge variant="outline" gives: inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold.
              Override className to match original: gap-[9px], px-[17px], py-[8px], border accent-line,
              bg accent-soft, text-[12.5px], tracking-[0.03em], text accent color, mb-[26px].
            */}
            <Badge
              variant="outline"
              className={cn(
                "gap-[9px] rounded-[999px] border-[rgba(103,232,249,0.32)] bg-[rgba(103,232,249,0.06)]",
                "px-[17px] py-[8px] text-[12.5px] font-semibold tracking-[0.03em] text-[#67e8f9]",
                "mb-[26px]",
                // Entrance: rise at delay 0 while not done
                "motion-safe:group-data-[done=false]:animate-rise",
                "[animation-delay:0ms]",
                // Override Badge default height/color constraints for our pill look
                "h-auto",
                "max-[900px]:mb-[18px]",
              )}
            >
              DeFi Yield Protocol on Stellar
            </Badge>

            {/*
              .hero h1 (landing.css:406): clamp(40px,6vw,86px), line-height 0.95,
              font-weight 700, letter-spacing -0.045em, margin-bottom 24px.
            */}
            <h1
              className={cn(
                "mb-[24px] font-bold leading-[0.95] tracking-[-0.045em]",
                "[font-size:clamp(40px,6vw,86px)]",
              )}
            >
              {/*
                .l1 (landing.css:413): display block (plain text color).
                Entrance: rise at 0.08s delay.
              */}
              <span
                className={cn(
                  "block",
                  "motion-safe:group-data-[done=false]:animate-rise [animation-delay:80ms]",
                )}
              >
                One Vault.
              </span>
              {/*
                .l2 (landing.css:416): display block, gradient text.
                Entrance: rise at 0.18s delay.
              */}
              <span
                className={cn(
                  "block bg-clip-text text-transparent",
                  "[background-image:linear-gradient(110deg,#fff_0%,#67e8f9_55%,#0ea5e9_100%)]",
                  "motion-safe:group-data-[done=false]:animate-rise [animation-delay:180ms]",
                )}
              >
                Every Protocol.
              </span>
            </h1>

            {/*
              .hero .sub (landing.css:423): clamp(15px,1.5vw,19px), color muted,
              max-width 520px, margin 0 0 36px, line-height 1.6.
            */}
            <p
              className={cn(
                "mb-[36px] max-w-[520px] leading-[1.6]",
                "[font-size:clamp(15px,1.5vw,19px)] [color:rgba(244,247,251,0.58)]",
                "max-[900px]:mx-auto",
                "motion-safe:group-data-[done=false]:animate-rise [animation-delay:300ms]",
              )}
            >
              Tasmil Finance puts your stablecoins to work across Stellar&apos;s top DeFi
              protocols. Auto-rebalancing yield, non-custodial, always yours.
            </p>

            {/*
              .hero-cta (landing.css:430): flex, gap 14px, justify-start, flex-wrap.
              Responsive (landing.css:559): justify-center on ≤900px.
            */}
            <div
              className={cn(
                "flex flex-wrap justify-start gap-[14px]",
                "max-[900px]:justify-center",
                "motion-safe:group-data-[done=false]:animate-rise [animation-delay:400ms]",
              )}
            >
              {/*
                .btn.btn-primary.btn-lg → Button variant="gradient" size="lg" asChild.
                The gradient variant already applies brand-gradient-interactive (hover lift +
                gradient transition) — do not repeat those properties in className.
              */}
              <Button asChild variant="gradient" size="lg">
                <a href={waitlist ? "/waitlist" : APP_ENTRY}>
                  {waitlist ? (
                    <>
                      Join Waitlist <span aria-hidden="true">→</span>
                    </>
                  ) : (
                    <>
                      Launch App <span aria-hidden="true">→</span>
                    </>
                  )}
                </a>
              </Button>

              {/*
                .btn.btn-ghost.btn-lg → Button variant="ghost" size="lg" asChild.
                Text color inherits from landing page (--text: #f4f7fb).
              */}
              <Button asChild variant="ghost" size="lg" className="text-[#f4f7fb]">
                <a href="#features">See how it works</a>
              </Button>
            </div>
          </div>

          {/*
            .hero-object (landing.css:436): relative grid place-items-center,
            min-height min(64vh,560px), perspective 1500px.
            ::before glow (landing.css:443): absolute circle radial-gradient glow.
            Responsive (landing.css:562): order -1, min-height min(42vh,340px) on ≤900px.
            Entrance: rise at 0.3s.
          */}
          <div
            id="heroStage"
            className={cn(
              "relative grid place-items-center",
              "[min-height:min(64vh,560px)] [perspective:1500px]",
              "max-[900px]:order-[-1] max-[900px]:[min-height:min(42vh,340px)]",
              // ::before glow
              "before:absolute before:aspect-square before:w-[78%] before:rounded-full",
              "before:[background:radial-gradient(circle,rgba(103,232,249,0.26),rgba(14,165,233,0.1)_45%,transparent_68%)]",
              "before:[filter:blur(28px)] before:z-0",
              "motion-safe:group-data-[done=false]:animate-rise [animation-delay:300ms]",
            )}
          >
            {/*
              .obj3d (landing.css:458): relative z-2, max-width min(100%,560px),
              transition transform 0.3s ease-out, will-change transform.
            */}
            <div
              id="obj3d"
              className={cn(
                "relative z-[2] w-full max-w-[560px]",
                "transition-transform duration-300 ease-out will-change-transform",
              )}
            >
              {/*
                .obj3d img (landing.css:465): width 100%, display block,
                user-select none, filter + drop-shadow, animation heroFloaty3d 6.5s.
                Reduced motion: no animation.
              */}
              <img
                src="/tasmil-crypto.svg"
                alt="Tasmil multi-asset crypto vault"
                draggable={false}
                className={cn(
                  "block w-full select-none",
                  "[filter:url(#tasmilCyan)_drop-shadow(0_30px_64px_rgba(103,232,249,0.34))]",
                  // heroFloaty3d: gentle vertical float
                  "motion-safe:animate-hero-floaty-3d",
                )}
              />
            </div>
          </div>
        </div>

        {/*
          .scroll-cue (landing.css:570): absolute bottom-[26px] left-1/2 -translate-x-1/2 z-3,
          flex column, align-items center, gap 8px, font-size 10.5px,
          letter-spacing 0.24em, text-transform uppercase, color dim.
          .dot (landing.css:585): 4×8px pill, bg accent, animation cue 1.8s.
          Entrance: rise at 0.7s.
        */}
        <a
          href="#backed"
          className={cn(
            "absolute bottom-[26px] left-1/2 z-[3] -translate-x-1/2",
            "flex flex-col items-center gap-[8px]",
            "text-[10.5px] uppercase tracking-[0.24em]",
            "[color:rgba(244,247,251,0.34)]",
            "motion-safe:group-data-[done=false]:animate-rise [animation-delay:700ms]",
          )}
        >
          <span>Scroll</span>
          <span
            aria-hidden="true"
            className={cn(
              "h-[8px] w-[4px] rounded-[4px] bg-[#67e8f9]",
              "motion-safe:animate-cue",
            )}
          />
        </a>
      </header>
    </>
  );
}
