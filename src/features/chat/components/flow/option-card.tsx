"use client";

import { cn } from "@/lib/utils";
import type { Suggestion } from "@/features/chat/types/flow-messages";

const TAG_STYLES: Record<string, [string, string]> = {
  recommended: ["recommended", "text-emerald-400 bg-emerald-400/10"],
  il_risk: ["IL risk", "text-amber-400 bg-amber-400/10"],
  high_tvl: ["high TVL", "text-blue-400 bg-blue-400/10"],
  bridge: ["bridge", "text-purple-400 bg-purple-400/10"],
};

interface OptionCardProps {
  question: string;
  suggestions: Suggestion[];
  onSelect: (value: Record<string, unknown>) => void;
  disabled?: boolean;
  selectedValue?: Record<string, unknown>;
}

function isSelected(
  suggestionValue: Record<string, unknown>,
  selectedValue: Record<string, unknown> | undefined
): boolean {
  if (!selectedValue) return false;
  return JSON.stringify(suggestionValue) === JSON.stringify(selectedValue);
}

export function OptionCard({
  question,
  suggestions,
  onSelect,
  disabled = false,
  selectedValue,
}: OptionCardProps) {
  return (
    <div className="w-fit min-w-[280px] max-w-[360px] overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-2.5">
        <p className="text-[13px] font-medium text-foreground">{question}</p>
      </div>

      {suggestions.length > 0 && (
        <div className="flex flex-col">
          {suggestions.map((suggestion, index) => {
            const selected = isSelected(suggestion.value, selectedValue);
            const dimmed = disabled && !selected && selectedValue !== undefined;

            return (
              <button
                key={index}
                type="button"
                aria-label={`Select ${suggestion.label}`}
                disabled={disabled}
                onClick={() => onSelect(suggestion.value)}
                className={cn(
                  "flex w-full items-start gap-2.5 px-4 py-2.5 text-left transition-colors",
                  index > 0 && "border-t border-border",
                  selected
                    ? "bg-primary/5"
                    : "hover:bg-muted/30",
                  dimmed && "opacity-50",
                  disabled ? "pointer-events-none" : "cursor-pointer",
                )}
              >
                <span className="mt-0.5 shrink-0 font-mono text-xs text-muted-foreground/60">
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[13px] font-medium text-foreground">
                      {suggestion.label}
                    </span>

                    {suggestion.tags?.map((tag) => {
                      const [label, cls] = TAG_STYLES[tag] ?? [tag, "text-muted-foreground bg-muted"];
                      return (
                        <span
                          key={tag}
                          className={cn("rounded-md px-1.5 py-px text-[10px] font-medium", cls)}
                        >
                          {label}
                        </span>
                      );
                    })}
                  </div>

                  {suggestion.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {suggestion.description}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
