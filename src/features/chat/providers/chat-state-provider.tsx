"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { AssistantInfo } from "../types";

interface ChatStateContextType {
  threadId: string | null;
  setThreadId: (id: string | null) => void;
  hideToolCalls: boolean;
  setHideToolCalls: (hide: boolean) => void;
  chatHistoryOpen: boolean;
  setChatHistoryOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  assistantInfo: AssistantInfo | null;
  setAssistantInfo: (info: AssistantInfo | null) => void;
  agentId: string | undefined;
  setAgentId: (id: string | undefined) => void;
  threadTitle: string | null;
  setThreadTitle: (title: string | null) => void;
}

const ChatStateContext = createContext<ChatStateContextType | undefined>(undefined);

interface ChatStateProviderProps {
  children: ReactNode;
  initialThreadId?: string | null;
  initialAgentId?: string;
}

export function ChatStateProvider({
  children,
  initialThreadId = null,
  initialAgentId,
}: ChatStateProviderProps) {
  const [threadId, setThreadId] = useState<string | null>(initialThreadId);
  const [hideToolCalls, setHideToolCalls] = useState(false);
  const [chatHistoryOpen, setChatHistoryOpen] = useState(false);
  const [assistantInfo, setAssistantInfo] = useState<AssistantInfo | null>(null);
  const [agentId, setAgentId] = useState<string | undefined>(initialAgentId);
  const [threadTitle, setThreadTitle] = useState<string | null>(null);

  // Sync threadId with the URL. `[[...slug]]` reuses the same page across
  // /chat/<id> ↔ /chat/new so useParams() doesn't change on Link navigation;
  // usePathname() does. Reset state when the user navigates to /chat or /chat/new,
  // and adopt the id from the URL when navigating to /chat/<id> (e.g. browser back).
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    const prev = prevPathnameRef.current;
    prevPathnameRef.current = pathname;
    if (prev === pathname) return;
    if (pathname === "/chat" || pathname === "/chat/new") {
      setThreadId(null);
      setThreadTitle(null);
      return;
    }
    if (pathname.startsWith("/chat/")) {
      const id = pathname.slice("/chat/".length).split("/")[0];
      if (id) setThreadId(id);
    }
  }, [pathname]);

  const handleSetChatHistoryOpen = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    if (typeof value === "function") {
      setChatHistoryOpen(value);
    } else {
      setChatHistoryOpen(value);
    }
  }, []);

  return (
    <ChatStateContext.Provider
      value={{
        threadId,
        setThreadId,
        hideToolCalls,
        setHideToolCalls,
        chatHistoryOpen,
        setChatHistoryOpen: handleSetChatHistoryOpen,
        assistantInfo,
        setAssistantInfo,
        agentId,
        setAgentId,
        threadTitle,
        setThreadTitle,
      }}
    >
      {children}
    </ChatStateContext.Provider>
  );
}

export function useChatState() {
  const context = useContext(ChatStateContext);
  if (!context) {
    throw new Error("useChatState must be used within a ChatStateProvider");
  }
  return context;
}
