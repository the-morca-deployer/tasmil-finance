"use client";

import type { Thread } from "@langchain/langgraph-sdk";
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { validate } from "uuid";
import { getApiKey } from "@/lib/api-key";
import { getBrowserAiBaseUrl } from "@/lib/runtime-urls";
import { useWallet } from "@/shared/context/wallet-context";
import { useAuthStore } from "@/store/use-auth";
import { useWalletStore } from "@/store/use-wallet";
import { createClient } from "../lib/client";

interface ThreadContextType {
  getThreads: (assistantId?: string) => Promise<Thread[]>;
  threads: Thread[];
  setThreads: Dispatch<SetStateAction<Thread[]>>;
  threadsLoading: boolean;
  setThreadsLoading: Dispatch<SetStateAction<boolean>>;
}

const ThreadContext = createContext<ThreadContextType | undefined>(undefined);

function getThreadSearchMetadata(
  assistantId: string
): { graph_id: string } | { assistant_id: string } {
  if (validate(assistantId)) {
    return { assistant_id: assistantId };
  }
  return { graph_id: assistantId };
}

export function ThreadProvider({ children, agentId }: { children: ReactNode; agentId?: string }) {
  const apiUrl = getBrowserAiBaseUrl();
  const { address: walletAddress } = useWallet();
  const accessToken = useAuthStore((state) => state.accessToken);
  const effectiveWallet = walletAddress ?? useWalletStore.getState().account;

  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);

  const getThreads = useCallback(
    async (assistantId?: string): Promise<Thread[]> => {
      const finalAssistantId = assistantId || agentId;
      if (!apiUrl || !finalAssistantId) return [];

      const client = createClient(apiUrl, {
        apiKey: getApiKey() ?? undefined,
        accessToken,
        walletAddress: effectiveWallet,
      });

      const threads = await client.threads.search({
        metadata: getThreadSearchMetadata(finalAssistantId),
        limit: 100,
      });

      return threads;
    },
    [accessToken, apiUrl, agentId, effectiveWallet]
  );

  const value = useMemo(
    () => ({
      getThreads,
      threads,
      setThreads,
      threadsLoading,
      setThreadsLoading,
    }),
    [getThreads, threads, threadsLoading]
  );

  return <ThreadContext.Provider value={value}>{children}</ThreadContext.Provider>;
}

export function useThreads() {
  const context = useContext(ThreadContext);
  if (context === undefined) {
    throw new Error("useThreads must be used within a ThreadProvider");
  }
  return context;
}
