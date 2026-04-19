"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";
import { Carousel, type CarouselApi, CarouselContent, CarouselItem } from "@/shared/ui/carousel";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { useOnboardingStore } from "@/store/use-onboarding";
import { welcomeSlides } from "../config/welcome-slides-data";
import { WelcomeSlide } from "./welcome-slide";

export function WelcomeModal() {
  const { welcomeModalOpen, completeWelcome } = useOnboardingStore();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  const isLastSlide = current === welcomeSlides.length - 1;

  const handleNext = useCallback(() => {
    if (isLastSlide) return;
    api?.scrollNext();
  }, [api, isLastSlide]);

  const handleSkip = useCallback(() => {
    completeWelcome();
  }, [completeWelcome]);

  const handleGetStarted = useCallback(() => {
    completeWelcome();
  }, [completeWelcome]);

  return (
    <Dialog open={welcomeModalOpen} onOpenChange={(open) => !open && completeWelcome()}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden border-border p-0 sm:rounded-2xl [&>button]:hidden">
        <DialogTitle className="sr-only">Welcome to Tasmil Finance</DialogTitle>
        <Carousel setApi={setApi} opts={{ watchDrag: false }}>
          <CarouselContent>
            {welcomeSlides.map((slide) => (
              <CarouselItem key={slide.title}>
                <WelcomeSlide slide={slide} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2 pb-2">
          {welcomeSlides.map((slide, index) => (
            <button
              key={slide.title}
              type="button"
              onClick={() => api?.scrollTo(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === current ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"
              )}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 pb-6">
          <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground">
            Skip
          </Button>
          {isLastSlide ? (
            <Button
              size="sm"
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-600 hover:to-blue-700"
            >
              Get Started
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleNext}
              className="bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-600 hover:to-blue-700"
            >
              Next
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
