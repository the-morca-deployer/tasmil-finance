"use client";

import { ChatProvider } from "../providers";
import { ChatClient } from "./chat-client";

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
