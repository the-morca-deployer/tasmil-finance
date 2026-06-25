import Link from "next/link";
import { Button } from "@/shared/ui/button";

export default function Cta() {
  return (
    <section className="cta relative h-[230vh] bg-black" id="start">
      <div
        className={[
          "cta-sticky",
          "sticky top-0 h-svh overflow-hidden",
          /* ambient gradient fade at top */
          "before:pointer-events-none before:absolute before:left-0 before:right-0 before:top-0",
          "before:z-[5] before:h-[190px]",
          "before:[background:linear-gradient(to_bottom,#000_0%,rgba(0,0,0,0.6)_45%,transparent_100%)]",
        ].join(" ")}
      >
        {/* hub-card cta-frame — JS sets --crop-t/r/b/l, --crop-radius, --frame-p on this element */}
        <div
          className={[
            "hub-card cta-frame",
            /* hub-card base — these match .hub-card rules */
            "relative flex items-center justify-center overflow-hidden rounded-[28px]",
            "border border-[var(--line)]",
            "min-h-[clamp(440px,54vh,580px)]",
            "p-[clamp(40px,7vw,90px)]",
            "[background:radial-gradient(120%_150%_at_50%_-10%,#14171d_0%,#0a0b10_46%,#050608_100%)]",
            /* cta-frame overrides — position absolute, no border/radius, black bg */
            "absolute inset-0 border-none rounded-none min-h-0 bg-black",
            /* clip-path consuming JS-set custom props */
            "[clip-path:inset(var(--crop-t)_var(--crop-r)_var(--crop-b)_var(--crop-l)_round_var(--crop-radius))]",
            "will-change-[clip-path]",
            /* frame border pseudo-element — tracks crop inset */
            "before:pointer-events-none before:absolute before:z-[6]",
            "before:[top:var(--crop-t)] before:[right:var(--crop-r)]",
            "before:[bottom:var(--crop-b)] before:[left:var(--crop-l)]",
            "before:[border-radius:var(--crop-radius)]",
            "before:[padding:1.2px]",
            "before:[background:linear-gradient(135deg,rgba(103,232,249,0.9),rgba(255,255,255,0.12)_38%,transparent_58%,rgba(14,165,233,0.7))]",
            "before:[-webkit-mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)]",
            "before:[-webkit-mask-composite:xor]",
            "before:[mask-composite:exclude]",
            "before:[opacity:var(--frame-p,0)]",
          ].join(" ")}
          style={{
            "--crop-t": "0px",
            "--crop-r": "0px",
            "--crop-b": "0px",
            "--crop-l": "0px",
            "--crop-radius": "0px",
            "--frame-p": "0",
          } as React.CSSProperties}
        >
          {/* horizon background image */}
          <img
            className="hub-bg absolute inset-0 z-0 h-full w-full object-cover object-[center_58%]"
            src="/tasmil-horizon.png"
            alt=""
            aria-hidden="true"
          />

          {/* veil — dark radial overlay */}
          <div
            className={[
              "hub-veil absolute inset-0 z-[1] pointer-events-none",
              "[background:radial-gradient(130%_95%_at_50%_30%,rgba(5,6,8,0.74),rgba(5,6,8,0.28)_56%,transparent_80%)]",
            ].join(" ")}
          />

          {/* inner content */}
          <div className="hub-inner relative z-[2] text-center max-w-[640px]">
            <h2
              className={[
                "text-[clamp(34px,5vw,60px)] font-bold tracking-[-0.04em] leading-[1.02] mb-[22px]",
                "text-[var(--text)]",
              ].join(" ")}
            >
              Put your stablecoins
              <br />
              to work today
            </h2>

            <p
              className={[
                "hsub",
                "text-[clamp(15px,1.7vw,18px)] text-[var(--muted)] leading-[1.55]",
                "max-w-[470px] mx-auto mb-[34px]",
              ].join(" ")}
            >
              Connect a Stellar wallet, deploy your vault, and pick a preset. Your capital starts
              compounding in minutes.
            </p>

            <div className="hub-cta flex gap-[13px] justify-center flex-wrap">
              <Button
                asChild
                variant="gradient"
                size="lg"
                className="shadow-[0_0_34px_-6px_var(--accent-glow)] [&_svg]:size-[15px]"
              >
                <Link href="/waitlist">
                  Join Waitlist <span>→</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="ghost"
                size="lg"
                className="[&_svg]:size-[15px]"
              >
                <a href="#features">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  See how it works
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
