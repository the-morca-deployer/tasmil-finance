"use client";

import { AutoReconnect, QuestFooter, QuestNav, RankRevealGate, TierRewardRevealGate } from "@/features/quest";
import { WalletProvider } from "@/features/quest/context/wallet-context";

export default function QuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <AutoReconnect />
      <div className="quest-scope">
        <QuestNav />
        <RankRevealGate />
        <TierRewardRevealGate />
        <main className="page">{children}</main>
        <QuestFooter />
        <div id="quest-overlay" />
      </div>
    </WalletProvider>
  );
}
