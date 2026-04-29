"use client";

/**
 * AG-UI event consumer hook.
 *
 * Replaces `useStream` from `@langchain/langgraph-sdk/react` by connecting
 * to the backend `/agui/{graphId}` endpoint via `HttpAgent` from `@ag-ui/client`.
 *
 * Outputs the same `StreamContextType` shape so that downstream components
 * (`chat-client`, `ai-message`, tool renderers) work unchanged.
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
  fetchStateHistory?: boolean;
}

// ---------------------------------------------------------------------------
// AG-UI → LangGraph message conversion
// ---------------------------------------------------------------------------

function aguiToLangGraph(msg: AguiMessage): Message {
  switch (msg.role) {
    case "user":
      return {
        id: msg.id,
        type: "human",
        content: msg.content ?? "",
      } as unknown as Message;
    case "assistant":
      return {
        id: msg.id,
        type: "ai",
        content: msg.content ?? "",
        tool_calls:
          (msg as any).toolCalls?.map((tc: any) => ({
            id: tc.id,
            name: tc.function?.name ?? tc.name ?? "",
            args: (() => {
              try {
                const raw = tc.function?.arguments;
                if (typeof raw === "string" && raw.length > 0) return JSON.parse(raw);
                return tc.function?.arguments ?? tc.args ?? {};
              } catch {
                return tc.args ?? {};
              }
            })(),
          })) ?? [],
      } as unknown as Message;
    case "tool":
      return {
        id: msg.id,
        type: "tool",
        content: msg.content ?? "",
        tool_call_id: (msg as any).toolCallId ?? "",
      } as unknown as Message;
    default:
      return {
        id: msg.id,
        type: msg.role ?? "unknown",
        content: msg.content ?? "",
      } as unknown as Message;
  }
}

// ---------------------------------------------------------------------------
// Internal state for an in-flight AI message being assembled from events
// ---------------------------------------------------------------------------

interface BuildingAIMessage {
  id: string;
  content: string;
  toolCalls: {
    id: string;
    name: string;
    argsBuffer: string;
    args: Record<string, unknown>;
    done: boolean;
  }[];
  reasoning: string;
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

  // Mutable refs for building streamed messages without re-renders per token
  const buildingRef = useRef<BuildingAIMessage | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const threadIdRef = useRef<string | null>(config.threadId);

  // Keep threadIdRef in sync
  useEffect(() => {
    threadIdRef.current = config.threadId;
  }, [config.threadId]);

  // ── Load thread history on mount ────────────────────────────────
  useEffect(() => {
    if (!config.threadId || !config.fetchStateHistory) return;

    const loadHistory = async () => {
      try {
        const res = await fetch(
          `${config.apiUrl}/threads/${config.threadId}/state`,
          { headers: config.defaultHeaders },
        );
        if (!res.ok) return;
        const state = await res.json();
        if (!state?.values?.messages?.length) return;

        const lgMessages = (state.values.messages as any[])
          .map((msg: any): Message | null => {
            // Content can be string OR list of multimodal blocks.
            // Extract text from list format: ["", {type:"reasoning",...}, "text"]
            const extractContent = (raw: unknown): string => {
              if (typeof raw === "string") return raw;
              if (Array.isArray(raw)) {
                return raw
                  .filter((b) => typeof b === "string" || (typeof b === "object" && b?.type === "text"))
                  .map((b) => (typeof b === "string" ? b : (b as { text?: string }).text ?? ""))
                  .join("")
                  .trim();
              }
              return typeof raw === "object" && raw !== null ? JSON.stringify(raw) : String(raw ?? "");
            };

            // Extract reasoning from list content: [{type:"reasoning", reasoning:"..."}]
            const extractReasoning = (raw: unknown): string | undefined => {
              if (!Array.isArray(raw)) return undefined;
              const block = raw.find(
                (b) => typeof b === "object" && b?.type === "reasoning" && b?.reasoning,
              );
              return block?.reasoning;
            };

            switch (msg.type) {
              case "human":
                return { id: msg.id, type: "human", content: extractContent(msg.content) } as unknown as Message;
              case "ai": {
                const reasoning =
                  msg.additional_kwargs?.reasoning_content || extractReasoning(msg.content);
                return {
                  id: msg.id,
                  type: "ai",
                  content: extractContent(msg.content),
                  tool_calls:
                    msg.tool_calls?.map((tc: any) => ({
                      id: tc.id,
                      name: tc.name,
                      args: tc.args ?? {},
                    })) ?? [],
                  additional_kwargs: {
                    ...(msg.additional_kwargs ?? {}),
                    ...(reasoning ? { reasoning_content: reasoning } : {}),
                  },
                } as unknown as Message;
              }
              case "tool":
                return {
                  id: msg.id,
                  type: "tool",
                  content: extractContent(msg.content),
                  tool_call_id: msg.tool_call_id,
                } as unknown as Message;
              default:
                return null;
            }
          })
          .filter(Boolean) as Message[];

        messagesRef.current = lgMessages;
        setMessages(lgMessages);

        if (state.values.ui || state.values.signed_txs) {
          setValues((prev) => ({
            ...prev,
            ui: state.values.ui ?? prev.ui,
            signed_txs: state.values.signed_txs ?? prev.signed_txs,
          }));
        }
      } catch {
        // Thread may not exist yet — ignore
      }
    };

    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.threadId]);

  // ── Flush building message into messages state ──────────────────
  const flushBuilding = useCallback(() => {
    const b = buildingRef.current;
    if (!b) return;

    const aiMsg: Message = {
      id: b.id,
      type: "ai",
      content: b.content,
      tool_calls: b.toolCalls.map((tc) => ({
        id: tc.id,
        name: tc.name,
        args: tc.args,
      })),
      ...(b.reasoning
        ? { additional_kwargs: { reasoning_content: b.reasoning } }
        : {}),
    } as unknown as Message;

    // Replace or append the building message
    const idx = messagesRef.current.findIndex((m) => m.id === b.id);
    if (idx >= 0) {
      messagesRef.current[idx] = aiMsg;
    } else {
      messagesRef.current.push(aiMsg);
    }
    setMessages([...messagesRef.current]);
  }, []);

  // Debounced flush for text streaming — reduces re-renders during fast token streaming
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedFlush = useCallback(() => {
    if (flushTimerRef.current) return; // already scheduled
    flushTimerRef.current = setTimeout(() => {
      flushTimerRef.current = null;
      flushBuilding();
    }, 30); // ~33fps — smooth enough, avoids excessive re-renders
  }, [flushBuilding]);

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
      buildingRef.current = null;

      // Add user message to local state immediately (optimistic)
      const payloadMessages = Array.isArray(payload.messages)
        ? payload.messages
        : payload.messages
          ? [payload.messages as Message]
          : [];

      for (const m of payloadMessages) {
        if (typeof m === "string") continue;
        // Ensure every message has an id (flow cards may submit without one)
        if (!m.id) {
          (m as any).id = uuidv4();
        }
        if (!messagesRef.current.some((existing) => existing.id === m.id)) {
          messagesRef.current.push(m);
        }
      }
      setMessages([...messagesRef.current]);

      const threadId = threadIdRef.current || uuidv4();

      // Build the forwarded_props (includes wallet, command for HITL resume)
      const forwardedProps: Record<string, unknown> = {};
      if (payload.wallet_address) {
        forwardedProps.wallet_address = payload.wallet_address;
      }
      if (payload.charge_usage) {
        forwardedProps.charge_usage = payload.charge_usage;
      }
      if (options?.command) {
        forwardedProps.command = options.command;
      }

      // Only send NEW messages (from this submit) — NOT the full history.
      // The backend loads history from the checkpoint automatically.
      // Sending all messagesRef would create DUPLICATES because frontend-built
      // messages have different IDs than checkpoint messages.
      const newAguiMessages = payloadMessages
        .filter((m) => typeof m !== "string")
        .map((m): AguiMessage => {
          const msg = m as any;
          const id = msg.id || uuidv4();
          switch (msg.type) {
            case "human":
              return { id, role: "user" as const, content: msg.content ?? "" } as AguiMessage;
            case "tool":
              return {
                id,
                role: "tool" as const,
                content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
                toolCallId: msg.tool_call_id,
              } as AguiMessage;
            default:
              return { id, role: "user" as const, content: msg.content ?? "" } as AguiMessage;
          }
        });

      const agent = new HttpAgent({
        url: `${config.apiUrl}/agui/${config.assistantId}`,
        headers: config.defaultHeaders,
        threadId,
        initialMessages: newAguiMessages,
      });

      try {
        await agent.runAgent(
          {
            tools: [],
            forwardedProps,
          },
          {
            onRunInitialized: () => {
              setIsLoading(true);
            },
            onRunFinalized: () => {
              // Clear debounce timer and flush any remaining building message
              if (flushTimerRef.current) {
                clearTimeout(flushTimerRef.current);
                flushTimerRef.current = null;
              }
              if (buildingRef.current) {
                flushBuilding();
                buildingRef.current = null;
              }

              // Clean up empty/orphan AI messages that were created during
              // intermediate streaming steps (e.g. reasoning-only messages
              // with no text or tool calls). These cause "Thinking..." to
              // appear in wrong places on subsequent turns.
              messagesRef.current = messagesRef.current.filter((m) => {
                if (m.type !== "ai") return true;
                const msg = m as any;
                const hasContent = typeof msg.content === "string"
                  ? msg.content.trim().length > 0
                  : Array.isArray(msg.content) && msg.content.length > 0;
                const hasToolCalls = msg.tool_calls?.length > 0;
                const hasReasoning = msg.additional_kwargs?.reasoning_content;
                return hasContent || hasToolCalls || hasReasoning;
              });
              setMessages([...messagesRef.current]);

              setIsLoading(false);
              // Notify parent of thread ID (for URL update)
              if (threadId !== threadIdRef.current) {
                threadIdRef.current = threadId;
                config.onThreadId?.(threadId);
              }
            },
            onRunFailed: ({ error: err }) => {
              setIsLoading(false);
              setError(err);
            },

            // ── Text message streaming ──
            onTextMessageStartEvent: ({ event }) => {
              // Reasoning events use a DIFFERENT messageId (random UUID) than
              // text events (chunk.id like lc_run--...). When text starts,
              // MERGE any pending reasoning into this message instead of
              // flushing it as a separate reasoning-only message.
              const pendingReasoning = buildingRef.current?.reasoning ?? "";
              const pendingToolCalls = buildingRef.current?.toolCalls ?? [];

              // If there's a previous building message with a different ID,
              // DON'T flush it — absorb its reasoning instead.
              // Only flush if it has content or tool calls (not just reasoning).
              if (
                buildingRef.current &&
                buildingRef.current.id !== event.messageId &&
                (buildingRef.current.content.trim() || buildingRef.current.toolCalls.length > 0)
              ) {
                flushBuilding();
              }
              // If the previous buildingRef was reasoning-only, remove its
              // flushed message from messagesRef (it'll be merged into this one).
              if (buildingRef.current && buildingRef.current.id !== event.messageId) {
                const oldId = buildingRef.current.id;
                messagesRef.current = messagesRef.current.filter((m) => m.id !== oldId);
              }

              buildingRef.current = {
                id: event.messageId,
                content: "",
                toolCalls: pendingToolCalls,
                reasoning: pendingReasoning,
              };
            },
            onTextMessageContentEvent: ({ event }) => {
              if (buildingRef.current) {
                buildingRef.current.content += event.delta;
                debouncedFlush(); // batched to ~30ms for smooth streaming
              }
            },
            onTextMessageEndEvent: () => {
              if (flushTimerRef.current) {
                clearTimeout(flushTimerRef.current);
                flushTimerRef.current = null;
              }
              flushBuilding();
              // Don't null buildingRef — tool calls may follow on same AI message.
            },

            // ── Tool call streaming ──
            onToolCallStartEvent: ({ event }) => {
              const parentId = (event as any).parentMessageId;

              if (!buildingRef.current) {
                // Tool call without preceding text — create AI message
                // Use parentMessageId if available so tool calls link correctly
                buildingRef.current = {
                  id: parentId || uuidv4(),
                  content: "",
                  toolCalls: [],
                  reasoning: "",
                };
              } else if (parentId && buildingRef.current.id !== parentId) {
                // New parent message — flush current and start new
                flushBuilding();
                buildingRef.current = {
                  id: parentId,
                  content: "",
                  toolCalls: [],
                  reasoning: "",
                };
              }

              buildingRef.current.toolCalls.push({
                id: event.toolCallId,
                name: event.toolCallName,
                argsBuffer: "",
                args: {},
                done: false,
              });
              flushBuilding();
            },
            onToolCallArgsEvent: ({ event }) => {
              const tc = buildingRef.current?.toolCalls.find(
                (t) => t.id === event.toolCallId,
              );
              if (tc) {
                tc.argsBuffer += event.delta;
                // Try parsing partial args
                try {
                  tc.args = JSON.parse(tc.argsBuffer);
                } catch {
                  // Not yet complete JSON — ignore
                }
                flushBuilding();
              }
            },
            onToolCallEndEvent: ({ event }) => {
              const tc = buildingRef.current?.toolCalls.find(
                (t) => t.id === event.toolCallId,
              );
              if (tc) {
                tc.done = true;
                try {
                  tc.args = JSON.parse(tc.argsBuffer);
                } catch {
                  tc.args = {};
                }
                flushBuilding();
              }
            },
            onToolCallResultEvent: ({ event }) => {
              // Create a tool message
              const toolMsg: Message = {
                id: event.messageId || `tool-${event.toolCallId}`,
                type: "tool",
                content: event.content ?? "",
                tool_call_id: event.toolCallId,
              } as unknown as Message;
              messagesRef.current.push(toolMsg);
              setMessages([...messagesRef.current]);
            },

            // ── State ──
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

            onMessagesSnapshotEvent: () => {
              // IGNORE during active streaming. MESSAGES_SNAPSHOT fires at
              // every graph node boundary and replaces incrementally-built
              // messages, causing UI flickering. Thread history is loaded
              // via GET /threads/{id}/state on mount instead.
            },

            // ── Reasoning ──
            onReasoningMessageStartEvent: ({ event }) => {
              // Reasoning arrives BEFORE TEXT_MESSAGE_START.
              // Create the building message now so reasoning content is captured.
              if (!buildingRef.current) {
                buildingRef.current = {
                  id: event.messageId || uuidv4(),
                  content: "",
                  toolCalls: [],
                  reasoning: "",
                };
              }
            },
            onReasoningMessageContentEvent: ({ event }) => {
              if (!buildingRef.current) {
                buildingRef.current = {
                  id: event.messageId || uuidv4(),
                  content: "",
                  toolCalls: [],
                  reasoning: "",
                };
              }
              buildingRef.current.reasoning += event.delta;
              debouncedFlush();
            },

            // ── Custom events (interrupts, etc.) ──
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
    [config.apiUrl, config.assistantId, config.defaultHeaders, config.onThreadId, flushBuilding],
  );

  // ── Stop ────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    // HttpAgent uses an AbortController internally — no external handle.
    // Setting isLoading to false hides the loading indicator.
    setIsLoading(false);
  }, []);

  // ── getMessagesMetadata stub (used for branching — not supported via AG-UI yet) ──
  const getMessagesMetadata = useCallback(() => undefined, []);

  // ── Compose context value ───────────────────────────────────────
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
