"use client";

import { motion } from "framer-motion";
import type { WelcomeSlideData } from "../config/welcome-slides-data";
import { WelcomeImage } from "./welcome-image";
import { WelcomeVideo } from "./welcome-video";

function hasContent(value: string | undefined): value is string {
  return typeof value === "string" && value.length > 0;
}

export function WelcomeSlide({ slide }: { slide: WelcomeSlideData }) {
  const Icon = slide.icon;
  const showVideo = hasContent(slide.videoSrc);
  const showImage = !showVideo && hasContent(slide.imageSrc);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center px-6 py-8 text-center"
    >
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
        <Icon className="h-8 w-8 text-primary-foreground" />
      </div>
      <h2 className="mb-3 font-bold text-2xl text-foreground">{slide.title}</h2>
      <p className="mb-4 max-w-sm text-muted-foreground leading-relaxed">{slide.description}</p>
      {showVideo && slide.videoSrc && (
        <WelcomeVideo src={slide.videoSrc} poster={slide.videoPoster} />
      )}
      {showImage && slide.imageSrc && (
        <WelcomeImage src={slide.imageSrc} alt={slide.imageAlt ?? slide.title} />
      )}
    </motion.div>
  );
}
