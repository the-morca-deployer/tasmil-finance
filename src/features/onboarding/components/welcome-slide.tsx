"use client";

import { motion } from "framer-motion";
import type { WelcomeSlideData } from "../config/welcome-slides-data";

export function WelcomeSlide({ slide }: { slide: WelcomeSlideData }) {
  const Icon = slide.icon;

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
      <p className="max-w-sm text-muted-foreground leading-relaxed">{slide.description}</p>
    </motion.div>
  );
}
