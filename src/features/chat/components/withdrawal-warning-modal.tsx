"use client";

interface VestingInfo {
  currentWeek: number;
  totalWeeks: number;
  lockedPercent: number;
  lockedAmount: number;
  unlockDate: string;
}

interface WithdrawalWarningModalProps {
  phase: "beta" | "mainnet";
  vesting: VestingInfo;
  reinvestProjection: { amount: number; byDate: string } | null;
  onKeepEarning: () => void;
  onWithdraw: () => void;
}

export function WithdrawalWarningModal({
  phase,
  vesting,
  reinvestProjection,
  onKeepEarning,
  onWithdraw,
}: WithdrawalWarningModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#111714] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span>⚠️</span>
          <h2 className="font-semibold text-yellow-400">Before you withdraw</h2>
          <span className="text-xs text-[#9aada4]">Please read carefully</span>
        </div>

        <p className="text-sm text-[#c8d8d0]">
          Withdrawing now means you will{" "}
          <span className="text-red-400 font-medium">lose unclaimed rewards</span> and any{" "}
          <span className="text-red-400 font-medium">unvested portion of your welcome reward</span>.
        </p>

        <p className="text-sm text-[#c8d8d0]">
          Current vesting: Week {vesting.currentWeek} of {vesting.totalWeeks} —{" "}
          <span className="text-orange-400 font-medium">
            {vesting.lockedPercent}% of your reward (${vesting.lockedAmount}) is still locked
          </span>
          . Unlocks fully on {vesting.unlockDate}.
        </p>

        <p className="text-sm text-[#9aada4]">
          You will also forfeit accumulated referral points tied to this pool position. This action
          cannot be undone.
        </p>

        {phase === "mainnet" && reinvestProjection && (
          <p className="text-sm text-[#00C278] rounded-lg border border-[#00C278]/20 bg-[#00C278]/5 px-3 py-2">
            If you reinvest instead, your estimated earnings:{" "}
            <span className="font-semibold">
              +${reinvestProjection.amount} more by {reinvestProjection.byDate}
            </span>
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onKeepEarning}
            className="flex-1 rounded-lg border border-white/[0.08] px-4 py-2.5 text-sm font-semibold text-[#f0f2f1] hover:border-[#00C278]/40"
          >
            Keep earning
          </button>
          <button
            type="button"
            onClick={onWithdraw}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500"
          >
            Withdraw anyway
          </button>
        </div>
      </div>
    </div>
  );
}
