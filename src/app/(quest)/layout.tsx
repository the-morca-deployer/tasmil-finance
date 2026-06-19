"use client";

import { AutoReconnect, QuestFooter, QuestNavbar } from "@/features/quest";
import { WalletProvider } from "@/features/quest/context/wallet-context";

export default function QuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <AutoReconnect />
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <QuestNavbar />
        <main className="mx-auto w-full max-w-[1200px] flex-grow px-4 pt-20 pb-20 sm:px-6 lg:px-8">
          {children}
        </main>
        <QuestFooter />
      </div>
    </WalletProvider>
  );
}
