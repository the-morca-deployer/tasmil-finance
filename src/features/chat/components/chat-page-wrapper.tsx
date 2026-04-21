"use client";

import { useWallet } from "@/shared/context/wallet-context";
import { ChatProvider } from "../providers";
import { ChatAuthState } from "./chat-auth-state";
import { ChatClient } from "./chat-client";

interface ChatPageWrapperProps {
  agentId: string;
  chatId: string;
}

export function ChatPageWrapper({ agentId, chatId }: ChatPageWrapperProps) {
  const { isConnected, isAuthenticated, isAuthenticating, connect, forceReauth } = useWallet();

  if (!isConnected) {
    return <ChatAuthState mode="disconnected" onConnect={() => void connect?.()} />;
  }

  if (isAuthenticating) {
    return <ChatAuthState mode="authenticating" />;
  }

  if (!isAuthenticated) {
    return <ChatAuthState mode="session-invalid" onReconnect={() => void forceReauth()} />;
  }

  const initialThreadId = chatId === "new" ? undefined : chatId;

  return (
    <ChatProvider agentId={agentId} chatId={initialThreadId}>
      <ChatClient agentId={agentId} chatId={chatId} />
    </ChatProvider>
  );
}
