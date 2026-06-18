import { v4 as uuidv4 } from "uuid";
import { useChatAgentStore } from "../stores/chat-agent-store";

const RETRY_DELAYS_MS = [1000, 2000, 4000];

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Convert LangGraph message format (type: "human") to AG-UI wire format (role: "user").
function toAguiMessage(msg: any): any {
  if (!msg || typeof msg !== "object") return msg;
  if (msg.role) return msg; // already AG-UI format
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
  const result: Record<string, unknown> = { ...msg, role };
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
          // and the browser never paints between events — the user sees the
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
        // synchronously per set — no flushSync needed. The rAF yield in the
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
          if (msg?.type === "tool" && msg.tool_call_id) {
            store.applyEvent({
              type: "TOOL_CALL_RESULT",
              toolCallId: msg.tool_call_id,
              content:
                typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content ?? ""),
              isError: false,
            });
          }
        }
        break;
      }

      // RUN_STARTED, RUN_FINISHED: no store state needed
      default:
        break;
    }
  }
}
