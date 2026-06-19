"use client";

import { Typography } from "@/shared/ui/typography";

export const VideoSection = () => {
  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center px-4 py-20 md:px-8"
      data-section-id="video"
    >
      {/* Background overlay - Made transparent for 3D visibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-transparent" />

      {/* Content container */}
      <div className="relative z-10 flex w-full max-w-6xl flex-col items-center gap-16">
        {/* Section Header */}
        <div className="flex flex-col items-center gap-6 text-center">
          <Typography
            className="text-center font-bold text-4xl uppercase md:text-5xl"
            gradient={true}
            variant="h1"
          >
            See Tasmil Finance in Action
          </Typography>

          <div className="max-w-2xl">
            <Typography
              className="text-center text-gray-300 text-xl leading-relaxed md:text-2xl"
              variant="p"
            >
              Watch how our AI-powered DeFi platform transforms your Stellar blockchain trading
              experience with intelligent automation and real-time insights.
            </Typography>
          </div>
        </div>

        {/* Video Demo */}
        <div className="relative w-full max-w-4xl overflow-hidden rounded-xl border border-white/10 shadow-2xl">
          <div className="aspect-video">
            <iframe
              src="https://www.youtube.com/embed/VoLY1gjz5mg"
              className="size-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              title="Tasmil Finance Demo Video"
            />
          </div>
        </div>

        {/* Additional Features */}
        <div className="mt-4 grid w-full grid-cols-1 gap-4 md:grid-cols-3">
          {[
            {
              num: "01",
              title: "AI-Powered Trading",
              desc: "Intelligent trading decisions with advanced AI algorithms that analyze Stellar market trends in real-time.",
            },
            {
              num: "02",
              title: "Stellar Ecosystem Integration",
              desc: "Connect with Blend, Soroswap, Aquarius, Phoenix, and SDEX. Manage your entire Stellar DeFi portfolio from one interface.",
            },
            {
              num: "03",
              title: "Real-Time Analytics",
              desc: "Instant insights into XLM market conditions, Soroban contract analytics, and yield opportunities across all pools.",
            },
          ].map((item) => (
            <div
              key={item.num}
              className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
              style={{
                background: "linear-gradient(160deg, rgba(14,19,29,0.8), rgba(10,14,22,0.5))",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse 60% 50% at 50% -10%, var(--tint), transparent 70%)",
                }}
              />
              <span
                className="mb-3 block font-mono text-[11px] font-bold uppercase tracking-[0.2em]"
                style={{ color: "rgba(245,248,252,0.34)" }}
              >
                {item.num}
              </span>
              <Typography
                as="h3"
                className="mb-2 font-semibold text-lg text-white md:text-xl"
                weight="semibold"
              >
                {item.title}
              </Typography>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(245,248,252,0.56)" }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
