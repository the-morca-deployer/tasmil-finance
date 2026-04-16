"use client";

import { Wallet } from "lucide-react";
import { useWallet } from "@/shared/context/wallet-context";
import { ChatProvider } from "../providers";
import { ChatClient } from "./chat-client";

interface ChatPageWrapperProps {
  agentId: string;
  chatId: string;
}

export function ChatPageWrapper({ agentId, chatId }: ChatPageWrapperProps) {
  const { isConnected, connect } = useWallet();

  if (!isConnected) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Connect your wallet</h2>
          <p className="max-w-xs text-sm text-muted-foreground">
            You need to connect a Stellar wallet to access the AI agent chat.
          </p>
        </div>
        <button
          type="button"
          onClick={() => connect?.()}
          className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  // Convert "new" to undefined for new chats
  const initialThreadId = chatId === "new" ? undefined : chatId;

  return (
    <ChatProvider agentId={agentId} chatId={initialThreadId}>
      <ChatClient agentId={agentId} chatId={chatId} />
    </ChatProvider>
  );
}
