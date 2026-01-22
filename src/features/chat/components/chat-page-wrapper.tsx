"use client";

import { ChatClient } from "./chat-client";
import { ChatProvider } from "../providers";

interface ChatPageWrapperProps {
  agentId: string;
  chatId: string;
}

export function ChatPageWrapper({ agentId, chatId }: ChatPageWrapperProps) {
  // Convert "new" to undefined for new chats
  const initialThreadId = chatId === "new" ? undefined : chatId;

  return (
    <ChatProvider agentId={agentId} chatId={initialThreadId}>
      <ChatClient agentId={agentId} chatId={chatId} />
    </ChatProvider>
  );
}
