import { act } from "@testing-library/react";
import { useChatAgentStore } from "../chat-agent-store";

beforeEach(() => {
  useChatAgentStore.getState().reset();
});

describe("TEXT_MESSAGE_START", () => {
  it("creates a streaming message", () => {
    act(() => {
      useChatAgentStore.getState().applyEvent({
        type: "TEXT_MESSAGE_START",
        messageId: "msg-1",
        role: "assistant",
      });
    });
    const { messages, isStreaming } = useChatAgentStore.getState();
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      id: "msg-1",
      role: "assistant",
      content: "",
      isStreaming: true,
    });
    expect(isStreaming).toBe(true);
  });
});

describe("TEXT_MESSAGE_CONTENT", () => {
  it("appends delta to the correct message", () => {
    act(() => {
      useChatAgentStore
        .getState()
        .applyEvent({ type: "TEXT_MESSAGE_START", messageId: "msg-1", role: "assistant" });
      useChatAgentStore
        .getState()
        .applyEvent({ type: "TEXT_MESSAGE_CONTENT", messageId: "msg-1", delta: "Hello " });
      useChatAgentStore
        .getState()
        .applyEvent({ type: "TEXT_MESSAGE_CONTENT", messageId: "msg-1", delta: "World" });
    });
    expect(useChatAgentStore.getState().messages[0]!.content).toBe("Hello World");
  });

  it("ignores delta for unknown messageId", () => {
    act(() => {
      useChatAgentStore
        .getState()
        .applyEvent({ type: "TEXT_MESSAGE_CONTENT", messageId: "unknown", delta: "x" });
    });
    expect(useChatAgentStore.getState().messages).toHaveLength(0);
  });
});

describe("TEXT_MESSAGE_END", () => {
  it("marks message not streaming and clears global isStreaming", () => {
    act(() => {
      useChatAgentStore
        .getState()
        .applyEvent({ type: "TEXT_MESSAGE_START", messageId: "msg-1", role: "assistant" });
      useChatAgentStore.getState().applyEvent({ type: "TEXT_MESSAGE_END", messageId: "msg-1" });
    });
    expect(useChatAgentStore.getState().messages[0]!.isStreaming).toBe(false);
    expect(useChatAgentStore.getState().isStreaming).toBe(false);
  });
});

describe("TOOL_CALL_START", () => {
  it("creates slot with status=running", () => {
    act(() => {
      useChatAgentStore
        .getState()
        .applyEvent({ type: "TEXT_MESSAGE_START", messageId: "msg-1", role: "assistant" });
      useChatAgentStore.getState().applyEvent({
        type: "TOOL_CALL_START",
        toolCallId: "tc-1",
        toolCallName: "bash",
        parentMessageId: "msg-1",
      });
    });
    const slot = useChatAgentStore.getState().toolCallSlots["tc-1"]!;
    expect(slot.status).toBe("running");
    expect(slot.toolName).toBe("bash");
    expect(slot.args).toBeNull();
  });

  it("attaches tool call id to parent message", () => {
    act(() => {
      useChatAgentStore
        .getState()
        .applyEvent({ type: "TEXT_MESSAGE_START", messageId: "msg-1", role: "assistant" });
      useChatAgentStore.getState().applyEvent({
        type: "TOOL_CALL_START",
        toolCallId: "tc-1",
        toolCallName: "bash",
        parentMessageId: "msg-1",
      });
    });
    expect(useChatAgentStore.getState().messages[0]!.toolCalls).toContain("tc-1");
  });
});

describe("TOOL_CALL_ARGS", () => {
  it("parses JSON args into slot.args", () => {
    act(() => {
      useChatAgentStore
        .getState()
        .applyEvent({ type: "TEXT_MESSAGE_START", messageId: "msg-1", role: "assistant" });
      useChatAgentStore.getState().applyEvent({
        type: "TOOL_CALL_START",
        toolCallId: "tc-1",
        toolCallName: "bash",
        parentMessageId: "msg-1",
      });
      useChatAgentStore
        .getState()
        .applyEvent({ type: "TOOL_CALL_ARGS", toolCallId: "tc-1", delta: '{"command":"ls"}' });
    });
    expect(useChatAgentStore.getState().toolCallSlots["tc-1"]!.args).toEqual({ command: "ls" });
  });
});

describe("TOOL_CALL_RESULT", () => {
  it("sets status=done and stores result", () => {
    act(() => {
      useChatAgentStore
        .getState()
        .applyEvent({ type: "TEXT_MESSAGE_START", messageId: "msg-1", role: "assistant" });
      useChatAgentStore.getState().applyEvent({
        type: "TOOL_CALL_START",
        toolCallId: "tc-1",
        toolCallName: "bash",
        parentMessageId: "msg-1",
      });
      useChatAgentStore.getState().applyEvent({
        type: "TOOL_CALL_RESULT",
        toolCallId: "tc-1",
        content: "ok output",
        isError: false,
      });
    });
    const slot = useChatAgentStore.getState().toolCallSlots["tc-1"]!;
    expect(slot.status).toBe("done");
    expect(slot.result).toBe("ok output");
  });

  it("sets status=error when isError=true", () => {
    act(() => {
      useChatAgentStore
        .getState()
        .applyEvent({ type: "TEXT_MESSAGE_START", messageId: "msg-1", role: "assistant" });
      useChatAgentStore.getState().applyEvent({
        type: "TOOL_CALL_START",
        toolCallId: "tc-1",
        toolCallName: "bash",
        parentMessageId: "msg-1",
      });
      useChatAgentStore.getState().applyEvent({
        type: "TOOL_CALL_RESULT",
        toolCallId: "tc-1",
        content: "error msg",
        isError: true,
      });
    });
    expect(useChatAgentStore.getState().toolCallSlots["tc-1"]!.status).toBe("error");
  });
});

describe("RUN_ERROR", () => {
  it("sets error and marks all running slots as aborted", () => {
    act(() => {
      useChatAgentStore
        .getState()
        .applyEvent({ type: "TEXT_MESSAGE_START", messageId: "msg-1", role: "assistant" });
      useChatAgentStore.getState().applyEvent({
        type: "TOOL_CALL_START",
        toolCallId: "tc-1",
        toolCallName: "bash",
        parentMessageId: "msg-1",
      });
      useChatAgentStore
        .getState()
        .applyEvent({ type: "RUN_ERROR", code: "internal", message: "went wrong" });
    });
    expect(useChatAgentStore.getState().error).toEqual({ code: "internal", message: "went wrong" });
    expect(useChatAgentStore.getState().toolCallSlots["tc-1"]!.status).toBe("aborted");
    expect(useChatAgentStore.getState().isStreaming).toBe(false);
  });
});

describe("session cache", () => {
  it("caches outgoing session on setThreadId switch", () => {
    act(() => {
      useChatAgentStore.getState().setThreadId("thread-A");
      useChatAgentStore
        .getState()
        .applyEvent({ type: "TEXT_MESSAGE_START", messageId: "msg-1", role: "assistant" });
      useChatAgentStore.getState().setThreadId("thread-B");
    });
    expect(useChatAgentStore.getState().sessionCache["thread-A"]?.messages).toHaveLength(1);
  });

  it("restores cached session instantly on switch back", () => {
    act(() => {
      useChatAgentStore.getState().setThreadId("thread-A");
      useChatAgentStore
        .getState()
        .applyEvent({ type: "TEXT_MESSAGE_START", messageId: "msg-1", role: "assistant" });
      useChatAgentStore.getState().setThreadId("thread-B");
      useChatAgentStore.getState().setThreadId("thread-A");
    });
    const { messages } = useChatAgentStore.getState();
    expect(messages).toHaveLength(1);
    expect(messages[0]!.id).toBe("msg-1");
  });

  it("starts empty for uncached thread", () => {
    act(() => {
      useChatAgentStore.getState().setThreadId("brand-new");
    });
    expect(useChatAgentStore.getState().messages).toHaveLength(0);
  });
});

describe("reset", () => {
  it("clears messages, toolCallSlots, isStreaming, and error", () => {
    act(() => {
      useChatAgentStore
        .getState()
        .applyEvent({ type: "TEXT_MESSAGE_START", messageId: "msg-1", role: "assistant" });
      useChatAgentStore.getState().reset();
    });
    const { messages, toolCallSlots, error, isStreaming } = useChatAgentStore.getState();
    expect(messages).toHaveLength(0);
    expect(Object.keys(toolCallSlots)).toHaveLength(0);
    expect(error).toBeNull();
    expect(isStreaming).toBe(false);
  });
});
