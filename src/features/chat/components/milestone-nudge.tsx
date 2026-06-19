interface MilestoneNudgeProps {
  type: "five-dollar" | "day-30" | "pool-full";
  topPercent: number;
  spotsLeft: number;
  onReinvest: () => void;
}

export function MilestoneNudge({ type, topPercent, spotsLeft, onReinvest }: MilestoneNudgeProps) {
  if (type === "five-dollar") {
    return (
      <div
        data-testid="milestone-nudge"
        className="rounded-xl border border-yellow-700/40 bg-yellow-950/20 px-4 py-3 text-sm text-yellow-200"
      >
        You've earned <span className="font-semibold text-yellow-400">$5</span>. You're in the top{" "}
        <span className="font-semibold">{topPercent}%</span> of earners on Tasmil.
      </div>
    );
  }
  if (type === "day-30") {
    return (
      <div
        data-testid="milestone-nudge"
        className="rounded-xl border border-[#00C278]/30 bg-[#00C278]/5 px-4 py-3 space-y-2"
      >
        <p className="text-sm text-[#f0f2f1]">
          Your vesting is <span className="font-semibold text-[#00C278]">fully unlocked</span>.
          Ready to compound?
        </p>
        <button
          type="button"
          onClick={onReinvest}
          className="rounded-lg bg-[#00C278] px-3 py-1.5 text-sm font-semibold text-black hover:bg-[#00a866]"
        >
          Compound now
        </button>
      </div>
    );
  }
  return (
    <div
      data-testid="milestone-nudge"
      className="rounded-xl border border-orange-700/40 bg-orange-950/20 px-4 py-3 text-sm text-orange-200"
    >
      Pool C is filling up —{" "}
      <span className="font-semibold text-orange-400">{spotsLeft} spots left</span> at this APY
      rate.
    </div>
  );
}
