"use client";

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

export function ChatPageWrapper({ agentId, chatId }: ChatPageWrapperProps) {
  const { isConnected, connectWalletOnly, forceReauth } = useWallet();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

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
      <ChatClient agentId={agentId} chatId={chatId} />
    </ChatProvider>
  );
}
