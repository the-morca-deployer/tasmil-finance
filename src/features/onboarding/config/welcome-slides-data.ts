import { Bot, LineChart, Tractor } from "lucide-react";
import type { ComponentType } from "react";

export interface WelcomeSlideData {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  gradient: string;
}

export const welcomeSlides: WelcomeSlideData[] = [
  {
    icon: Bot,
    title: "Welcome to Tasmil Finance",
    description:
      "Your AI-powered DeFi portfolio manager on Stellar. We help you manage, optimize, and grow your digital assets — all in one place.",
    gradient: "from-sky-500 to-blue-600",
  },
  {
    icon: Tractor,
    title: "Smart Yield Farming",
    description:
      "AI agents automatically find the best yields across Blend, Soroswap, Aquarius, and more. Set your risk level and let the AI handle rebalancing for you.",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    icon: LineChart,
    title: "Track Everything",
    description:
      "Monitor your complete DeFi portfolio in real-time. See your positions, P&L, APY performance, and activity history across all Stellar protocols.",
    gradient: "from-violet-500 to-purple-600",
  },
];
