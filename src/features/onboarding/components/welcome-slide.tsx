"use client";

import { motion } from "framer-motion";
import { PlayCircle } from "lucide-react";
import type { WelcomeSlideData } from "../config/welcome-slides-data";

export function WelcomeSlide({ slide }: { slide: WelcomeSlideData }) {
  const Icon = slide.icon;
  const hasVideo = slide.videoUrl !== undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center px-6 py-8 text-center"
    >
      <div
        className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${slide.gradient} shadow-lg`}
      >
        <Icon className="h-8 w-8 text-white" />
      </div>
      <h2 className="mb-3 font-bold text-2xl text-foreground">{slide.title}</h2>
      <p className="max-w-sm text-muted-foreground leading-relaxed mb-4">{slide.description}</p>
      {hasVideo && (
        <button
          type="button"
          aria-label="Play intro video"
          className="group relative mt-2 flex aspect-video w-full max-w-md items-center justify-center overflow-hidden rounded-xl border border-border bg-gradient-to-br from-muted/40 to-background"
        >
          <PlayCircle className="h-16 w-16 text-foreground/70 transition-transform group-hover:scale-105" />
          <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
            Watch intro (2 min)
          </span>
        </button>
      )}
    </motion.div>
  );
}
