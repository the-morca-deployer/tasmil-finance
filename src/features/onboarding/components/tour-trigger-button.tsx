"use client";

import { RotateCcw } from "lucide-react";
import { usePathname } from "next/navigation";
import { useOnborda } from "onborda";
import { useOnboardingStore } from "@/store/use-onboarding";
import { TOUR_NAMES } from "../config/tour-steps";

const PATH_TO_TOUR: Record<string, string> = {
  "/agents": TOUR_NAMES.agents,
  "/farming": TOUR_NAMES.farming,
  "/portfolio": TOUR_NAMES.portfolio,
  "/aggregator": TOUR_NAMES.aggregator,
};

export function TourTriggerButton() {
  const { hasCompletedWelcome } = useOnboardingStore();
  const { startOnborda } = useOnborda();
  const pathname = usePathname();

  if (!hasCompletedWelcome) return null;

  const tourName = PATH_TO_TOUR[pathname];
  if (!tourName) return null;

  const handleReplay = () => {
    startOnborda(tourName);
  };

  return (
    <button
      onClick={handleReplay}
      type="button"
      className="flex w-full items-center justify-center gap-2 rounded-lg py-1.5 text-muted-foreground text-xs transition-colors hover:bg-accent hover:text-foreground"
    >
      <RotateCcw className="h-3 w-3" />
      Replay Tour
    </button>
  );
}
