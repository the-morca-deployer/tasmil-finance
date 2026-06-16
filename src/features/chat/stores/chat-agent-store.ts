import { create } from "zustand";

export interface ToolCallSlot {
  id: string;
  toolName: string;
  args: Record<string, unknown> | null;
  result: unknown | null;
  status: "pending" | "running" | "done" | "error" | "aborted";
  parentMessageId: string;
}

export interface ChatAgentMessage {
  id: string;
  role: "human" | "assistant";
  content: string;
  toolCalls: string[];
  isStreaming: boolean;
}

interface SessionSnapshot {
  messages: ChatAgentMessage[];
  toolCallSlots: Record<string, ToolCallSlot>;
}

export type AGUIEvent =
  | { type: "TEXT_MESSAGE_START"; messageId: string; role: string }
  | { type: "TEXT_MESSAGE_CONTENT"; messageId: string; delta: string }
  | { type: "TEXT_MESSAGE_END"; messageId: string }
  | { type: "TOOL_CALL_START"; toolCallId: string; toolCallName: string; parentMessageId: string }
  | { type: "TOOL_CALL_ARGS"; toolCallId: string; delta: string }
  | { type: "TOOL_CALL_RESULT"; toolCallId: string; content: string; isError: boolean }
  | { type: "RUN_ERROR"; code: string; message: string };

interface ChatAgentStoreState {
  threadId: string | null;
  messages: ChatAgentMessage[];
  toolCallSlots: Record<string, ToolCallSlot>;
  isStreaming: boolean;
  error: { code: string; message: string } | null;
  interrupt: unknown | null;
  sessionCache: Record<string, SessionSnapshot>;
  applyEvent: (event: AGUIEvent) => void;
  setThreadId: (id: string) => void;
  addHumanMessage: (id: string, content: string) => void;
  reset: () => void;
}

export const useChatAgentStore = create<ChatAgentStoreState>()((set, get) => ({
  threadId: null,
  messages: [],
  toolCallSlots: {},
  isStreaming: false,
  error: null,
  interrupt: null,
  sessionCache: {},

  applyEvent: (event) => {
    switch (event.type) {
      case "TEXT_MESSAGE_START":
        set((s) => ({
          messages: [
            ...s.messages,
            {
              id: event.messageId,
              role: "assistant" as const,
              content: "",
              toolCalls: [],
              isStreaming: true,
            },
          ],
          isStreaming: true,
          error: null,
        }));
        break;

      case "TEXT_MESSAGE_CONTENT":
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === event.messageId ? { ...m, content: m.content + event.delta } : m
          ),
        }));
        break;

      case "TEXT_MESSAGE_END":
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === event.messageId ? { ...m, isStreaming: false } : m
          ),
          isStreaming: false,
        }));
        break;

      case "TOOL_CALL_START":
        set((s) => ({
          toolCallSlots: {
            ...s.toolCallSlots,
            [event.toolCallId]: {
              id: event.toolCallId,
              toolName: event.toolCallName,
              args: null,
              result: null,
              status: "running" as const,
              parentMessageId: event.parentMessageId,
            },
          },
          messages: s.messages.map((m) =>
            m.id === event.parentMessageId
              ? { ...m, toolCalls: [...m.toolCalls, event.toolCallId] }
              : m
          ),
        }));
        break;

      case "TOOL_CALL_ARGS": {
        const slot = get().toolCallSlots[event.toolCallId];
        if (!slot) break;
        let parsed: Record<string, unknown> = {};
        try {
          parsed = JSON.parse(event.delta);
        } catch {
          // incomplete JSON — ignore
        }
        set((s) => ({
          toolCallSlots: { ...s.toolCallSlots, [event.toolCallId]: { ...slot, args: parsed } },
        }));
        break;
      }

      case "TOOL_CALL_RESULT": {
        const slot = get().toolCallSlots[event.toolCallId];
        if (!slot) break;
        set((s) => ({
          toolCallSlots: {
            ...s.toolCallSlots,
            [event.toolCallId]: {
              ...slot,
              result: event.content,
              status: event.isError ? ("error" as const) : ("done" as const),
            },
          },
        }));
        break;
      }

      case "RUN_ERROR":
        set((s) => ({
          error: { code: event.code, message: event.message },
          isStreaming: false,
          toolCallSlots: Object.fromEntries(
            Object.entries(s.toolCallSlots).map(([id, slot]) => [
              id,
              slot.status === "running" ? { ...slot, status: "aborted" as const } : slot,
            ])
          ),
        }));
        break;
    }
  },

  setThreadId: (id) => {
    const s = get();
    if (s.threadId && s.threadId !== id && s.messages.length > 0) {
      set((prev) => ({
        sessionCache: {
          ...prev.sessionCache,
          [s.threadId!]: { messages: s.messages, toolCallSlots: s.toolCallSlots },
        },
      }));
    }
    const cached = s.sessionCache[id];
    set({
      threadId: id,
      messages: cached?.messages ?? [],
      toolCallSlots: cached?.toolCallSlots ?? {},
      isStreaming: false,
      error: null,
    });
  },

  addHumanMessage: (id, content) => {
    set((s) => ({
      messages: [
        ...s.messages,
        { id, role: "human" as const, content, toolCalls: [], isStreaming: false },
      ],
    }));
  },

  reset: () =>
    set({
      messages: [],
      toolCallSlots: {},
      isStreaming: false,
      error: null,
      threadId: null,
      sessionCache: {},
    }),
}));
