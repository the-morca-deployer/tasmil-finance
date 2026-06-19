"use client";

import { useEffect, useState } from "react";
import { DEV_BYPASS } from "@/lib/dev-bypass";
import { useWallet } from "@/shared/context/wallet-context";
import { useAuthStore } from "@/store/use-auth";
import { ChatProvider } from "../providers";
import { ChatAuthState } from "./chat-auth-state";
import { ChatClient } from "./chat-client";

interface ChatPageWrapperProps {
  agentId: string;
  chatId: string;
}

export interface PhaseProfile {
  phase: "beta" | "mainnet";
  isFirstLogin: boolean;
  hasPositions: boolean;
  daysSinceLastStake: number;
  lastPoolEarnings: number | null;
}

const DEFAULT_PROFILE: PhaseProfile = {
  phase: "beta",
  isFirstLogin: false,
  hasPositions: false,
  daysSinceLastStake: 0,
  lastPoolEarnings: null,
};

function usePhaseProfile(): PhaseProfile {
  const [profile, setProfile] = useState<PhaseProfile>(DEFAULT_PROFILE);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("tasmil-auth");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setProfile({
        phase: parsed.phase === "mainnet" ? "mainnet" : "beta",
        isFirstLogin: Boolean(parsed.isFirstLogin),
        hasPositions: Boolean(parsed.hasPositions),
        daysSinceLastStake:
          typeof parsed.daysSinceLastStake === "number" ? parsed.daysSinceLastStake : 0,
        lastPoolEarnings:
          typeof parsed.lastPoolEarnings === "number" ? parsed.lastPoolEarnings : null,
      });
    } catch {
      // defaults stay on parse failure
    }
  }, []);
  return profile;
}

export function ChatPageWrapper({ agentId, chatId }: ChatPageWrapperProps) {
  const { isConnected, connectWalletOnly, forceReauth } = useWallet();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const phaseProfile = usePhaseProfile();

  if (!DEV_BYPASS) {
    if (!isConnected) {
      return <ChatAuthState mode="disconnected" onConnect={() => void connectWalletOnly()} />;
    }
    if (!isAuthenticated) {
      return <ChatAuthState mode="session-invalid" onReconnect={() => void forceReauth()} />;
    }
  }

  const initialThreadId = chatId === "new" ? undefined : chatId;

  return (
    <ChatProvider key={chatId} agentId={agentId} chatId={initialThreadId}>
      <ChatClient agentId={agentId} chatId={chatId} phaseProfile={phaseProfile} />
    </ChatProvider>
  );
}
