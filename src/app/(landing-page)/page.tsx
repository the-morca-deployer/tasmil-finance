import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tasmil Finance | AI-Powered DeFi Gateway for Stellar Blockchain",
  description:
    "Experience seamless DeFi on Stellar — trade on Soroswap, lend on Blend, earn Aquarius rewards, and bridge via Allbridge with AI-powered conversational agents.",
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black">
      <Link
        href="/chat"
        className="rounded-xl bg-white px-8 py-4 text-lg font-semibold text-black transition-opacity hover:opacity-80"
      >
        Launch App
      </Link>
    </div>
  );
}
