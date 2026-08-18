"use client";

/**
 * Thin adapter: wires chat-agent-store + AguiEventProcessor into StreamContextType.
 * All stream state lives in the Zustand store; this hook only orchestrates.
 */

import { useCallback, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAuthStore } from "@/store/use-auth";
import { AguiEventProcessor } from "../lib/agui-event-processor";
import type { StreamContextType } from "../providers/stream-provider";
import type { ChatAgentMessage, ToolCallSlot } from "../stores/chat-agent-store";
import { useChatAgentStore } from "../stores/chat-agent-store";

export interface AguiStreamConfig {
  apiUrl: string;
  assistantId: string;
  threadId: string | null;
  defaultHeaders: Record<string, string>;
  onThreadId?: (id: string) => void;
  onFirstResponse?: (title: string) => void;
  fetchStateHistory?: boolean;
}

export function useAguiStream(config: AguiStreamConfig): StreamContextType {
  const store = useChatAgentStore();
  const processorRef = useRef(new AguiEventProcessor());
  const isLoadingRef = useRef(false);

  // Sync thread ID into store on navigation. Passing null clears the
  // active session so a fresh /chat/new doesn't render leftover messages
  // from the previous thread (sessionCache is preserved).
  useEffect(() => {
    store.setThreadId(config.threadId ?? null);
  }, [config.threadId]);

  // Abort on unmount
  useEffect(() => {
    return () => {
      processorRef.current.abort();
    };
  }, []);

  // Load history for existing threads
  useEffect(() => {
    if (!config.threadId || !config.fetchStateHistory) return;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`${config.apiUrl}/threads/${config.threadId}/state`, {
          headers: config.defaultHeaders,
          signal: controller.signal,
        });
        if (!res.ok) return;
        const state = await res.json();
        if (!state?.values?.messages?.length) return;
        if (useChatAgentStore.getState().messages.length > 0) return;
        _populateFromHistory(state.values.messages);
      } catch (err) {
        if ((err as Error).name !== "AbortError") console.warn("[useAguiStream] history:", err);
      }
    })();
    return () => controller.abort();
  }, [config.threadId, config.apiUrl]);

  const submit = useCallback(
    async (payload: {
      messages?: any[] | any | string;
      wallet_address?: string;
      charge_usage?: boolean;
    }) => {
      if (!config.defaultHeaders.Authorization) {
        if (typeof window !== "undefined") {
          const fresh = !useAuthStore.getState().isTokenExpired();
          window.dispatchEvent(
            new window.CustomEvent("auth:session-invalid", {
              detail: { fresh, url: "chat-submit" },
            })
          );
        }
        return;
      }

      // isLoading guard - prevents concurrent streams
      if (isLoadingRef.current) return;

      isLoadingRef.current = true;
      useChatAgentStore.setState({ isStreaming: true, error: null });

      const threadId = config.threadId ?? uuidv4();
      const msgs = Array.isArray(payload.messages)
        ? payload.messages
        : payload.messages
          ? [payload.messages]
          : [];

      // Optimistic human message
      for (const msg of msgs) {
        if (msg && typeof msg === "object" && msg.type === "human") {
          store.addHumanMessage(msg.id ?? uuidv4(), msg.content ?? "");
        }
      }

      if (threadId !== config.threadId) config.onThreadId?.(threadId);

      try {
        await processorRef.current.run({
          url: `${config.apiUrl}/agui/${config.assistantId}`,
          threadId,
          messages: msgs,
          headers: config.defaultHeaders,
          forwardedProps: {
            charge_usage: payload.charge_usage,
            ...(payload.wallet_address && { wallet_address: payload.wallet_address }),
          },
        });
      } finally {
        isLoadingRef.current = false;
        useChatAgentStore.setState({ isStreaming: false });
      }

      if (config.onFirstResponse) {
        const first = useChatAgentStore.getState().messages.find((m) => m.role === "human");
        if (first) {
          config.onFirstResponse(
            first.content.slice(0, 50) + (first.content.length > 50 ? "..." : "")
          );
        }
      }
    },
    [config, store]
  );

  const stop = useCallback(() => {
    processorRef.current.abort();
    isLoadingRef.current = false;
    useChatAgentStore.setState({ isStreaming: false });
  }, []);

  const messages = _toStreamMessages(store.messages, store.toolCallSlots);

  return {
    messages,
    values: { messages } as any,
    isLoading: store.isStreaming,
    error: store.error ? new Error(store.error.message) : undefined,
    interrupt: store.interrupt,
    submit,
    stop,
    getMessagesMetadata: () => undefined,
    experimental_branchOff: undefined,
  } as unknown as StreamContextType;
}

// -- Helpers ------------------------------------------------------------------

function _toStreamMessages(
  messages: ChatAgentMessage[],
  slots: Record<string, ToolCallSlot>
): any[] {
  const result: any[] = [];
  for (const m of messages) {
    result.push({
      id: m.id,
      // Map store role ("human" | "assistant") → LangChain stream message
      // type ("human" | "ai") so consumers reading `type === "ai"` see
      // assistant messages instead of categorising them as 0.
      type: m.role === "assistant" ? "ai" : m.role,
      content: m.content,
      tool_calls: m.toolCalls.map((id) => {
        const slot = slots[id];
        return { id, name: slot?.toolName ?? "", args: slot?.args ?? {} };
      }),
      // Carry the in-event-order timeline so AssistantMessage can interleave
      // text + tool segments instead of grouping all tools above content.
      segments: m.segments,
    });
    // Synthesize tool result messages so ToolCallRenderer can mark steps complete.
    // The store tracks results in toolCallSlots but never emits them as message objects;
    // without this, resultMap in ToolCallRenderer is always empty and every step shows
    // "calling" (spinner) even after the agent finishes.
    for (const toolCallId of m.toolCalls) {
      const slot = slots[toolCallId];
      if (slot && (slot.status === "done" || slot.status === "error") && slot.result !== null) {
        result.push({
          id: `__tool_result__${toolCallId}`,
          type: "tool",
          tool_call_id: toolCallId,
          name: slot.toolName,
          content: typeof slot.result === "string" ? slot.result : JSON.stringify(slot.result),
        });
      }
    }
  }
  return result;
}

/**
 * LangGraph persists message content as either a plain string or an array of
 * content blocks like `[{ type: "text", text: "..." }, ...]`. The original
 * replay code only kept string content, so reloaded threads showed empty AI
 * messages even when the conversation had real text. Walk both shapes here.
 */
function _extractText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((block: any) => {
      if (typeof block === "string") return block;
      if (block && typeof block === "object") {
        if (typeof block.text === "string") return block.text;
        if (block.type === "text" && typeof block.value === "string") return block.value;
      }
      return "";
    })
    .join("");
}

function _populateFromHistory(rawMessages: any[]): void {
  const store = useChatAgentStore.getState();
  const seen = new Set<string>();
  for (const msg of rawMessages) {
    if (!msg?.id || seen.has(msg.id)) continue;
    seen.add(msg.id);
    const mid = msg.id as string;
    if (
      mid.startsWith("__hidden__") ||
      mid.startsWith("__do_not_render__") ||
      mid.startsWith("do-not-render")
    )
      continue;
    if (msg.type === "system") continue;

    if (msg.type === "human") {
      store.addHumanMessage(msg.id, _extractText(msg.content));
    } else if (msg.type === "ai") {
      store.applyEvent({ type: "TEXT_MESSAGE_START", messageId: msg.id, role: "assistant" });
      const text = _extractText(msg.content);
      if (text) {
        store.applyEvent({
          type: "TEXT_MESSAGE_CONTENT",
          messageId: msg.id,
          delta: text,
        });
      }
      store.applyEvent({ type: "TEXT_MESSAGE_END", messageId: msg.id });
      for (const tc of msg.tool_calls ?? []) {
        store.applyEvent({
          type: "TOOL_CALL_START",
          toolCallId: tc.id,
          toolCallName: tc.name,
          parentMessageId: msg.id,
        });
        store.applyEvent({
          type: "TOOL_CALL_ARGS",
          toolCallId: tc.id,
          delta: JSON.stringify(tc.args ?? {}),
        });
        // On history replay there's no separate TOOL_CALL_END event, so mark
        // the slot complete immediately - otherwise reloaded conversations
        // show every past tool call stuck on a spinner.
        store.applyEvent({
          type: "TOOL_CALL_RESULT",
          toolCallId: tc.id,
          content: "",
          isError: false,
        });
      }
    } else if (msg.type === "tool" && msg.tool_call_id) {
      store.applyEvent({
        type: "TOOL_CALL_RESULT",
        toolCallId: msg.tool_call_id,
        content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
        isError: false,
      });
    }
  }
}
