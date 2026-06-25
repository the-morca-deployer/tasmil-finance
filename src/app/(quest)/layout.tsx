"use client";

import dynamic from "next/dynamic";
import { AutoReconnect, QuestFooter, QuestNav, RankRevealGate } from "@/features/quest";
import { WalletProvider } from "@/features/quest/context/wallet-context";

const QuestBeams = dynamic(
  () => import("@/features/quest/components/QuestBeams").then((m) => m.QuestBeams),
  { ssr: false },
);

export default function QuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <AutoReconnect />
      <div className="quest-scope">
        <QuestBeams />
        <QuestNav />
        <RankRevealGate />
        <main className="page">{children}</main>
        <QuestFooter />
        <div id="quest-overlay" />
      </div>
    </WalletProvider>
  );
}
