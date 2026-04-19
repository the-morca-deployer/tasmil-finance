"use client";

import type { CardComponentProps } from "onborda";
import { useOnborda } from "onborda";
import { Button } from "@/shared/ui/button";
import { useOnboardingStore } from "@/store/use-onboarding";

export function TourCard({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  arrow,
}: CardComponentProps) {
  const isLast = currentStep === totalSteps - 1;
  const isFirst = currentStep === 0;
  const { currentTour, closeOnborda } = useOnborda();
  const { completeTour } = useOnboardingStore();

  const handleFinish = () => {
    if (currentTour) {
      completeTour(currentTour);
    }
    closeOnborda();
  };

  const handleSkip = () => {
    if (currentTour) {
      completeTour(currentTour);
    }
    closeOnborda();
  };

  return (
    <div className="relative w-[320px] rounded-xl border border-border bg-background p-4 shadow-xl">
      {arrow}
      <div className="mb-1 flex items-center justify-between">
        <span className="font-medium text-muted-foreground text-xs">
          Step {currentStep + 1} of {totalSteps}
        </span>
        {!isLast && (
          <button
            type="button"
            onClick={handleSkip}
            className="text-muted-foreground text-xs hover:text-foreground"
          >
            Skip
          </button>
        )}
      </div>
      <h3 className="mb-2 font-semibold text-foreground text-lg">{step.title}</h3>
      <p className="mb-4 text-muted-foreground text-sm leading-relaxed">{step.content as string}</p>
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={prevStep}
          disabled={isFirst}
          className={isFirst ? "invisible" : ""}
        >
          Previous
        </Button>
        <Button
          size="sm"
          onClick={isLast ? handleFinish : nextStep}
          className="bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-600 hover:to-blue-700"
        >
          {isLast ? "Finish" : "Next"}
        </Button>
      </div>
    </div>
  );
}
