import type { Message, AIMessage, ToolMessage } from "@langchain/langgraph-sdk";

// Re-export LangGraph types
export type { Message, AIMessage, ToolMessage };

// Chat message types
export interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
}

// Tool call types
export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

// Content block types
export interface ContentBlock {
  type: string;
  content: unknown;
}
