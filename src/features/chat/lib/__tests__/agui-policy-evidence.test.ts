import { useChatAgentStore } from "../../stores/chat-agent-store";
import { AguiEventProcessor } from "../agui-event-processor";
import { parseFlowResult } from "../parse-flow-result";

jest.mock("uuid", () => ({ v4: () => "test-uuid" }));

it("preserves decision id and replay payload when AG-UI rehydrates a tool snapshot", () => {
  useChatAgentStore.getState().reset();
  useChatAgentStore.getState().applyEvent({
    type: "TOOL_CALL_START",
    toolCallId: "call-1",
    toolCallName: "flow_compose_plan",
    parentMessageId: "message-1",
  });
  const content = JSON.stringify({
    kind: "policy_decision",
    policyDecision: { decisionId: "decision-persisted", status: "DECLINED" },
    actions: [{ kind: "view_replay", decisionId: "decision-persisted" }],
  });
  const processor = new AguiEventProcessor();
  (processor as unknown as { _dispatch: (event: unknown) => void })._dispatch({
    type: "MESSAGES_SNAPSHOT",
    messages: [
      {
        type: "tool",
        tool_call_id: "call-1",
        name: "flow_compose_plan",
        content,
      },
    ],
  });

  const restored = useChatAgentStore.getState().toolCallSlots["call-1"]?.result;
  expect(parseFlowResult(restored)).toMatchObject({
    policyDecision: { decisionId: "decision-persisted" },
    actions: [{ kind: "view_replay", decisionId: "decision-persisted" }],
  });
});
