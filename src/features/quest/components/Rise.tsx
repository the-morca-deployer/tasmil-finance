"use client";

import { motion, useReducedMotion } from "framer-motion";
import * as React from "react";

interface RiseProps {
  children?: React.ReactNode;
  delay?: number;
  className?: string;
}

export function Rise({ children, delay = 0, className }: RiseProps) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
