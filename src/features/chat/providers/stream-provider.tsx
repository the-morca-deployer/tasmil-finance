"use client";

import type { Message } from "@langchain/langgraph-sdk";
import { useStream } from "@langchain/langgraph-sdk/react";
import {
  isRemoveUIMessage,
  isUIMessage,
  type RemoveUIMessage,
  type UIMessage,
  uiMessageReducer,
} from "@langchain/langgraph-sdk/react-ui";
import type React from "react";
import { createContext, type ReactNode, useContext, useEffect, useRef } from "react";
import { toast } from "sonner";
import { getApiKey } from "@/lib/api-key";
import { LangGraphLogoSVG } from "@/shared/icons/langgraph";
import { useWallet } from "@/shared/context/wallet-context";
import { useWalletStore } from "@/store/use-wallet";
import { createClient } from "../lib/client";
import type { StateType } from "../types";
import { useChatState } from "./chat-state-provider";
import { useThreads } from "./thread-provider";

const useTypedStream = useStream<
  StateType,
  {
    UpdateType: {
      messages?: Message[] | Message | string;
      ui?: (UIMessage | RemoveUIMessage)[] | UIMessage | RemoveUIMessage;
      context?: Record<string, unknown>;
      signed_txs?: Record<string, unknown>;
    };
    CustomEventType: UIMessage | RemoveUIMessage;
  }
>;

export type StreamContextType = ReturnType<typeof useTypedStream>;
export const StreamContext = createContext<StreamContextType | undefined>(undefined);

async function sleep(ms = 4000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkGraphStatus(apiUrl: string, apiKey: string | null): Promise<boolean> {
  try {
    const res = await fetch(`${apiUrl}/info`, {
      ...(apiKey && {
        headers: {
          "X-Api-Key": apiKey,
        },
      }),
    });

    return res.ok;
  } catch (e) {
    console.error(e);
    return false;
  }
}

const StreamSession = ({
  children,
  apiKey,
  apiUrl,
  assistantId,
}: {
  children: ReactNode;
  apiKey: string | null;
  apiUrl: string;
  assistantId: string;
}) => {
  const { threadId, setThreadId } = useChatState();
  const { getThreads, setThreads } = useThreads();
  const { address: walletAddress } = useWallet();
  // Capture the initial threadId at mount — non-null means user came via direct URL
  const initialThreadId = useRef(threadId);

  // Verify ownership when loading a pre-existing thread directly via URL
  useEffect(() => {
    const preExistingThreadId = initialThreadId.current;
    if (!preExistingThreadId) return; // New chat — skip check

    const effectiveWallet = walletAddress ?? useWalletStore.getState().account;
    if (!effectiveWallet) return; // No wallet connected — can't verify, skip

    const client = createClient(apiUrl, apiKey ?? undefined);
    client.threads.get(preExistingThreadId).then((thread) => {
      const threadWallet = (thread.metadata as Record<string, unknown> | undefined)?.wallet_address as string | undefined;
      // Only block if thread has a wallet tag that differs from current wallet
      if (threadWallet && threadWallet !== effectiveWallet) {
        setThreadId(null);
        window.history.replaceState(null, "", `/chat/${assistantId}/new`);
      }
    }).catch(console.error);
  // Re-run once wallet becomes available (async kit init)
  }, [walletAddress]); // eslint-disable-line react-hooks/exhaustive-deps

  const streamValue = useTypedStream({
    apiUrl,
    apiKey: apiKey ?? undefined,
    assistantId,
    threadId: threadId ?? null,
    fetchStateHistory: true,
    // onFinish enables shouldRefetch=true in the SDK, which causes history.data to be
    // refreshed after each stream completes. This is required so that getMessagesMetadata()
    // can return a valid parent_checkpoint for message editing/regeneration.
    onFinish: () => {},
    onCustomEvent: (event, options) => {
      if (isUIMessage(event) || isRemoveUIMessage(event)) {
        options.mutate((prev: any) => {
          const ui = uiMessageReducer(prev?.ui ?? [], event);
          return { ...prev, ui };
        });
      }
    },
    onThreadId: (id) => {
      setThreadId(id);
      // Update URL to reflect the new thread ID without triggering a Next.js re-navigation
      // (which would remount the page and lose the in-flight stream)
      window.history.replaceState(null, "", `/chat/${assistantId}/${id}`);
      // Tag thread metadata with wallet_address for per-wallet isolation
      const effectiveWallet = walletAddress ?? useWalletStore.getState().account;
      if (effectiveWallet) {
        const client = createClient(apiUrl, apiKey ?? undefined);
        client.threads.update(id, { metadata: { wallet_address: effectiveWallet } }).catch(console.error);
      }
      // Refetch threads list when thread ID changes.
      sleep().then(() => getThreads(assistantId).then(setThreads).catch(console.error));
    },
  });

  useEffect(() => {
    checkGraphStatus(apiUrl, apiKey).then((ok) => {
      if (!ok) {
        toast.error("Failed to connect to LangGraph server", {
          description: () => (
            <p>
              Please ensure your graph is running at <code>{apiUrl}</code> and your API key is
              correctly set (if connecting to a deployed graph).
            </p>
          ),
          duration: 10000,
          richColors: true,
          closeButton: true,
        });
      }
    });
  }, [apiKey, apiUrl]);

  return <StreamContext.Provider value={streamValue}>{children}</StreamContext.Provider>;
};

export const StreamProvider: React.FC<{
  children: ReactNode;
  agentId?: string;
}> = ({ children, agentId }) => {
  // Get environment variables
  const envApiUrl: string | undefined = process.env["NEXT_PUBLIC_AI_URL"];

  // Use agentId from props as assistantId
  const assistantId = agentId || "";
  const apiUrl = envApiUrl || "";

  // For API key, use localStorage with env var fallback
  const apiKey = typeof window !== "undefined" ? getApiKey() : null;

  // Show error if we don't have required values
  if (!apiUrl || !assistantId) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-4">
        <div className="fade-in-0 zoom-in-95 flex max-w-3xl animate-in flex-col rounded-lg border bg-background p-6 shadow-lg">
          <div className="flex flex-col gap-2">
            <LangGraphLogoSVG className="h-7" />
            <h1 className="font-semibold text-xl tracking-tight">Configuration Error</h1>
            <p className="text-muted-foreground">
              Missing required configuration. Please ensure NEXT_PUBLIC_AI_URL is set and agentId
              is provided.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <StreamSession apiKey={apiKey} apiUrl={apiUrl} assistantId={assistantId}>
      {children}
    </StreamSession>
  );
};

// Create a custom hook to use the context
export const useStreamContext = (): StreamContextType => {
  const context = useContext(StreamContext);
  if (context === undefined) {
    throw new Error("useStreamContext must be used within a StreamProvider");
  }
  return context;
};

export default StreamContext;
