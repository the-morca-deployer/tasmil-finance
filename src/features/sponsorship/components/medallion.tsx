"use client";
import Image from "next/image";
import { motion } from "framer-motion";

export function Medallion({ size = 124 }: { size?: number }) {
  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
    >
      <span
        className="absolute -inset-6 rounded-full pointer-events-none opacity-40 blur-md"
        style={{
          background:
            "radial-gradient(closest-side, rgba(103,232,249,0.5), transparent 72%)",
        }}
        aria-hidden
      />
      <motion.div
        initial={{ scale: 0.4, rotate: -40, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-full grid place-items-center"
        style={{
          width: size,
          height: size,
          background:
            "conic-gradient(from 210deg,#0369A1,#67E8F9 28%,#9FEFFB 50%,#67E8F9 72%,#0369A1)",
          boxShadow:
            "0 0 0 1px rgba(103,232,249,0.55), 0 18px 50px -16px rgba(0,0,0,0.7), 0 0 44px -8px rgba(103,232,249,0.5)",
        }}
      >
        <div
          className="rounded-full grid place-items-center"
          style={{
            width: size * 0.77,
            height: size * 0.77,
            background:
              "radial-gradient(circle at 50% 32%,#0c1418,#070a0c 78%)",
            boxShadow:
              "inset 0 2px 10px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(103,232,249,0.22)",
          }}
        >
          <Image
            src="/protocols/tasmil.png"
            alt="Tasmil Finance"
            width={Math.round(size * 0.47)}
            height={Math.round(size * 0.47)}
          />
        </div>
      </motion.div>
    </div>
  );
}
