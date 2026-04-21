import { Client } from "@langchain/langgraph-sdk";
import { buildAiAuthHeaders } from "@/lib/ai-auth";

export function createClient(
  apiUrl: string,
  options: { apiKey?: string; accessToken?: string | null } = {}
) {
  return new Client({
    apiKey: options.apiKey ?? null,
    apiUrl,
    defaultHeaders: buildAiAuthHeaders(options.accessToken),
  });
}
