"use client";

import { Geist_Mono, Hanken_Grotesk } from "next/font/google";
import "@/features/quest/quest.css";
import { AutoReconnect, QuestFooter, QuestNavbar } from "@/features/quest";
import { WalletProvider } from "@/features/quest/context/wallet-context";

const questSans = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-quest-sans",
  display: "swap",
});
const questMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-quest-mono",
  display: "swap",
});

export default function QuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <AutoReconnect />
      <div
        className={`${questSans.variable} ${questMono.variable} quest-scope flex min-h-screen flex-col`}
      >
        <QuestNavbar />
        <main className="mx-auto w-full max-w-[1200px] flex-grow px-4 pt-20 pb-20 sm:px-6 lg:px-8">
          {children}
        </main>
        <QuestFooter />
      </div>
    </WalletProvider>
  );
}
