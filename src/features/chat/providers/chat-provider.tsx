"use client";

import type { ReactNode } from "react";
import { ArtifactProvider } from "../thread/components";
import { AguiStreamProvider } from "./agui-stream-provider";
import { ChatStateProvider } from "./chat-state-provider";
import { StreamProvider } from "./stream-provider";
import { ThreadProvider } from "./thread-provider";

const USE_AGUI = process.env.NEXT_PUBLIC_USE_AGUI === "true";

interface ChatProviderProps {
  children: ReactNode;
  agentId?: string;
  chatId?: string | null;
}

/**
 * Main chat provider that combines all chat-related providers
 * Order matters: ChatState → Thread → Stream → Artifact
 *
 * When `NEXT_PUBLIC_USE_AGUI=true` the AG-UI stream provider is used instead
 * of the LangGraph SDK provider.  Both expose the same `StreamContext`.
 */
export function ChatProvider({ children, agentId, chatId }: ChatProviderProps) {
  const initialThreadId = chatId === null ? null : chatId;
  const SelectedStreamProvider = USE_AGUI ? AguiStreamProvider : StreamProvider;

  return (
    <ChatStateProvider initialThreadId={initialThreadId} initialAgentId={agentId}>
      <ThreadProvider agentId={agentId}>
        <SelectedStreamProvider agentId={agentId}>
          <ArtifactProvider>{children}</ArtifactProvider>
        </SelectedStreamProvider>
      </ThreadProvider>
    </ChatStateProvider>
  );
}
