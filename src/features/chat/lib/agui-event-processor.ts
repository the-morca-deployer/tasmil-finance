import { HttpAgent } from "@ag-ui/client";
import { useChatAgentStore } from "../stores/chat-agent-store";

const RETRY_DELAYS_MS = [1000, 2000, 4000];

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

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
        if (attempt === RETRY_DELAYS_MS.length) {
          useChatAgentStore
            .getState()
            .applyEvent({
              type: "RUN_ERROR",
              code: "stream_exhausted",
              message: "Connection lost after 3 retries",
            });
          return;
        }
        await sleep(RETRY_DELAYS_MS[attempt]);
      }
    }
  }

  abort(): void {
    this.abortController?.abort();
  }

  private async _runOnce(config: ProcessorRunConfig, controller: AbortController): Promise<void> {
    const store = useChatAgentStore.getState();
    const agent = new HttpAgent({
      url: config.url,
      headers: config.headers,
      threadId: config.threadId,
    });

    await agent.runAgent(
      { tools: [], forwardedProps: config.forwardedProps, abortController: controller },
      {
        onTextMessageStartEvent: ({ event }: any) =>
          store.applyEvent({
            type: "TEXT_MESSAGE_START",
            messageId: event.messageId,
            role: event.role ?? "assistant",
          }),
        onTextMessageContentEvent: ({ event }: any) =>
          store.applyEvent({
            type: "TEXT_MESSAGE_CONTENT",
            messageId: event.messageId,
            delta: event.delta,
          }),
        onTextMessageEndEvent: ({ event }: any) =>
          store.applyEvent({ type: "TEXT_MESSAGE_END", messageId: event.messageId }),
        onToolCallStartEvent: ({ event }: any) =>
          store.applyEvent({
            type: "TOOL_CALL_START",
            toolCallId: event.toolCallId,
            toolCallName: event.toolCallName,
            parentMessageId: event.parentMessageId ?? "",
          }),
        onToolCallArgsEvent: ({ event }: any) =>
          store.applyEvent({
            type: "TOOL_CALL_ARGS",
            toolCallId: event.toolCallId,
            delta: event.delta,
          }),
        onToolCallResultEvent: ({ event }: any) =>
          store.applyEvent({
            type: "TOOL_CALL_RESULT",
            toolCallId: event.toolCallId,
            content: event.content ?? "",
            isError: Boolean(event.isError),
          }),
        onRunFailed: ({ error: err }: any) =>
          store.applyEvent({
            type: "RUN_ERROR",
            code: "run_failed",
            message: (err as Error)?.message ?? "Run failed",
          }),
      }
    );
  }
}
