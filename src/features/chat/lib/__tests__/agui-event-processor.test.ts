/**
 * AguiEventProcessor talks to the AG-UI endpoint over plain `fetch` + SSE.
 *
 * This suite used to drive it through a jest.mock of `@ag-ui/client`'s
 * HttpAgent. The processor stopped using that package, so every assertion was
 * being made against a mock nothing called: `runAgent` was never invoked, the
 * retry test saw 0 calls, and the abort tests spied on a controller the code
 * under test never created. The tests are repointed at the real seam -- the
 * global `fetch`, its AbortSignal, and the SSE body.
 */

import { TextDecoder as NodeTextDecoder } from "node:util";
import { useChatAgentStore } from "../../stores/chat-agent-store";
import { AguiEventProcessor } from "../agui-event-processor";

// jsdom does not provide TextDecoder, which the SSE reader loop needs.
if (typeof globalThis.TextDecoder === "undefined") {
  (globalThis as unknown as { TextDecoder: unknown }).TextDecoder = NodeTextDecoder;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// --- Fake SSE plumbing -------------------------------------------------------

const encode = (s: string) => new Uint8Array(Array.from(s, (c) => c.charCodeAt(0)));

/** Build a Response-shaped object whose body streams the given SSE frames. */
function sseResponse(events: unknown[], { chunkTogether = false } = {}) {
  const frames = events.map((e) => `data: ${JSON.stringify(e)}\n\n`);
  const chunks = chunkTogether ? [frames.join("")] : frames;
  let i = 0;
  return {
    ok: true,
    status: 200,
    body: {
      getReader: () => ({
        read: async () =>
          i < chunks.length
            ? { done: false, value: encode(chunks[i++] as string) }
            : { done: true, value: undefined },
        cancel: async () => {},
      }),
    },
  };
}

function errorResponse(status: number, text = "boom") {
  return { ok: false, status, text: async () => text, body: null };
}

let mockFetch: jest.Mock;

const baseConfig = {
  url: "http://localhost:8001/agui/supervisor",
  threadId: "thread-1",
  messages: [] as unknown[],
  headers: { Authorization: "Bearer token" },
  forwardedProps: {},
};

/** The JSON body the processor POSTed on call `n`. */
function sentBody(n = 0): Record<string, any> {
  return JSON.parse(mockFetch.mock.calls[n][1].body);
}

beforeEach(() => {
  useChatAgentStore.getState().reset();
  mockFetch = jest.fn().mockResolvedValue(sseResponse([]));
  (globalThis as unknown as { fetch: unknown }).fetch = mockFetch;
  // The reader loop yields via rAF after text events; keep it immediate.
  (globalThis as unknown as { requestAnimationFrame: unknown }).requestAnimationFrame = (
    cb: (t: number) => void
  ) => {
    cb(0);
    return 0;
  };
  jest.spyOn(console, "error").mockImplementation(() => {});
});

describe("AguiEventProcessor", () => {
  describe("outgoing message normalisation", () => {
    // Regression: AG-UI's RunAgentInput rejects the whole request with HTTP 400
    // when any message lacks an `id`. The clarify submit passed none, so every
    // slot-filling turn died on the wire and the card froze silently.
    it("gives every outgoing message an id, even when the caller supplies none", async () => {
      await new AguiEventProcessor().run({
        ...baseConfig,
        messages: [
          { type: "human", content: "50 usdc" },
          { type: "human", content: "blend" },
        ],
      });

      const sent = sentBody().messages;
      expect(sent).toHaveLength(2);
      for (const msg of sent) {
        expect(typeof msg.id).toBe("string");
        expect(msg.id).not.toHaveLength(0);
      }
      // Distinct messages must not collide onto one id.
      expect(sent[0].id).not.toBe(sent[1].id);
    });

    it("preserves an id the caller already set", async () => {
      await new AguiEventProcessor().run({
        ...baseConfig,
        messages: [
          { id: "caller-supplied", type: "human", content: "hi" },
          { id: "already-agui", role: "user", content: "hi again" },
        ],
      });

      const sent = sentBody().messages;
      expect(sent[0].id).toBe("caller-supplied");
      expect(sent[1].id).toBe("already-agui");
    });

    it("generates ids that look like uuids rather than a shared constant", async () => {
      await new AguiEventProcessor().run({
        ...baseConfig,
        messages: [{ type: "human", content: "hi" }],
      });
      expect(sentBody().messages[0].id).toMatch(UUID_RE);
    });

    it("converts LangGraph message types to AG-UI roles", async () => {
      await new AguiEventProcessor().run({
        ...baseConfig,
        messages: [
          { type: "human", content: "a" },
          { type: "ai", content: "b" },
          { type: "system", content: "c" },
          { type: "tool", content: "d" },
        ],
      });

      expect(sentBody().messages.map((m: any) => m.role)).toEqual([
        "user",
        "assistant",
        "system",
        "tool",
      ]);
      // `type` is a LangGraph-ism; AG-UI must not receive it.
      expect(sentBody().messages.every((m: any) => !("type" in m))).toBe(true);
    });

    it("sends a run id and the caller's thread id and headers", async () => {
      await new AguiEventProcessor().run(baseConfig);

      const body = sentBody();
      expect(body.threadId).toBe("thread-1");
      expect(typeof body.runId).toBe("string");
      expect(body.runId).toMatch(UUID_RE);

      const init = mockFetch.mock.calls[0][1];
      expect(init.method).toBe("POST");
      expect(init.headers.Authorization).toBe("Bearer token");
      expect(init.headers.Accept).toBe("text/event-stream");
    });
  });

  describe("SSE dispatch", () => {
    it("applies TEXT_MESSAGE_START / CONTENT / END to the store", async () => {
      mockFetch.mockResolvedValue(
        sseResponse([
          { type: "TEXT_MESSAGE_START", messageId: "msg-1", role: "assistant" },
          { type: "TEXT_MESSAGE_CONTENT", messageId: "msg-1", delta: "Hel" },
          { type: "TEXT_MESSAGE_CONTENT", messageId: "msg-1", delta: "lo" },
          { type: "TEXT_MESSAGE_END", messageId: "msg-1" },
        ])
      );

      await new AguiEventProcessor().run(baseConfig);

      const msg = useChatAgentStore.getState().messages[0];
      expect(msg?.id).toBe("msg-1");
      expect(msg?.content).toBe("Hello");
      expect(msg?.isStreaming).toBe(false);
    });

    it("parses several events arriving in one chunk", async () => {
      mockFetch.mockResolvedValue(
        sseResponse(
          [
            { type: "TEXT_MESSAGE_START", messageId: "msg-1", role: "assistant" },
            { type: "TEXT_MESSAGE_CONTENT", messageId: "msg-1", delta: "batched" },
          ],
          { chunkTogether: true }
        )
      );

      await new AguiEventProcessor().run(baseConfig);
      expect(useChatAgentStore.getState().messages[0]?.content).toBe("batched");
    });

    it("surfaces a RUN_ERROR event as store error state", async () => {
      mockFetch.mockResolvedValue(
        sseResponse([{ type: "RUN_ERROR", code: "agent_failed", message: "nope" }])
      );

      await new AguiEventProcessor().run(baseConfig);
      expect(useChatAgentStore.getState().error).toEqual({
        code: "agent_failed",
        message: "nope",
      });
    });

    it("marks tool call slots done on TOOL_CALL_RESULT", async () => {
      mockFetch.mockResolvedValue(
        sseResponse([
          { type: "TOOL_CALL_START", toolCallId: "tc-1", toolCallName: "get_pools" },
          { type: "TOOL_CALL_RESULT", toolCallId: "tc-1", content: "[]" },
        ])
      );

      await new AguiEventProcessor().run(baseConfig);
      const slot = useChatAgentStore.getState().toolCallSlots["tc-1"];
      expect(slot?.status).toBe("done");
      expect(slot?.result).toBe("[]");
    });
  });

  describe("abort lifecycle", () => {
    it("aborts the in-flight request when run() is called again", async () => {
      let firstSignal: AbortSignal | undefined;
      mockFetch
        .mockImplementationOnce((_url: string, init: RequestInit) => {
          firstSignal = init.signal as AbortSignal;
          return new Promise(() => {}); // hangs until aborted
        })
        .mockResolvedValueOnce(sseResponse([]));

      const processor = new AguiEventProcessor();
      void processor.run({ ...baseConfig, threadId: "thread-1" });
      await processor.run({ ...baseConfig, threadId: "thread-2" });

      expect(firstSignal?.aborted).toBe(true);
      expect(mockFetch.mock.calls[1][1].signal.aborted).toBe(false);
    });

    it("abort() cancels the current request", async () => {
      let signal: AbortSignal | undefined;
      mockFetch.mockImplementation((_url: string, init: RequestInit) => {
        signal = init.signal as AbortSignal;
        return new Promise(() => {});
      });

      const processor = new AguiEventProcessor();
      void processor.run(baseConfig);
      await Promise.resolve();
      processor.abort();

      expect(signal?.aborted).toBe(true);
    });

    it("does not retry, and records no error, when the request is aborted", async () => {
      const err = new Error("Aborted");
      err.name = "AbortError";
      mockFetch.mockRejectedValue(err);

      await new AguiEventProcessor().run(baseConfig);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(useChatAgentStore.getState().error).toBeNull();
    });
  });

  describe("retry", () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it("retries with backoff, then reports stream_exhausted", async () => {
      jest.useFakeTimers();
      mockFetch.mockRejectedValue(new Error("network error"));

      const runPromise = new AguiEventProcessor().run(baseConfig);
      await jest.advanceTimersByTimeAsync(10_000);
      await runPromise;

      // The exact delays are an implementation detail; the property is that the
      // initial attempt is followed by a bounded number of retries and then a
      // terminal error rather than silence or an infinite loop.
      expect(mockFetch.mock.calls.length).toBeGreaterThan(1);
      expect(mockFetch).toHaveBeenCalledTimes(4);
      expect(useChatAgentStore.getState().error?.code).toBe("stream_exhausted");
    });

    it("stops retrying as soon as an attempt succeeds", async () => {
      jest.useFakeTimers();
      mockFetch
        .mockRejectedValueOnce(new Error("network error"))
        .mockResolvedValueOnce(
          sseResponse([{ type: "TEXT_MESSAGE_START", messageId: "msg-1", role: "assistant" }])
        );

      const runPromise = new AguiEventProcessor().run(baseConfig);
      await jest.advanceTimersByTimeAsync(10_000);
      await runPromise;

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(useChatAgentStore.getState().error).toBeNull();
      expect(useChatAgentStore.getState().messages[0]?.id).toBe("msg-1");
    });

    it("treats a non-2xx response as a failed attempt", async () => {
      jest.useFakeTimers();
      mockFetch.mockResolvedValue(errorResponse(400, "id missing"));

      const runPromise = new AguiEventProcessor().run(baseConfig);
      await jest.advanceTimersByTimeAsync(10_000);
      await runPromise;

      expect(mockFetch).toHaveBeenCalledTimes(4);
      const error = useChatAgentStore.getState().error;
      expect(error?.code).toBe("stream_exhausted");
      expect(error?.message).toContain("400");
    });
  });
});
