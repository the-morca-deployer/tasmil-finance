import type { Checkpoint, Thread } from "@langchain/langgraph-sdk";

// Re-export LangGraph types
export type { Thread, Checkpoint };

// Thread metadata
export interface ThreadMetadata {
  graph_id?: string;
  assistant_id?: string;
  [key: string]: unknown;
}
