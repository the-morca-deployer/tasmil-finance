"use client";

import { useEffect, useState } from "react";

export interface SeasonCountdown {
  d: string;
  h: string;
  m: string;
  s: string;
  ended: boolean;
}

const pad = (n: number) => String(n).padStart(2, "0");

function compute(endAt: string | undefined): SeasonCountdown {
  if (!endAt) {
    return { d: "00", h: "00", m: "00", s: "00", ended: true };
  }
  const target = new Date(endAt).getTime();
  let remaining = Math.floor((target - Date.now()) / 1000);
  if (!Number.isFinite(remaining) || remaining <= 0) {
    return { d: "00", h: "00", m: "00", s: "00", ended: true };
  }
  const days = Math.floor(remaining / 86_400);
  remaining -= days * 86_400;
  const hrs = Math.floor(remaining / 3600);
  remaining -= hrs * 3600;
  const min = Math.floor(remaining / 60);
  const sec = remaining - min * 60;
  return { d: pad(days), h: pad(hrs), m: pad(min), s: pad(sec), ended: false };
}

/**
 * Live season countdown to `endAt` (ISO string). Recomputes every second.
 * Zero-padded; `ended` is true once the deadline passes or `endAt` is missing.
 */
export function useSeasonCountdown(endAt: string | undefined): SeasonCountdown {
  const [value, setValue] = useState<SeasonCountdown>(() => compute(endAt));

  useEffect(() => {
    setValue(compute(endAt));
    if (!endAt) return;
    const id = setInterval(() => setValue(compute(endAt)), 1000);
    return () => clearInterval(id);
  }, [endAt]);

  return value;
}
