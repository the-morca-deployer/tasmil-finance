import { useChatAgentStore } from "../../stores/chat-agent-store";
import { AguiEventProcessor } from "../agui-event-processor";

const mockRunAgent = jest.fn();
jest.mock("@ag-ui/client", () => ({
  EventType: { CUSTOM: "CUSTOM" },
  HttpAgent: jest.fn().mockImplementation(() => ({ runAgent: mockRunAgent })),
}));
jest.mock("uuid", () => ({ v4: () => "test-uuid" }));

beforeEach(() => {
  jest.clearAllMocks();
  useChatAgentStore.getState().reset();
  mockRunAgent.mockResolvedValue(undefined);
});

const baseConfig = {
  url: "http://localhost:8001/agui/supervisor",
  threadId: "thread-1",
  messages: [] as any[],
  headers: { Authorization: "Bearer token" },
  forwardedProps: {},
};

describe("AguiEventProcessor", () => {
  it("calls store.applyEvent for TEXT_MESSAGE_START from HttpAgent", async () => {
    mockRunAgent.mockImplementation((_params: any, handlers: any) => {
      handlers.onTextMessageStartEvent?.({ event: { messageId: "msg-1", role: "assistant" } });
      return Promise.resolve();
    });
    const processor = new AguiEventProcessor();
    await processor.run(baseConfig);
    expect(useChatAgentStore.getState().messages[0]?.id).toBe("msg-1");
  });

  it("aborts previous stream when run() is called again", async () => {
    const abortSpy = jest.spyOn(AbortController.prototype, "abort");
    mockRunAgent.mockImplementationOnce(() => new Promise(() => {})); // hangs forever
    mockRunAgent.mockResolvedValueOnce(undefined);
    const processor = new AguiEventProcessor();
    processor.run({ ...baseConfig, threadId: "thread-1" }); // don't await
    await processor.run({ ...baseConfig, threadId: "thread-2" });
    expect(abortSpy).toHaveBeenCalledTimes(1);
    abortSpy.mockRestore();
  });

  it("does not retry on AbortError", async () => {
    const err = new Error("Aborted");
    err.name = "AbortError";
    mockRunAgent.mockRejectedValue(err);
    const processor = new AguiEventProcessor();
    await processor.run(baseConfig);
    expect(mockRunAgent).toHaveBeenCalledTimes(1);
    expect(useChatAgentStore.getState().error).toBeNull();
  });

  it("retries 3 times then sets stream_exhausted error", async () => {
    jest.useFakeTimers();
    mockRunAgent.mockRejectedValue(new Error("network error"));
    const processor = new AguiEventProcessor();
    const runPromise = processor.run(baseConfig);
    await jest.advanceTimersByTimeAsync(10_000);
    await runPromise;
    expect(mockRunAgent).toHaveBeenCalledTimes(4); // initial + 3 retries
    expect(useChatAgentStore.getState().error?.code).toBe("stream_exhausted");
    jest.useRealTimers();
  });

  it("abort() cancels current stream", async () => {
    const abortSpy = jest.spyOn(AbortController.prototype, "abort");
    mockRunAgent.mockImplementation(() => new Promise(() => {}));
    const processor = new AguiEventProcessor();
    processor.run(baseConfig);
    processor.abort();
    expect(abortSpy).toHaveBeenCalledTimes(1);
    abortSpy.mockRestore();
  });
});
