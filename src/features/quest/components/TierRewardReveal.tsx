"use client";

import { Dialog, DialogContent } from "@/features/quest/components/ui/dialog";
import { type QuestRank, RANK_STYLES } from "@/features/quest/lib/tier";

export function TierRewardReveal({
  open,
  tier,
  points,
  onClaim,
  onClose,
  claiming,
}: {
  open: boolean;
  tier: string;
  points: number;
  onClaim: () => void;
  onClose: () => void;
  claiming: boolean;
}) {
  const asset = RANK_STYLES[tier as QuestRank]?.asset ?? "/ranks/unrank.png";
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      {/* `quest-scope` re-exposes quest CSS vars here since Radix portals this
          outside the page's `.quest-scope` wrapper - but that class also carries
          page-wrapper layout rules (`min-height: 100vh`, `width: 100%`) that would
          otherwise stretch this dialog card to the full viewport height. */}
      <DialogContent className="quest-scope min-h-0 w-auto max-w-[400px] text-center">
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[rgba(244,247,251,0.55)]">
            Rank reward unlocked
          </div>
          <img
            src={asset}
            alt=""
            className="w-24 h-24 object-contain animate-in zoom-in-50 duration-500 [filter:drop-shadow(0_8px_16px_rgba(0,0,0,0.5))]"
          />
          <div className="text-[22px] font-extrabold tracking-[-0.02em]">{tier}</div>
          <div className="text-[var(--accent)] font-mono text-[18px] font-bold">+{points} pts</div>
          <button
            type="button"
            onClick={onClaim}
            disabled={claiming}
            className="mt-2 inline-flex items-center justify-center rounded-quest-pill [background:var(--grad)] px-6 py-2 text-[14px] font-bold text-quest-accent-ink disabled:opacity-60"
          >
            {claiming ? "Claiming..." : "Claim reward"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
