"use client";

import "@/features/quest/quest.css";
import { AutoReconnect, QuestFooter, QuestNav, RankRevealGate } from "@/features/quest";
import { WalletProvider } from "@/features/quest/context/wallet-context";

export default function QuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <AutoReconnect />
      <div className="quest-scope flex min-h-screen flex-col">
        <QuestNav />
        <RankRevealGate />
        <main className="page flex-grow">{children}</main>
        <QuestFooter />
        <div id="quest-overlay" />
      </div>
    </WalletProvider>
  );
}
