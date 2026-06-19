"use client";

import { Globe, MessageCircle, Wrench } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Typography } from "@/shared/ui/typography";

const BENEFIT_IMAGES = {
  crossBackground: "/images/landing-v3/benefit/cross-bg.png",
  bg1: "/images/landing-v3/benefit/bg-1.png",
  bg2: "/images/landing-v3/benefit/bg-2.png",
  bg3: "/images/landing-v3/benefit/bg-3.png",
} as const;

export const BenefitSection = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [cardsLoaded, setCardsLoaded] = useState([false, false, false]);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setIsLoaded(true);

          const timer1 = setTimeout(() => {
            setCardsLoaded((prev) => [true, prev[1] ?? false, prev[2] ?? false]);
          }, 400);

          const timer2 = setTimeout(() => {
            setCardsLoaded((prev) => [prev[0] ?? false, true, prev[2] ?? false]);
          }, 800);

          const timer3 = setTimeout(() => {
            setCardsLoaded((prev) => [prev[0] ?? false, prev[1] ?? false, true]);
          }, 1200);

          return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
          };
        }
        return undefined;
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.3,
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  // Data for the three feature cards
  const features = [
    {
      icon: MessageCircle,
      label: "AI Agent System",
      title: "Conversational DeFi Intelligence",
      description:
        "Execute DeFi strategies across Blend, Soroswap, Aquarius, and Phoenix with natural language — fully non-custodial.",
      background: BENEFIT_IMAGES.bg1,
    },
    {
      icon: Wrench,
      label: "Creator Economy",
      title: "Build, Deploy, Earn on Stellar",
      description:
        "Build custom trading agents for Stellar DeFi without coding. Publish to our marketplace and earn performance-based fees.",
      background: BENEFIT_IMAGES.bg2,
    },
    {
      icon: Globe,
      label: "Stellar Ecosystem Integration",
      title: "Native Stellar DeFi Gateway",
      description:
        "Native integration with Soroswap, Blend, Aquarius, Phoenix, and SDEX. Real-time portfolio tracking and cross-protocol yield optimization via Soroban.",
      background: BENEFIT_IMAGES.bg3,
    },
  ];

  return (
    <section
      className="relative flex min-h-screen w-full items-center justify-center"
      id="usecase-section"
      ref={sectionRef}
    >
      {/* Background with cross lights */}
      <div className="absolute top-10 right-0 bottom-10 left-0 z-0 h-full w-full">
        <Image
          alt="Benefit background"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
          className={`object-cover transition-opacity duration-1000 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          fill
          placeholder="blur"
          priority
          sizes="100vw"
          src={BENEFIT_IMAGES.crossBackground}
        />
      </div>

      <div className="container relative z-10 mx-auto px-4 md:px-8">
        {/* Section header */}
        <div
          className={`mb-10 flex flex-col items-center text-center transition-all duration-1000 md:mb-16 ${
            isLoaded ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <Typography
            as="span"
            className={`mb-3 text-sm uppercase opacity-80 transition-all duration-700 md:text-base ${
              isLoaded ? "translate-x-0 opacity-100" : "-translate-x-10 opacity-0"
            }`}
            gradient={true}
          >
            / BENEFITS
          </Typography>
          <Typography
            as="h2"
            className={`font-semibold text-3xl uppercase transition-all delay-200 duration-700 md:text-5xl ${
              isLoaded ? "translate-x-0 opacity-100" : "translate-x-10 opacity-0"
            }`}
            gradient={true}
            weight="semibold"
          >
            FEATURES
          </Typography>
        </div>

        {/* Feature cards container */}
        <div
          className={`mx-auto max-w-[1100px] transition-all duration-1000 ${
            isLoaded ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
          }`}
        >
          {/* Desktop and mobile layout */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-[#ffffff1a] md:flex-row">
            {features.map((feature, index) => (
              <div
                className={`group relative flex-1 transition-all duration-700 ${
                  index > 0 ? "border-[#ffffff1a] border-t md:border-t-0 md:border-l" : ""
                } ${cardsLoaded[index] ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0"}`}
                key={feature.label}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <div className="relative h-[420px] overflow-hidden bg-black/50 backdrop-blur-3xl transition-all duration-500 group-hover:bg-black/60 md:h-[440px]">
                  {/* Background image */}
                  <div
                    className={`absolute inset-0 transition-all duration-1000 ${
                      cardsLoaded[index] ? "opacity-70" : "opacity-0"
                    } group-hover:opacity-90`}
                    style={{ transitionDelay: `${500 + index * 100}ms` }}
                  >
                    <div
                      className={`relative flex h-full w-full ${
                        index === 1
                          ? "items-end justify-center pb-16"
                          : "items-center justify-center"
                      }`}
                    >
                      <div className="relative h-[220px] w-full">
                        <Image
                          alt="Card background"
                          className={`object-contain object-center transition-all duration-500 ${
                            index === 1
                              ? "group-hover:-translate-y-3"
                              : "group-hover:-translate-y-2"
                          } group-hover:scale-105`}
                          fill
                          src={feature.background}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bottom gradient overlay for readability */}
                  <div className="absolute right-0 bottom-0 left-0 h-48 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

                  {/* Icon and label — top left */}
                  <div className="absolute top-6 left-6 z-20 flex items-center gap-3 md:top-7 md:left-7">
                    <div
                      className={`transition-all duration-500 ${
                        cardsLoaded[index] ? "scale-100 opacity-100" : "scale-50 opacity-0"
                      } group-hover:scale-110`}
                      style={{ transitionDelay: `${600 + index * 100}ms` }}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-md border border-white/20 bg-white/10 backdrop-blur-sm">
                        <feature.icon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <span
                      className={`text-sm text-white/80 transition-all duration-500 ${
                        cardsLoaded[index]
                          ? "translate-x-0 opacity-100"
                          : "-translate-x-4 opacity-0"
                      }`}
                      style={{ transitionDelay: `${700 + index * 100}ms` }}
                    >
                      {feature.label}
                    </span>
                  </div>

                  {/* Card content — pinned to bottom */}
                  <div
                    className={`absolute right-0 bottom-0 left-0 z-20 p-6 transition-all duration-500 md:p-7 ${
                      cardsLoaded[index] ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                    }`}
                    style={{ transitionDelay: `${800 + index * 100}ms` }}
                  >
                    <Typography
                      as="h3"
                      className="mb-2 font-semibold text-white text-xl md:text-2xl"
                      weight="semibold"
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      as="p"
                      className="text-sm text-white/60 leading-relaxed md:text-base"
                    >
                      {feature.description}
                    </Typography>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
