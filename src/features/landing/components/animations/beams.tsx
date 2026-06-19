"use client";

import dynamic from "next/dynamic";

const BeamsCanvas = dynamic(() => import("@/features/landing/components/animations/beams-canvas"), {
  ssr: false,
});

interface BeamsBgProps {
  accent?: string;
  enabled?: boolean;
}

const BEAM_COLORS: Record<string, string> = {
  Aqua: "#67E8F9",
  Violet: "#C4B5FD",
  Emerald: "#6EE7B7",
  Amber: "#FCD34D",
};

export function BeamsBg({ accent = "Aqua", enabled = true }: BeamsBgProps) {
  if (!enabled) return null;

  const lightColor = BEAM_COLORS[accent] ?? "#67E8F9";

  return (
    <div className="beams" aria-hidden="true">
      <BeamsCanvas lightColor={lightColor} />
      <div className="beams-scrim" />
    </div>
  );
}
