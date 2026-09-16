/**
 * Lifecycle contract of useAguiStream:
 *  1. a new submit aborts the request left over from the previous one
 *  2. unmount aborts whatever is in flight
 *  3. the isLoading guard prevents concurrent streams
 *  4. a missing Authorization header short-circuits to the re-auth event
 *
 * The suite used to assert all of this against a jest.mock of `@ag-ui/client`'s
 * HttpAgent, reading the AbortController off `runAgent`'s first argument. The
 * hook drives AguiEventProcessor, which has used plain `fetch` + SSE for a
 * while, so `runAgent` was never called and the AbortController assertions were
 * inspecting a mock the code never touched. Everything below now goes through
 * the real seam: the global `fetch` and the signal it receives.
 */

import { TextDecoder as NodeTextDecoder } from "node:util";
import { act, renderHook } from "@testing-library/react";
import { useChatAgentStore } from "../stores/chat-agent-store";
import { useAguiStream } from "./use-agui-stream";

// jsdom does not provide TextDecoder, which the SSE reader loop needs.
if (typeof globalThis.TextDecoder === "undefined") {
  (globalThis as unknown as { TextDecoder: unknown }).TextDecoder = NodeTextDecoder;
}

/** Response-shaped object with an immediately-exhausted SSE body. */
function emptyStream() {
  return {
    ok: true,
    status: 200,
    body: {
      getReader: () => ({
        read: async () => ({ done: true, value: undefined }),
        cancel: async () => {},
      }),
    },
  };
}

let mockFetch: jest.Mock;

/** AbortSignal handed to fetch on call `n`. */
const signalOf = (n: number): AbortSignal => mockFetch.mock.calls[n][1].signal;

const baseConfig = {
  apiUrl: "http://localhost:8001",
  assistantId: "test-agent",
  threadId: null,
  defaultHeaders: { Authorization: "Bearer test-token" },
};

beforeEach(() => {
  useChatAgentStore.getState().reset();
  mockFetch = jest.fn().mockResolvedValue(emptyStream());
  (globalThis as unknown as { fetch: unknown }).fetch = mockFetch;
});

describe("useAguiStream lifecycle", () => {
  describe("AbortController", () => {
    it("passes an AbortSignal to every request", async () => {
      const { result } = renderHook(() => useAguiStream(baseConfig));

      await act(async () => {
        await result.current.submit({ messages: [] });
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(signalOf(0)).toBeInstanceOf(AbortSignal);
      expect(signalOf(0).aborted).toBe(false);
    });

    it("aborts the previous request when a new submit starts", async () => {
      const { result } = renderHook(() => useAguiStream(baseConfig));

      await act(async () => {
        await result.current.submit({ messages: [] });
      });
      expect(signalOf(0).aborted).toBe(false);

      await act(async () => {
        await result.current.submit({ messages: [] });
      });

      expect(signalOf(0).aborted).toBe(true);
      expect(signalOf(1).aborted).toBe(false);
    });
  });

  describe("unmount cleanup", () => {
    it("aborts the active stream on unmount", async () => {
      const { result, unmount } = renderHook(() => useAguiStream(baseConfig));

      await act(async () => {
        await result.current.submit({ messages: [] });
      });
      expect(signalOf(0).aborted).toBe(false);

      unmount();

      expect(signalOf(0).aborted).toBe(true);
    });

    it("unmounts without throwing when nothing was ever submitted", () => {
      const { unmount } = renderHook(() => useAguiStream(baseConfig));
      expect(() => unmount()).not.toThrow();
    });
  });

  describe("isLoading guard", () => {
    it("does not start a second stream while one is in flight", async () => {
      let release: (() => void) | undefined;
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            release = () => resolve(emptyStream());
          })
      );

      const { result } = renderHook(() => useAguiStream(baseConfig));

      act(() => {
        void result.current.submit({ messages: [] });
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        await result.current.submit({ messages: [] });
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      release?.();
      await act(async () => {});
    });

    it("clears isLoading once the stream finishes, so the next submit runs", async () => {
      const { result } = renderHook(() => useAguiStream(baseConfig));

      await act(async () => {
        await result.current.submit({ messages: [] });
      });
      expect(result.current.isLoading).toBe(false);

      await act(async () => {
        await result.current.submit({ messages: [] });
      });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("stop() aborts and clears the loading flag", async () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));
      const { result } = renderHook(() => useAguiStream(baseConfig));

      act(() => {
        void result.current.submit({ messages: [] });
      });
      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.stop();
      });

      expect(signalOf(0).aborted).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("auth guard", () => {
    it("emits auth:session-invalid and sends nothing when the token is missing", async () => {
      const onAuthEvent = jest.fn();
      window.addEventListener("auth:session-invalid", onAuthEvent);

      const { result } = renderHook(() =>
        useAguiStream({ ...baseConfig, defaultHeaders: {} as Record<string, string> })
      );

      await act(async () => {
        await result.current.submit({ messages: [] });
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(onAuthEvent).toHaveBeenCalledTimes(1);
      window.removeEventListener("auth:session-invalid", onAuthEvent);
    });
  });

  describe("optimistic echo", () => {
    it("shows the human message before the stream responds", async () => {
      const { result } = renderHook(() => useAguiStream(baseConfig));

      await act(async () => {
        await result.current.submit({ messages: [{ type: "human", content: "deposit 50 usdc" }] });
      });

      const human = useChatAgentStore.getState().messages.find((m) => m.role === "human");
      expect(human?.content).toBe("deposit 50 usdc");
      // The store assigns an id even though the caller passed none, which is
      // what AG-UI's RunAgentInput requires on the wire.
      expect(typeof human?.id).toBe("string");
      expect(human?.id).not.toHaveLength(0);
    });
  });
});
