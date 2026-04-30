"use client";

/**
 * AG-UI event consumer hook.
 *
 * Replaces `useStream` from `@langchain/langgraph-sdk/react` by connecting
 * to the backend `/agui/{graphId}` endpoint via `HttpAgent` from `@ag-ui/client`.
 *
 * Instead of manually reconstructing messages from every chunk event, this
 * hook reads `params.messages` from subscriber callbacks — the AG-UI client
 * already accumulates messages internally.  We convert AG-UI format to the
 * LangGraph-compatible shape that downstream consumers expect.
 */

import { HttpAgent, EventType } from "@ag-ui/client";
import type { CustomEvent, Message as AguiMessage } from "@ag-ui/core";
import type { Message } from "@langchain/langgraph-sdk";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { StreamContextType } from "../providers/stream-provider";
import type { StateType } from "../types";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface AguiStreamConfig {
  apiUrl: string;
  assistantId: string;
  threadId: string | null;
  defaultHeaders: Record<string, string>;
  onThreadId?: (id: string) => void;
  onFirstResponse?: (title: string) => void;
  fetchStateHistory?: boolean;
}

// ---------------------------------------------------------------------------
// AG-UI → LangGraph message conversion
// ---------------------------------------------------------------------------

/** Extract plain text from AG-UI content (string | ContentBlock[]). */
function extractText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter(
        (b) =>
          typeof b === "string" ||
          (typeof b === "object" && (b as any)?.type === "text"),
      )
      .map((b) =>
        typeof b === "string" ? b : ((b as any).text ?? ""),
      )
      .join("")
      .trim();
  }
  return "";
}

/** Extract reasoning from AG-UI content blocks or reasoning messages. */
function extractReasoning(content: unknown): string | undefined {
  if (!Array.isArray(content)) return undefined;
  const block = content.find(
    (b) => typeof b === "object" && b?.type === "reasoning" && b?.reasoning,
  );
  return block?.reasoning;
}

/** Convert AG-UI accumulated messages to LangGraph-compatible Message[]. */
function aguiToLangGraph(aguiMessages: readonly AguiMessage[]): Message[] {
  const result: Message[] = [];

  for (const m of aguiMessages) {
    // Skip system/developer messages (wallet context injected per-run)
    if (m.role === "system" || m.role === "developer") continue;

    switch (m.role) {
      case "user":
        result.push({
          id: m.id,
          type: "human",
          content: extractText(m.content),
        } as unknown as Message);
        break;

      case "assistant": {
        const reasoning = extractReasoning(m.content);
        result.push({
          id: m.id,
          type: "ai",
          content: extractText(m.content),
          tool_calls: (m.toolCalls ?? []).map((tc) => ({
            id: tc.id,
            name: tc.function.name,
            args: safeParseJson(tc.function.arguments),
          })),
          ...(reasoning
            ? { additional_kwargs: { reasoning_content: reasoning } }
            : {}),
        } as unknown as Message);
        break;
      }

      case "reasoning": {
        // Reasoning messages carry content for the previous AI message.
        // Attach as additional_kwargs on the last AI message.
        const lastAi = findLastAi(result);
        if (lastAi) {
          const existing = (lastAi as any).additional_kwargs?.reasoning_content ?? "";
          (lastAi as any).additional_kwargs = {
            ...((lastAi as any).additional_kwargs ?? {}),
            reasoning_content: existing + extractText(m.content),
          };
        }
        break;
      }

      case "tool":
        result.push({
          id: m.id,
          type: "tool",
          content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
          tool_call_id: m.toolCallId,
        } as unknown as Message);
        break;

      case "activity":
        // Activity messages are UI hints — skip from message list
        break;
    }
  }

  return result;
}

function findLastAi(messages: Message[]): Message | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]!.type === "ai") return messages[i];
  }
  return undefined;
}

function safeParseJson(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// History loading
// ---------------------------------------------------------------------------

async function loadThreadHistory(
  apiUrl: string,
  threadId: string,
  headers: Record<string, string>,
): Promise<{ messages: Message[]; ui?: unknown; signed_txs?: unknown }> {
  const res = await fetch(`${apiUrl}/threads/${threadId}/state`, { headers });
  if (!res.ok) return { messages: [] };

  const state = await res.json();
  const rawMessages: any[] = state?.values?.messages ?? [];

  const messages = rawMessages
    .filter((msg: any) => {
      const mid = msg.id as string | undefined;
      if (mid?.startsWith("do-not-render") || mid?.startsWith("__do_not_render__")) return false;
      if (msg.type === "system") return false;
      return true;
    })
    .map((msg: any): Message | null => {
      switch (msg.type) {
        case "human":
          return { id: msg.id, type: "human", content: extractText(msg.content) } as unknown as Message;
        case "ai": {
          const reasoning =
            msg.additional_kwargs?.reasoning_content || extractReasoning(msg.content);
          return {
            id: msg.id,
            type: "ai",
            content: extractText(msg.content),
            tool_calls: (msg.tool_calls ?? []).map((tc: any) => ({
              id: tc.id,
              name: tc.name,
              args: tc.args ?? {},
            })),
            ...(reasoning ? { additional_kwargs: { reasoning_content: reasoning } } : {}),
          } as unknown as Message;
        }
        case "tool":
          return {
            id: msg.id,
            type: "tool",
            content: extractText(msg.content),
            tool_call_id: msg.tool_call_id,
          } as unknown as Message;
        default:
          return null;
      }
    })
    .filter(Boolean) as Message[];

  return {
    messages,
    ui: state.values?.ui,
    signed_txs: state.values?.signed_txs,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAguiStream(config: AguiStreamConfig): StreamContextType {
  const [messages, setMessages] = useState<Message[]>([]);
  const [values, setValues] = useState<StateType>({ messages: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();
  const [interrupt, setInterrupt] = useState<unknown>(undefined);

  // Debounced sync — convert AG-UI messages → LangGraph and flush to state
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingMessagesRef = useRef<readonly AguiMessage[]>([]);

  // Track first response for title generation
  const titleGeneratedRef = useRef(false);

  /** Derive a conversation title from the first human message content. */
  function deriveTitle(messages: readonly AguiMessage[]): string | null {
    const firstHuman = messages.find((m) => m.role === "user");
    if (!firstHuman) return null;
    const text = extractText(firstHuman.content);
    if (!text.trim()) return null;
    const cleaned = text.replace(/\s+/g, " ").trim();
    return cleaned.slice(0, 50) + (cleaned.length > 50 ? "..." : "");
  }

  const scheduleSync = useCallback((aguiMessages: readonly AguiMessage[]) => {
    pendingMessagesRef.current = aguiMessages;
    if (!syncTimerRef.current) {
      syncTimerRef.current = setTimeout(() => {
        syncTimerRef.current = null;
        setMessages(aguiToLangGraph(pendingMessagesRef.current));
      }, 30);
    }
  }, []);

  const flushSync = useCallback(() => {
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }
    if (pendingMessagesRef.current.length > 0) {
      setMessages(aguiToLangGraph(pendingMessagesRef.current));
    }
  }, []);

  // ── Load thread history on mount / thread switch ────────────────
  useEffect(() => {
    if (!config.threadId || !config.fetchStateHistory) return;

    let cancelled = false;
    loadThreadHistory(config.apiUrl, config.threadId, config.defaultHeaders).then(
      ({ messages: historyMessages, ui, signed_txs }) => {
        if (cancelled) return;
        if (historyMessages.length > 0) {
          setMessages(historyMessages);
        }
        if (ui || signed_txs) {
          setValues((prev) => {
            const next = { ...prev };
            if (ui) (next as any).ui = ui;
            if (signed_txs) (next as any).signed_txs = signed_txs;
            return next;
          });
        }
      },
    );

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.threadId]);

  // ── Clear history-loaded state when thread changes ──────────────
  const loadedThreadRef = useRef<string | null>(null);
  useEffect(() => {
    if (config.threadId !== loadedThreadRef.current) {
      loadedThreadRef.current = config.threadId;
      titleGeneratedRef.current = false;
      if (!config.threadId) {
        setMessages([]);
      }
    }
  }, [config.threadId]);

  // ── Submit a message to the agent ───────────────────────────────
  const submit = useCallback(
    async (
      payload: {
        messages?: Message[] | Message | string;
        wallet_address?: string;
        charge_usage?: boolean;
      },
      options?: Record<string, unknown>,
    ) => {
      setError(undefined);
      setInterrupt(undefined);
      setIsLoading(true);
      pendingMessagesRef.current = [];

      // ── Prepare payload messages ──
      const payloadMessages = Array.isArray(payload.messages)
        ? payload.messages
        : payload.messages
          ? [payload.messages as Message]
          : [];

      // Add new human messages to local state optimistically
      const existingIds = new Set(messages.map((m) => m.id));
      const newLocalMessages: Message[] = [];
      for (const m of payloadMessages) {
        if (typeof m === "string") continue;
        const mid = (m as any).id || uuidv4();
        if (mid.startsWith("do-not-render") || mid.startsWith("__do_not_render__")) continue;
        if (!existingIds.has(mid)) {
          (m as any).id = mid;
          newLocalMessages.push(m as Message);
          existingIds.add(mid);
        }
      }
      if (newLocalMessages.length > 0) {
        setMessages((prev) => [...prev, ...newLocalMessages]);
      }

      const threadId = config.threadId || uuidv4();

      // ── Build forwarded_props ──
      const forwardedProps: Record<string, unknown> = {};
      if (payload.wallet_address) forwardedProps.wallet_address = payload.wallet_address;
      if (payload.charge_usage) forwardedProps.charge_usage = payload.charge_usage;
      if (options?.command) forwardedProps.command = options.command;

      // ── Convert new messages to AG-UI format ──
      const aguiMessages: AguiMessage[] = payloadMessages
        .filter((m) => {
          if (typeof m === "string") return false;
          const msg = m as any;
          if (msg.id?.startsWith("do-not-render") || msg.id?.startsWith("__do_not_render__")) return false;
          return msg.type === "human" || msg.type === "tool";
        })
        .map((m): AguiMessage => {
          const msg = m as any;
          const id = msg.id || uuidv4();
          switch (msg.type) {
            case "human":
              return { id, role: "user", content: msg.content ?? "" } as AguiMessage;
            case "tool":
              return {
                id,
                role: "tool",
                content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
                toolCallId: msg.tool_call_id,
              } as AguiMessage;
            default:
              return { id, role: "user", content: msg.content ?? "" } as AguiMessage;
          }
        });

      const agent = new HttpAgent({
        url: `${config.apiUrl}/agui/${config.assistantId}`,
        headers: config.defaultHeaders,
        threadId,
        initialMessages: aguiMessages,
      });

      try {
        await agent.runAgent(
          { tools: [], forwardedProps },
          {
            onRunInitialized: () => {
              setIsLoading(true);
            },

            onRunFinalized: ({ messages: finalMessages, state }) => {
              flushSync();
              // Use the AG-UI client's accumulated messages as final state
              const converted = aguiToLangGraph(finalMessages);
              // Filter empty orphan AI messages (reasoning-only, no text or tool calls)
              const filtered = converted.filter((m) => {
                if (m.type !== "ai") return true;
                const msg = m as any;
                const hasContent =
                  typeof msg.content === "string"
                    ? msg.content.trim().length > 0
                    : Array.isArray(msg.content) && msg.content.length > 0;
                const hasToolCalls = msg.tool_calls?.length > 0;
                const hasReasoning = msg.additional_kwargs?.reasoning_content;
                return hasContent || hasToolCalls || hasReasoning;
              });
              setMessages(filtered);
              setIsLoading(false);

              if (state) {
                setValues((prev) => ({
                  ...prev,
                  ui: (state as any).ui ?? prev.ui,
                  signed_txs: (state as any).signed_txs ?? prev.signed_txs,
                }));
              }

              if (threadId !== config.threadId) {
                config.onThreadId?.(threadId);
              }

              // Generate conversation title after first AI response
              if (!titleGeneratedRef.current && config.onFirstResponse) {
                const title = deriveTitle(finalMessages);
                if (title) {
                  titleGeneratedRef.current = true;
                  config.onFirstResponse(title);
                }
              }
            },

            onRunFailed: ({ error: err }) => {
              setIsLoading(false);
              setError(err);
            },

            // ── Streaming: schedule debounced sync on every message-changing event ──
            onTextMessageContentEvent: ({ messages: aguiMsgs }) => {
              scheduleSync(aguiMsgs);
            },
            onTextMessageEndEvent: ({ messages: aguiMsgs }) => {
              scheduleSync(aguiMsgs);
            },
            onToolCallStartEvent: ({ messages: aguiMsgs }) => {
              scheduleSync(aguiMsgs);
            },
            onToolCallEndEvent: ({ messages: aguiMsgs }) => {
              scheduleSync(aguiMsgs);
            },
            onToolCallResultEvent: ({ messages: aguiMsgs }) => {
              scheduleSync(aguiMsgs);
            },
            onMessagesSnapshotEvent: ({ messages: aguiMsgs }) => {
              scheduleSync(aguiMsgs);
            },

            // ── State snapshots (UI messages, signed TXs) ──
            onStateSnapshotEvent: ({ event }) => {
              const snapshot = event.snapshot as Record<string, unknown> | undefined;
              if (snapshot) {
                setValues((prev) => ({
                  ...prev,
                  ui: (snapshot.ui as any) ?? prev.ui,
                  signed_txs: (snapshot.signed_txs as any) ?? prev.signed_txs,
                }));
              }
            },

            // ── Reasoning (still stream smoothly) ──
            onReasoningMessageContentEvent: ({ messages: aguiMsgs }) => {
              scheduleSync(aguiMsgs);
            },

            // ── Custom events (interrupts) ──
            onEvent: ({ event }) => {
              if (
                event.type === EventType.CUSTOM &&
                (event as CustomEvent).name === "LangGraphInterruptEvent"
              ) {
                setInterrupt((event as CustomEvent).value);
              }
            },
          },
        );
      } catch (err) {
        setIsLoading(false);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [
      config.apiUrl,
      config.assistantId,
      config.defaultHeaders,
      config.onThreadId,
      config.threadId,
      messages,
      scheduleSync,
      flushSync,
    ],
  );

  // ── Stop ────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    setIsLoading(false);
  }, []);

  const getMessagesMetadata = useCallback(() => undefined, []);

  const contextValue = useMemo(
    () =>
      ({
        messages,
        values,
        isLoading,
        error,
        interrupt,
        submit,
        stop,
        getMessagesMetadata,
      }) as unknown as StreamContextType,
    [messages, values, isLoading, error, interrupt, submit, stop, getMessagesMetadata],
  );

  return contextValue;
}
