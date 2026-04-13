"use client";

import { WalletWaitlistPanel } from "./wallet-waitlist-panel";
import { ReferralLoopCard } from "./referral-loop-card";
import { useWallet } from "@/shared/context/wallet-context";

interface WaitlistPhaseBoardProps {
  referredByCode?: string | null;
}

export function WaitlistPhaseBoard({ referredByCode }: WaitlistPhaseBoardProps) {
  const { isConnected } = useWallet();

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Left card: wallet entry gate — always use WalletWaitlistPanel
          which handles both unregistered and registered states */}
      <div className="rounded-2xl border border-border bg-card/80 p-5 shadow-sm backdrop-blur-sm">
        <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          {isConnected ? "Your status" : "Join the waitlist"}
        </p>

        <WalletWaitlistPanel referredByCode={referredByCode} />
      </div>

      {/* Right card: referral loop explanation */}
      <div className="rounded-2xl border border-border bg-card/80 p-5 shadow-sm backdrop-blur-sm">
        <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          How it works
        </p>
        <ReferralLoopCard />
      </div>
    </div>
  );
}
