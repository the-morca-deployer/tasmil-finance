"use client";
import { useMemo } from "react";

export function Starfield({ count = 64, seed = 42 }: { count?: number; seed?: number }) {
  const stars = useMemo(() => {
    const rng = mulberry32(seed);
    return Array.from({ length: count }, (_, i) => {
      const size = rng() < 0.18 ? 2 : 1;
      return {
        id: i,
        size,
        left: rng() * 100,
        top: rng() * 60,
        opacity: 0.1 + rng() * 0.45,
        cyan: rng() < 0.3,
      };
    });
  }, [count, seed]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full motion-safe:animate-twinkle"
          style={{
            width: s.size,
            height: s.size,
            left: `${s.left}%`,
            top: `${s.top}%`,
            opacity: s.opacity,
            background: s.cyan ? "#A9F2FB" : "#fff",
          }}
        />
      ))}
    </div>
  );
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
