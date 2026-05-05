"use client";

import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/shared/ui/button-v2";
import { StepDots } from "../shared/step-dots";

interface Props {
  currentStep: number;
  totalSteps: number;
  title: string;
  ctaLabel: string;
  onCta: () => void;
  ctaDisabled?: boolean;
  ctaLoading?: boolean;
  onBack?: () => void;
  children: ReactNode;
}

/**
 * Wizard chrome — designed to live inside a centered modal/Dialog
 * (not fullscreen). Header strip with back + step dots, content body,
 * footer with primary gradient CTA.
 */
export function StepFrame({
  currentStep,
  totalSteps,
  title,
  ctaLabel,
  onCta,
  ctaDisabled,
  ctaLoading,
  onBack,
  children,
}: Props) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-border border-b px-2 pb-3">
        <div className="flex items-center gap-2">
          {onBack ? (
            <button
              type="button"
              aria-label="Back"
              onClick={onBack}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          ) : (
            <span className="w-7" aria-hidden />
          )}
          <span className="text-muted-foreground text-xs">Tasmil</span>
        </div>
        <StepDots current={currentStep} total={totalSteps} />
        <span className="w-16 text-right text-[10px] text-muted-foreground/70">
          Step {currentStep} of {totalSteps}
        </span>
      </div>

      <div className="flex flex-col items-center gap-5 px-2 py-6">
        <h1 className="text-center font-semibold text-lg tracking-tight">{title}</h1>
        <div className="w-full">{children}</div>
      </div>

      <div className="flex justify-center border-border border-t px-2 pt-4">
        <Button
          variant="gradient"
          size="lg"
          className="h-11 rounded-full px-10"
          onClick={onCta}
          disabled={ctaDisabled || ctaLoading}
        >
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
}
