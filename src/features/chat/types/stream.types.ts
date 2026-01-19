import type { Message } from "@langchain/langgraph-sdk";
import type { UIMessage } from "@langchain/langgraph-sdk/react-ui";

// Stream state type
export interface StateType {
  messages: Message[];
  ui?: UIMessage[];
}

// Stream update type
export interface StreamUpdateType {
  messages?: Message[] | Message | string;
  ui?: UIMessage | UIMessage[];
  context?: Record<string, unknown>;
}
