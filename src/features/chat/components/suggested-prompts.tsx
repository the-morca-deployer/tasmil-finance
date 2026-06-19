"use client";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
  hasPositions?: boolean;
  phase?: "beta" | "mainnet";
}

const FIRST_TIME_PROMPTS = [
  "Top 5 highest-yield USDC pools",
  "Top 5 highest-yield XLM pools",
  "Start with $5",
  "Compare Blend vs DeFindex",
  "What can I do here?",
];

const RETURNING_PROMPTS = [
  "Add to my position",
  "Check my earnings",
  "Withdraw some",
  "Show best yields",
  "Rebalance my portfolio",
];

const MAINNET_RETURNING_PROMPTS = [
  "What did my portfolio earn this week?",
  "Which pool is performing best right now?",
  "Reinvest my rewards automatically",
  "Show my referral earnings",
];

export function SuggestedPrompts({ onSelect, hasPositions = false, phase }: SuggestedPromptsProps) {
  let prompts: string[];
  if (phase === "mainnet" && hasPositions) {
    prompts = MAINNET_RETURNING_PROMPTS;
  } else if (hasPositions) {
    prompts = RETURNING_PROMPTS;
  } else {
    prompts = FIRST_TIME_PROMPTS;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onSelect(prompt)}
          className="rounded-full border border-white/[0.07] bg-[#181c1a] px-3.5 py-1.5 text-[#9aada4] text-sm transition-colors hover:border-[#00C278]/35 hover:text-[#f0f2f1]"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
