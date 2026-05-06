"use client";

import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import type { RiskPreset } from "@/features/account/types";
import { cn } from "@/lib/utils";

interface Props {
  preset: RiskPreset;
  onSelect: (preset: RiskPreset) => void;
  onBack?: () => void;
}

interface PresetMeta {
  value: RiskPreset;
  label: string;
  description: string;
  gradient: string;
  textColor: string;
}

const PRESETS: PresetMeta[] = [
  {
    value: "Safe",
    label: "Safe",
    description:
      "Your agent prioritizes capital preservation, picking only the most battle-tested pools and keeping a healthy cash buffer.",
    gradient:
      "radial-gradient(circle at 30% 28%, #d6ffb3 0%, #8fdc6c 32%, #2f7a2f 75%, #0e2a13 100%)",
    textColor: "text-emerald-950",
  },
  {
    value: "Balanced",
    label: "Balanced",
    description:
      "Your agent blends yield with safety — diversified across solid pools while still chasing competitive APY across protocols.",
    gradient:
      "radial-gradient(circle at 30% 28%, #d8f4ff 0%, #7ad6ff 32%, #1d6c9a 75%, #07243a 100%)",
    textColor: "text-sky-950",
  },
  {
    value: "Aggressive",
    label: "Aggressive",
    description:
      "Your agent goes for the highest yield — concentrating allocation into top-APY pools and accepting higher volatility.",
    gradient:
      "radial-gradient(circle at 30% 28%, #ffe0b3 0%, #ff9d4a 32%, #b3520c 75%, #3a1605 100%)",
    textColor: "text-orange-950",
  },
];

export function StepStrategy({ preset, onSelect, onBack }: Props) {
  const [hovered, setHovered] = useState<RiskPreset | null>(null);
  const activeMeta =
    PRESETS.find((p) => p.value === (hovered ?? preset)) ?? (PRESETS[1] as PresetMeta);

  return (
    <div className="relative flex min-h-[calc(100vh-3.5rem)] w-full flex-col items-center bg-background px-6 pt-6">
      {onBack && (
        <button
          type="button"
          aria-label="Back"
          onClick={onBack}
          className="absolute top-4 left-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      <div className="flex flex-1 flex-col items-center justify-center gap-10 md:gap-14">
        <h1 className="text-center font-bold text-5xl text-foreground tracking-tight md:text-7xl">
          Agent Strategy
        </h1>

        <div className="flex items-center justify-center gap-6 md:gap-12">
          {PRESETS.map((meta) => (
            <PresetSphere
              key={meta.value}
              meta={meta}
              selected={preset === meta.value}
              onHover={setHovered}
              onClick={() => onSelect(meta.value)}
            />
          ))}
        </div>

        <p className="min-h-[3.5rem] max-w-2xl text-center text-base text-muted-foreground leading-6 md:text-lg md:leading-7">
          {activeMeta.description}
        </p>
      </div>
    </div>
  );
}

interface PresetSphereProps {
  meta: PresetMeta;
  selected: boolean;
  onHover: (value: RiskPreset | null) => void;
  onClick: () => void;
}

function PresetSphere({ meta, selected, onHover, onClick }: PresetSphereProps) {
  const [isHovered, setIsHovered] = useState(false);
  const showGradient = selected || isHovered;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onMouseEnter={() => {
        setIsHovered(true);
        onHover(meta.value);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onHover(null);
      }}
      onFocus={() => onHover(meta.value)}
      onBlur={() => onHover(null)}
      onClick={onClick}
      style={showGradient ? { background: meta.gradient } : undefined}
      className={cn(
        "flex h-[220px] w-[220px] items-center justify-center rounded-full font-medium text-2xl transition-all duration-300 md:h-[280px] md:w-[280px] md:text-3xl",
        showGradient
          ? cn("scale-105 shadow-2xl", meta.textColor)
          : "bg-zinc-800/70 text-foreground",
        selected && "ring-2 ring-white/30"
      )}
    >
      {meta.label}
    </button>
  );
}
