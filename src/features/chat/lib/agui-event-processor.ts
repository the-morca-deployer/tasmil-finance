import { v4 as uuidv4 } from "uuid";
import { useChatAgentStore } from "../stores/chat-agent-store";

const RETRY_DELAYS_MS = [1000, 2000, 4000];

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Convert LangGraph message format (type: "human") to AG-UI wire format (role: "user").
// AG-UI's RunAgentInput requires an id on every message and rejects the entire
// request with 400 when one is missing. Most callers pass one; the clarify
// submit did not, so every slot-filling turn failed on the wire -- and because
// the processor swallows the error, the card just froze with no message. Fill
// the gap here so no caller can reintroduce it.
function toAguiMessage(msg: any): any {
  if (!msg || typeof msg !== "object") return msg;
  if (msg.role) return msg.id ? msg : { ...msg, id: uuidv4() }; // already AG-UI format
  const role =
    msg.type === "human"
      ? "user"
      : msg.type === "ai" || msg.type === "assistant"
        ? "assistant"
        : msg.type === "system"
          ? "system"
          : msg.type === "tool"
            ? "tool"
            : "user";
  const result: Record<string, unknown> = { ...msg, id: msg.id ?? uuidv4(), role };
  delete result.type;
  return result;
}

export interface ProcessorRunConfig {
  url: string;
  threadId: string;
  messages: any[];
  headers: Record<string, string>;
  forwardedProps: Record<string, unknown>;
}

export class AguiEventProcessor {
  private abortController: AbortController | null = null;

  async run(config: ProcessorRunConfig): Promise<void> {
    this.abortController?.abort();
    this.abortController = new AbortController();

    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      try {
        await this._runOnce(config, this.abortController);
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        console.error("[AguiEventProcessor] stream attempt failed:", err);
        if (attempt === RETRY_DELAYS_MS.length) {
          useChatAgentStore.getState().applyEvent({
            type: "RUN_ERROR",
            code: "stream_exhausted",
            message: (err as Error).message || "Connection lost after 3 retries",
          });
          return;
        }
        await sleep(RETRY_DELAYS_MS[attempt] ?? 0);
      }
    }
  }

  abort(): void {
    this.abortController?.abort();
  }

  private async _runOnce(config: ProcessorRunConfig, controller: AbortController): Promise<void> {
    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        ...config.headers,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        threadId: config.threadId,
        runId: uuidv4(),
        messages: config.messages.map(toAguiMessage),
        tools: [],
        context: [],
        state: {},
        forwardedProps: config.forwardedProps,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
    }

    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE events are separated by double newlines
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const dataLine = part.split("\n").find((l) => l.startsWith("data: "));
          if (!dataLine) continue; // heartbeat / comment line

          const json = dataLine.slice(6).trim();
          if (!json || json === "[DONE]") continue;

          let event: any;
          try {
            event = JSON.parse(json);
          } catch {
            continue;
          }

          this._dispatch(event);

          // Backend often delivers several SSE events in a single TCP chunk.
          // Without yielding, the for-loop runs back-to-back in one microtask
          // and the browser never paints between events - the user sees the
          // whole response appear at once at the end of the chunk and never
          // sees the "Thinking..." state because TEXT_MESSAGE_START is
          // immediately followed by the first TEXT_MESSAGE_CONTENT delta.
          // Yield to the browser after any event that changes visible state
          // so each transition gets a chance to paint at display refresh rate.
          if (event.type === "TEXT_MESSAGE_START" || event.type === "TEXT_MESSAGE_CONTENT") {
            await new Promise<void>((r) => requestAnimationFrame(() => r()));
          }
        }
      }
    } finally {
      reader.cancel().catch(() => {});
    }
  }

  private _dispatch(event: any): void {
    const store = useChatAgentStore.getState();

    switch (event.type) {
      case "TEXT_MESSAGE_START":
        store.applyEvent({
          type: "TEXT_MESSAGE_START",
          messageId: event.messageId,
          role: event.role ?? "assistant",
        });
        break;

      case "TEXT_MESSAGE_CONTENT":
        // Zustand uses useSyncExternalStore so subscribers re-render
        // synchronously per set - no flushSync needed. The rAF yield in the
        // reader loop is what actually lets the browser paint between deltas.
        store.applyEvent({
          type: "TEXT_MESSAGE_CONTENT",
          messageId: event.messageId,
          delta: event.delta,
        });
        break;

      case "TEXT_MESSAGE_END":
        store.applyEvent({ type: "TEXT_MESSAGE_END", messageId: event.messageId });
        break;

      case "TOOL_CALL_START":
        store.applyEvent({
          type: "TOOL_CALL_START",
          toolCallId: event.toolCallId,
          toolCallName: event.toolCallName,
          parentMessageId: event.parentMessageId ?? "",
        });
        break;

      case "TOOL_CALL_ARGS":
        store.applyEvent({
          type: "TOOL_CALL_ARGS",
          toolCallId: event.toolCallId,
          delta: event.delta,
        });
        break;

      case "TOOL_CALL_RESULT":
        store.applyEvent({
          type: "TOOL_CALL_RESULT",
          toolCallId: event.toolCallId,
          content: event.content ?? "",
          isError: Boolean(event.isError),
        });
        break;

      case "RUN_ERROR":
        if (typeof window !== "undefined") {
          (window as any).__AI_STREAM_ACTIVE__ = false;
        }
        store.applyEvent({
          type: "RUN_ERROR",
          code: event.code ?? "run_error",
          message: event.message ?? "Run failed",
        });
        break;

      case "TOOL_CALL_END":
        // AG-UI standard signals tool definition complete via TOOL_CALL_END,
        // not TOOL_CALL_RESULT. Mark the slot done with empty result so the
        // spinner stops; the actual result content arrives separately via a
        // tool message in MESSAGES_SNAPSHOT.
        if (event.toolCallId) {
          store.applyEvent({
            type: "TOOL_CALL_RESULT",
            toolCallId: event.toolCallId,
            content: "",
            isError: false,
          });
        }
        break;

      case "MESSAGES_SNAPSHOT":
      case "STATE_SNAPSHOT": {
        // AG-UI delivers tool results as tool-type messages embedded in a
        // snapshot rather than as a TOOL_CALL_RESULT event. Walk the
        // snapshot's messages and forward each tool result to the store so
        // the matching slot transitions to "done" with real content.
        const snapshotMessages: any[] = Array.isArray(event.messages)
          ? event.messages
          : Array.isArray(event.snapshot?.messages)
            ? event.snapshot.messages
            : [];
        for (const msg of snapshotMessages) {
          if (msg?.type !== "tool" || !msg.tool_call_id) continue;
          const state = useChatAgentStore.getState();
          // Direct ID match (works when backend emits same ID for START + result)
          let targetId: string | null = state.toolCallSlots[msg.tool_call_id]
            ? msg.tool_call_id
            : null;
          // Fallback: backend often emits TOOL_CALL_START with UUID but tool
          // messages in the snapshot use the LLM's call_XX_* IDs. Match by
          // toolName against any still-empty running slot (FIFO).
          if (!targetId && typeof msg.name === "string") {
            const candidate = Object.values(state.toolCallSlots).find(
              // Also match slots with empty string - TOOL_CALL_END fires before MESSAGES_SNAPSHOT
              // and sets result to "" as a spinner-stop signal; the real content arrives here.
              (slot) => slot.toolName === msg.name && (slot.result === null || slot.result === "")
            );
            if (candidate) targetId = candidate.id;
          }
          if (!targetId) continue;
          store.applyEvent({
            type: "TOOL_CALL_RESULT",
            toolCallId: targetId,
            content:
              typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content ?? ""),
            isError: false,
          });
        }
        break;
      }

      case "RUN_FINISHED": {
        // Safety net: stream ended but some slots may still be "running" because
        // their TOOL_CALL_RESULT used a mismatched ID. Force them done so no
        // spinner is left hanging after the agent's final text appears.
        if (typeof window !== "undefined") {
          (window as any).__AI_STREAM_ACTIVE__ = false;
        }
        const state = useChatAgentStore.getState();
        for (const [id, slot] of Object.entries(state.toolCallSlots)) {
          if (slot.status === "running") {
            store.applyEvent({
              type: "TOOL_CALL_RESULT",
              toolCallId: id,
              content: "",
              isError: false,
            });
          }
        }
        break;
      }

      case "RUN_STARTED": {
        // Expose run identifiers on `window` so the overnight loop Sweeper can
        // capture them and later look up the LangSmith trace by thread_id.
        // Loop expects `__TASMIL_THREAD_ID__` (langgraph thread id) and
        // `__LANGSMITH_RUN_ID__` (AG-UI run id - Sweeper queries LangSmith by
        // thread_id metadata since AG-UI runId is not the same as LangSmith
        // run id, but exposing it allows manual cross-referencing).
        if (typeof window !== "undefined") {
          (window as any).__TASMIL_THREAD_ID__ = event.threadId ?? null;
          (window as any).__LANGSMITH_RUN_ID__ = event.runId ?? null;
          // Signal to the E2E runner that the AI stream is active.
          // run-chat.ts checks this to avoid declaring stable mid-generation.
          (window as any).__AI_STREAM_ACTIVE__ = true;
        }
        break;
      }

      case "milestone-nudge": {
        const data = event.data ?? {};
        const nudgeType = data.nudgeType;
        if (nudgeType !== "five-dollar" && nudgeType !== "day-30" && nudgeType !== "pool-full") {
          break;
        }
        store.addNudge({
          id: uuidv4(),
          nudgeType,
          topPercent: typeof data.topPercent === "number" ? data.topPercent : 0,
          spotsLeft: typeof data.spotsLeft === "number" ? data.spotsLeft : 0,
        });
        break;
      }

      case "withdrawal-intent": {
        if (typeof window !== "undefined") {
          (window as any).__TASMIL_OPEN_WITHDRAWAL_MODAL__ = event.data;
          window.dispatchEvent(new CustomEvent("tasmil:open-withdrawal-modal"));
        }
        break;
      }

      default:
        break;
    }
  }
}
