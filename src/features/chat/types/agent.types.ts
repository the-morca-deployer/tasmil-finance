// Agent configuration types
export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  suggestions: string[];
  capabilities: string[];
  icon?: string;
}

// Assistant metadata from /assistants/search
export interface AssistantMetadata {
  id?: string;
  icon?: string;
  name?: string;
  type?: string;
  author?: string;
  version?: string;
  category?: string;
  description?: string[];
}

// Assistant info
export interface AssistantInfo {
  assistant_id: string;
  graph_id: string;
  metadata: AssistantMetadata;
  name?: string;
}
